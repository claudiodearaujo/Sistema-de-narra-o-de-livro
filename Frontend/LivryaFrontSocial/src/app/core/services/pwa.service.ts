import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// VAPID public key - must match the one on backend
// Generate keys with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = environment.vapidPublicKey || '';

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private deferredPrompt: BeforeInstallPromptEvent | null = null;

  // State
  isInstallable = signal(false);
  isInstalled = signal(false);
  isOnline = signal(true);
  pushSubscription = signal<PushSubscription | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.init();
    }
  }

  private init(): void {
    // Check if already installed
    this.checkInstallStatus();

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      this.deferredPrompt = event as BeforeInstallPromptEvent;
      this.isInstallable.set(true);
      console.log('[PWA] Install prompt available');
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      this.isInstalled.set(true);
      this.isInstallable.set(false);
      this.deferredPrompt = null;
      console.log('[PWA] App installed successfully');
    });

    // Listen for online/offline status
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      console.log('[PWA] Back online');
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
      console.log('[PWA] Gone offline');
    });

    // Initial online status
    this.isOnline.set(navigator.onLine);

    // Register service worker
    this.registerServiceWorker();
  }

  private checkInstallStatus(): void {
    // Check if running in standalone mode (installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    
    this.isInstalled.set(isStandalone);
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        console.log('[PWA] Service Worker registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version available');
                // Could trigger a UI prompt to refresh
              }
            });
          }
        });
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Prompt the user to install the app
   */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log('[PWA] Install prompt outcome:', outcome);
      
      this.deferredPrompt = null;
      this.isInstallable.set(false);
      
      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Error prompting install:', error);
      return false;
    }
  }

  /**
   * Request notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('[PWA] Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    const permission = await Notification.requestPermission();
    console.log('[PWA] Notification permission:', permission);
    return permission;
  }

  /**
   * Check if notifications are enabled
   */
  get notificationsEnabled(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Show a local notification
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!this.notificationsEnabled) {
      console.log('[PWA] Notifications not enabled');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/icon-72x72.png',
      ...options,
    });
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!('PushManager' in window)) {
      console.log('[PWA] Push notifications not supported');
      return null;
    }

    if (!VAPID_PUBLIC_KEY) {
      console.warn('[PWA] VAPID public key not configured');
      return null;
    }

    try {
      // Request notification permission first
      const permission = await this.requestNotificationPermission();
      if (permission !== 'granted') {
        console.log('[PWA] Notification permission denied');
        return null;
      }

      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        const applicationServerKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as any,
        });
        console.log('[PWA] New push subscription created');
      }

      this.pushSubscription.set(subscription);

      // Send subscription to backend
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('[PWA] Error subscribing to push:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    const subscription = this.pushSubscription();
    if (!subscription) {
      return true;
    }

    try {
      await subscription.unsubscribe();
      this.pushSubscription.set(null);

      // Notify backend
      await this.removeSubscriptionFromServer(subscription);

      console.log('[PWA] Unsubscribed from push');
      return true;
    } catch (error) {
      console.error('[PWA] Error unsubscribing:', error);
      return false;
    }
  }

  /**
   * Send subscription to backend
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await this.http.post(`${environment.apiUrl}/notifications/push/subscribe`, {
        subscription: subscription.toJSON(),
      }).toPromise();
      console.log('[PWA] Subscription sent to server');
    } catch (error) {
      console.error('[PWA] Error sending subscription to server:', error);
    }
  }

  /**
   * Remove subscription from backend
   */
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      await this.http.post(`${environment.apiUrl}/notifications/push/unsubscribe`, {
        endpoint: subscription.endpoint,
      }).toPromise();
      console.log('[PWA] Subscription removed from server');
    } catch (error) {
      console.error('[PWA] Error removing subscription from server:', error);
    }
  }

  /**
   * Convert base64 VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Check if push is supported and subscribed
   */
  get isPushSupported(): boolean {
    return 'PushManager' in window && 'serviceWorker' in navigator;
  }

  /**
   * Check current push subscription status
   */
  async checkPushSubscription(): Promise<boolean> {
    if (!this.isPushSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      this.pushSubscription.set(subscription);
      return !!subscription;
    } catch {
      return false;
    }
  }
}
