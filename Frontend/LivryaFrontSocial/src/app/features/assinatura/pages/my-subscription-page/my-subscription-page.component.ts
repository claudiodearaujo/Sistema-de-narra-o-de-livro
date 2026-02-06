/**
 * My Subscription Page Component
 * Shows current subscription details and management
 * Sprint 9: Planos e Pagamentos
 */
import { Component, OnInit, inject, signal, computed } from '@angular/core';

import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { SubscriptionService } from '../../../../core/services/subscription.service';
import { LivraService } from '../../../../core/services/livra.service';
import {
  Subscription,
  getPlanDisplayName,
  getPlanIcon,
  formatPrice,
} from '../../../../core/models/subscription.model';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

@Component({
  selector: 'app-my-subscription-page',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    TagModule,
    DividerModule,
    ConfirmDialogModule,
    ToastModule,
    ProgressBarModule,
    TranslocoModule
],
  providers: [ConfirmationService, MessageService],
  templateUrl: './my-subscription-page.component.html',
  styleUrl: './my-subscription-page.component.css',
})
export class MySubscriptionPageComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private livraService = inject(LivraService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private translocoService = inject(TranslocoService);

  subscription = signal<Subscription | null>(null);
  features = signal<any>(null);
  livraBalance = signal<any>(null);

  getPlanDisplayName = getPlanDisplayName;
  getPlanIcon = getPlanIcon;
  formatPrice = formatPrice;

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.subscriptionService.getSubscription().subscribe({
      next: (sub) => this.subscription.set(sub),
      error: (err) => console.error('Error loading subscription:', err),
    });

    this.subscriptionService.getPlanFeatures().subscribe({
      next: ({ features }) => this.features.set(features),
      error: (err) => console.error('Error loading features:', err),
    });

    this.livraService.getBalance().subscribe({
      next: (balance) => this.livraBalance.set(balance),
      error: (err) => console.error('Error loading balance:', err),
    });
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  goToPlans() {
    this.router.navigate(['/subscription/plans']);
  }

  goToLivras() {
    this.router.navigate(['/livras']);
  }

  async openPortal() {
    try {
      await this.subscriptionService.redirectToPortal();
    } catch (error: any) {
      this.messageService.add({
        severity: 'error',
        summary: this.translocoService.translate('errors.unexpected'),
        detail: this.translocoService.translate('mySubscription.portalError'),
      });
    }
  }

  confirmCancel() {
    this.confirmationService.confirm({
      message: this.translocoService.translate('mySubscription.confirmCancelMessage'),
      header: this.translocoService.translate('mySubscription.cancelSubscription'),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.translocoService.translate('mySubscription.yesCancel'),
      rejectLabel: this.translocoService.translate('primeng.reject'),
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.cancelSubscription(),
    });
  }

  cancelSubscription() {
    this.subscriptionService.cancelSubscription().subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('mySubscription.success'),
          detail: this.translocoService.translate('mySubscription.cancelledAtEnd'),
        });
        this.loadData();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('errors.unexpected'),
          detail: err.error?.error || this.translocoService.translate('mySubscription.cancelError'),
        });
      },
    });
  }

  resumeSubscription() {
    this.subscriptionService.resumeSubscription().subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.translocoService.translate('mySubscription.success'),
          detail: this.translocoService.translate('mySubscription.subscriptionReactivated'),
        });
        this.loadData();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: this.translocoService.translate('errors.unexpected'),
          detail: err.error?.error || this.translocoService.translate('mySubscription.reactivateError'),
        });
      },
    });
  }
}
