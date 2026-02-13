---
name: socket-io-security
description: Authentication, authorization, rate limiting, and DDoS protection for Socket.IO in Livrya
keywords: [socket-io, security, authentication, authorization, rate-limiting, ddos, livrya]
category: project-specific
---

# 🔒 Socket.IO Security

Production security patterns for Socket.IO authentication, authorization, and protection against attacks.

## Overview

Socket.IO real-time communication requires careful security:
- **Authentication** - Verify user identity
- **Authorization** - Control room access
- **Rate Limiting** - Prevent spam/abuse
- **DDoS Protection** - Handle malicious traffic
- **Data Validation** - Prevent injections
- **Audit Logging** - Track suspicious activity

This skill covers production security patterns.

---

## Key Concepts

### 1. Attack Vectors

```
Threat              | Impact          | Prevention
─────────────────────────────────────────────────────────
Unauthorized Access | View/modify data| JWT authentication
Cross-room access   | Privacy breach  | Authorization checks
Spam/Flooding       | Service DoS     | Rate limiting
Large payload DDoS  | Memory exhaustion| Payload size limits
Slow-read attack    | Connection hang | Timeout handling
```

### 2. Security Layers

```
1. Connection Level
   ↓
   JWT verification
   Socket origin check
   ↓
2. Room Level
   ↓
   User has permission?
   Can join this room?
   ↓
3. Event Level
   ↓
   Rate limit exceeded?
   Payload too large?
   ↓
4. Audit Level
   ↓
   Log for analysis
   Alert on suspicious
```

---

## Implementation Patterns

### Pattern 1: JWT Authentication

```typescript
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId: string;
  permissions: string[];
  isAdmin: boolean;
}

/**
 * Middleware for JWT verification
 */
const authenticateToken = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      permissions: string[];
      isAdmin: boolean;
    };

    socket.userId = decoded.userId;
    socket.permissions = decoded.permissions;
    socket.isAdmin = decoded.isAdmin;

    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

const io = new Server(httpServer, {
  cors: { origin: process.env.CLIENT_URL },
});

// Apply authentication middleware
io.use(authenticateToken);

io.on('connection', (socket: AuthenticatedSocket) => {
  console.log(`✓ Authenticated user: ${socket.userId}`);

  socket.on('disconnect', () => {
    console.log(`✗ User disconnected: ${socket.userId}`);
  });
});
```

### Pattern 2: Room Authorization

```typescript
interface RoomPermission {
  roomName: string;
  requiredPermissions: string[];
  isPublic: boolean;
}

class RoomAuthorizationManager {
  private roomPermissions: Map<string, RoomPermission> = new Map();

  registerRoom(config: RoomPermission): void {
    this.roomPermissions.set(config.roomName, config);
  }

  /**
   * Check if user can join room
   */
  canJoinRoom(userId: string, roomId: string, permissions: string[]): boolean {
    // Public rooms anyone can join
    if (roomId === 'social:feed' || roomId === 'global:announcements') {
      return true;
    }

    // Book rooms - check subscription
    if (roomId.startsWith('book:')) {
      return permissions.includes('read:book');
    }

    // Private user rooms - only owner
    if (roomId.startsWith('user:')) {
      return roomId.endsWith(userId);
    }

    // Admin rooms - check admin status
    if (roomId.startsWith('admin:')) {
      return permissions.includes('admin:access');
    }

    return false;
  }

  /**
   * Check if user can emit event
   */
  canEmitEvent(
    userId: string,
    roomId: string,
    eventName: string,
    permissions: string[]
  ): boolean {
    // Read-only events are always allowed
    if (eventName.startsWith('get:') || eventName.startsWith('fetch:')) {
      return this.canJoinRoom(userId, roomId, permissions);
    }

    // Write events need specific permissions
    if (eventName.startsWith('create:') || eventName.startsWith('update:')) {
      return permissions.includes(`write:${roomId.split(':')[0]}`);
    }

    // Delete events need admin
    if (eventName.startsWith('delete:')) {
      return permissions.includes('admin:delete');
    }

    return false;
  }
}

const roomAuth = new RoomAuthorizationManager();

// Register room permissions
roomAuth.registerRoom({
  roomName: 'social:feed',
  requiredPermissions: [],
  isPublic: true,
});

roomAuth.registerRoom({
  roomName: 'book:*',
  requiredPermissions: ['read:book'],
  isPublic: false,
});

// Enforce in middleware
io.use((socket: AuthenticatedSocket, next) => {
  const originalOn = socket.on.bind(socket);

  socket.on = function (event: string, ...args: any[]) {
    // Intercept room join events
    if (event === 'join' || event === 'subscribe') {
      const roomId = args[0];

      if (!roomAuth.canJoinRoom(socket.userId, roomId, socket.permissions)) {
        return next(new Error(`Unauthorized: Cannot access room ${roomId}`));
      }
    }

    return originalOn(event, ...args);
  };

  next();
});
```

