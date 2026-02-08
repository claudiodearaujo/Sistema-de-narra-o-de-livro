import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { LivraService } from '../../../core/services/livra.service';
import { LivraBalance, LivraUpdateEvent } from '../../../core/models/livra.model';

@Component({
  selector: 'app-livra-balance',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, TooltipModule, BadgeModule],
  templateUrl: './livra-balance.component.html',
  styleUrl: './livra-balance.component.css',
})
export class LivraBalanceComponent implements OnInit, OnDestroy {
  private livraService = inject(LivraService);
  private destroy$ = new Subject<void>();

  balance: LivraBalance | null = null;
  displayBalance = 0;
  isAnimating = false;
  lastAmount = 0;
  tooltipContent = 'Carregando...';

  ngOnInit() {
    // Subscribe to balance changes
    this.livraService.balance$.pipe(takeUntil(this.destroy$)).subscribe((balance) => {
      if (balance) {
        this.balance = balance;
        this.animateBalance(balance.balance);
        this.tooltipContent = `Saldo: ${balance.balance} Livras\nTotal ganho: ${balance.lifetime}\nTotal gasto: ${balance.spent}`;
      }
    });

    // Subscribe to live updates
    this.livraService.lastUpdate$.pipe(takeUntil(this.destroy$)).subscribe((update) => {
      if (update) {
        this.handleUpdate(update);
      }
    });

    // Load initial balance
    this.livraService.getBalance().subscribe();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private animateBalance(newBalance: number) {
    const duration = 500;
    const startBalance = this.displayBalance;
    const diff = newBalance - startBalance;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      
      this.displayBalance = Math.round(startBalance + diff * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  private handleUpdate(update: LivraUpdateEvent) {
    this.lastAmount = update.amount;
    this.isAnimating = true;

    // Update balance with animation
    this.animateBalance(update.balance);

    // Reset animation after delay
    setTimeout(() => {
      this.isAnimating = false;
      this.lastAmount = 0;
    }, 2500);
  }
}
