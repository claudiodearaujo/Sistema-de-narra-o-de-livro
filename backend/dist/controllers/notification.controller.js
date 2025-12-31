"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = void 0;
exports.getNotifications = getNotifications;
exports.getNotificationCount = getNotificationCount;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.deleteNotification = deleteNotification;
exports.deleteAllNotifications = deleteAllNotifications;
const notification_service_1 = require("../services/notification.service");
/**
 * GET /api/notifications - Get notifications for current user
 */
async function getNotifications(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 50);
        const type = req.query.type;
        // Validate type if provided
        const validTypes = [
            'LIKE', 'COMMENT', 'FOLLOW', 'MENTION', 'MESSAGE',
            'BOOK_UPDATE', 'ACHIEVEMENT', 'LIVRA_EARNED', 'SYSTEM'
        ];
        if (type && !validTypes.includes(type)) {
            res.status(400).json({ error: 'Tipo de notificação inválido' });
            return;
        }
        const result = await notification_service_1.notificationService.getByUser(userId, page, limit, type);
        res.json(result);
    }
    catch (error) {
        console.error('[NotificationController] Error getting notifications:', error.message);
        res.status(500).json({ error: 'Erro ao buscar notificações' });
    }
}
/**
 * GET /api/notifications/count - Get unread notification count
 */
async function getNotificationCount(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const counts = await notification_service_1.notificationService.getCounts(userId);
        res.json(counts);
    }
    catch (error) {
        console.error('[NotificationController] Error getting count:', error.message);
        res.status(500).json({ error: 'Erro ao contar notificações' });
    }
}
/**
 * PATCH /api/notifications/:id/read - Mark a notification as read
 */
async function markAsRead(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'ID da notificação é obrigatório' });
            return;
        }
        const notification = await notification_service_1.notificationService.markAsRead(id, userId);
        res.json(notification);
    }
    catch (error) {
        console.error('[NotificationController] Error marking as read:', error.message);
        if (error.message.includes('não encontrada')) {
            res.status(404).json({ error: error.message });
        }
        else if (error.message.includes('permissão')) {
            res.status(403).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Erro ao marcar como lida' });
        }
    }
}
/**
 * PATCH /api/notifications/read-all - Mark all notifications as read
 */
async function markAllAsRead(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const count = await notification_service_1.notificationService.markAllAsRead(userId);
        res.json({ marked: count });
    }
    catch (error) {
        console.error('[NotificationController] Error marking all as read:', error.message);
        res.status(500).json({ error: 'Erro ao marcar todas como lidas' });
    }
}
/**
 * DELETE /api/notifications/:id - Delete a notification
 */
async function deleteNotification(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const { id } = req.params;
        if (!id) {
            res.status(400).json({ error: 'ID da notificação é obrigatório' });
            return;
        }
        await notification_service_1.notificationService.delete(id, userId);
        res.status(204).send();
    }
    catch (error) {
        console.error('[NotificationController] Error deleting notification:', error.message);
        if (error.message.includes('não encontrada')) {
            res.status(404).json({ error: error.message });
        }
        else if (error.message.includes('permissão')) {
            res.status(403).json({ error: error.message });
        }
        else {
            res.status(500).json({ error: 'Erro ao excluir notificação' });
        }
    }
}
/**
 * DELETE /api/notifications - Delete all notifications
 */
async function deleteAllNotifications(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const count = await notification_service_1.notificationService.deleteAll(userId);
        res.json({ deleted: count });
    }
    catch (error) {
        console.error('[NotificationController] Error deleting all notifications:', error.message);
        res.status(500).json({ error: 'Erro ao excluir notificações' });
    }
}
exports.notificationController = {
    getNotifications,
    getNotificationCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
};
