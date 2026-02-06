import { Component, signal } from '@angular/core';


@Component({
  selector: 'app-beta-banner',
  standalone: true,
  imports: [],
  templateUrl: './beta-banner.component.html',
  styleUrl: './beta-banner.component.css'
})
export class BetaBannerComponent {
  private readonly STORAGE_KEY = 'livrya-beta-banner-dismissed';

  isVisible = signal(true);

  constructor() {
    const dismissed = localStorage.getItem(this.STORAGE_KEY);
    if (dismissed === 'true') {
      this.isVisible.set(false);
    }
  }

  dismiss(): void {
    this.isVisible.set(false);
    localStorage.setItem(this.STORAGE_KEY, 'true');
  }
}
