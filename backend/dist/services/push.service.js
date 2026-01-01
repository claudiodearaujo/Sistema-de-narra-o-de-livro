"use strict";
/**
 * Push Notification Service
 * Handles web push subscriptions and sending push notifications
 *
 * Setup:
 * 1. Generate VAPID keys: npx web-push generate-vapid-keys
 * 2. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env
 * 3. Set VAPID_SUBJECT (mailto:your@email.com) in .env
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushService = void 0;
exports.saveSubscription = saveSubscription;
exports.removeSubscription = removeSubscription;
exports.getUserSubscriptions = getUserSubscriptions;
exports.sendPushNotification = sendPushNotification;
exports.sendMessagePush = sendMessagePush;
exports.sendFollowPush = sendFollowPush;
exports.sendInteractionPush = sendInteractionPush;
exports.sendAchievementPush = sendAchievementPush;
const prisma_1 = __importDefault(require("../lib/prisma"));
const client_1 = require("@prisma/client");
// Web push configuration
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@livria.com';
// Check if push is configured
const isPushConfigured = () => {
    return !!(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
};
/**
 * Store a push subscription for a user
 */
async function saveSubscription(userId, subscription) {
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
    const existing = await prisma_1.default.notification.findFirst({
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
        await prisma_1.default.notification.update({
            where: { id: existing.id },
            data: {
                data: {
                    pushEndpoint: endpoint,
                    pushSubscription: subscriptionJson,
                    updatedAt: new Date().toISOString(),
                },
            },
        });
    }
    else {
        // Create new subscription record
        await prisma_1.default.notification.create({
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
                },
            },
        });
    }
}
/**
 * Remove a push subscription
 */
async function removeSubscription(userId, endpoint) {
    await prisma_1.default.notification.deleteMany({
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
async function getUserSubscriptions(userId) {
    const subscriptions = await prisma_1.default.notification.findMany({
        where: {
            userId,
            type: 'SYSTEM',
            data: {
                path: ['pushEndpoint'],
                not: client_1.Prisma.DbNull,
            },
        },
    });
    return subscriptions
        .map((sub) => {
        const data = sub.data;
        return data?.pushSubscription;
    })
        .filter(Boolean);
}
/**
 * Send a push notification to a user
 */
async function sendPushNotification(userId, payload) {
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
        }
        catch (error) {
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
async function sendToSubscription(subscription, payload) {
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
async function sendMessagePush(receiverId, senderName, preview) {
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
async function sendFollowPush(userId, followerName) {
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
async function sendInteractionPush(userId, type, actorName) {
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
async function sendAchievementPush(userId, achievementName, livraReward) {
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
exports.pushService = {
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