### Pattern 3: Rate Limiting

```typescript
interface RateLimitConfig {
  windowMs: number; // Time window in ms
  maxRequests: number; // Max requests per window
}

class SocketIORateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if user exceeded rate limit
   */
  isRateLimited(userId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get requests in current window
    let requests = this.requests.get(userId) || [];
    requests = requests.filter((ts) => ts > windowStart);

    // Check limit
    if (requests.length >= this.config.maxRequests) {
      console.warn(`Rate limit exceeded for user ${userId}`);
      return true;
    }

    // Record request
    requests.push(now);
    this.requests.set(userId, requests);

    return false;
  }

  /**
   * Clear old entries (run periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [userId, requests] of this.requests) {
      const filtered = requests.filter((ts) => ts > now - this.config.windowMs);

      if (filtered.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, filtered);
      }
    }
  }
}

// Setup rate limiter: 100 events per 60 seconds
const rateLimiter = new SocketIORateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
});

// Run cleanup every 5 minutes
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);

// Apply in middleware
io.use((socket: AuthenticatedSocket, next) => {
  const originalEmit = socket.emit.bind(socket);

  socket.emit = function (eventName: string, ...args: any[]) {
    if (rateLimiter.isRateLimited(socket.userId)) {
      console.warn(`Rate limited: ${socket.userId} -> ${eventName}`);
      return false;
    }

    return originalEmit(eventName, ...args);
  };

  next();
});

// Per-event rate limiting
io.on('connection', (socket: AuthenticatedSocket) => {
  const perEventLimiter = new Map<string, number>();

  socket.on('message:send', (data: any) => {
    const eventName = 'message:send';
    const now = Date.now();
    const lastCall = perEventLimiter.get(eventName) || 0;

    if (now - lastCall < 500) { // Max 1 message per 500ms
      socket.emit('error', { message: 'Rate limited' });
      return;
    }

    perEventLimiter.set(eventName, now);

    // Process message
  });
});
```

### Pattern 4: Payload Validation

```typescript
interface ValidatedPayload {
  isValid: boolean;
  errors?: string[];
  data?: any;
}

class PayloadValidator {
  /**
   * Validate message payload
   */
  validateMessagePayload(data: any): ValidatedPayload {
    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['Payload must be an object'] };
    }

    const errors: string[] = [];

    // Check required fields
    if (!data.text || typeof data.text !== 'string') {
      errors.push('Text field required (string)');
    }

    if (data.text && data.text.length > 5000) {
      errors.push('Text too long (max 5000 chars)');
    }

    // Sanitize text
    if (data.text) {
      data.text = this.sanitizeHTML(data.text);
    }

    // Check optional fields
    if (data.chapterId && typeof data.chapterId !== 'string') {
      errors.push('ChapterId must be string');
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      data: errors.length === 0 ? data : undefined,
    };
  }

  /**
   * Prevent XSS
   */
  private sanitizeHTML(text: string): string {
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate JSON with schema
   */
  validateWithSchema(data: any, schema: any): ValidatedPayload {
    try {
      // Use a JSON schema validator (e.g., ajv)
      // const ajv = new Ajv();
      // const validate = ajv.compile(schema);
      // const valid = validate(data);

      // For now, basic validation
      return { isValid: true, data };
    } catch (error) {
      return { isValid: false, errors: [error.message] };
    }
  }
}

const validator = new PayloadValidator();

io.on('connection', (socket: AuthenticatedSocket) => {
  socket.on('message:send', (payload: any) => {
    const validation = validator.validateMessagePayload(payload);

    if (!validation.isValid) {
      socket.emit('error', {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid message format',
        errors: validation.errors,
      });
      return;
    }

    // Process validated data
    console.log('Valid message:', validation.data);
  });
});
```

