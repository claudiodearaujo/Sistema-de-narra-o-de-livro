import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authenticate } from '../middleware';

const router = Router();

/**
 * Notification Routes
 * Base path: /api/notifications
 * 
 * All routes require authentication
 */

// Get notifications for current user (with optional type filter)
router.get('/', authenticate, notificationController.getNotifications);

// Get unread notification count
router.get('/count', authenticate, notificationController.getNotificationCount);

// Mark all notifications as read
router.patch('/read-all', authenticate, notificationController.markAllAsRead);

// Mark a specific notification as read
router.patch('/:id/read', authenticate, notificationController.markAsRead);

// Delete all notifications
router.delete('/', authenticate, notificationController.deleteAllNotifications);

// Delete a specific notification
router.delete('/:id', authenticate, notificationController.deleteNotification);

export default router;
