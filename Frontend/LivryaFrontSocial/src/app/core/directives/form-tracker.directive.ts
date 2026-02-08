import { Directive, OnInit, OnDestroy, HostListener, ElementRef, inject, input } from '@angular/core';
import { AnalyticsService } from '../../core/services/analytics.service';

@Directive({
    selector: '[appFormTracker]',
    standalone: true
})
export class FormTrackerDirective implements OnInit, OnDestroy {
    private analytics = inject(AnalyticsService);
    private elementRef = inject<ElementRef<HTMLFormElement>>(ElementRef);

    readonly formName = input('unknown_form', { alias: "appFormTracker" });
    readonly formId = input<string>();

    private hasStarted = false;
    private lastFieldInteracted?: string;

    ngOnInit(): void {
        // Track form abandonment on page unload
        window.addEventListener('beforeunload', this.trackAbandonmentOnUnload);
    }

    ngOnDestroy(): void {
        window.removeEventListener('beforeunload', this.trackAbandonmentOnUnload);

        // Track abandonment if form wasn't submitted
        if (this.hasStarted) {
            this.analytics.trackFormAbandon(this.formName(), this.formId(), this.lastFieldInteracted);
        }
    }

    @HostListener('focusin', ['$event'])
    onFocusIn(event: FocusEvent): void {
        const target = event.target as HTMLElement;
        const fieldName = this.getFieldName(target);

        if (fieldName) {
            // Track form start on first interaction
            const formName = this.formName();
            if (!this.hasStarted) {
                this.hasStarted = true;
                this.analytics.trackFormStart(formName, this.formId());
            }

            this.lastFieldInteracted = fieldName;
            this.analytics.trackFormFieldFocus(formName, fieldName);
        }
    }

    @HostListener('submit')
    onSubmit(): void {
        this.hasStarted = false; // Prevent abandonment tracking
        this.analytics.trackFormSubmit(this.formName(), this.formId(), true);
    }

    private trackAbandonmentOnUnload = (): void => {
        if (this.hasStarted) {
            this.analytics.trackFormAbandon(this.formName(), this.formId(), this.lastFieldInteracted);
        }
    };

    private getFieldName(element: HTMLElement): string | null {
        if (element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLSelectElement) {
            return element.name || element.id || element.getAttribute('formControlName') || null;
        }
        return null;
    }

    /**
     * Call this method to mark form as successfully submitted
     * (useful when using reactive forms with custom submit handling)
     */
    markAsSubmitted(success: boolean = true): void {
        this.hasStarted = false;
        this.analytics.trackFormSubmit(this.formName(), this.formId(), success);
    }

    /**
     * Reset tracking state (e.g., after form reset)
     */
    resetTracking(): void {
        this.hasStarted = false;
        this.lastFieldInteracted = undefined;
    }
}
