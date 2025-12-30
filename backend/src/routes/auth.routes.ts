import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ============ Public Routes ============

// Registration & Login
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);

// Password Reset
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Email Verification (token in body, public access)
router.post('/verify-email', authController.verifyEmail);

// ============ Protected Routes ============

// Profile Management
router.get('/profile', authenticate, authController.getProfile);
router.patch('/profile', authenticate, authController.updateProfile);
router.post('/profile/avatar', authenticate, authController.uploadAvatar);

// Password Change (requires current password)
router.post('/change-password', authenticate, authController.changePassword);

// Resend Verification Email
router.post('/resend-verification', authenticate, authController.resendVerification);

export default router;
