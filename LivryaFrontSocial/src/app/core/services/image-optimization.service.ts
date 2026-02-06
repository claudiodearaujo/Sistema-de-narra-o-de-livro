import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Image format support detection
 */
export interface ImageFormatSupport {
  webp: boolean;
  avif: boolean;
  webpLossy: boolean;
  webpLossless: boolean;
  webpAlpha: boolean;
}

/**
 * Image optimization configuration
 */
export interface ImageOptimizationConfig {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  format: 'webp' | 'jpeg' | 'png' | 'auto';
}

/**
 * ImageOptimizationService
 *
 * Provides utilities for image optimization including:
 * - Format support detection (WebP, AVIF)
 * - Image URL transformation for CDN/optimization services
 * - Responsive image srcset generation
 * - Placeholder generation
 *
 * @example
 * ```typescript
 * export class MyComponent {
 *   private imageService = inject(ImageOptimizationService);
 *
 *   ngOnInit() {
 *     if (this.imageService.supportsWebP()) {
 *       // Use WebP version
 *     }
 *
 *     const srcset = this.imageService.generateSrcset(imageUrl, [320, 640, 1280]);
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ImageOptimizationService {
  private readonly platformId = inject(PLATFORM_ID);

  private formatSupport = signal<ImageFormatSupport>({
    webp: false,
    avif: false,
    webpLossy: false,
    webpLossless: false,
    webpAlpha: false
  });

  private detectionComplete = signal(false);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.detectFormatSupport();
    }
  }

  /**
   * Check if WebP format is supported
   */
  supportsWebP(): boolean {
    return this.formatSupport().webp;
  }

  /**
   * Check if AVIF format is supported
   */
  supportsAVIF(): boolean {
    return this.formatSupport().avif;
  }

  /**
   * Get the best supported image format
   */
  getBestFormat(): 'avif' | 'webp' | 'jpeg' {
    if (this.supportsAVIF()) return 'avif';
    if (this.supportsWebP()) return 'webp';
    return 'jpeg';
  }

  /**
   * Check if format detection is complete
   */
  isDetectionComplete(): boolean {
    return this.detectionComplete();
  }

  /**
   * Get all format support information
   */
  getFormatSupport(): ImageFormatSupport {
    return this.formatSupport();
  }

  /**
   * Generate srcset string for responsive images
   */
  generateSrcset(baseUrl: string, widths: number[]): string {
    if (!baseUrl) return '';

    return widths
      .map(width => `${this.getResizedUrl(baseUrl, width)} ${width}w`)
      .join(', ');
  }

  /**
   * Generate sizes attribute for responsive images
   */
  generateSizes(breakpoints: { maxWidth: number; size: string }[], defaultSize: string = '100vw'): string {
    const parts = breakpoints.map(bp => `(max-width: ${bp.maxWidth}px) ${bp.size}`);
    parts.push(defaultSize);
    return parts.join(', ');
  }

  /**
   * Get URL for resized image
   * This is a template - adjust based on your image CDN/service
   */
  getResizedUrl(url: string, width: number, format?: 'webp' | 'jpeg' | 'png' | 'avif'): string {
    if (!url) return '';

    // If using a CDN like Cloudinary, Imgix, or similar, transform URL here
    // Example for a hypothetical image service:
    // return `${url}?w=${width}&fmt=${format || this.getBestFormat()}`;

    // For now, return original URL
    // In production, implement your CDN's URL transformation
    return url;
  }

  /**
   * Convert image URL to WebP version
   */
  toWebP(url: string): string {
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

  /**
   * Generate a placeholder data URL (tiny blurred image)
   */
  generatePlaceholder(color: string = '#e0e0e0'): string {
    // Return a simple 1x1 pixel placeholder
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect fill='${encodeURIComponent(color)}' width='1' height='1'/%3E%3C/svg%3E`;
  }

  /**
   * Generate a blur hash placeholder (if blur hash is provided)
   */
  generateBlurPlaceholder(width: number, height: number, color: string = '#e0e0e0'): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3Crect fill='${encodeURIComponent(color)}' width='${width}' height='${height}'/%3E%3C/svg%3E`;
  }

  /**
   * Calculate aspect ratio from dimensions
   */
  calculateAspectRatio(width: number, height: number): string {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}/${height / divisor}`;
  }

  /**
   * Detect image format support
   */
  private detectFormatSupport(): void {
    // WebP detection
    this.checkWebPSupport().then(support => {
      this.formatSupport.update(current => ({
        ...current,
        webp: support.lossy || support.lossless || support.alpha,
        webpLossy: support.lossy,
        webpLossless: support.lossless,
        webpAlpha: support.alpha
      }));
    });

    // AVIF detection
    this.checkAVIFSupport().then(supported => {
      this.formatSupport.update(current => ({
        ...current,
        avif: supported
      }));
      this.detectionComplete.set(true);
    });
  }

  /**
   * Check WebP support (lossy, lossless, alpha)
   */
  private checkWebPSupport(): Promise<{ lossy: boolean; lossless: boolean; alpha: boolean }> {
    return new Promise(resolve => {
      const results = { lossy: false, lossless: false, alpha: false };

      // Test images (1x1 pixel WebP images in different formats)
      const tests = {
        lossy: 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
        lossless: 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
        alpha: 'UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA=='
      };

      let completed = 0;
      const total = Object.keys(tests).length;

      const checkComplete = () => {
        completed++;
        if (completed === total) {
          resolve(results);
        }
      };

      Object.entries(tests).forEach(([type, data]) => {
        const img = new Image();
        img.onload = () => {
          results[type as keyof typeof results] = img.width > 0 && img.height > 0;
          checkComplete();
        };
        img.onerror = () => {
          results[type as keyof typeof results] = false;
          checkComplete();
        };
        img.src = 'data:image/webp;base64,' + data;
      });
    });
  }

  /**
   * Check AVIF support
   */
  private checkAVIFSupport(): Promise<boolean> {
    return new Promise(resolve => {
      const img = new Image();

      img.onload = () => {
        resolve(img.width > 0 && img.height > 0);
      };

      img.onerror = () => {
        resolve(false);
      };

      // 1x1 AVIF image
      img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKBzgABpAQ0AIAyp8A';
    });
  }
}
