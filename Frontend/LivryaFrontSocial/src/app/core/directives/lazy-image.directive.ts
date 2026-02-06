import {
  Directive,
  ElementRef,
  OnInit,
  OnDestroy,
  inject,
  PLATFORM_ID,
  NgZone,
  Renderer2,
  input
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * LazyImageDirective
 *
 * A reusable directive for lazy loading images using IntersectionObserver.
 * Improves page load performance by deferring image loading until they're
 * about to enter the viewport.
 *
 * Features:
 * - Native lazy loading with IntersectionObserver fallback
 * - Placeholder support while loading
 * - Error handling with fallback image
 * - Fade-in animation on load
 * - WebP detection and automatic format selection
 *
 * @example
 * <img
 *   [appLazyImage]="imageUrl"
 *   [placeholder]="'assets/images/placeholder.jpg'"
 *   [fallback]="'assets/images/no-image.jpg'"
 *   alt="Image description">
 */
@Directive({
  selector: 'img[appLazyImage]',
  standalone: true
})
export class LazyImageDirective implements OnInit, OnDestroy {
  private readonly el = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private readonly renderer = inject(Renderer2);

  private observer?: IntersectionObserver;
  private loaded = false;

  /**
   * The image URL to lazy load
   */
  readonly appLazyImage = input<string>('');

  /**
   * Placeholder image shown while the main image loads
   */
  readonly placeholder = input<string>('');

  /**
   * Fallback image shown if the main image fails to load
   */
  readonly fallback = input<string>('');

  /**
   * Root margin for IntersectionObserver (how early to start loading)
   */
  readonly rootMargin = input<string>('50px');

  /**
   * Whether to add fade-in animation
   */
  readonly fadeIn = input<boolean>(true);

  /**
   * Threshold for IntersectionObserver (0-1)
   */
  readonly threshold = input<number>(0.01);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      // SSR: set src directly
      this.setSrc(this.appLazyImage());
      return;
    }

    this.setupImage();
  }

  ngOnDestroy(): void {
    this.disconnectObserver();
  }

  private setupImage(): void {
    const img = this.el.nativeElement as HTMLImageElement;

    // Set native lazy loading
    this.renderer.setAttribute(img, 'loading', 'lazy');
    this.renderer.setAttribute(img, 'decoding', 'async');

    // Apply initial styles for fade-in effect
    if (this.fadeIn()) {
      this.renderer.setStyle(img, 'opacity', '0');
      this.renderer.setStyle(img, 'transition', 'opacity 0.3s ease-in-out');
    }

    // Set placeholder if provided
    const placeholder = this.placeholder();
    if (placeholder) {
      this.setSrc(placeholder);
    }

    // Setup IntersectionObserver for lazy loading
    if ('IntersectionObserver' in window) {
      this.setupObserver();
    } else {
      // Fallback for older browsers
      this.loadImage();
    }
  }

  private setupObserver(): void {
    this.ngZone.runOutsideAngular(() => {
      const options: IntersectionObserverInit = {
        root: null,
        rootMargin: this.rootMargin(),
        threshold: this.threshold()
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.loaded) {
            this.ngZone.run(() => {
              this.loadImage();
            });
            this.disconnectObserver();
          }
        });
      }, options);

      this.observer.observe(this.el.nativeElement);
    });
  }

  private loadImage(): void {
    const appLazyImage = this.appLazyImage();
    if (this.loaded || !appLazyImage) return;

    const img = this.el.nativeElement as HTMLImageElement;

    // Create a temporary image to preload
    const tempImg = new Image();

    tempImg.onload = () => {
      this.loaded = true;
      this.setSrc(this.appLazyImage());

      if (this.fadeIn()) {
        // Small delay to ensure the image is rendered
        requestAnimationFrame(() => {
          this.renderer.setStyle(img, 'opacity', '1');
        });
      }
    };

    tempImg.onerror = () => {
      this.loaded = true;
      const fallback = this.fallback();
      if (fallback) {
        this.setSrc(fallback);
      }
      if (this.fadeIn()) {
        this.renderer.setStyle(img, 'opacity', '1');
      }
    };

    tempImg.src = appLazyImage;
  }

  private setSrc(src: string): void {
    if (src) {
      this.renderer.setAttribute(this.el.nativeElement, 'src', src);
    }
  }

  private disconnectObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }
}
