---
name: socket-io-rooms-management
description: Manage Socket.IO rooms, namespaces, and broadcasts for real-time collaboration in Livrya
keywords: [socket-io, rooms, namespaces, broadcasting, realtime, collaboration, livrya]
category: project-specific
---

# 🔌 Socket.IO Rooms Management

Expert patterns for managing Socket.IO rooms and namespaces in Livrya's real-time collaboration system.

## Overview

Livrya uses Socket.IO for real-time features:
- **Live feed updates** - New chapters, reviews, comments
- **Typing indicators** - See who's writing/reviewing
- **Progress tracking** - Narration status updates
- **Collaborative features** - Multi-author editing
- **Notifications** - Instant alerts to subscribers

This skill covers production room management patterns.

---

## Key Concepts

### 1. Room Hierarchy

```
/                           (Default namespace)
├── book:{bookId}           (All readers of a book)
├── chapter:{chapterId}     (Readers of specific chapter)
├── author:{authorId}       (Notifications for author)
├── narrator:{narratorId}   (Narrator status updates)
├── social:feed             (Global social feed)
├── notifications:{userId}  (Private notifications)
└── admin:broadcast         (System-wide announcements)
```

### 2. Namespace Strategy

```
io.of('/')                 → Default (general use)
io.of('/books')            → Book-specific events
io.of('/social')           → Social feed events
io.of('/notifications')    → Push notifications
io.of('/admin')            → Admin-only events
```

### 3. Scaling with Redis Adapter

```
Node 1                     Node 2                  Node 3
  ↓                          ↓                        ↓
[Socket.IO] ────────── [Redis Adapter] ───────── [Socket.IO]
  ↓                          ↓                        ↓
rooms: A,B                  rooms: *                rooms: C,D
users: 50                                          users: 75
```

---

## Implementation Patterns

### Pattern 1: Basic Room Management

```typescript
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

/**
 * User joins a book
 */
io.on('connection', (socket: Socket) => {
  // Join book room
  socket.on('book:join', (bookId: string, userId: string) => {
    const roomId = `book:${bookId}`;

    socket.join(roomId);
    console.log(`User ${userId} joined ${roomId}`);

    // Notify others in room
    io.to(roomId).emit('user:joined', {
      userId,
      timestamp: new Date(),
      userCount: io.sockets.adapter.rooms.get(roomId)?.size || 0,
    });
  });

  // User leaves book
  socket.on('book:leave', (bookId: string, userId: string) => {
    const roomId = `book:${bookId}`;

    socket.leave(roomId);
    console.log(`User ${userId} left ${roomId}`);

    io.to(roomId).emit('user:left', {
      userId,
      timestamp: new Date(),
      userCount: io.sockets.adapter.rooms.get(roomId)?.size || 0,
    });
  });

  // Broadcast to room
  socket.on('chapter:update', (bookId: string, chapterId: string, data: any) => {
    const roomId = `book:${bookId}`;

    io.to(roomId).emit('chapter:updated', {
      chapterId,
      ...data,
      timestamp: new Date(),
    });
  });
});

httpServer.listen(3000);
```

### Pattern 2: Namespace Organization

