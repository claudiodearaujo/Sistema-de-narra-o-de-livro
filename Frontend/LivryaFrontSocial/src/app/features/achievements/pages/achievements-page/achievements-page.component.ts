import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AchievementService } from 'src/app/core/services/achievement.service';
import {
  Achievement,
  AchievementStats,
  AchievementCategory,
  ACHIEVEMENT_CATEGORY_LABELS,
  ACHIEVEMENT_CATEGORY_ICONS,
  isAchievementUnlocked,
  getAchievementProgress,
  formatAchievementDate
} from 'src/app/core/models/achievement.model';

// PrimeNG imports
import { CardModule } from 'primeng/card';
import { TabsModule } from 'primeng/tabs';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-achievements-page',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    TabsModule,
    ProgressBarModule,
    TagModule,
    BadgeModule,
    SkeletonModule,
    TooltipModule,
    ButtonModule,
    MessageModule
  ],
  templateUrl: './achievements-page.component.html',
  styleUrl: './achievements-page.component.css'
})
export class AchievementsPageComponent implements OnInit {
  private achievementService = inject(AchievementService);

  achievements = signal<Achievement[]>([]);
  stats = signal<AchievementStats | null>(null);
  loading = signal(true);

  categories: AchievementCategory[] = ['SOCIAL', 'WRITING', 'READING', 'MILESTONE', 'SPECIAL'];

  ngOnInit() {
    this.loadAchievements();
  }

  loadAchievements() {
    this.loading.set(true);
    this.achievementService.getMyAchievements().subscribe({
      next: (response) => {
        // Flatten user achievements to Achievement[]
        const achievements = response.achievements.map(ua => ({
          ...ua.achievement,
          unlockedAt: ua.unlockedAt
        }));

        // Also get all achievements for progress
        this.achievementService.getAllAchievements().subscribe({
          next: (allResponse) => {
            this.achievements.set(allResponse.achievements);
            this.stats.set(response.stats);
            this.loading.set(false);
          },
          error: () => {
            this.achievements.set(achievements);
            this.stats.set(response.stats);
            this.loading.set(false);
          }
        });
      },
      error: () => {
        // Fallback to all achievements without auth
        this.achievementService.getAllAchievements().subscribe({
          next: (response) => {
            this.achievements.set(response.achievements);
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
          }
        });
      }
    });
  }

  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return this.achievements().filter(a => a.category === category);
  }

  getCategoryLabel(category: AchievementCategory): string {
    return ACHIEVEMENT_CATEGORY_LABELS[category];
  }

  getCategoryIcon(category: AchievementCategory): string {
    return ACHIEVEMENT_CATEGORY_ICONS[category];
  }

  isUnlocked(achievement: Achievement): boolean {
    return isAchievementUnlocked(achievement);
  }

  getProgress(achievement: Achievement): number {
    return getAchievementProgress(achievement);
  }

  formatDate(date: Date | string | null | undefined): string {
    return formatAchievementDate(date);
  }
}
