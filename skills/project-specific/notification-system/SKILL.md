---
name: notification-system
description: Push notifications, in-app alerts, and delivery queue for Livrya
keywords: [notifications, push, queue, bullmq, web-push, livrya]
category: project-specific
---

# 🔔 Notification System

Production patterns for multi-channel notifications in Livrya using BullMQ, Web Push, and Socket.IO.

## Overview

Notification types in Livrya:
- **New chapters** - Author publishes chapter
- **Comments** - Someone comments on review
- **Achievements** - User unlocks badge
- **Social** - Friend started following
- **System** - Maintenance alerts

Channels:
- **In-app** - Socket.IO (instant)
- **Push** - Web Push (offline)
- **Email** - SMTP (summary, weekly digest)

---

## Implementation

### Pattern 1: Notification Queue with BullMQ

```typescript
import Bull from 'bullmq';
import { Redis } from 'ioredis';

interface NotificationJob {
  userId: string;
  type: 'CHAPTER_PUBLISHED' | 'COMMENT' | 'ACHIEVEMENT' | 'FOLLOW';
  data: Record<string, any>;
  channels: Array<'in-app' | 'push' | 'email'>;
}

const redis = new Redis();
const notificationQueue = new Bull<NotificationJob>('notifications', {
  connection: redis,
});

// Queue processor
notificationQueue.process(async (job: Bull.Job<NotificationJob>) => {
  const { userId, type, data, channels } = job.data;

  try {
    job.progress(25);

    // Send to each channel
    const promises: Promise<any>[] = [];

    if (channels.includes('in-app')) {
      promises.push(sendInApp(userId, type, data));
    }
    job.progress(50);

    if (channels.includes('push')) {
      promises.push(sendPush(userId, type, data));
    }
    job.progress(75);

    if (channels.includes('email')) {
      promises.push(sendEmail(userId, type, data));
    }

    await Promise.all(promises);
    job.progress(100);

    return { success: true };
  } catch (error) {
    console.error(`Notification failed for ${userId}:`, error);
    throw error;
  }
});

// Event handlers
notificationQueue.on('failed', (job, err) => {
  console.error(`Notification job ${job.id} failed:`, err.message);
});

notificationQueue.on('completed', (job) => {
  console.log(`Notification ${job.id} completed`);
});

// Queue job
async function notifyUser(
  userId: string,
  type: string,
  data: any,
  channels: string[] = ['in-app']
): Promise<void> {
  await notificationQueue.add(
    { userId, type, data, channels },
    {
      priority: 10,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: true,
    }
  );
}
```

### Pattern 2: In-App Notifications (Socket.IO)

```typescript
async function sendInApp(
  userId: string,
  type: string,
  data: any
): Promise<void> {
  // Emit to user's socket
  io.to(`user:${userId}`).emit('notification', {
    id: generateId(),
    type,
    message: formatMessage(type, data),
    data,
    createdAt: new Date(),
    read: false,
  });

  // Also save to database for history
  await prisma.notification.create({
    data: {
      userId,
      type,
      data,
      channel: 'IN_APP',
      deliveredAt: new Date(),
    },
  });
}

function formatMessage(type: string, data: any): string {
  const messages: Record<string, string> = {
    CHAPTER_PUBLISHED: `New chapter: "${data.title}"`,
    COMMENT: `${data.authorName} commented on your post`,
    ACHIEVEMENT: `You unlocked: ${data.achievementName}`,
    FOLLOW: `${data.followersName} started following you`,
  };
  return messages[type] || 'New notification';
}
```

### Pattern 3: Web Push Notifications

