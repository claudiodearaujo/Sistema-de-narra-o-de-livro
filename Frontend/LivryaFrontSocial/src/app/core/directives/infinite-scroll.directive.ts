import {
  Directive,
  ElementRef,
  OnDestroy,
  OnInit,
  inject,
  NgZone,
  input,
  output
} from '@angular/core';

/**
 * InfiniteScrollDirective
 * 
 * A reusable directive for implementing infinite scroll functionality.
 * Uses IntersectionObserver for efficient scroll detection.
 * 
 * @example
 * <div 
 *   appInfiniteScroll 
 *   (scrolled)="loadMore()"
 *   [threshold]="0.1"
 *   [disabled]="loading() || !hasMore()">
 * </div>
 */
@Directive({
  selector: '[appInfiniteScroll]',
  standalone: true
})
export class InfiniteScrollDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly ngZone = inject(NgZone);
  private observer?: IntersectionObserver;

  /**
   * Intersection threshold (0 to 1)
   * 0.1 means the callback fires when 10% of the element is visible
   */
  readonly threshold = input<number>(0.1);

  /**
   * Root margin for the intersection observer
   * Positive values trigger earlier, negative values trigger later
   */
  readonly rootMargin = input<string>('100px');

  /**
   * Whether infinite scroll is disabled
   * Use this to prevent loading when already loading or no more data
   */
  readonly disabled = input<boolean>(false);

  /**
   * Event emitted when the element enters the viewport
   */
  readonly scrolled = output<void>();

  ngOnInit(): void {
    this.setupObserver();
  }

  ngOnDestroy(): void {
    this.disconnectObserver();
  }

  private setupObserver(): void {
    // Run outside Angular zone for better performance
    this.ngZone.runOutsideAngular(() => {
      const options: IntersectionObserverInit = {
        root: null, // Use viewport as root
        rootMargin: this.rootMargin(),
        threshold: this.threshold()
      };

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.disabled()) {
            // Run callback inside Angular zone
            this.ngZone.run(() => {
              // TODO: The 'emit' function requires a mandatory void argument
              this.scrolled.emit();
            });
          }
        });
      }, options);

      this.observer.observe(this.elementRef.nativeElement);
    });
  }

  private disconnectObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
  }

  /**
   * Reset the observer (useful when content changes)
   */
  reset(): void {
    this.disconnectObserver();
    this.setupObserver();
  }
}
