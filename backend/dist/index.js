"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const http_1 = require("http");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const books_routes_1 = __importDefault(require("./routes/books.routes"));
const chapters_routes_1 = __importDefault(require("./routes/chapters.routes"));
const characters_routes_1 = __importDefault(require("./routes/characters.routes"));
const voices_routes_1 = __importDefault(require("./routes/voices.routes"));
const speeches_routes_1 = __importDefault(require("./routes/speeches.routes"));
const narration_routes_1 = require("./routes/narration.routes");
const audio_routes_1 = require("./routes/audio.routes");
const custom_voices_routes_1 = __importDefault(require("./routes/custom-voices.routes"));
const post_routes_1 = __importDefault(require("./routes/post.routes"));
const like_routes_1 = __importDefault(require("./routes/like.routes"));
const comment_routes_1 = __importDefault(require("./routes/comment.routes"));
const follow_routes_1 = __importDefault(require("./routes/follow.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const search_routes_1 = __importDefault(require("./routes/search.routes"));
const message_routes_1 = __importDefault(require("./routes/message.routes"));
const livra_routes_1 = __importDefault(require("./routes/livra.routes"));
const subscription_routes_1 = __importDefault(require("./routes/subscription.routes"));
const webhook_routes_1 = __importDefault(require("./routes/webhook.routes"));
const achievement_routes_1 = __importDefault(require("./routes/achievement.routes"));
const group_routes_1 = __importDefault(require("./routes/group.routes"));
const campaign_routes_1 = __importDefault(require("./routes/campaign.routes"));
const story_routes_1 = __importDefault(require("./routes/story.routes"));
const websocket_server_1 = require("./websocket/websocket.server");
const middleware_1 = require("./middleware");
// Initialize Redis queues (if enabled)
require("./queues/narration.queue");
require("./queues/narration.processor");
require("./queues/audio.queue");
require("./queues/notification.queue");
require("./queues/notification.worker");
require("./queues/subscription.worker");
require("./queues/story.worker");
dotenv_1.default.config();
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const port = process.env.PORT || 3000;
// CORS Configuration - restrict origins in production
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:4200', 'http://localhost:3000'];
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};
// Audit context middleware - MUST be first to capture all request data
app.use((0, middleware_1.auditContext)());
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Servir arquivos estáticos (áudios gerados)
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
app.get('/', (req, res) => {
    res.send('Sistema de Narração de Livros API - Gemini TTS');
});
// Auth Routes (public and protected)
app.use('/api/auth', auth_routes_1.default);
// Protected Routes (will add middleware to protect these later)
app.use('/api/books', books_routes_1.default);
app.use('/api', chapters_routes_1.default);
app.use('/api', characters_routes_1.default);
app.use('/api', voices_routes_1.default);
app.use('/api', speeches_routes_1.default);
app.use('/api', narration_routes_1.narrationRoutes);
app.use('/api', audio_routes_1.audioRoutes);
app.use('/api', custom_voices_routes_1.default);
app.use('/api/posts', post_routes_1.default);
// Social interaction routes (Sprint 3)
app.use('/api/posts', like_routes_1.default); // Like routes nested under posts
app.use('/api', comment_routes_1.default); // Comment routes (posts/:postId/comments and /comments/:id)
app.use('/api/users', follow_routes_1.default); // Follow routes under users
app.use('/api/notifications', notification_routes_1.default); // Notification routes
// Sprint 4: Profile and Search routes
app.use('/api/users', profile_routes_1.default); // Profile routes (must be after followRoutes)
app.use('/api/search', search_routes_1.default); // Search routes
// Sprint 5: Messages routes
app.use('/api/messages', message_routes_1.default); // Direct messages
// Sprint 8: Livra system routes
app.use('/api/livras', livra_routes_1.default); // Livra balance and transactions
// Sprint 9: Subscription and payment routes
app.use('/api/subscription', subscription_routes_1.default); // Subscription management
app.use('/api/webhooks', webhook_routes_1.default); // Stripe webhooks
// Sprint 10: Achievement routes
app.use('/api/achievements', achievement_routes_1.default); // Achievements and gamification
// Sprint 11: Groups and Campaigns routes
app.use('/api/groups', group_routes_1.default); // Groups and group campaigns
app.use('/api/campaigns', campaign_routes_1.default); // Campaign management
// Sprint 12: Stories routes
app.use('/api/stories', story_routes_1.default); // Stories (ephemeral content)
// Initialize WebSocket
(0, websocket_server_1.initializeWebSocket)(httpServer);
httpServer.listen(port, () => {
    console.log(`🚀 Servidor rodando na porta ${port}`);
    console.log(`📁 Arquivos de áudio em: ${path_1.default.join(__dirname, '../uploads')}`);
});
