---
name: social-feed-architecture
description: Scalable social feed architecture with pagination, algorithms, and caching
keywords: [feed, pagination, algorithm, caching, redis, social, livrya]
category: project-specific
---

# 📰 Social Feed Architecture

Production patterns for building scalable social feeds in Livrya with cursor-based pagination, relevance algorithms, and Redis caching.

## Overview

Livrya's social feed shows:
- **New chapters** from followed authors
- **User reviews** and ratings
- **Community comments** on chapters
- **Achievement badges** from readers
- **Trending content** across platform

Requirements:
- **Fast** - Load in <500ms
- **Accurate** - Show relevant content first
- **Scalable** - Million+ concurrent users
- **Real-time** - New posts appear instantly
- **Cost-efficient** - Minimize database queries

---

## Key Concepts

### 1. Pagination Strategy

**Offset-based (❌ Bad):**
```
GET /feed?page=5&limit=20
- SKIP 80 rows
- Each page: expensive full-table scan
- Breaks with concurrent inserts
```

**Cursor-based (✅ Good):**
```
GET /feed?cursor=post:1234&limit=20
- Position-independent
- Handles concurrent changes
- Efficient indexes
```

### 2. Feed Algorithm

```
Post Score = (Recency) + (Engagement) + (Follow Distance)

Score = (days_ago^-2) + (likes × 0.1 + comments × 0.5) + (distance × 0.01)

Example:
- New post from close follow: HIGH
- Old post from friend: MEDIUM
- Trending from stranger: LOW
```

### 3. Caching Layers

```
1. User Session Cache (5 min)
   → Personalized feed in memory

2. Redis Hot Cache (30 min)
   → Latest posts, trending

3. PostgreSQL (Permanent)
   → Full history

4. Archive (Rare access)
   → Old posts (>30 days)
```

---

## Implementation Patterns

### Pattern 1: Cursor-Based Pagination

```typescript
interface FeedCursor {
  postId: string;
  timestamp: Date;
  score: number;
}

interface FeedResponse {
  posts: Post[];
  nextCursor?: FeedCursor;
  hasMore: boolean;
}

class FeedService {
  /**
   * Get feed with cursor-based pagination
   */
  async getFeed(
    userId: string,
    cursor?: FeedCursor,
    limit: number = 20
  ): Promise<FeedResponse> {
    let query = prisma.post.findMany({
      where: {
        // Only from followed authors
        author: {
          followers: {
            some: { followerId: userId },
          },
        },
      },
      orderBy: [
        { score: 'desc' },
        { id: 'desc' }, // Tiebreaker for stable pagination
      ],
      take: limit + 1, // Get one extra to determine hasMore
      include: {
        author: true,
        likes: { where: { userId } },
        comments: { take: 3 },
      },
    });

    // Apply cursor if provided
    if (cursor) {
      query = query.skip(1).cursor({
        id: cursor.postId,
      });
    }

    const posts = await query;

    // Check if there are more posts
    const hasMore = posts.length > limit;

    // Return only requested limit
    const result = posts.slice(0, limit);

    // Calculate next cursor
    const lastPost = result[result.length - 1];
    const nextCursor = hasMore
      ? {
          postId: lastPost.id,
          timestamp: lastPost.createdAt,
          score: lastPost.score,
        }
      : undefined;

    return {
      posts: result,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Infinite scroll - get next batch
   */
  async loadMore(
    userId: string,
    cursor: FeedCursor,
    limit: number = 20
  ): Promise<FeedResponse> {
    return this.getFeed(userId, cursor, limit);
  }
}
```

### Pattern 2: Feed Algorithm

```typescript
interface Post {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  likeCount: number;
  commentCount: number;
  score: number;
}

class FeedAlgorithm {
  /**
   * Calculate post relevance score
   */
  calculateScore(
    post: Post,
    userId: string,
    metadata: {
      followDistance: number; // 1=direct follow, 2=friend of friend
      isTrending: boolean;
      userPreferences: string[]; // Categories user likes
      postCategories: string[];
    }
  ): number {
    // 1. Recency (higher for newer posts)
    const ageHours = (Date.now() - post.createdAt.getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 100 - ageHours * 2); // Decay over time

    // 2. Engagement (likes, comments, shares)
    const engagementScore =
      (post.likeCount * 10 + post.commentCount * 50) / 100;

    // 3. Relationship (closer follows rank higher)
    const relationshipScore =
      (1 / metadata.followDistance) * 50; // Direct follow = 50, 2 hops = 25

    // 4. Preference matching
    const matchingCategories = metadata.postCategories.filter((cat) =>
      metadata.userPreferences.includes(cat)
    ).length;
    const preferenceScore = (matchingCategories / metadata.postCategories.length) * 30;

    // 5. Trending boost
    const trendingBoost = metadata.isTrending ? 50 : 0;

    // Weighted sum
    const totalScore =
      recencyScore * 0.3 + // 30% recency
      engagementScore * 0.25 + // 25% engagement
      relationshipScore * 0.25 + // 25% relationship
      preferenceScore * 0.15 + // 15% preferences
      trendingBoost; // Bonus

    return Math.round(totalScore);
  }

  /**
   * Update scores for all posts (daily job)
   */
  async updateScores(): Promise<void> {
    const posts = await prisma.post.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      },
      include: {
        _count: { select: { likes: true, comments: true } },
      },
    });

    for (const post of posts) {
      const score = this.calculateScore(post, post.authorId, {
        followDistance: 1,
        isTrending: post._count.likes > 100,
        userPreferences: ['fiction', 'fantasy'],
        postCategories: ['fiction'],
      });

      await prisma.post.update({
        where: { id: post.id },
        data: { score },
      });
    }
  }
}
```

