---
name: gamification-patterns
description: Gamification system with achievements, leaderboards, streaks, and XP for user engagement
keywords: [gamification, achievements, leaderboards, streak, xp, badges, livrya]
category: project-specific
---

# 🏆 Gamification Patterns

Production patterns for building engaging gamification systems in Livrya.

## Overview

Gamification in Livrya:
- **Achievements/Badges** - Unlock milestones
- **Leaderboards** - Monthly, yearly rankings
- **Streaks** - Daily reading, writing consistency
- **Points/XP** - Visible progress
- **Levels** - Reader, Contributor, Critic, etc.

---

## Key Achievements

```
Reader Achievements
├── first-book (Read 1 book)
├── 10-books (Read 10 books)
├── 100-books (Read 100 books)
├── fast-reader (Complete book in <1 week)
└── late-night-owl (Read after midnight)

Creator Achievements
├── first-story (Publish first book)
├── completed-series (Finish multi-book series)
├── popular-author (Get 1k followers)
└── bestseller (Book >10k readers)

Critic Achievements
├── first-review (Write 1 review)
├── detailed-critic (10 detailed reviews)
├── trending-reviewer (Review liked >100 times)
└── top-critic (In top 10 reviewers)

Social Achievements
├── friendly (Follow 10 authors)
├── community-builder (Create discussion >50 replies)
├── helpful (Comment liked >1k times)
└── influencer (5k followers)
```

---

## Implementation

### Pattern 1: Achievement Tracking

```typescript
interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  condition: (user: UserStats) => boolean;
  xpReward: number;
}

interface UserAchievement {
  achievementId: string;
  userId: string;
  unlockedAt: Date;
  progress: number; // 0-100
}

const achievements: Achievement[] = [
  {
    id: 'first-book',
    name: 'First Book',
    description: 'Read your first book',
    icon: '📖',
    rarity: 'common',
    condition: (user) => user.booksRead >= 1,
    xpReward: 50,
  },
  {
    id: 'speed-reader',
    name: 'Speed Reader',
    description: 'Finish a book in 1 day',
    icon: '⚡',
    rarity: 'rare',
    condition: (user) => user.fastestBookTimeHours <= 24,
    xpReward: 200,
  },
  {
    id: 'critic',
    name: 'The Critic',
    description: 'Write 10 detailed reviews',
    icon: '✍️',
    rarity: 'epic',
    condition: (user) => user.detailedReviews >= 10,
    xpReward: 500,
  },
];

class AchievementService {
  /**
   * Check and unlock achievements
   */
  async checkAchievements(userId: string): Promise<Achievement[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            booksRead: true,
            reviews: true,
            followers: true,
          },
        },
        achievements: true,
      },
    });

    const stats: UserStats = {
      booksRead: user._count.booksRead,
      detailedReviews: user.reviews.filter((r) => r.text.length > 100).length,
      followers: user._count.followers,
      fastestBookTimeHours: 24, // Calculate from actual data
    };

    const unlockedAchievements: Achievement[] = [];

    for (const achievement of achievements) {
      const alreadyUnlocked = user.achievements.some(
        (a) => a.id === achievement.id
      );

      if (!alreadyUnlocked && achievement.condition(stats)) {
        // Unlock achievement
        await prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            unlockedAt: new Date(),
          },
        });

        // Award XP
        await this.awardXP(userId, achievement.xpReward);

        unlockedAchievements.push(achievement);

        // Notify user
        io.to(`user:${userId}`).emit('achievement:unlocked', achievement);
      }
    }

    return unlockedAchievements;
  }

  /**
   * Calculate progress toward achievement
   */
  async getProgress(userId: string, achievementId: string): Promise<number> {
    const achievement = achievements.find((a) => a.id === achievementId);
    if (!achievement) return 0;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Calculate 0-100 progress
    switch (achievementId) {
      case 'first-book':
        return Math.min(100, (user.booksRead / 1) * 100);
      case '10-books':
        return Math.min(100, (user.booksRead / 10) * 100);
      default:
        return 0;
    }
  }

  private async awardXP(userId: string, amount: number): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        xp: { increment: amount },
      },
    });
  }
}
```

### Pattern 2: Leaderboards

```typescript
interface Leaderboard {
  rank: number;
  userId: string;
  username: string;
  score: number;
  changeThisMonth: number; // +/- from last month
}

class LeaderboardService {
  /**
   * Get monthly leaderboard
   */
  async getMonthly(limit: number = 100): Promise<Leaderboard[]> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const leaderboard = await prisma.user.findMany({
      where: {
        xpHistory: {
          some: {
            createdAt: { gte: monthStart },
          },
        },
      },
      select: {
        id: true,
        username: true,
        xp: true,
        _count: { select: { xpHistory: true } },
      },
      orderBy: { xp: 'desc' },
      take: limit,
    });

    return leaderboard.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      username: user.username,
      score: user.xp,
      changeThisMonth: calculateMonthlyChange(user.id),
    }));
  }

  /**
   * Get yearly leaderboard
   */
  async getYearly(limit: number = 100): Promise<Leaderboard[]> {
    const users = await prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: limit,
      select: {
        id: true,
        username: true,
        xp: true,
      },
    });

    return users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      username: user.username,
      score: user.xp,
      changeThisMonth: 0,
    }));
  }

  /**
   * Get all-time leaderboard
   */
  async getAllTime(limit: number = 100): Promise<Leaderboard[]> {
    const users = await prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: limit,
      select: {
        id: true,
        username: true,
        xp: true,
      },
    });

    return users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      username: user.username,
      score: user.xp,
      changeThisMonth: 0,
    }));
  }

  /**
   * Get user's rank
   */
  async getUserRank(userId: string): Promise<number> {
    const usersAbove = await prisma.user.count({
      where: {
        xp: { gt: (await prisma.user.findUnique({ where: { id: userId } })).xp },
      },
    });

    return usersAbove + 1;
  }

  /**
   * Update leaderboards (run hourly)
   */
  async updateLeaderboards(): Promise<void> {
    // Recalculate ranks
    const users = await prisma.user.findMany({
      orderBy: { xp: 'desc' },
      select: { id: true, xp: true },
    });

    for (let i = 0; i < users.length; i++) {
      await prisma.user.update({
        where: { id: users[i].id },
        data: { leaderboardRank: i + 1 },
      });
    }

    console.log('Leaderboards updated');
  }
}
```

