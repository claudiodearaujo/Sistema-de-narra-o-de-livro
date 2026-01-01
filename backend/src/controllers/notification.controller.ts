import { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { pushService, PushSubscriptionData } from '../services/push.service';
import { NotificationType } from '@prisma/client';

/**
 * GET /api/notifications - Get notifications for current user
 */
export async function getNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const type = req.query.type as NotificationType | undefined;

    // Validate type if provided
    const validTypes: NotificationType[] = [
      'LIKE', 'COMMENT', 'FOLLOW', 'MENTION', 'MESSAGE',
      'BOOK_UPDATE', 'ACHIEVEMENT', 'LIVRA_EARNED', 'SYSTEM'
    ];
    if (type && !validTypes.includes(type)) {
      res.status(400).json({ error: 'Tipo de notificação inválido' });
      return;
    }

    const result = await notificationService.getByUser(userId, page, limit, type);
    res.json(result);
  } catch (error: any) {
    console.error('[NotificationController] Error getting notifications:', error.message);
    res.status(500).json({ error: 'Erro ao buscar notificações' });
  }
}

/**
 * GET /api/notifications/count - Get unread notification count
 */
export async function getNotificationCount(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const counts = await notificationService.getCounts(userId);
    res.json(counts);
  } catch (error: any) {
    console.error('[NotificationController] Error getting count:', error.message);
    res.status(500).json({ error: 'Erro ao contar notificações' });
  }
}

/**
 * PATCH /api/notifications/:id/read - Mark a notification as read
 */
export async function markAsRead(req: Request, res: Response): Promise<void> {
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

    const notification = await notificationService.markAsRead(id, userId);
    res.json(notification);
  } catch (error: any) {
    console.error('[NotificationController] Error marking as read:', error.message);
    
    if (error.message.includes('não encontrada')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('permissão')) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao marcar como lida' });
    }
  }
}

/**
 * PATCH /api/notifications/read-all - Mark all notifications as read
 */
export async function markAllAsRead(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const count = await notificationService.markAllAsRead(userId);
    res.json({ marked: count });
  } catch (error: any) {
    console.error('[NotificationController] Error marking all as read:', error.message);
    res.status(500).json({ error: 'Erro ao marcar todas como lidas' });
  }
}

/**
 * DELETE /api/notifications/:id - Delete a notification
 */
export async function deleteNotification(req: Request, res: Response): Promise<void> {
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

    await notificationService.delete(id, userId);
    res.status(204).send();
  } catch (error: any) {
    console.error('[NotificationController] Error deleting notification:', error.message);
    
    if (error.message.includes('não encontrada')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('permissão')) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erro ao excluir notificação' });
    }
  }
}

/**
 * DELETE /api/notifications - Delete all notifications
 */
export async function deleteAllNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const count = await notificationService.deleteAll(userId);
    res.json({ deleted: count });
  } catch (error: any) {
    console.error('[NotificationController] Error deleting all notifications:', error.message);
    res.status(500).json({ error: 'Erro ao excluir notificações' });
  }
}

/**
 * POST /api/notifications/push/subscribe - Subscribe to push notifications
 */
export async function subscribeToPush(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const { subscription } = req.body as { subscription: PushSubscriptionData };
    
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      res.status(400).json({ error: 'Dados de subscription inválidos' });
      return;
    }

    await pushService.saveSubscription(userId, subscription);
    
    res.json({ 
      success: true, 
      message: 'Inscrição para push notifications ativada' 
    });
  } catch (error: any) {
    console.error('[NotificationController] Error subscribing to push:', error.message);
    res.status(500).json({ error: 'Erro ao ativar push notifications' });
  }
}

/**
 * POST /api/notifications/push/unsubscribe - Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Autenticação necessária' });
      return;
    }

    const { endpoint } = req.body as { endpoint: string };
    
    if (!endpoint) {
      res.status(400).json({ error: 'Endpoint é obrigatório' });
      return;
    }

    await pushService.removeSubscription(userId, endpoint);
    
    res.json({ 
      success: true, 
      message: 'Inscrição para push notifications cancelada' 
    });
  } catch (error: any) {
    console.error('[NotificationController] Error unsubscribing from push:', error.message);
    res.status(500).json({ error: 'Erro ao cancelar push notifications' });
  }
}

export const notificationController = {
  getNotifications,
  getNotificationCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  subscribeToPush,
  unsubscribeFromPush
};
