/**
 * Push Notification Service
 * Handles web push subscriptions and sending push notifications
 * 
 * Setup:
 * 1. Generate VAPID keys: npx web-push generate-vapid-keys
 * 2. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env
 * 3. Set VAPID_SUBJECT (mailto:your@email.com) in .env
 */

import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

// Web push configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@livria.com';

// Check if push is configured
const isPushConfigured = (): boolean => {
  return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
};

export interface PushSubscriptionData {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  [key: string]: unknown; // Index signature for Prisma JSON compatibility
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

/**
 * Store a push subscription for a user
 */
export async function saveSubscription(
  userId: string,
  subscription: PushSubscriptionData
): Promise<void> {
  // Store subscription in database (using Notification table with special type or create PushSubscription model)
  // For now, we'll store it in a JSON field or create the model
  
  // Using a simple approach: store endpoint hash as unique identifier
  const endpoint = subscription.endpoint;
  
  // Prepare subscription data as Prisma-compatible JSON
  const subscriptionJson = {
    endpoint: subscription.endpoint,
    expirationTime: subscription.expirationTime ?? null,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  };
  
  // Check if subscription already exists
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      type: 'SYSTEM',
      data: {
        path: ['pushEndpoint'],
        equals: endpoint,
      },
    },
  });

  if (existing) {
    // Update existing subscription
    await prisma.notification.update({
      where: { id: existing.id },
      data: {
        data: {
          pushEndpoint: endpoint,
          pushSubscription: subscriptionJson,
          updatedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });
  } else {
    // Create new subscription record
    await prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'Push Subscription',
        message: 'Push notification subscription active',
        isRead: true,
        data: {
          pushEndpoint: endpoint,
          pushSubscription: subscriptionJson,
          createdAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });
  }
}

/**
 * Remove a push subscription
 */
export async function removeSubscription(
  userId: string,
  endpoint: string
): Promise<void> {
  await prisma.notification.deleteMany({
    where: {
      userId,
      type: 'SYSTEM',
      data: {
        path: ['pushEndpoint'],
        equals: endpoint,
      },
    },
  });
}

/**
 * Get all subscriptions for a user
 */
export async function getUserSubscriptions(
  userId: string
): Promise<PushSubscriptionData[]> {
  const subscriptions = await prisma.notification.findMany({
    where: {
      userId,
      type: 'SYSTEM',
      data: {
        path: ['pushEndpoint'],
        not: Prisma.DbNull,
      },
    },
  });

  return subscriptions
    .map((sub) => {
      const data = sub.data as Record<string, any>;
      return data?.pushSubscription as PushSubscriptionData;
    })
    .filter(Boolean);
}

/**
 * Send a push notification to a user
 */
export async function sendPushNotification(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!isPushConfigured()) {
    console.warn('[PushService] VAPID keys not configured, skipping push notification');
    return { sent: 0, failed: 0 };
  }

  const subscriptions = await getUserSubscriptions(userId);
  
  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      await sendToSubscription(subscription, payload);
      sent++;
    } catch (error: any) {
      console.error('[PushService] Error sending push:', error.message);
      failed++;
      
      // If subscription is invalid, remove it
      if (error.statusCode === 404 || error.statusCode === 410) {
        await removeSubscription(userId, subscription.endpoint);
      }
    }
  }

  return { sent, failed };
}

/**
 * Send push to a specific subscription using fetch
 */
async function sendToSubscription(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<void> {
  // Use web-push library or implement JWT-based push
  // For production, install: npm install web-push
  // This is a placeholder implementation
  
  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/assets/icons/icon-192x192.png',
    badge: payload.badge || '/assets/icons/icon-72x72.png',
    tag: payload.tag || 'livria-notification',
    data: payload.data || {},
  });

  // In production, use web-push library:
  // const webpush = require('web-push');
  // webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  // await webpush.sendNotification(subscription, payloadString);
  
  console.log('[PushService] Would send push to:', subscription.endpoint.substring(0, 50) + '...');
  console.log('[PushService] Payload:', payloadString);
}

/**
 * Send push notification for new message
 */
export async function sendMessagePush(
  receiverId: string,
  senderName: string,
  preview: string
): Promise<void> {
  await sendPushNotification(receiverId, {
    title: `Nova mensagem de ${senderName}`,
    body: preview.substring(0, 100),
    tag: 'message',
    data: {
      type: 'message',
      url: '/social/messages',
    },
  });
}

/**
 * Send push notification for new follower
 */
export async function sendFollowPush(
  userId: string,
  followerName: string
): Promise<void> {
  await sendPushNotification(userId, {
    title: 'Novo seguidor!',
    body: `${followerName} começou a seguir você`,
    tag: 'follow',
    data: {
      type: 'follow',
      url: '/social/profile',
    },
  });
}

/**
 * Send push notification for post interaction
 */
export async function sendInteractionPush(
  userId: string,
  type: 'like' | 'comment',
  actorName: string
): Promise<void> {
  const messages = {
    like: {
      title: 'Novo like!',
      body: `${actorName} curtiu seu post`,
    },
    comment: {
      title: 'Novo comentário!',
      body: `${actorName} comentou no seu post`,
    },
  };

  await sendPushNotification(userId, {
    ...messages[type],
    tag: type,
    data: {
      type,
      url: '/social/notifications',
    },
  });
}

/**
 * Send push notification for achievement unlocked
 */
export async function sendAchievementPush(
  userId: string,
  achievementName: string,
  livraReward: number
): Promise<void> {
  await sendPushNotification(userId, {
    title: '🏆 Conquista desbloqueada!',
    body: `${achievementName} - Você ganhou ${livraReward} Livras!`,
    tag: 'achievement',
    data: {
      type: 'achievement',
      url: '/achievements',
    },
  });
}

export const pushService = {
  isPushConfigured,
  saveSubscription,
  removeSubscription,
  getUserSubscriptions,
  sendPushNotification,
  sendMessagePush,
  sendFollowPush,
  sendInteractionPush,
  sendAchievementPush,
};
