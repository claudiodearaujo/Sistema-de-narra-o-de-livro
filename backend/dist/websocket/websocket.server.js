"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeWebSocket = exports.io = void 0;
const socket_io_1 = require("socket.io");
const initializeWebSocket = (httpServer) => {
    exports.io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*', // Configure appropriately for production
            methods: ['GET', 'POST']
        }
    });
    exports.io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);
        socket.on('join:chapter', (chapterId) => {
            console.log(`Socket ${socket.id} joined chapter:${chapterId}`);
            socket.join(`chapter:${chapterId}`);
        });
        socket.on('leave:chapter', (chapterId) => {
            console.log(`Socket ${socket.id} left chapter:${chapterId}`);
            socket.leave(`chapter:${chapterId}`);
        });
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
    return exports.io;
};
exports.initializeWebSocket = initializeWebSocket;
