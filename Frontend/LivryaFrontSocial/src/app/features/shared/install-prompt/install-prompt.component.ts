import { Component, inject, signal } from '@angular/core';

import { Button } from 'primeng/button';
import { TranslocoModule } from '@jsverse/transloco';
import { PwaService } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-install-prompt',
  standalone: true,
  imports: [Button, TranslocoModule],
  templateUrl: './install-prompt.component.html',
  styleUrl: './install-prompt.component.css',
})
export class InstallPromptComponent {
  private readonly pwaService = inject(PwaService);

  showPrompt = signal(false);

  constructor() {
    // Show prompt after a delay if installable
    setTimeout(() => {
      if (this.pwaService.isInstallable() && !this.pwaService.isInstalled()) {
        // Check if user has dismissed before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          this.showPrompt.set(true);
        }
      }
    }, 5000);
  }

  async install(): Promise<void> {
    const installed = await this.pwaService.promptInstall();
    this.showPrompt.set(false);
    if (installed) {
      console.log('[InstallPrompt] App installed!');
    }
  }

  dismiss(): void {
    this.showPrompt.set(false);
    // Don't show again for 7 days
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setTimeout(() => {
      localStorage.removeItem('pwa-install-dismissed');
    }, 7 * 24 * 60 * 60 * 1000);
  }
}
