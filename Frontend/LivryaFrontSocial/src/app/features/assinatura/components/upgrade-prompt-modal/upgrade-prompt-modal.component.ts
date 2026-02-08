/**
 * Upgrade Prompt Modal Component
 * Shows upgrade prompt when user hits a limit
 * Sprint 9: Planos e Pagamentos
 */
import { Component, inject, signal, input, output, model } from '@angular/core';

import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { SubscriptionService } from '../../../../core/services/subscription.service';
import { SubscriptionPlan, getPlanDisplayName } from '../../../../core/models/subscription.model';

export interface UpgradePromptData {
  title?: string;
  message: string;
  feature?: string;
  currentLimit?: number;
  upgradeBenefit?: string;
}

@Component({
  selector: 'app-upgrade-prompt-modal',
  standalone: true,
  imports: [
    DialogModule,
    ButtonModule,
    TagModule,
    TranslocoModule
  ],
  templateUrl: './upgrade-prompt-modal.component.html',
  styleUrl: './upgrade-prompt-modal.component.css',
})
export class UpgradePromptModalComponent {
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);
  private translocoService = inject(TranslocoService);

  readonly visible = model(false);
  readonly data = input<UpgradePromptData | null>(null);
  readonly closed = output<void>();

  currentPlan = signal<SubscriptionPlan>('FREE');

  getPlanDisplayName = getPlanDisplayName;

  getDialogHeader(): string {
    return this.data()?.title || this.translocoService.translate('upgradePrompt.limitReached');
  }

  ngOnInit() {
    this.subscriptionService.currentPlan$.subscribe(
      plan => this.currentPlan.set(plan)
    );
  }

  onClose() {
    this.visible.set(false);
    this.closed.emit();
  }

  goToPlans() {
    this.onClose();
    this.router.navigate(['/subscription/plans']);
  }
}
