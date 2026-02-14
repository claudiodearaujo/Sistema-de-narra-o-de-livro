/**
 * Tests for useCharacterWizard hook
 * Tests wizard navigation, validation, and state management
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCharacterWizard } from './useCharacterWizard';

describe('useCharacterWizard', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useCharacterWizard());
    act(() => {
      result.current.resetWizard();
    });
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useCharacterWizard());

      expect(result.current.currentStep).toBe(1);
      expect(result.current.isFirstStep).toBe(true);
      expect(result.current.isLastStep).toBe(false);
      expect(result.current.totalSteps).toBe(7);
    });
  });

  describe('Navigation', () => {
    it('should navigate to next step if validation passes', () => {
      const { result } = renderHook(() => useCharacterWizard());

      // Fill required fields
      act(() => {
        result.current.updateBasicFields({
          name: 'John Doe',
          bookId: 'book-123',
          voiceId: 'voice-1',
        });
      });

      // Go to next step
      const success = result.current.goToNextStep();

      expect(success).toBe(true);
      expect(result.current.currentStep).toBe(2);
    });

    it('should not navigate to next step if validation fails', () => {
      const { result } = renderHook(() => useCharacterWizard());

      // Try to go to next step without filling required fields
      const success = result.current.goToNextStep();

      expect(success).toBe(false);
      expect(result.current.currentStep).toBe(1);
    });

    it('should navigate to previous step', () => {
      const { result } = renderHook(() => useCharacterWizard());

      // Move to step 3
      act(() => {
        result.current.updateBasicFields({
          name: 'John',
          bookId: 'book-123',
          voiceId: 'voice-1',
        });
        result.current.goToNextStep();
        result.current.goToNextStep();
      });

      expect(result.current.currentStep).toBe(3);

      // Go back
      const success = result.current.goToPreviousStep();

      expect(success).toBe(true);
      expect(result.current.currentStep).toBe(2);
    });

    it('should not go to previous step on first step', () => {
      const { result } = renderHook(() => useCharacterWizard());

      const success = result.current.goToPreviousStep();

      expect(success).toBe(false);
      expect(result.current.currentStep).toBe(1);
    });

    it('should jump to specific step if valid', () => {
      const { result } = renderHook(() => useCharacterWizard());

      // Fill Step 1
      act(() => {
        result.current.updateBasicFields({
          name: 'John',
          bookId: 'book-123',
          voiceId: 'voice-1',
        });
      });

      // Jump to Step 3
      const success = result.current.goToStep(3);

      expect(success).toBe(true);
      expect(result.current.currentStep).toBe(3);
    });

    it('should not jump to step if Step 1 is not valid', () => {
      const { result } = renderHook(() => useCharacterWizard());

      // Try to jump to step 3 without filling Step 1
      const success = result.current.goToStep(3);

      expect(success).toBe(false);
      expect(result.current.currentStep).toBe(1);
    });

    it('should allow going back to step 1 without validation', () => {
      const { result } = renderHook(() => useCharacterWizard());

      act(() => {
        result.current.goToStep(5);
      });

      const success = result.current.goToStep(1);

      expect(success).toBe(true);
      expect(result.current.currentStep).toBe(1);
    });
  });

  describe('Validation', () => {
    it('should validate basic step correctly', () => {
      const { result } = renderHook(() => useCharacterWizard());

      // Empty should be invalid
      expect(result.current.isBasicStepValid()).toBe(false);

      // Partial should be invalid
      act(() => {
        result.current.updateBasicFields({
          name: 'John',
          bookId: 'book-123',
        });
      });

      expect(result.current.isBasicStepValid()).toBe(false);

      // All required should be valid
      act(() => {
        result.current.updateBasicFields({
          voiceId: 'voice-1',
        });
      });

      expect(result.current.isBasicStepValid()).toBe(true);
    });

    it('should validate name length requirement', () => {
      const { result } = renderHook(() => useCharacterWizard());

      // Too short
      act(() => {
        result.current.updateBasicFields({
          name: 'A',
          bookId: 'book-123',
          voiceId: 'voice-1',
        });
      });

      expect(result.current.isBasicStepValid()).toBe(false);

      // Valid length
      act(() => {
        result.current.updateBasicFields({
          name: 'John Doe',
        });
      });

      expect(result.current.isBasicStepValid()).toBe(true);
    });

    it('should consider other steps valid (no required fields)', () => {
      const { result } = renderHook(() => useCharacterWizard());

      // Step 2-7 don't have required fields
      act(() => {
        result.current.goToStep(2); // Jump to step 2 with invalid step 1
      });

      // Should stay on step 1 because step 1 is invalid
      expect(result.current.currentStep).toBe(1);

      // Fill step 1
      act(() => {
        result.current.updateBasicFields({
          name: 'John',
          bookId: 'book-123',
          voiceId: 'voice-1',
        });
        result.current.goToNextStep();
      });

      // Step 2 should be valid (even if empty)
      expect(result.current.isCurrentStepValid()).toBe(true);
    });
  });

  describe('Progress', () => {
    it('should calculate progress percentage', () => {
      const { result } = renderHook(() => useCharacterWizard());

      expect(result.current.getProgressPercentage()).toBe(0);

      act(() => {
        result.current.updateBasicFields({
          name: 'John',
          bookId: 'book-123',
          voiceId: 'voice-1',
        });
      });

      expect(result.current.getProgressPercentage()).toBeGreaterThan(0);
    });

    it('should return correct progress color', () => {
      const { result } = renderHook(() => useCharacterWizard());

      // Red color for < 30%
      let color = result.current.getProgressColor();
      expect(color).toBe('bg-red-500');

      // Add more fields to reach 30%+
      act(() => {
        result.current.updateBasicFields({
          name: 'John',
          bookId: 'book-123',
          voiceId: 'voice-1',
        });
      });

      color = result.current.getProgressColor();
      expect(color).toMatch(/bg-(red|yellow)-500/);
    });
  });

  describe('Form Data Updates', () => {
    it('should update basic fields', () => {
      const { result } = renderHook(() => useCharacterWizard());

      act(() => {
        result.current.updateBasicFields({
          name: 'John Doe',
          voiceDescription: 'Deep voice',
        });
      });

      expect(result.current.formData.name).toBe('John Doe');
      expect(result.current.formData.voiceDescription).toBe('Deep voice');
    });

    it('should update section data', () => {
      const { result } = renderHook(() => useCharacterWizard());

      act(() => {
        result.current.updateBasicFields({
          bookId: 'book-123',
        });
        result.current.updateSection('identity', {
          gender: 'Masculino',
          age: 30,
        });
      });

      expect(result.current.formData.identity?.gender).toBe('Masculino');
      expect(result.current.formData.identity?.age).toBe(30);
    });
  });

  describe('Error Handling', () => {
    it('should set and clear errors', () => {
      const { result } = renderHook(() => useCharacterWizard());

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Reset', () => {
    it('should reset wizard state', () => {
      const { result } = renderHook(() => useCharacterWizard());

      // Modify state
      act(() => {
        result.current.updateBasicFields({
          name: 'John',
          bookId: 'book-123',
          voiceId: 'voice-1',
        });
        result.current.goToNextStep();
        result.current.setError('Error');
      });

      // Reset
      act(() => {
        result.current.resetWizard();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.formData.name).toBe('');
      expect(result.current.error).toBeNull();
    });
  });

  describe('Step Configuration', () => {
    it('should have correct step config', () => {
      const { result } = renderHook(() => useCharacterWizard());

      expect(result.current.stepConfig).toHaveLength(7);
      expect(result.current.stepConfig[0].label).toBe('Dados Básicos');
      expect(result.current.stepConfig[0].required).toBe(true);

      // Other steps should not be required
      for (let i = 1; i < 7; i++) {
        expect(result.current.stepConfig[i].required).toBe(false);
      }
    });
  });
});
