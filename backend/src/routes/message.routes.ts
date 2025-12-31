import { Router } from 'express';
import { messageController } from '../controllers/message.controller';
import { authenticate } from '../middleware';

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

// Send a message to a user
router.post('/:userId', authenticate, messageController.sendMessage);

// Mark all messages from a user as read
router.put('/:userId/read', authenticate, messageController.markAsRead);

// Notify typing status
router.post('/:userId/typing', authenticate, messageController.notifyTyping);

// Delete a message
router.delete('/message/:messageId', authenticate, messageController.deleteMessage);

export default router;
