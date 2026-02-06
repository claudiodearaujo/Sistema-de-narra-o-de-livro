/**
 * Plans Page Component
 * Displays subscription plans for upgrade
 * Sprint 9: Planos e Pagamentos
 */
import { Component, OnInit, inject, signal, computed } from '@angular/core';

import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { SubscriptionService } from '../../../../core/services/subscription.service';
import {
  Plan,
  BillingPeriod,
  formatPrice,
  calculateYearlySavings,
  SubscriptionPlan,
} from '../../../../core/models/subscription.model';

@Component({
  selector: 'app-plans-page',
  standalone: true,
  imports: [
    FormsModule,
    CardModule,
    ButtonModule,
    SelectButtonModule,
    DividerModule,
    TagModule,
    ToastModule,
    TranslocoModule
],
  providers: [MessageService],
  templateUrl: './plans-page.component.html',
  styleUrl: './plans-page.component.css',
})
export class PlansPageComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private translocoService = inject(TranslocoService);

  plans = signal<Plan[]>([]);
  currentPlan = signal<SubscriptionPlan>('FREE');
  billingPeriod = signal<BillingPeriod>('monthly');
  isLoading = signal(false);

  billingOptions = computed(() => [
    { label: this.translocoService.translate('plansPage.billing.monthly'), value: 'monthly' },
    { label: this.translocoService.translate('plansPage.billing.yearly'), value: 'yearly' },
  ]);

  formatPrice = formatPrice;

  ngOnInit() {
    this.loadPlans();
    this.loadCurrentSubscription();
  }

  private loadPlans() {
    this.subscriptionService.getPlans().subscribe({
      next: (plans) => this.plans.set(plans),
      error: (err) => {
        console.error('Error loading plans:', err);
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('errors.unexpected'),
          detail: this.translocoService.translate('plansPage.errors.loadPlans'),
        });
      },
    });
  }

  private loadCurrentSubscription() {
    this.subscriptionService.getSubscription().subscribe({
      next: (sub) => this.currentPlan.set(sub.plan),
      error: (err) => console.error('Error loading subscription:', err),
    });
  }

  getPrice(plan: Plan): number {
    return this.billingPeriod() === 'yearly' ? plan.price.yearly : plan.price.monthly;
  }

  calculateSavings(plan: Plan): number {
    return calculateYearlySavings(plan.price.monthly, plan.price.yearly);
  }

  getCardClass(plan: Plan): string {
    const base = 'h-full';
    if (plan.id === 'PRO') {
      return `${base} plan-card-featured`;
    }
    return base;
  }

  getButtonLabel(plan: Plan): string {
    if (this.currentPlan() === 'FREE') {
      return this.translocoService.translate('plansPage.buttons.startWith', { name: plan.name });
    }
    if (plan.id === 'PRO' && this.currentPlan() === 'PREMIUM') {
      return this.translocoService.translate('plansPage.buttons.upgrade');
    }
    return this.translocoService.translate('plansPage.buttons.changeTo', { name: plan.name });
  }

  async selectPlan(plan: Plan) {
    if (plan.id === 'FREE' || plan.id === this.currentPlan()) {
      return;
    }

    this.isLoading.set(true);

    try {
      await this.subscriptionService.redirectToCheckout(
        plan.id as 'PREMIUM' | 'PRO',
        this.billingPeriod()
      );
    } catch (error: any) {
      console.error('Checkout error:', error);
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('errors.unexpected'),
        detail: error.error?.error || this.translocoService.translate('plansPage.errors.checkout'),
      });
      this.isLoading.set(false);
    }
  }

  async openPortal() {
    try {
      await this.subscriptionService.redirectToPortal();
    } catch (error: any) {
      console.error('Portal error:', error);
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('errors.unexpected'),
        detail: this.translocoService.translate('plansPage.errors.portal'),
      });
    }
  }
}
