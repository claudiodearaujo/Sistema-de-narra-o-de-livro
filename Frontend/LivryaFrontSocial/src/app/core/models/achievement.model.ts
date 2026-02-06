/**
 * Sprint 10: Achievement Models and Types
 */

export type AchievementCategory = 'WRITING' | 'SOCIAL' | 'READING' | 'MILESTONE' | 'SPECIAL';

export interface AchievementRequirement {
  type: string;
  target: number;
}

export interface Achievement {
  id: string;
  key: string;
  category: AchievementCategory;
  name: string;
  description: string;
  icon: string;
  livraReward: number;
  requirement: AchievementRequirement | null;
  isHidden: boolean;
  unlockedAt?: Date | null;
  progress?: number;
  progressTarget?: number;
}

export interface UserAchievement {
  id: string;
  achievementId: string;
  userId: string;
  unlockedAt: Date;
  achievement: Achievement;
}

export interface AchievementStats {
  total: number;
  unlocked: number;
  locked: number;
  percentage: number;
  recentUnlocks: UserAchievement[];
}

export interface AchievementsResponse {
  achievements: Achievement[];
  stats?: AchievementStats;
}

export interface UserAchievementsResponse {
  achievements: UserAchievement[];
  stats: AchievementStats;
}

// Category labels and icons
export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  WRITING: 'Escrita',
  SOCIAL: 'Social',
  READING: 'Leitura',
  MILESTONE: 'Marcos',
  SPECIAL: 'Especial'
};

export const ACHIEVEMENT_CATEGORY_ICONS: Record<AchievementCategory, string> = {
  WRITING: 'pi pi-pencil',
  SOCIAL: 'pi pi-users',
  READING: 'pi pi-book',
  MILESTONE: 'pi pi-flag',
  SPECIAL: 'pi pi-star'
};

// Helper functions
export function isAchievementUnlocked(achievement: Achievement): boolean {
  return achievement.unlockedAt != null;
}

export function getAchievementProgress(achievement: Achievement): number {
  if (!achievement.progressTarget || achievement.progressTarget === 0) return 0;
  if (isAchievementUnlocked(achievement)) return 100;
  return Math.min(Math.round(((achievement.progress || 0) / achievement.progressTarget) * 100), 100);
}

export function formatAchievementDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}
