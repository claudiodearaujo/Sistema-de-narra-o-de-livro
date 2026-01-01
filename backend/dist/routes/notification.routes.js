"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * Notification Routes
 * Base path: /api/notifications
 *
 * All routes require authentication
 */
// Get notifications for current user (with optional type filter)
router.get('/', middleware_1.authenticate, notification_controller_1.notificationController.getNotifications);
// Get unread notification count
router.get('/count', middleware_1.authenticate, notification_controller_1.notificationController.getNotificationCount);
// Mark all notifications as read
router.patch('/read-all', middleware_1.authenticate, notification_controller_1.notificationController.markAllAsRead);
// Mark a specific notification as read
router.patch('/:id/read', middleware_1.authenticate, notification_controller_1.notificationController.markAsRead);
// Delete all notifications
router.delete('/', middleware_1.authenticate, notification_controller_1.notificationController.deleteAllNotifications);
// Delete a specific notification
router.delete('/:id', middleware_1.authenticate, notification_controller_1.notificationController.deleteNotification);
// Push notification subscription management
router.post('/push/subscribe', middleware_1.authenticate, notification_controller_1.notificationController.subscribeToPush);
router.post('/push/unsubscribe', middleware_1.authenticate, notification_controller_1.notificationController.unsubscribeFromPush);
exports.default = router;
