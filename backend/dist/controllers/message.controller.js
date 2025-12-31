"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageController = void 0;
exports.getConversations = getConversations;
exports.getUnreadCount = getUnreadCount;
exports.getMessages = getMessages;
exports.sendMessage = sendMessage;
exports.markAsRead = markAsRead;
exports.deleteMessage = deleteMessage;
exports.notifyTyping = notifyTyping;
exports.getOnlineUsers = getOnlineUsers;
const message_service_1 = require("../services/message.service");
/**
 * GET /api/messages/conversations - Get user's conversations
 */
async function getConversations(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const result = await message_service_1.messageService.getConversations(userId, page, limit);
        res.json(result);
    }
    catch (error) {
        console.error('[MessageController] Error getting conversations:', error.message);
        res.status(500).json({ error: 'Erro ao buscar conversas' });
    }
}
/**
 * GET /api/messages/unread-count - Get total unread message count
 */
async function getUnreadCount(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const count = await message_service_1.messageService.getUnreadCount(userId);
        res.json({ unreadCount: count });
    }
    catch (error) {
        console.error('[MessageController] Error getting unread count:', error.message);
        res.status(500).json({ error: 'Erro ao buscar contagem de mensagens' });
    }
}
/**
 * GET /api/messages/:userId - Get messages with a specific user
 */
async function getMessages(req, res) {
    try {
        const currentUserId = req.user?.userId;
        if (!currentUserId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({ error: 'ID do usuário é obrigatório' });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 50, 100);
        const result = await message_service_1.messageService.getMessages(currentUserId, userId, page, limit);
        res.json(result);
    }
    catch (error) {
        console.error('[MessageController] Error getting messages:', error.message);
        if (error.message.includes('não encontrado')) {
            res.status(404).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Erro ao buscar mensagens' });
        }
    }
}
/**
 * POST /api/messages/:userId - Send a message to a user
 */
async function sendMessage(req, res) {
    try {
        const senderId = req.user?.userId;
        if (!senderId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const { userId: receiverId } = req.params;
        if (!receiverId) {
            res.status(400).json({ error: 'ID do destinatário é obrigatório' });
            return;
        }
        const { content } = req.body;
        if (!content) {
            res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório' });
            return;
        }
        const result = await message_service_1.messageService.sendMessage(senderId, receiverId, { content });
        res.status(201).json(result);
    }
    catch (error) {
        console.error('[MessageController] Error sending message:', error.message);
        if (error.message.includes('não encontrado')) {
            res.status(404).json({ error: error.message });
        }
        else if (error.message.includes('si mesmo') || error.message.includes('vazia') || error.message.includes('longa')) {
            res.status(400).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Erro ao enviar mensagem' });
        }
    }
}
/**
 * PUT /api/messages/:userId/read - Mark all messages from a user as read
 */
async function markAsRead(req, res) {
    try {
        const currentUserId = req.user?.userId;
        if (!currentUserId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const { userId: otherUserId } = req.params;
        if (!otherUserId) {
            res.status(400).json({ error: 'ID do usuário é obrigatório' });
            return;
        }
        const result = await message_service_1.messageService.markAsRead(currentUserId, otherUserId);
        res.json(result);
    }
    catch (error) {
        console.error('[MessageController] Error marking as read:', error.message);
        res.status(500).json({ error: 'Erro ao marcar como lida' });
    }
}
/**
 * DELETE /api/messages/:messageId - Delete a message
 */
async function deleteMessage(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const { messageId } = req.params;
        if (!messageId) {
            res.status(400).json({ error: 'ID da mensagem é obrigatório' });
            return;
        }
        await message_service_1.messageService.deleteMessage(messageId, userId);
        res.json({ success: true });
    }
    catch (error) {
        console.error('[MessageController] Error deleting message:', error.message);
        if (error.message.includes('não encontrada')) {
            res.status(404).json({ error: error.message });
        }
        else if (error.message.includes('não pode')) {
            res.status(403).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Erro ao deletar mensagem' });
        }
    }
}
/**
 * POST /api/messages/:userId/typing - Notify typing status
 */
async function notifyTyping(req, res) {
    try {
        const senderId = req.user?.userId;
        if (!senderId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const { userId: receiverId } = req.params;
        if (!receiverId) {
            res.status(400).json({ error: 'ID do usuário é obrigatório' });
            return;
        }
        const { isTyping } = req.body;
        message_service_1.messageService.emitTyping(senderId, receiverId, isTyping ?? true);
        res.json({ success: true });
    }
    catch (error) {
        console.error('[MessageController] Error notifying typing:', error.message);
        res.status(500).json({ error: 'Erro ao enviar status de digitação' });
    }
}
/**
 * GET /api/messages/online - Get online users
 */
async function getOnlineUsers(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const onlineUsers = message_service_1.messageService.getOnlineUsers();
        res.json({ users: onlineUsers });
    }
    catch (error) {
        console.error('[MessageController] Error getting online users:', error.message);
        res.status(500).json({ error: 'Erro ao buscar usuários online' });
    }
}
exports.messageController = {
    getConversations,
    getUnreadCount,
    getMessages,
    sendMessage,
    markAsRead,
    deleteMessage,
    notifyTyping,
    getOnlineUsers
};
