"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = void 0;
exports.getNotifications = getNotifications;
exports.getNotificationCount = getNotificationCount;
exports.markAsRead = markAsRead;
exports.markAllAsRead = markAllAsRead;
exports.deleteNotification = deleteNotification;
exports.deleteAllNotifications = deleteAllNotifications;
exports.subscribeToPush = subscribeToPush;
exports.unsubscribeFromPush = unsubscribeFromPush;
const notification_service_1 = require("../services/notification.service");
const push_service_1 = require("../services/push.service");
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
        const id = req.params.id;
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
        const id = req.params.id;
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
/**
 * POST /api/notifications/push/subscribe - Subscribe to push notifications
 */
async function subscribeToPush(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const { subscription } = req.body;
        if (!subscription || !subscription.endpoint || !subscription.keys) {
            res.status(400).json({ error: 'Dados de subscription inválidos' });
            return;
        }
        await push_service_1.pushService.saveSubscription(userId, subscription);
        res.json({
            success: true,
            message: 'Inscrição para push notifications ativada'
        });
    }
    catch (error) {
        console.error('[NotificationController] Error subscribing to push:', error.message);
        res.status(500).json({ error: 'Erro ao ativar push notifications' });
    }
}
/**
 * POST /api/notifications/push/unsubscribe - Unsubscribe from push notifications
 */
async function unsubscribeFromPush(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Autenticação necessária' });
            return;
        }
        const { endpoint } = req.body;
        if (!endpoint) {
            res.status(400).json({ error: 'Endpoint é obrigatório' });
            return;
        }
        await push_service_1.pushService.removeSubscription(userId, endpoint);
        res.json({
            success: true,
            message: 'Inscrição para push notifications cancelada'
        });
    }
    catch (error) {
        console.error('[NotificationController] Error unsubscribing from push:', error.message);
        res.status(500).json({ error: 'Erro ao cancelar push notifications' });
    }
}
exports.notificationController = {
    getNotifications,
    getNotificationCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    subscribeToPush,
    unsubscribeFromPush
};
