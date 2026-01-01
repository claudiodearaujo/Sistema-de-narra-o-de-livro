"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWebSocket = exports.io = void 0;
exports.emitToUser = emitToUser;
exports.emitToAll = emitToAll;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const message_service_1 = require("../services/message.service");
const notification_service_1 = require("../services/notification.service");
const notification_worker_1 = require("../queues/notification.worker");
const livra_service_1 = require("../services/livra.service");
// Map of userId to socket ids (a user can have multiple connections)
const userSockets = new Map();
/**
 * Get user ID from socket authentication
 */
function getUserIdFromSocket(socket) {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token)
        return null;
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        return decoded.userId;
    }
    catch {
        return null;
    }
}
/**
 * Emit event to a specific user (all their connections)
 */
function emitToUser(userId, event, data) {
    const socketIds = userSockets.get(userId);
    if (socketIds && exports.io) {
        socketIds.forEach(socketId => {
            exports.io.to(socketId).emit(event, data);
        });
    }
}
/**
 * Emit event to all connected users
 */
function emitToAll(event, data) {
    if (exports.io) {
        exports.io.emit(event, data);
    }
}
/**
 * WebSocket emitter for services
 */
function websocketEmitter(userId, event, data) {
    if (userId === 'broadcast') {
        emitToAll(event, data);
    }
    else {
        emitToUser(userId, event, data);
    }
}
const initializeWebSocket = (httpServer) => {
    // WebSocket CORS Configuration - restrict origins in production
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:4200', 'http://localhost:3000'];
    exports.io = new socket_io_1.Server(httpServer, {
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
    message_service_1.messageService.setWebSocketEmitter(websocketEmitter);
    notification_service_1.notificationService.setWebSocketEmitter(websocketEmitter);
    (0, notification_worker_1.setNotificationWorkerEmitter)(websocketEmitter);
    (0, livra_service_1.setLivraWebSocketEmitter)(websocketEmitter);
    exports.io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        const userId = getUserIdFromSocket(socket);
        // Register user socket connection
        if (userId) {
            if (!userSockets.has(userId)) {
                userSockets.set(userId, new Set());
            }
            userSockets.get(userId).add(socket.id);
            // Mark user as online
            message_service_1.messageService.setUserOnline(userId);
            console.log(`User ${userId} is now online (socket: ${socket.id})`);
            // Join user's personal room for targeted messages
            socket.join(`user:${userId}`);
        }
        // ===== Chapter Events (existing) =====
        socket.on('join:chapter', (chapterId) => {
            console.log(`Socket ${socket.id} joined chapter:${chapterId}`);
            socket.join(`chapter:${chapterId}`);
        });
        socket.on('leave:chapter', (chapterId) => {
            console.log(`Socket ${socket.id} left chapter:${chapterId}`);
            socket.leave(`chapter:${chapterId}`);
        });
        // ===== Message Events (Sprint 5) =====
        // Join a conversation room
        socket.on('conversation:join', (otherUserId) => {
            if (!userId)
                return;
            const roomId = [userId, otherUserId].sort().join(':');
            socket.join(`conversation:${roomId}`);
            console.log(`Socket ${socket.id} joined conversation:${roomId}`);
        });
        // Leave a conversation room
        socket.on('conversation:leave', (otherUserId) => {
            if (!userId)
                return;
            const roomId = [userId, otherUserId].sort().join(':');
            socket.leave(`conversation:${roomId}`);
            console.log(`Socket ${socket.id} left conversation:${roomId}`);
        });
        // Typing indicator
        socket.on('message:typing', (data) => {
            if (!userId)
                return;
            message_service_1.messageService.emitTyping(userId, data.receiverId, data.isTyping);
        });
        // Request online status of users
        socket.on('presence:check', (userIds) => {
            const status = userIds.reduce((acc, id) => {
                acc[id] = message_service_1.messageService.isUserOnline(id);
                return acc;
            }, {});
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
                        message_service_1.messageService.setUserOffline(userId);
                        console.log(`User ${userId} is now offline`);
                    }
                }
            }
        });
    });
    return exports.io;
};
exports.initializeWebSocket = initializeWebSocket;
