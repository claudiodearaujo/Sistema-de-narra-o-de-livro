"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_controller_1 = require("../controllers/message.controller");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
/**
 * Message Routes
 * Base path: /api/messages
 *
 * All routes require authentication
 */
// Get all conversations (inbox)
router.get('/conversations', middleware_1.authenticate, message_controller_1.messageController.getConversations);
// Get total unread message count
router.get('/unread-count', middleware_1.authenticate, message_controller_1.messageController.getUnreadCount);
// Get online users
router.get('/online', middleware_1.authenticate, message_controller_1.messageController.getOnlineUsers);
// Get messages with a specific user
router.get('/:userId', middleware_1.authenticate, message_controller_1.messageController.getMessages);
// Send a message to a user (rate limited)
router.post('/:userId', middleware_1.authenticate, (0, middleware_1.rateLimit)('message:send'), message_controller_1.messageController.sendMessage);
// Mark all messages from a user as read
router.put('/:userId/read', middleware_1.authenticate, message_controller_1.messageController.markAsRead);
// Notify typing status (rate limited to prevent spam)
router.post('/:userId/typing', middleware_1.authenticate, (0, middleware_1.rateLimit)('message:typing'), message_controller_1.messageController.notifyTyping);
// Delete a message
router.delete('/message/:messageId', middleware_1.authenticate, message_controller_1.messageController.deleteMessage);
exports.default = router;
