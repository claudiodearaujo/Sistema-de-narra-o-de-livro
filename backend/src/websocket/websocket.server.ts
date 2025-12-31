import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { messageService } from '../services/message.service';
import { notificationService } from '../services/notification.service';
import { setNotificationWorkerEmitter } from '../queues/notification.worker';
import { setLivraWebSocketEmitter } from '../services/livra.service';

export let io: Server;

// Map of userId to socket ids (a user can have multiple connections)
const userSockets = new Map<string, Set<string>>();

/**
 * Get user ID from socket authentication
 */
function getUserIdFromSocket(socket: Socket): string | null {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    return decoded.userId;
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
 * WebSocket emitter for services
 */
function websocketEmitter(userId: string, event: string, data: any): void {
  if (userId === 'broadcast') {
    emitToAll(event, data);
  } else {
    emitToUser(userId, event, data);
  }
}

export const initializeWebSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Configure appropriately for production
      methods: ['GET', 'POST']
    }
  });

  // Connect services to WebSocket emitter
  messageService.setWebSocketEmitter(websocketEmitter);
  notificationService.setWebSocketEmitter(websocketEmitter);
  setNotificationWorkerEmitter(websocketEmitter);
  setLivraWebSocketEmitter(websocketEmitter);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    const userId = getUserIdFromSocket(socket);

    // Register user socket connection
    if (userId) {
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId)!.add(socket.id);
      
      // Mark user as online
      messageService.setUserOnline(userId);
      console.log(`User ${userId} is now online (socket: ${socket.id})`);

      // Join user's personal room for targeted messages
      socket.join(`user:${userId}`);
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
