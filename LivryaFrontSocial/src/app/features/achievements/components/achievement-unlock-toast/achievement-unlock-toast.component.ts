import { Component, OnInit, OnDestroy, input, output } from '@angular/core';

import { trigger, transition, style, animate } from '@angular/animations';
import { Achievement } from '../../../../core/models/achievement.model';

import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-achievement-unlock-toast',
  standalone: true,
  imports: [ToastModule, ButtonModule],
  templateUrl: './achievement-unlock-toast.component.html',
  styleUrl: './achievement-unlock-toast.component.css',
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('0.3s ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0.2s ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class AchievementUnlockToastComponent implements OnInit, OnDestroy {
  readonly achievement = input.required<Achievement>();
  readonly duration = input(8000); // Auto-close after 8 seconds
  readonly closed = output<void>();
  readonly viewAchievements = output<void>();

  visible = true;
  private timeoutId?: ReturnType<typeof setTimeout>;

  ngOnInit() {
    if (this.duration() > 0) {
      this.timeoutId = setTimeout(() => this.close(), this.duration());
    }
  }

  ngOnDestroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  close() {
    this.visible = false;
    setTimeout(() => this.closed.emit(), 200);
  }
}
