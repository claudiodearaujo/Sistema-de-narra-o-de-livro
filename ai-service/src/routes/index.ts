import { Router } from 'express';
import ttsRoutes from './tts.routes';
import usageRoutes from './usage.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
    });
});

// API routes
router.use('/tts', ttsRoutes);
router.use('/usage', usageRoutes);
router.use('/admin', adminRoutes);

export default router;