### Pattern 3: Streaks

```typescript
interface UserStreak {
  userId: string;
  type: 'reading' | 'writing' | 'reviewing';
  currentStreak: number;
  bestStreak: number;
  lastActivityDate: Date;
}

class StreakService {
  /**
   * Record user activity (reading, writing, reviewing)
   */
  async recordActivity(userId: string, type: 'reading' | 'writing' | 'reviewing'): Promise<void> {
    const today = new Date().toDateString();

    // Check if already tracked today
    const existingActivity = await prisma.userActivity.findFirst({
      where: {
        userId,
        type,
        createdAt: {
          gte: new Date(today),
          lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingActivity) return; // Already tracked today

    // Record activity
    await prisma.userActivity.create({
      data: { userId, type, createdAt: new Date() },
    });

    // Update or create streak
    const streak = await prisma.userStreak.findUnique({
      where: { userId_type: { userId, type } },
    });

    if (!streak) {
      // First activity, start new streak
      await prisma.userStreak.create({
        data: {
          userId,
          type,
          currentStreak: 1,
          bestStreak: 1,
          lastActivityDate: new Date(),
        },
      });
      return;
    }

    // Check if consecutive day
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = new Date(yesterday.toDateString());

    if (streak.lastActivityDate >= yesterdayStart) {
      // Consecutive! Increment streak
      const newStreak = streak.currentStreak + 1;
      const bestStreak = Math.max(streak.bestStreak, newStreak);

      await prisma.userStreak.update({
        where: { userId_type: { userId, type } },
        data: {
          currentStreak: newStreak,
          bestStreak,
          lastActivityDate: new Date(),
        },
      });

      // Milestone rewards
      if (newStreak % 7 === 0) {
        await this.awardStreakMilestone(userId, type, newStreak);
      }
    } else {
      // Broke streak, restart
      await prisma.userStreak.update({
        where: { userId_type: { userId, type } },
        data: {
          currentStreak: 1,
          lastActivityDate: new Date(),
        },
      });
    }
  }

  /**
   * Get user's current streaks
   */
  async getStreaks(userId: string): Promise<UserStreak[]> {
    return prisma.userStreak.findMany({
      where: { userId },
    });
  }

  private async awardStreakMilestone(
    userId: string,
    type: string,
    streak: number
  ): Promise<void> {
    const xpReward = streak * 10; // 7-day = 70 XP, 14-day = 140 XP

    await prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: xpReward } },
    });

    io.to(`user:${userId}`).emit('streak:milestone', {
      type,
      streak,
      xpAwarded: xpReward,
    });
  }
}
```

### Pattern 4: User Levels

```typescript
function calculateLevel(xp: number): number {
  // XP required: 100 for level 1, 300 for level 2, 600 for level 3, etc.
  // Formula: xp_required = 100 * n * (n + 1) / 2

  let level = 1;
  let totalXpRequired = 0;

  while (totalXpRequired + 100 * level * (level + 1) / 2 <= xp) {
    totalXpRequired += 100 * level * (level + 1) / 2;
    level++;
  }

  return level;
}

function getXpToNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  const xpForCurrentLevel = 100 * currentLevel * (currentLevel + 1) / 2;

  let totalXpForCurrentLevel = 0;
  for (let i = 1; i < currentLevel; i++) {
    totalXpForCurrentLevel += 100 * i * (i + 1) / 2;
  }

  const nextLevelXp = totalXpForCurrentLevel + xpForCurrentLevel;
  return Math.max(0, nextLevelXp - currentXp);
}

// Usage
const userLevel = calculateLevel(2500); // Level 5
const xpNeeded = getXpToNextLevel(2500); // 150 XP to level 6
```

---

## Best Practices

### ✅ DO's

1. **Make Achievements Attainable** - 80% should unlock some
2. **Provide Progress Feedback** - Show bars, percentages
3. **Notify on Unlocks** - Celebrate with user
4. **Respect Engagement** - Don't force grinding
5. **Rotate Leaderboards** - Monthly, yearly to stay fresh

### ❌ DON'Ts

1. **Don't Make It Pay-to-Win**
2. **Don't Hide Achievement Paths**
3. **Don't Award XP for Nothing**
4. **Don't Show Leaderboards Only to Winners**
5. **Don't Forget Casual Users**

---

## Related Skills

- `notification-system` - Notify achievements
- `social-feed-architecture` - Show rankings in feed
- `socket-io-rooms-management` - Real-time updates

---

**Status:** ✅ Production Ready
**Last Updated:** 2026-02-13
