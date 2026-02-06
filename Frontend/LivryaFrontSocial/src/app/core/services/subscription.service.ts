import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Subscription,
  Plan,
  CheckoutSession,
  PortalSession,
  PlanFeatures,
  LivraPackage,
  BillingPeriod,
  SubscriptionPlan,
} from '../models/subscription.model';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/subscription`;
  private livraUrl = `${environment.apiUrl}/livras`;

  // Subscription state
  private subscriptionSubject = new BehaviorSubject<Subscription | null>(null);
  public subscription$ = this.subscriptionSubject.asObservable();

  // Current plan
  public currentPlan$ = this.subscription$.pipe(
    map(sub => sub?.plan ?? 'FREE')
  );

  /**
   * Get current user's subscription
   */
  getSubscription(): Observable<Subscription> {
    return this.http.get<Subscription>(this.apiUrl).pipe(
      tap(sub => this.subscriptionSubject.next(sub))
    );
  }

  /**
   * Get current subscription value
   */
  get currentSubscription(): Subscription | null {
    return this.subscriptionSubject.value;
  }

  /**
   * Get current plan value
   */
  get currentPlan(): SubscriptionPlan {
    return this.subscriptionSubject.value?.plan ?? 'FREE';
  }

  /**
   * Get available plans
   */
  getPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.apiUrl}/plans`);
  }

  /**
   * Get plan features for current user
   */
  getPlanFeatures(): Observable<{ plan: SubscriptionPlan; features: PlanFeatures }> {
    return this.http.get<{ plan: SubscriptionPlan; features: PlanFeatures }>(
      `${this.apiUrl}/features`
    );
  }

  /**
   * Create checkout session for subscription
   */
  createCheckoutSession(
    plan: 'PREMIUM' | 'PRO',
    billingPeriod: BillingPeriod
  ): Observable<CheckoutSession> {
    const successUrl = `${window.location.origin}/subscription/success`;
    const cancelUrl = `${window.location.origin}/subscription/plans`;

    return this.http.post<CheckoutSession>(`${this.apiUrl}/checkout`, {
      plan,
      billingPeriod,
      successUrl,
      cancelUrl,
    });
  }

  /**
   * Create customer portal session
   */
  createPortalSession(): Observable<PortalSession> {
    const returnUrl = `${window.location.origin}/subscription`;

    return this.http.post<PortalSession>(`${this.apiUrl}/portal`, {
      returnUrl,
    });
  }

  /**
   * Cancel subscription at period end
   */
  cancelSubscription(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/cancel`, {}).pipe(
      tap(() => {
        // Update local state
        if (this.subscriptionSubject.value) {
          this.subscriptionSubject.next({
            ...this.subscriptionSubject.value,
            cancelAtPeriodEnd: true,
          });
        }
      })
    );
  }

  /**
   * Resume cancelled subscription
   */
  resumeSubscription(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/resume`, {}).pipe(
      tap(() => {
        // Update local state
        if (this.subscriptionSubject.value) {
          this.subscriptionSubject.next({
            ...this.subscriptionSubject.value,
            cancelAtPeriodEnd: false,
          });
        }
      })
    );
  }

  /**
   * Redirect to Stripe checkout
   */
  async redirectToCheckout(plan: 'PREMIUM' | 'PRO', billingPeriod: BillingPeriod): Promise<void> {
    const session = await this.createCheckoutSession(plan, billingPeriod).toPromise();
    if (session?.url) {
      window.location.href = session.url;
    }
  }

  /**
   * Redirect to Stripe customer portal
   */
  async redirectToPortal(): Promise<void> {
    const session = await this.createPortalSession().toPromise();
    if (session?.url) {
      window.location.href = session.url;
    }
  }

  // ========== Livra Package Methods ==========

  /**
   * Get available Livra packages
   */
  getLivraPackages(): Observable<LivraPackage[]> {
    return this.http.get<LivraPackage[]>(`${this.livraUrl}/packages`);
  }

  /**
   * Create checkout session for Livra package purchase
   */
  purchaseLivraPackage(packageId: string): Observable<CheckoutSession> {
    const successUrl = `${window.location.origin}/livras/success`;
    const cancelUrl = `${window.location.origin}/livras`;

    return this.http.post<CheckoutSession>(`${this.livraUrl}/purchase/${packageId}`, {
      successUrl,
      cancelUrl,
    });
  }

  /**
   * Redirect to Stripe checkout for Livra package
   */
  async redirectToLivraCheckout(packageId: string): Promise<void> {
    const session = await this.purchaseLivraPackage(packageId).toPromise();
    if (session?.url) {
      window.location.href = session.url;
    }
  }

  // ========== Helper Methods ==========

  /**
   * Check if user has an active paid subscription
   */
  hasPaidSubscription(): boolean {
    const sub = this.subscriptionSubject.value;
    return sub?.plan !== 'FREE' && sub?.status === 'ACTIVE';
  }

  /**
   * Check if user can use a feature
   */
  canUseFeature(feature: keyof PlanFeatures): Observable<boolean> {
    return this.getPlanFeatures().pipe(
      map(({ features }) => {
        const value = features[feature];
        if (typeof value === 'boolean') return value;
        return value !== 0;
      })
    );
  }

  /**
   * Check if user is within limit
   */
  isWithinLimit(
    feature: 'maxBooks' | 'maxCharactersPerBook' | 'maxSpeechesPerChapter' | 'maxDmsPerDay' | 'maxStoriesPerDay',
    currentCount: number
  ): Observable<boolean> {
    return this.getPlanFeatures().pipe(
      map(({ features }) => {
        const limit = features[feature];
        if (limit === -1) return true; // Unlimited
        return currentCount < limit;
      })
    );
  }

  /**
   * Get remaining count for a limit
   */
  getRemainingCount(
    feature: 'maxBooks' | 'maxCharactersPerBook' | 'maxSpeechesPerChapter',
    currentCount: number
  ): Observable<number | 'unlimited'> {
    return this.getPlanFeatures().pipe(
      map(({ features }) => {
        const limit = features[feature];
        if (limit === -1) return 'unlimited';
        return Math.max(0, limit - currentCount);
      })
    );
  }

  /**
   * Refresh subscription data
   */
  refresh(): void {
    this.getSubscription().subscribe();
  }
}