```typescript
// Books namespace
const booksNamespace = io.of('/books');

booksNamespace.on('connection', (socket: Socket) => {
  // Join specific book
  socket.on('join', (bookId: string) => {
    socket.join(`book:${bookId}`);
  });

  // Broadcast chapter update only to this book's readers
  socket.on('chapter:narrated', (bookId: string, chapterId: string) => {
    booksNamespace.to(`book:${bookId}`).emit('chapter:ready', {
      chapterId,
      url: `/audio/${bookId}/${chapterId}.mp3`,
    });
  });
});

// Social namespace
const socialNamespace = io.of('/social');

socialNamespace.on('connection', (socket: Socket) => {
  socket.on('post:create', (post: any) => {
    // Broadcast to global feed
    socialNamespace.emit('feed:update', post);
  });

  socket.on('comment:add', (postId: string, comment: any) => {
    socialNamespace.to(`post:${postId}`).emit('comment:new', comment);
  });
});

// Notifications namespace
const notificationsNamespace = io.of('/notifications');

notificationsNamespace.on('connection', (socket: Socket) => {
  const userId = socket.handshake.auth.userId;

  // User joins own notification room
  socket.join(`user:${userId}`);

  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected notifications`);
  });
});
```

### Pattern 3: Redis Adapter for Scaling

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

const pubClient = new Redis('redis://localhost:6379');
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

/**
 * Now rooms work across multiple Node.js servers
 */
io.on('connection', (socket: Socket) => {
  socket.on('book:join', (bookId: string) => {
    socket.join(`book:${bookId}`);

    // This broadcast reaches ALL servers
    io.to(`book:${bookId}`).emit('reader:joined', {
      userId: socket.handshake.auth.userId,
    });
  });

  // Get room info across all servers
  socket.on('get:readerCount', (bookId: string, callback) => {
    io.in(`book:${bookId}`).fetchSockets().then((sockets) => {
      callback({ count: sockets.length });
    });
  });
});
```

### Pattern 4: Typing Indicators

```typescript
interface UserTyping {
  userId: string;
  username: string;
  position: number; // Caret position
  isTyping: boolean;
}

class TypingIndicatorManager {
  private typingUsers: Map<string, UserTyping> = new Map();
  private typingTimeouts: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Track when user starts typing
   */
  startTyping(chapterId: string, user: UserTyping): void {
    const key = `${chapterId}:${user.userId}`;

    // Clear existing timeout
    if (this.typingTimeouts.has(key)) {
      clearTimeout(this.typingTimeouts.get(key));
    }

    // Store typing state
    this.typingUsers.set(key, user);

    // Auto-stop after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      this.stopTyping(chapterId, user.userId);
    }, 3000);

    this.typingTimeouts.set(key, timeout);
  }

  /**
   * Track when user stops typing
   */
  stopTyping(chapterId: string, userId: string): void {
    const key = `${chapterId}:${userId}`;

    this.typingUsers.delete(key);

    if (this.typingTimeouts.has(key)) {
      clearTimeout(this.typingTimeouts.get(key));
      this.typingTimeouts.delete(key);
    }
  }

  /**
   * Get who's typing in chapter
   */
  getTypingUsers(chapterId: string): UserTyping[] {
    return Array.from(this.typingUsers.values()).filter(
      (user) => user.userId.split(':')[0] === chapterId
    );
  }
}

// Setup typing indicators
const typingManager = new TypingIndicatorManager();

io.on('connection', (socket: Socket) => {
  socket.on('text:typing', (chapterId: string, position: number) => {
    const userId = socket.handshake.auth.userId;

    typingManager.startTyping(chapterId, {
      userId,
      username: socket.handshake.auth.username,
      position,
      isTyping: true,
    });

    // Notify other editors
    socket.to(`chapter:${chapterId}`).emit('editors:typing', {
      typing: typingManager.getTypingUsers(chapterId),
    });
  });

  socket.on('text:stopTyping', (chapterId: string) => {
    const userId = socket.handshake.auth.userId;
    typingManager.stopTyping(chapterId, userId);

    socket.to(`chapter:${chapterId}`).emit('editors:typing', {
      typing: typingManager.getTypingUsers(chapterId),
    });
  });
});
```

### Pattern 5: Room Events with Prisma Integration

