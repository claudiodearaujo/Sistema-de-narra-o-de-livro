/**
 * Livra Purchase Success Page Component
 * Shown after successful Livra package purchase
 * Sprint 9: Planos e Pagamentos
 */
import { Component, OnInit, inject, signal } from '@angular/core';

import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LivraService } from '../../../../core/services/livra.service';

@Component({
  selector: 'app-livra-success-page',
  standalone: true,
  imports: [
    CardModule,
    ButtonModule,
    ProgressSpinnerModule
],
  templateUrl: './livra-success-page.component.html',
  styleUrl: './livra-success-page.component.css',
})
export class LivraSuccessPageComponent implements OnInit {
  private router = inject(Router);
  private livraService = inject(LivraService);

  isLoading = signal(true);
  balance = signal(0);

  ngOnInit() {
    // Refresh balance
    this.livraService.getBalance().subscribe({
      next: (data) => {
        this.balance.set(data.balance);
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

  goToLivras() {
    this.router.navigate(['/livras']);
  }
}