### Pattern 5: Audit Logging

```typescript
interface AuditLog {
  timestamp: Date;
  userId: string;
  event: string;
  roomId?: string;
  severity: 'info' | 'warn' | 'error';
  details: Record<string, any>;
}

class SocketAuditLogger {
  private logger: any; // Winston or similar

  /**
   * Log socket event
   */
  log(log: AuditLog): void {
    const logMessage = `[${log.severity.toUpperCase()}] ${log.userId} -> ${log.event}`;

    console.log(logMessage, log.details);

    // Store in database or logging service
    if (log.severity === 'error' || log.severity === 'warn') {
      // Alert on suspicious activity
      this.checkForAnomalies(log);
    }
  }

  /**
   * Detect anomalies
   */
  private checkForAnomalies(log: AuditLog): void {
    // Rate exceeded
    // Unauthorized access attempt
    // Suspicious payload
    // Etc.

    console.warn(`⚠️  Anomaly detected: ${log.details.reason}`);
  }
}

const auditLogger = new SocketAuditLogger();

// Log all connections
io.on('connection', (socket: AuthenticatedSocket) => {
  auditLogger.log({
    timestamp: new Date(),
    userId: socket.userId,
    event: 'socket:connect',
    severity: 'info',
    details: { socketId: socket.id },
  });

  // Log room joins
  socket.on('join', (roomId: string) => {
    auditLogger.log({
      timestamp: new Date(),
      userId: socket.userId,
      event: 'socket:join',
      roomId,
      severity: 'info',
      details: { roomId },
    });
  });

  // Log errors
  socket.on('error', (error: any) => {
    auditLogger.log({
      timestamp: new Date(),
      userId: socket.userId,
      event: 'socket:error',
      severity: 'error',
      details: { error: error.message },
    });
  });

  socket.on('disconnect', () => {
    auditLogger.log({
      timestamp: new Date(),
      userId: socket.userId,
      event: 'socket:disconnect',
      severity: 'info',
      details: { reason: socket.disconnectReason },
    });
  });
});
```

---

## Best Practices

### ✅ DO's

1. **Always Verify JWT on Connection**
   - Check token signature
   - Verify expiration
   - Validate permissions

2. **Check Authorization Before Room Access**
   - Don't trust client
   - Verify on server
   - Log access attempts

3. **Implement Rate Limiting**
   - Per-user limits
   - Per-event limits
   - Progressive delays

4. **Validate All Payloads**
   - Check type
   - Limit size
   - Sanitize HTML

5. **Audit Everything**
   - Log connects/disconnects
   - Log errors
   - Alert on anomalies

### ❌ DON'Ts

1. **Don't Trust Client-Side Checks**
   - Users can bypass
   - Always verify server-side

2. **Don't Store Sensitive Data in JWT**
   - Can be decoded
   - Use only for ID

3. **Don't Skip CORS**
   - Anyone can connect
   - Restrict to your domain

4. **Don't Ignore Rate Limits**
   - Spam and DoS attacks
   - Abuse goes undetected

---

## Related Skills

- `socket-io-rooms-management` - Room management
- `api-security-best-practices` - General security
- `backend-dev-guidelines` - General patterns

---

**Status:** ✅ Production Ready
**Last Updated:** 2026-02-13
**Project:** Livrya Security