```typescript
import webpush from 'web-push';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

async function sendPush(userId: string, type: string, data: any): Promise<void> {
  // Get user's push subscriptions
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title: formatTitle(type),
    body: formatMessage(type, data),
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: `notification-${data.id || type}`,
    requireInteraction: false,
    data: {
      url: formatDeepLink(type, data),
      id: data.id,
    },
  });

  // Send to all subscriptions
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        payload
      );
    } catch (error) {
      if (error.statusCode === 410) {
        // Subscription expired
        await prisma.pushSubscription.delete({
          where: { id: subscription.id },
        });
      } else {
        console.error('Push notification error:', error);
      }
    }
  }
}

function formatTitle(type: string): string {
  const titles: Record<string, string> = {
    CHAPTER_PUBLISHED: '📖 New Chapter',
    COMMENT: '💬 New Comment',
    ACHIEVEMENT: '🏆 Achievement',
    FOLLOW: '👤 New Follower',
  };
  return titles[type] || 'Notification';
}

function formatDeepLink(type: string, data: any): string {
  switch (type) {
    case 'CHAPTER_PUBLISHED':
      return `/book/${data.bookId}/chapter/${data.chapterId}`;
    case 'COMMENT':
      return `/post/${data.postId}`;
    case 'ACHIEVEMENT':
      return `/profile/achievements`;
    case 'FOLLOW':
      return `/profile/${data.followerId}`;
    default:
      return '/';
  }
}
```

### Pattern 4: Notification Preferences

```typescript
interface NotificationPreferences {
  email_chapters: boolean;
  email_comments: boolean;
  email_social: boolean;
  push_chapters: boolean;
  push_comments: boolean;
  push_social: boolean;
  inapp_all: boolean;
  digest_frequency: 'daily' | 'weekly' | 'never';
}

async function getChannels(
  userId: string,
  type: string
): Promise<Array<'in-app' | 'push' | 'email'>> {
  const preferences = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (!preferences) return ['in-app']; // Default

  const channels: Array<'in-app' | 'push' | 'email'> = [];

  // Always in-app if enabled
  if (preferences.inapp_all) {
    channels.push('in-app');
  }

  // Conditional channels based on type
  switch (type) {
    case 'CHAPTER_PUBLISHED':
      if (preferences.push_chapters) channels.push('push');
      if (preferences.email_chapters) channels.push('email');
      break;
    case 'COMMENT':
      if (preferences.push_comments) channels.push('push');
      if (preferences.email_comments) channels.push('email');
      break;
  }

  return channels;
}

async function updatePreferences(
  userId: string,
  updates: Partial<NotificationPreferences>
): Promise<void> {
  await prisma.userPreferences.upsert({
    where: { userId },
    update: updates,
    create: { userId, ...updates },
  });
}
```

### Pattern 5: Unsubscribe Links

```typescript
import { createHash } from 'crypto';

function generateUnsubscribeToken(userId: string, channel: string): string {
  const data = `${userId}:${channel}:${Date.now()}`;
  return createHash('sha256').update(data).digest('hex');
}

app.get('/notifications/unsubscribe/:token', async (req, res) => {
  const { token } = req.params;
  const { channel } = req.query; // 'email', 'push'

  try {
    // Verify token (in real app, store in DB with expiration)
    const userId = await verifyUnsubscribeToken(token);

    if (channel === 'email') {
      const prefs = await prisma.userPreferences.findUnique({
        where: { userId },
      });

      await prisma.userPreferences.update({
        where: { userId },
        data: {
          email_chapters: false,
          email_comments: false,
          email_social: false,
        },
      });

      res.json({ message: 'Unsubscribed from emails' });
    }
  } catch (error) {
    res.status(400).json({ error: 'Invalid token' });
  }
});
```

---

## Best Practices

### ✅ DO's

1. **Use Queues** - BullMQ for reliability
2. **Respect Preferences** - Let users control notifications
3. **Rate Limit** - Don't spam users
4. **Include Unsubscribe** - Email compliance
5. **Monitor Delivery** - Track failures and retry

### ❌ DON'Ts

1. **Don't Send Immediately** - Use queues
2. **Don't Ignore Failures** - Implement retries
3. **Don't Skip User Preferences** - Always respect opt-out
4. **Don't Over-notify** - Limit notification frequency

---

## Related Skills

- `socket-io-rooms-management` - In-app delivery
- `social-feed-architecture` - Trigger notifications
- `backend-dev-guidelines` - General patterns

---

**Status:** ✅ Production Ready
**Last Updated:** 2026-02-13
