import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { DividerModule } from 'primeng/divider';
import { TimelineModule } from 'primeng/timeline';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { LivraService } from '../../../../core/services/livra.service';
import {
  LivraBalance,
  LivraTransaction,
  TransactionFilters,
  LivraTransactionType,
  getTransactionTypeInfo,
} from '../../../../core/models/livra.model';
import { LivraPackagesComponent } from '../../components/livra-packages/livra-packages.component';

@Component({
  selector: 'app-livras-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    SelectModule,
    DatePickerModule,
    ProgressSpinnerModule,
    TagModule,
    TooltipModule,
    DividerModule,
    TimelineModule,
    TranslocoModule,
    LivraPackagesComponent,
  ],
  templateUrl: './livras-page.component.html',
  styleUrl: './livras-page.component.css',
})
export class LivrasPageComponent implements OnInit {
  private livraService = inject(LivraService);

  // State
  balance = signal<LivraBalance | null>(null);
  transactions = signal<LivraTransaction[]>([]);
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(false);
  currentPage = 1;

  // Filters
  selectedType: LivraTransactionType | null = null;
  dateRange: Date[] | null = null;
  typeOptions = this.livraService.getTransactionTypeOptions();

  // Computed
  periodTotals = computed(() => this.livraService.calculateTotals(this.transactions()));

  ngOnInit() {
    this.loadBalance();
    this.loadTransactions();
  }

  loadBalance() {
    this.livraService.getBalance().subscribe((balance) => {
      this.balance.set(balance);
    });
  }

  loadTransactions() {
    this.loading.set(true);
    this.currentPage = 1;

    const filters: TransactionFilters = {};
    if (this.selectedType) {
      filters.type = this.selectedType;
    }
    if (this.dateRange && this.dateRange.length === 2) {
      filters.startDate = this.dateRange[0];
      filters.endDate = this.dateRange[1];
    }

    this.livraService.getTransactions(1, 20, filters).subscribe({
      next: (result) => {
        this.transactions.set(result.transactions);
        this.hasMore.set(result.hasMore);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  loadMore() {
    this.loadingMore.set(true);
    this.currentPage++;

    const filters: TransactionFilters = {};
    if (this.selectedType) {
      filters.type = this.selectedType;
    }
    if (this.dateRange && this.dateRange.length === 2) {
      filters.startDate = this.dateRange[0];
      filters.endDate = this.dateRange[1];
    }

    this.livraService.getTransactions(this.currentPage, 20, filters).subscribe({
      next: (result) => {
        this.transactions.update((current) => [...current, ...result.transactions]);
        this.hasMore.set(result.hasMore);
        this.loadingMore.set(false);
      },
      error: () => {
        this.loadingMore.set(false);
      },
    });
  }

  getTypeInfo(type: LivraTransactionType) {
    return getTransactionTypeInfo(type);
  }
}
