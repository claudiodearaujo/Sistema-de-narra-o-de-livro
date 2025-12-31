import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import authRoutes from './routes/auth.routes';
import booksRoutes from './routes/books.routes';
import chaptersRoutes from './routes/chapters.routes';
import charactersRoutes from './routes/characters.routes';
import voicesRoutes from './routes/voices.routes';
import speechesRoutes from './routes/speeches.routes';
import { narrationRoutes } from './routes/narration.routes';
import { audioRoutes } from './routes/audio.routes';
import customVoicesRoutes from './routes/custom-voices.routes';
import postRoutes from './routes/post.routes';
import likeRoutes from './routes/like.routes';
import commentRoutes from './routes/comment.routes';
import followRoutes from './routes/follow.routes';
import notificationRoutes from './routes/notification.routes';
import profileRoutes from './routes/profile.routes';
import searchRoutes from './routes/search.routes';
import messageRoutes from './routes/message.routes';
import livraRoutes from './routes/livra.routes';
import subscriptionRoutes from './routes/subscription.routes';
import webhookRoutes from './routes/webhook.routes';
import achievementRoutes from './routes/achievement.routes';
import groupRoutes from './routes/group.routes';
import campaignRoutes from './routes/campaign.routes';
import { initializeWebSocket } from './websocket/websocket.server';
// Initialize Redis queues (if enabled)
import './queues/narration.queue';
import './queues/narration.processor';
import './queues/audio.queue';
import './queues/notification.queue';
import './queues/notification.worker';
import './queues/subscription.worker';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir arquivos estáticos (áudios gerados)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
    res.send('Sistema de Narração de Livros API - Gemini TTS');
});

// Auth Routes (public and protected)
app.use('/api/auth', authRoutes);

// Protected Routes (will add middleware to protect these later)
app.use('/api/books', booksRoutes);
app.use('/api', chaptersRoutes);
app.use('/api', charactersRoutes);
app.use('/api', voicesRoutes);
app.use('/api', speechesRoutes);
app.use('/api', narrationRoutes);
app.use('/api', audioRoutes);
app.use('/api', customVoicesRoutes);
app.use('/api/posts', postRoutes);

// Social interaction routes (Sprint 3)
app.use('/api/posts', likeRoutes);      // Like routes nested under posts
app.use('/api', commentRoutes);          // Comment routes (posts/:postId/comments and /comments/:id)
app.use('/api/users', followRoutes);     // Follow routes under users
app.use('/api/notifications', notificationRoutes);  // Notification routes

// Sprint 4: Profile and Search routes
app.use('/api/users', profileRoutes);    // Profile routes (must be after followRoutes)
app.use('/api/search', searchRoutes);    // Search routes

// Sprint 5: Messages routes
app.use('/api/messages', messageRoutes); // Direct messages

// Sprint 8: Livra system routes
app.use('/api/livras', livraRoutes);     // Livra balance and transactions

// Sprint 9: Subscription and payment routes
app.use('/api/subscription', subscriptionRoutes);  // Subscription management
app.use('/api/webhooks', webhookRoutes);           // Stripe webhooks

// Sprint 10: Achievement routes
app.use('/api/achievements', achievementRoutes);   // Achievements and gamification

// Sprint 11: Groups and Campaigns routes
app.use('/api/groups', groupRoutes);               // Groups and group campaigns
app.use('/api/campaigns', campaignRoutes);         // Campaign management

// Initialize WebSocket
initializeWebSocket(httpServer);

httpServer.listen(port, () => {
    console.log(`🚀 Servidor rodando na porta ${port}`);
    console.log(`📁 Arquivos de áudio em: ${path.join(__dirname, '../uploads')}`);
});
