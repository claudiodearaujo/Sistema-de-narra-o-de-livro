import { Injectable, computed, signal, inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class RouteLoadingService {
  private router = inject(Router);

  private readonly pendingTransitions = signal(0);

  readonly isNavigating = computed(() => this.pendingTransitions() > 0);

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.pendingTransitions.update(count => count + 1);
        return;
      }

      if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
        this.pendingTransitions.update(count => Math.max(count - 1, 0));
      }
    });
  }
}
