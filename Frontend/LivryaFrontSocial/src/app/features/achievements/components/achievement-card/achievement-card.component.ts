import { Component, input } from '@angular/core';

import { 
  Achievement, 
  isAchievementUnlocked, 
  getAchievementProgress, 
  formatAchievementDate 
} from '../../../../core/models/achievement.model';

import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-achievement-card',
  standalone: true,
  imports: [ProgressBarModule, TagModule, TooltipModule],
  templateUrl: './achievement-card.component.html',
  styleUrl: './achievement-card.component.css'
})
export class AchievementCardComponent {
  readonly achievement = input.required<Achievement>();
  readonly compact = input(false);
  readonly showProgress = input(true);
  readonly showReward = input(true);

  get isUnlocked(): boolean {
    return isAchievementUnlocked(this.achievement());
  }

  get progress(): number {
    return getAchievementProgress(this.achievement());
  }

  formatDate(date: Date | string | null | undefined): string {
    return formatAchievementDate(date);
  }
}
