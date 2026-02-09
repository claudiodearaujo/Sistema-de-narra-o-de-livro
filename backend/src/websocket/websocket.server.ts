import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { messageService } from '../services/message.service';
import { notificationService } from '../services/notification.service';
import { setNotificationWorkerEmitter } from '../queues/notification.worker';
import { setLivraWebSocketEmitter } from '../services/livra.service';
import { auditService } from '../services/audit.service';

export let io: Server;

// Map of userId to socket ids (a user can have multiple connections)
const userSockets = new Map<string, Set<string>>();

interface SocketUser {
  userId: string;
  role: UserRole;
}

/**
 * Get user data from socket authentication
 */
async function getUserFromSocket(socket: Socket): Promise<SocketUser | null> {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    });
    
    if (!user) return null;
    
    return {
      userId: user.id,
      role: user.role
    };
  } catch {
    return null;
  }
}

/**
 * Emit event to a specific user (all their connections)
 */
export function emitToUser(userId: string, event: string, data: any): void {
  const socketIds = userSockets.get(userId);
  if (socketIds && io) {
    socketIds.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
  }
}

/**
 * Emit event to all connected users
 */
export function emitToAll(event: string, data: any): void {
  if (io) {
    io.emit(event, data);
  }
}

/**
 * Emit event to all admins only
 */
export function emitToAdmins(event: string, data: any): void {
  if (io) {
    io.to('admin-room').emit(event, data);
  }
}

/**
 * WebSocket emitter for services
 */
function websocketEmitter(userId: string, event: string, data: any): void {
  if (userId === 'broadcast') {
    emitToAll(event, data);
  } else if (userId === 'admin-room') {
    emitToAdmins(event, data);
  } else {
    emitToUser(userId, event, data);
  }
}

export const initializeWebSocket = (httpServer: HttpServer) => {
  // WebSocket CORS Configuration - restrict origins in production
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:4200', 'http://localhost:3000'];

  io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? allowedOrigins 
        : '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Connect services to WebSocket emitter
  messageService.setWebSocketEmitter(websocketEmitter);
  notificationService.setWebSocketEmitter(websocketEmitter);
  setNotificationWorkerEmitter(websocketEmitter);
  setLivraWebSocketEmitter(websocketEmitter);
  auditService.setWebSocketEmitter(websocketEmitter);

  io.on('connection', async (socket) => {
    console.log('Client connected:', socket.id);

    const user = await getUserFromSocket(socket);
    const userId: string | undefined = user?.userId;

    // Register user socket connection
    if (user) {
      const uid = user.userId;
      const { role } = user;

      if (!userSockets.has(uid)) {
        userSockets.set(uid, new Set());
      }
      userSockets.get(uid)!.add(socket.id);

      // Mark user as online
      messageService.setUserOnline(uid);
      console.log(`User ${uid} (${role}) is now online (socket: ${socket.id})`);

      // Join user's personal room for targeted messages
      socket.join(`user:${uid}`);

      // Join admin room if user is admin
      if (role === UserRole.ADMIN) {
        socket.join('admin-room');
        console.log(`Admin ${uid} joined admin-room`);
      }
    }

    // ===== Chapter Events (existing) =====
    socket.on('join:chapter', (chapterId: string) => {
      console.log(`Socket ${socket.id} joined chapter:${chapterId}`);
      socket.join(`chapter:${chapterId}`);
    });

    socket.on('leave:chapter', (chapterId: string) => {
      console.log(`Socket ${socket.id} left chapter:${chapterId}`);
      socket.leave(`chapter:${chapterId}`);
    });

    // ===== Message Events (Sprint 5) =====
    
    // Join a conversation room
    socket.on('conversation:join', (otherUserId: string) => {
      if (!userId) return;
      const roomId = [userId, otherUserId].sort().join(':');
      socket.join(`conversation:${roomId}`);
      console.log(`Socket ${socket.id} joined conversation:${roomId}`);
    });

    // Leave a conversation room
    socket.on('conversation:leave', (otherUserId: string) => {
      if (!userId) return;
      const roomId = [userId, otherUserId].sort().join(':');
      socket.leave(`conversation:${roomId}`);
      console.log(`Socket ${socket.id} left conversation:${roomId}`);
    });

    // Typing indicator
    socket.on('message:typing', (data: { receiverId: string; isTyping: boolean }) => {
      if (!userId) return;
      messageService.emitTyping(userId, data.receiverId, data.isTyping);
    });

    // Request online status of users
    socket.on('presence:check', (userIds: string[]) => {
      const status = userIds.reduce((acc, id) => {
        acc[id] = messageService.isUserOnline(id);
        return acc;
      }, {} as Record<string, boolean>);
      socket.emit('presence:status', status);
    });

    // ===== Disconnect =====
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);

      if (userId) {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            userSockets.delete(userId);
            messageService.setUserOffline(userId);
            console.log(`User ${userId} is now offline`);
          }
        }
      }
    });
  });

  return io;
};
