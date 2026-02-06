import { Directive, OnInit, OnDestroy, HostListener, inject, input } from '@angular/core';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';

@Directive({
    selector: '[appScrollTracker]',
    standalone: true
})
export class ScrollTrackerDirective implements OnInit, OnDestroy {
    private analytics = inject(AnalyticsService);
    private router = inject(Router);

    readonly trackScrollEnabled = input(true);

    private routerSubscription?: Subscription;

    ngOnInit(): void {
        // Reset tracking on navigation
        this.routerSubscription = this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => {
                this.analytics.resetScrollTracking();
            });
    }

    ngOnDestroy(): void {
        this.routerSubscription?.unsubscribe();
    }

    @HostListener('window:scroll', [])
    onScroll(): void {
        if (!this.trackScrollEnabled()) return;

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;

        if (scrollHeight <= clientHeight) return;

        const scrollPercentage = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
        const currentPath = window.location.pathname;

        this.analytics.trackScrollDepth(scrollPercentage, currentPath);
    }
}
