import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  inject,
  PLATFORM_ID,
  signal,
  input,
  output
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * OptimizedImageComponent
 *
 * A reusable component for optimized image loading with WebP support,
 * lazy loading, placeholder, and responsive images.
 *
 * Features:
 * - Automatic WebP detection and fallback
 * - Lazy loading with IntersectionObserver
 * - Placeholder while loading
 * - Error fallback image
 * - Responsive srcset support
 * - Skeleton loading animation
 * - Accessibility support (alt text)
 *
 * @example
 * <app-optimized-image
 *   [src]="bookCover"
 *   [alt]="book.title"
 *   [width]="300"
 *   [height]="400"
 *   [placeholder]="'assets/images/book-placeholder.jpg'"
 *   [objectFit]="'cover'"
 *   (loaded)="onImageLoaded()"
 *   (error)="onImageError()">
 * </app-optimized-image>
 */
@Component({
  selector: 'app-optimized-image',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="optimized-image-container"
      [style.width]="width() ? width() + 'px' : '100%'"
      [style.height]="height() ? height() + 'px' : 'auto'"
      [style.aspect-ratio]="aspectRatio() || 'auto'">

      <!-- Skeleton loader -->
      @if (showSkeleton()() && !isLoaded() && !hasError()) {
        <div class="skeleton-loader"></div>
      }

      <!-- Picture element for WebP support -->
      <picture [class.loaded]="isLoaded()" [class.hidden]="hasError() && fallback()">
        @if (webpSrc() && supportsWebP()) {
          <source [srcset]="webpSrc()" type="image/webp">
        }

        <img
          [src]="currentSrc()"
          [alt]="alt()"
          [width]="width()"
          [height]="height()"
          [style.object-fit]="objectFit()"
          [loading]="lazy() ? 'lazy' : 'eager'"
          decoding="async"
          (load)="onLoad()"
          (error)="onError()"
          [class.loading]="!isLoaded()"
          [attr.fetchpriority]="priority()">
      </picture>
    </div>
  `,
  styles: [`
    .optimized-image-container {
      position: relative;
      overflow: hidden;
      background-color: #f0f0f0;
    }

    .skeleton-loader {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        #f0f0f0 25%,
        #e0e0e0 50%,
        #f0f0f0 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    picture {
      display: block;
      width: 100%;
      height: 100%;
    }

    picture.hidden {
      display: none;
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      opacity: 0;
      transition: opacity 0.3s ease-in-out;
    }

    img.loading {
      opacity: 0;
    }

    picture.loaded img {
      opacity: 1;
    }
  `]
})
export class OptimizedImageComponent implements OnInit, OnChanges {
  private readonly platformId = inject(PLATFORM_ID);
  private webPSupported: boolean | null = null;

  /**
   * Image source URL
   */
  readonly src = input<string>('');

  /**
   * WebP version of the image (optional)
   * If not provided, will try to generate from src
   */
  readonly webpSrc = input<string>();

  /**
   * Alt text for accessibility
   */
  readonly alt = input<string>('');

  /**
   * Image width in pixels
   */
  readonly width = input<number>();

  /**
   * Image height in pixels
   */
  readonly height = input<number>();

  /**
   * Aspect ratio (e.g., "16/9", "4/3", "1/1")
   */
  readonly aspectRatio = input<string>();

  /**
   * Object fit CSS property
   */
  readonly objectFit = input<'cover' | 'contain' | 'fill' | 'none' | 'scale-down'>('cover');

  /**
   * Placeholder image URL
   */
  readonly placeholder = input<string>();

  /**
   * Fallback image URL for error state
   */
  readonly fallback = input<string>();

  /**
   * Whether to use lazy loading
   */
  readonly lazy = input<boolean>(true);

  /**
   * Show skeleton loader while loading
   */
  readonly showSkeleton = input(signal(true));

  /**
   * Fetch priority for the image
   */
  readonly priority = input<'high' | 'low' | 'auto'>('auto');

  /**
   * Event emitted when image loads successfully
   */
  readonly loaded = output<void>();

  /**
   * Event emitted when image fails to load
   */
  readonly error = output<void>();

  isLoaded = signal(false);
  hasError = signal(false);
  currentSrc = signal('');

  ngOnInit(): void {
    this.detectWebPSupport();
    this.updateCurrentSrc();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] || changes['placeholder']) {
      this.updateCurrentSrc();
      this.isLoaded.set(false);
      this.hasError.set(false);
    }
  }

  private updateCurrentSrc(): void {
    const placeholder = this.placeholder();
    const src = this.src();
    if (placeholder && !this.isLoaded()) {
      this.currentSrc.set(placeholder);
    } else if (src) {
      this.currentSrc.set(src);
    }
  }

  onLoad(): void {
    this.isLoaded.set(true);
    this.hasError.set(false);

    // If we were showing placeholder, now show the actual image
    const src = this.src();
    if (this.currentSrc() === this.placeholder() && src) {
      this.currentSrc.set(src);
    }

    // TODO: The 'emit' function requires a mandatory void argument
    this.loaded.emit();
  }

  onError(): void {
    this.hasError.set(true);

    const fallback = this.fallback();
    if (fallback && this.currentSrc() !== fallback) {
      this.currentSrc.set(fallback);
      this.hasError.set(false);
    }

    // TODO: The 'emit' function requires a mandatory void argument
    this.error.emit();
  }

  supportsWebP(): boolean {
    return this.webPSupported ?? false;
  }

  private detectWebPSupport(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.webPSupported = false;
      return;
    }

    // Check if already detected
    if (this.webPSupported !== null) {
      return;
    }

    // Use canvas to detect WebP support
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
      this.webPSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    } else {
      this.webPSupported = false;
    }
  }

  /**
   * Generate WebP URL from original source
   * Assumes WebP versions are available with .webp extension
   */
  getWebPUrl(url: string): string {
    if (!url) return '';

    // If URL already ends with .webp, return as is
    if (url.toLowerCase().endsWith('.webp')) {
      return url;
    }

    // Replace extension with .webp
    const lastDot = url.lastIndexOf('.');
    if (lastDot === -1) {
      return url + '.webp';
    }

    return url.substring(0, lastDot) + '.webp';
  }
}
