import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TranslocoModule } from '@jsverse/transloco';
import { RouteLoadingService } from './core/services/route-loading.service';
import { AnalyticsService } from './core/services/analytics.service';
import { ScrollTrackerDirective } from './core/directives/scroll-tracker.directive';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ProgressSpinnerModule, ScrollTrackerDirective, TranslocoModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  protected readonly routeLoading = inject(RouteLoadingService);
  private readonly analytics = inject(AnalyticsService);

  ngOnInit(): void {
    // Track UTM campaign parameters on app start
    this.analytics.trackCampaignFromUrl();
  }
}
