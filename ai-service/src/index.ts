import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { serverConfig } from './config/server.config';
import { aiFactory } from './ai/ai.factory';
import { checkFfmpegInstalled } from './services/audio-converter';
import routes from './routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: serverConfig.corsOrigins,
    credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
if (serverConfig.nodeEnv !== 'test') {
    app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: serverConfig.rateLimit.windowMs,
    max: serverConfig.rateLimit.maxRequests,
    message: { error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        name: 'AI Service',
        version: '1.0.0',
        description: 'Standalone AI Service for TTS, Text and Image generation',
        docs: '/api/docs',
        health: '/api/health',
    });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: serverConfig.nodeEnv === 'development' ? err.message : 'Internal server error',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
async function start() {
    try {
        console.log('Starting AI Service...');
        console.log(`Environment: ${serverConfig.nodeEnv}`);

        // Check FFmpeg
        const ffmpegOk = await checkFfmpegInstalled();
        if (!ffmpegOk) {
            console.warn('WARNING: FFmpeg not found. Audio conversion features will not work.');
        } else {
            console.log('FFmpeg: OK');
        }

        // Initialize AI providers
        await aiFactory.initialize();

        // Start listening
        app.listen(serverConfig.port, () => {
            console.log(`AI Service running on port ${serverConfig.port}`);
            console.log(`Health check: http://localhost:${serverConfig.port}/api/health`);
        });
    } catch (error) {
        console.error('Failed to start AI Service:', error);
        process.exit(1);
    }
}

start();

export default app;
