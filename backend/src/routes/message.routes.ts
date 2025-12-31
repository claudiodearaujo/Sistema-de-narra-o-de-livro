import { Router } from 'express';
import { messageController } from '../controllers/message.controller';
import { authenticate, rateLimit } from '../middleware';

const router = Router();

/**
 * Message Routes
 * Base path: /api/messages
 * 
 * All routes require authentication
 */

// Get all conversations (inbox)
router.get('/conversations', authenticate, messageController.getConversations);

// Get total unread message count
router.get('/unread-count', authenticate, messageController.getUnreadCount);

// Get online users
router.get('/online', authenticate, messageController.getOnlineUsers);

// Get messages with a specific user
router.get('/:userId', authenticate, messageController.getMessages);

// Send a message to a user (rate limited)
router.post('/:userId', authenticate, rateLimit('message:send'), messageController.sendMessage);

// Mark all messages from a user as read
router.put('/:userId/read', authenticate, messageController.markAsRead);

// Notify typing status (rate limited to prevent spam)
router.post('/:userId/typing', authenticate, rateLimit('message:typing'), messageController.notifyTyping);

// Delete a message
router.delete('/message/:messageId', authenticate, messageController.deleteMessage);

export default router;
