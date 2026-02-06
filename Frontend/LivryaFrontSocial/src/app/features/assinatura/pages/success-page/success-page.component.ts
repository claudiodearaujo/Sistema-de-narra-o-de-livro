/**
 * Subscription Success Page Component
 * Shown after successful checkout
 * Sprint 9: Planos e Pagamentos
 */
import { Component, OnInit, inject, signal } from '@angular/core';

import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TranslocoModule } from '@jsverse/transloco';
import { SubscriptionService } from '../../../../core/services/subscription.service';
import { getPlanDisplayName } from '../../../../core/models/subscription.model';

@Component({
  selector: 'app-success-page',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    ProgressSpinnerModule,
    TranslocoModule
],
  templateUrl: './success-page.component.html',
  styleUrl: './success-page.component.css',
})
export class SuccessPageComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private subscriptionService = inject(SubscriptionService);

  isLoading = signal(true);
  planName = signal('Premium');

  ngOnInit() {
    // Refresh subscription data
    this.subscriptionService.getSubscription().subscribe({
      next: (sub) => {
        this.planName.set(getPlanDisplayName(sub.plan));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  goToBooks() {
    this.router.navigate(['/books']);
  }

  goToSubscription() {
    this.router.navigate(['/subscription']);
  }
}
