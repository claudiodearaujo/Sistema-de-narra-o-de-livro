import { Injectable, inject } from '@angular/core';
import { AnalyticsService } from './analytics.service';

export interface Experiment {
    id: string;
    name: string;
    variants: string[];
    weights?: number[]; // Optional: custom distribution weights
}

export interface ExperimentAssignment {
    experimentId: string;
    variant: string;
    assignedAt: number;
}

const EXPERIMENTS_STORAGE_KEY = 'ab_experiments';

/**
 * A/B Testing Service
 * Manages client-side experiments with GA4 integration
 */
@Injectable({
    providedIn: 'root'
})
export class ABTestingService {
    private analytics = inject(AnalyticsService);

    private assignments: Map<string, ExperimentAssignment> = new Map();

    constructor() {
        this.loadAssignments();
    }

    /**
     * Get or assign a variant for an experiment
     * @param experiment The experiment configuration
     * @returns The assigned variant
     */
    getVariant(experiment: Experiment): string {
        // Check if user already has an assignment
        const existing = this.assignments.get(experiment.id);
        if (existing) {
            return existing.variant;
        }

        // Assign new variant
        const variant = this.assignVariant(experiment);
        const assignment: ExperimentAssignment = {
            experimentId: experiment.id,
            variant,
            assignedAt: Date.now()
        };

        this.assignments.set(experiment.id, assignment);
        this.saveAssignments();

        // Track experiment assignment in GA4
        this.trackExperimentAssignment(experiment, variant);

        return variant;
    }

    /**
     * Track when a user is exposed to an experiment variant
     */
    trackExperimentExposure(experimentId: string, variant: string): void {
        this.analytics.trackEvent('experiment_exposure', {
            experiment_id: experimentId,
            variant: variant
        });
    }

    /**
     * Track experiment conversion
     */
    trackExperimentConversion(experimentId: string, conversionName: string, value?: number): void {
        const assignment = this.assignments.get(experimentId);
        if (!assignment) return;

        this.analytics.trackEvent('experiment_conversion', {
            experiment_id: experimentId,
            variant: assignment.variant,
            conversion_name: conversionName,
            value: value
        });
    }

    /**
     * Check if user is in a specific variant
     */
    isInVariant(experimentId: string, variant: string): boolean {
        const assignment = this.assignments.get(experimentId);
        return assignment?.variant === variant;
    }

    /**
     * Get current assignment for an experiment
     */
    getAssignment(experimentId: string): ExperimentAssignment | undefined {
        return this.assignments.get(experimentId);
    }

    /**
     * Clear all experiment assignments (useful for testing)
     */
    clearAssignments(): void {
        this.assignments.clear();
        localStorage.removeItem(EXPERIMENTS_STORAGE_KEY);
    }

    /**
     * Force a specific variant for testing
     */
    forceVariant(experimentId: string, variant: string): void {
        const assignment: ExperimentAssignment = {
            experimentId,
            variant,
            assignedAt: Date.now()
        };
        this.assignments.set(experimentId, assignment);
        this.saveAssignments();
    }

    // ============ Private Methods ============

    private assignVariant(experiment: Experiment): string {
        const { variants, weights } = experiment;

        if (weights && weights.length === variants.length) {
            // Weighted random selection
            return this.weightedRandom(variants, weights);
        }

        // Equal distribution
        const index = Math.floor(Math.random() * variants.length);
        return variants[index];
    }

    private weightedRandom(variants: string[], weights: number[]): string {
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < variants.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return variants[i];
            }
        }

        return variants[variants.length - 1];
    }

    private trackExperimentAssignment(experiment: Experiment, variant: string): void {
        this.analytics.trackEvent('experiment_assignment', {
            experiment_id: experiment.id,
            experiment_name: experiment.name,
            variant: variant
        });

        // Also set as user property for segmentation
        this.analytics.setUserProperties({
            [`exp_${experiment.id}`]: variant
        });
    }

    private loadAssignments(): void {
        try {
            const stored = localStorage.getItem(EXPERIMENTS_STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored) as ExperimentAssignment[];
                data.forEach(assignment => {
                    this.assignments.set(assignment.experimentId, assignment);
                });
            }
        } catch (error) {
            console.error('Error loading experiment assignments:', error);
        }
    }

    private saveAssignments(): void {
        try {
            const data = Array.from(this.assignments.values());
            localStorage.setItem(EXPERIMENTS_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving experiment assignments:', error);
        }
    }
}

// ============ Pre-defined Experiments ============

export const EXPERIMENTS = {
    // Example: Test different CTA button texts
    CTA_BUTTON_TEXT: {
        id: 'cta_button_text_v1',
        name: 'CTA Button Text Test',
        variants: ['control', 'variant_a', 'variant_b']
    } as Experiment,

    // Example: Test different onboarding flows
    ONBOARDING_FLOW: {
        id: 'onboarding_flow_v1',
        name: 'Onboarding Flow Test',
        variants: ['standard', 'simplified', 'guided'],
        weights: [0.5, 0.25, 0.25] // 50% standard, 25% each for others
    } as Experiment,

    // Example: Test pricing page layouts
    PRICING_LAYOUT: {
        id: 'pricing_layout_v1',
        name: 'Pricing Layout Test',
        variants: ['horizontal', 'vertical']
    } as Experiment
};