```typescript
import { prisma } from '@/lib/prisma';

io.on('connection', async (socket: Socket) => {
  const userId = socket.handshake.auth.userId;

  // Auto-join user's subscribed books
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    include: { book: true },
  });

  for (const subscription of subscriptions) {
    socket.join(`book:${subscription.book.id}`);
  }

  // New chapter published
  socket.on('chapter:published', async (bookId: string, chapterId: string) => {
    // Save to database
    const chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: { publishedAt: new Date(), status: 'PUBLISHED' },
    });

    // Broadcast to readers
    io.to(`book:${bookId}`).emit('chapter:available', {
      bookId,
      chapterId,
      title: chapter.title,
      audioUrl: chapter.audioUrl,
      narratorName: chapter.narratorName,
    });

    // Notify author's followers
    const author = await prisma.book.findUnique({
      where: { id: bookId },
      include: { author: true },
    });

    io.to(`author:${author.authorId}`).emit('notification', {
      type: 'CHAPTER_PUBLISHED',
      message: `New chapter: ${chapter.title}`,
      bookId,
      chapterId,
    });
  });

  // Comment on chapter
  socket.on('comment:post', async (chapterId: string, text: string) => {
    const comment = await prisma.comment.create({
      data: {
        text,
        chapterId,
        authorId: userId,
      },
      include: { author: true },
    });

    // Get chapter's book
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: { book: true },
    });

    // Notify chapter readers
    io.to(`chapter:${chapterId}`).emit('comment:new', {
      id: comment.id,
      text: comment.text,
      author: comment.author.username,
      createdAt: comment.createdAt,
    });

    // Notify book's author
    io.to(`author:${chapter.book.authorId}`).emit('notification', {
      type: 'COMMENT_ON_BOOK',
      message: `New comment: "${text.slice(0, 50)}..."`,
      commentId: comment.id,
    });
  });

  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});
```

---

## Best Practices

### ✅ DO's

1. **Use Namespaces for Organization**
   - `/books` for book events
   - `/social` for social events
   - `/notifications` for alerts

2. **Prefix Room Names**
   - `book:123` - Clear what it is
   - `chapter:456` - Hierarchical
   - `user:789` - Obvious scope

3. **Use Redis Adapter for Scaling**
   - Works across multiple servers
   - No single point of failure
   - Cost-effective

4. **Clean Up on Disconnect**
   - Remove from rooms
   - Clear typing indicators
   - Update presence

5. **Persist to Database**
   - Rooms = temporary
   - Database = permanent
   - Publish-then-broadcast pattern

### ❌ DON'Ts

1. **Don't Use Default Namespace for Everything**
   - Harder to manage
   - Security issues
   - Unclear ownership

2. **Don't Broadcast Without Redis**
   - Only works on same server
   - Breaks with load balancing

3. **Don't Ignore Disconnections**
   - Leads to memory leaks
   - Incorrect user counts

4. **Don't Skip Authentication**
   - Anyone can join
   - Security risk

---

## Common Pitfalls

### ⚠️ Pitfall 1: Memory Leaks from Unpruned Rooms

**Problem:** Old rooms stay in memory forever

**Solution:**
```typescript
// Auto-delete empty rooms
io.on('connection', (socket) => {
  socket.on('disconnect', () => {
    const rooms = socket.rooms;
    for (const room of rooms) {
      if (io.sockets.adapter.rooms.get(room)?.size === 0) {
        // Room is empty, will auto-clean
      }
    }
  });
});
```

### ⚠️ Pitfall 2: Scaling Issues with Sticky Sessions

**Problem:** Users on different servers can't see each other

**Solution:**
```typescript
// Use Redis adapter (see Pattern 3)
io.adapter(createAdapter(pubClient, subClient));
```

### ⚠️ Pitfall 3: Broadcasting to Wrong Room

**Problem:** Users see each other's private data

**Solution:**
```typescript
// ✗ Wrong - broadcasts to everyone
io.emit('message', data);

// ✓ Correct - specific room
io.to(`chapter:${chapterId}`).emit('message', data);
```

### ⚠️ Pitfall 4: Race Conditions in Joins

**Problem:** User count is inconsistent

**Solution:**
```typescript
// Use atommic operations
socket.on('join', (roomId) => {
  socket.join(roomId);

  // Wait for all servers to sync before counting
  setTimeout(() => {
    io.in(roomId).fetchSockets().then(sockets => {
      io.to(roomId).emit('users', { count: sockets.length });
    });
  }, 100);
});
```

---

## Related Skills

- `socket-io-security` - Authentication and authorization
- `notification-system` - Push notifications
- `backend-dev-guidelines` - General patterns
- `nodejs-best-practices` - Node.js patterns

---

**Status:** ✅ Production Ready
**Last Updated:** 2026-02-13
**Project:** Livrya Real-time System