### Pattern 3: Redis Caching

```typescript
import { Redis } from 'ioredis';

class CachedFeedService {
  private redis: Redis;
  private readonly CACHE_TTL = 30 * 60; // 30 minutes

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  /**
   * Get cached feed or generate
   */
  async getFeed(
    userId: string,
    cursor?: FeedCursor
  ): Promise<FeedResponse> {
    const cacheKey = `feed:${userId}`;

    // Check Redis cache
    const cached = await this.redis.get(cacheKey);

    if (cached && !cursor) {
      // Return from cache (first page only)
      return JSON.parse(cached);
    }

    // Generate fresh feed
    const feedService = new FeedService();
    const feed = await feedService.getFeed(userId, cursor);

    // Cache first page for quick access
    if (!cursor) {
      await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(feed));
    }

    return feed;
  }

  /**
   * Invalidate feed cache on changes
   */
  async invalidateFeed(userId: string): Promise<void> {
    await this.redis.del(`feed:${userId}`);
  }

  /**
   * Pre-warm cache for active users
   */
  async warmCache(activeUserIds: string[]): Promise<void> {
    const feedService = new FeedService();

    for (const userId of activeUserIds) {
      const feed = await feedService.getFeed(userId);
      await this.redis.setex(
        `feed:${userId}`,
        this.CACHE_TTL,
        JSON.stringify(feed)
      );
    }
  }
}
```

### Pattern 4: Real-time Feed Updates

```typescript
io.on('connection', (socket: Socket) => {
  const userId = socket.handshake.auth.userId;

  socket.on('feed:subscribe', () => {
    // Join feed room
    socket.join(`feed:${userId}`);
    console.log(`User ${userId} subscribed to feed`);
  });

  socket.on('feed:unsubscribe', () => {
    socket.leave(`feed:${userId}`);
  });
});

/**
 * When new post is created
 */
async function handlePostCreated(post: Post): Promise<void> {
  // Get followers of post author
  const followers = await prisma.user.findMany({
    where: {
      following: {
        some: { followingId: post.authorId },
      },
    },
    select: { id: true },
  });

  // Invalidate cache for all followers
  const cachedFeedService = new CachedFeedService('redis://localhost');

  for (const follower of followers) {
    // Clear cache
    await cachedFeedService.invalidateFeed(follower.id);

    // Notify via Socket.IO
    io.to(`feed:${follower.id}`).emit('feed:new-post', {
      postId: post.id,
      author: post.author.username,
      preview: post.content.slice(0, 100),
      timestamp: new Date(),
    });
  }
}
```

### Pattern 5: Analytics & Trending

```typescript
class FeedAnalytics {
  /**
   * Get trending posts
   */
  async getTrending(timeWindowHours: number = 24): Promise<Post[]> {
    const since = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

    const trending = await prisma.post.findMany({
      where: {
        createdAt: { gte: since },
      },
      orderBy: {
        _count: {
          likes: 'desc',
        },
      },
      include: {
        _count: {
          select: { likes: true, comments: true },
        },
      },
      take: 10,
    });

    return trending;
  }

  /**
   * Get feed stats for analytics
   */
  async getStats(userId: string): Promise<{
    avgViewTime: number;
    clickThroughRate: number;
    engagementRate: number;
  }> {
    // Track user interactions with feed
    const interactions = await prisma.feedInteraction.findMany({
      where: { userId },
      include: { post: true },
    });

    // Calculate metrics
    const avgViewTime =
      interactions.reduce((sum, i) => sum + i.viewTimeMs, 0) / interactions.length;

    const clicks = interactions.filter((i) => i.clicked).length;
    const clickThroughRate = clicks / interactions.length;

    const engaged = interactions.filter(
      (i) => i.liked || i.commented || i.shared
    ).length;
    const engagementRate = engaged / interactions.length;

    return {
      avgViewTime,
      clickThroughRate,
      engagementRate,
    };
  }
}
```

---

## Best Practices

### ✅ DO's

1. **Use Cursor-Based Pagination**
   - Handles concurrent changes
   - Stable sorting
   - Efficient queries

2. **Cache Aggressively**
   - First page in Redis
   - 30-minute TTL
   - Invalidate on changes

3. **Score Continuously**
   - Recalculate daily
   - Consider recency
   - Weight engagement

4. **Real-time Updates**
   - Use Socket.IO for new posts
   - Don't refresh entire feed
   - Show optimistic updates

5. **Monitor Performance**
   - Track query times
   - Monitor cache hit rate
   - Alert on degradation

### ❌ DON'Ts

1. **Don't Use Offset Pagination**
   - SKIP is inefficient
   - Breaks with concurrent inserts

2. **Don't Load Entire Feed**
   - Always paginate
   - Limit to 20-50 items

3. **Don't Recalculate Scores on Request**
   - Pre-compute offline
   - Use batch jobs

4. **Don't Ignore Cache**
   - Database queries are expensive
   - Cache first page

---

## Related Skills

- `notification-system` - Notify followers of new posts
- `gamification-patterns` - Trending algorithm integration
- `socket-io-rooms-management` - Real-time feed subscriptions
- `postgres-best-practices` - Query optimization

---

**Status:** ✅ Production Ready
**Last Updated:** 2026-02-13
**Project:** Livrya Social Feed
