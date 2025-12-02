import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

export let io: Server;

export const initializeWebSocket = (httpServer: HttpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: '*', // Configure appropriately for production
            methods: ['GET', 'POST']
        }
    });

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('join:chapter', (chapterId: string) => {
            console.log(`Socket ${socket.id} joined chapter:${chapterId}`);
            socket.join(`chapter:${chapterId}`);
        });

        socket.on('leave:chapter', (chapterId: string) => {
            console.log(`Socket ${socket.id} left chapter:${chapterId}`);
            socket.leave(`chapter:${chapterId}`);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};
