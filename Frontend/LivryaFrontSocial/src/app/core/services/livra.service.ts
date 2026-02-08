import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LivraBalance,
  LivraTransaction,
  PaginatedTransactions,
  TransactionFilters,
  CostCheckResponse,
  AffordCheckResponse,
  LivraTransactionType,
  LivraUpdateEvent,
} from '../models/livra.model';

@Injectable({
  providedIn: 'root',
})
export class LivraService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/livras`;

  // Balance state
  private balanceSubject = new BehaviorSubject<LivraBalance | null>(null);
  public balance$ = this.balanceSubject.asObservable();

  // Last update animation state
  private lastUpdateSubject = new BehaviorSubject<LivraUpdateEvent | null>(null);
  public lastUpdate$ = this.lastUpdateSubject.asObservable();

  /**
   * Get current user's balance
   */
  getBalance(): Observable<LivraBalance> {
    return this.http.get<LivraBalance>(`${this.apiUrl}/balance`).pipe(
      tap((balance) => this.balanceSubject.next(balance))
    );
  }

  /**
   * Get current balance value synchronously
   */
  get currentBalance(): number {
    return this.balanceSubject.value?.balance ?? 0;
  }

  /**
   * Get transaction history
   */
  getTransactions(
    page: number = 1,
    limit: number = 20,
    filters?: TransactionFilters
  ): Observable<PaginatedTransactions> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters?.type) {
      params = params.set('type', filters.type);
    }
    if (filters?.startDate) {
      params = params.set('startDate', filters.startDate.toISOString());
    }
    if (filters?.endDate) {
      params = params.set('endDate', filters.endDate.toISOString());
    }

    return this.http.get<PaginatedTransactions>(`${this.apiUrl}/transactions`, { params });
  }

  /**
   * Get cost for a specific action
   */
  getCost(action: 'TTS' | 'IMAGE' | 'CHARACTER' | 'BOOST'): Observable<CostCheckResponse> {
    return this.http.get<CostCheckResponse>(`${this.apiUrl}/cost/${action.toLowerCase()}`);
  }

  /**
   * Check if user can afford an amount
   */
  canAfford(amount: number): Observable<AffordCheckResponse> {
    const params = new HttpParams().set('amount', amount.toString());
    return this.http.get<AffordCheckResponse>(`${this.apiUrl}/can-afford`, { params });
  }

  /**
   * Check if user can afford an action
   */
  canAffordAction(action: 'TTS' | 'IMAGE' | 'CHARACTER' | 'BOOST'): Observable<boolean> {
    return this.getCost(action).pipe(
      map((costResponse) => this.currentBalance >= costResponse.cost)
    );
  }

  /**
   * Handle WebSocket livra:update event
   */
  handleLivraUpdate(event: LivraUpdateEvent): void {
    // Update balance
    const currentBalance = this.balanceSubject.value;
    if (currentBalance) {
      const isEarned = event.amount > 0;
      this.balanceSubject.next({
        balance: event.balance,
        lifetime: isEarned ? currentBalance.lifetime + event.amount : currentBalance.lifetime,
        spent: !isEarned ? currentBalance.spent + Math.abs(event.amount) : currentBalance.spent,
      });
    }

    // Emit for animation
    this.lastUpdateSubject.next(event);

    // Clear after animation
    setTimeout(() => {
      if (this.lastUpdateSubject.value === event) {
        this.lastUpdateSubject.next(null);
      }
    }, 3000);
  }

  /**
   * Refresh balance from server
   */
  refreshBalance(): void {
    this.getBalance().subscribe();
  }

  /**
   * Group transactions by date
   */
  groupTransactionsByDate(transactions: LivraTransaction[]): Map<string, LivraTransaction[]> {
    const grouped = new Map<string, LivraTransaction[]>();

    transactions.forEach((tx) => {
      const date = new Date(tx.createdAt).toLocaleDateString('pt-BR');
      const existing = grouped.get(date) || [];
      existing.push(tx);
      grouped.set(date, existing);
    });

    return grouped;
  }

  /**
   * Calculate total earned/spent in a period
   */
  calculateTotals(transactions: LivraTransaction[]): { earned: number; spent: number } {
    return transactions.reduce(
      (acc, tx) => {
        if (tx.amount > 0) {
          acc.earned += tx.amount;
        } else {
          acc.spent += Math.abs(tx.amount);
        }
        return acc;
      },
      { earned: 0, spent: 0 }
    );
  }

  /**
   * Get filter options for transaction types
   */
  getTransactionTypeOptions(): { label: string; value: LivraTransactionType }[] {
    return [
      { label: 'Curtidas recebidas', value: 'EARNED_LIKE' },
      { label: 'Comentários recebidos', value: 'EARNED_COMMENT' },
      { label: 'Novos seguidores', value: 'EARNED_FOLLOW' },
      { label: 'Posts criados', value: 'EARNED_POST' },
      { label: 'Campanhas completadas', value: 'EARNED_CAMPAIGN' },
      { label: 'Bônus mensal', value: 'EARNED_PLAN' },
      { label: 'Conquistas', value: 'EARNED_ACHIEVEMENT' },
      { label: 'Compras', value: 'EARNED_PURCHASE' },
      { label: 'Geração de áudio', value: 'SPENT_TTS' },
      { label: 'Geração de imagem', value: 'SPENT_IMAGE' },
      { label: 'Criação de personagem', value: 'SPENT_CHARACTER' },
      { label: 'Posts impulsionados', value: 'SPENT_BOOST' },
      { label: 'Expirados', value: 'EXPIRED' },
    ];
  }
}
