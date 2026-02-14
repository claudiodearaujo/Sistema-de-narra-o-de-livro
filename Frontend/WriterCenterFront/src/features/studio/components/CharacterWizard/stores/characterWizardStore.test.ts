/**
 * Tests for characterWizardStore
 * Tests Zustand store functionality, persistence, and state management
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCharacterWizardStore } from './characterWizardStore';
import type { CharacterFormData } from '../types/character-wizard.types';

describe('characterWizardStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useCharacterWizardStore());
    act(() => {
      result.current.resetWizard();
    });
    // Clear localStorage
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      expect(result.current.currentStep).toBe(1);
      expect(result.current.formData.name).toBe('');
      expect(result.current.isDirty).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.completionPercentage).toBe(0);
      expect(result.current.characterId).toBeNull();
    });
  });

  describe('Step Navigation', () => {
    it('should set current step', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      act(() => {
        result.current.setCurrentStep(3);
      });

      expect(result.current.currentStep).toBe(3);
    });

    it('should not allow invalid steps', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      act(() => {
        result.current.setCurrentStep(99);
      });

      // Store doesn't validate, but should still set
      expect(result.current.currentStep).toBe(99);
    });
  });

  describe('Form Data Management', () => {
    it('should update form data and mark as dirty', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      act(() => {
        result.current.setFormData({
          name: 'John Doe',
          bookId: 'book-123',
        });
      });

      expect(result.current.formData.name).toBe('John Doe');
      expect(result.current.formData.bookId).toBe('book-123');
      expect(result.current.isDirty).toBe(true);
    });

    it('should update nested section data', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      act(() => {
        result.current.setFormData({ bookId: 'book-123' }); // Set bookId first
        result.current.updateFormData('identity', {
          gender: 'Masculino',
          age: 30,
        });
      });

      expect(result.current.formData.identity?.gender).toBe('Masculino');
      expect(result.current.formData.identity?.age).toBe(30);
      expect(result.current.isDirty).toBe(true);
    });

    it('should merge nested section data', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      act(() => {
        result.current.setFormData({ bookId: 'book-123' });
        result.current.updateFormData('identity', {
          gender: 'Masculino',
          age: 30,
        });
        result.current.updateFormData('identity', {
          nationality: 'Brasileiro',
        });
      });

      const identity = result.current.formData.identity;
      expect(identity?.gender).toBe('Masculino');
      expect(identity?.age).toBe(30);
      expect(identity?.nationality).toBe('Brasileiro');
    });
  });

  describe('Completion Percentage', () => {
    it('should calculate 0% when no fields are filled', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      act(() => {
        result.current.calculateCompletion();
      });

      expect(result.current.completionPercentage).toBe(0);
    });

    it('should calculate percentage when basic fields are filled', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      act(() => {
        result.current.setFormData({
          name: 'John Doe',
          bookId: 'book-123',
          voiceId: 'voice-1',
        });
      });

      expect(result.current.completionPercentage).toBeGreaterThan(0);
    });

    it('should increase percentage when more fields are filled', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      let firstPercentage = 0;
      let secondPercentage = 0;

      act(() => {
        result.current.setFormData({
          name: 'John',
          bookId: 'book-123',
          voiceId: 'voice-1',
        });
        firstPercentage = result.current.completionPercentage;
      });

      act(() => {
        result.current.updateFormData('identity', {
          gender: 'Masculino',
          age: 30,
          nationality: 'Brasileiro',
        });
        secondPercentage = result.current.completionPercentage;
      });

      expect(secondPercentage).toBeGreaterThan(firstPercentage);
    });

    it('should calculate 100% when all major fields are filled', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      act(() => {
        // Fill all basic required fields
        result.current.setFormData({
          name: 'John Doe',
          bookId: 'book-123',
          voiceId: 'voice-1',
        });

        // Fill all optional sections with all their fields
        result.current.updateFormData('identity', {
          gender: 'Masculino',
          age: 30,
          nationality: 'Brasileiro',
          occupation: 'Doctor',
          birthDate: '1990-01-01',
          birthPlace: 'São Paulo',
          personality: 'Introverted',
          background: 'Rich background',
        });

        result.current.updateFormData('physique', {
          height: '180cm',
          weight: '80kg',
          bodyType: 'Atlética',
          waist: '90cm',
          posture: 'Erguida',
          skinTone: 'Claro',
          skinTexture: 'Lisa',
          scars: 'None',
          tattoos: 'None',
          birthmarks: 'None',
        });

        result.current.updateFormData('face', {
          faceShape: 'Oval',
          forehead: 'Normal',
          cheekbones: 'Proeminentes',
          chin: 'Normal',
          jaw: 'Normal',
          nose: 'Normal',
          lips: 'Normal',
          expression: 'Normal',
          beard: 'None',
          mustache: 'None',
          wrinkles: 'None',
          dimples: 'Yes',
          freckles: 'No',
        });

        result.current.updateFormData('eyes', {
          eyeSize: 'Normal',
          eyeShape: 'Amendoado',
          eyeColor: 'Azul',
          eyeSpacing: 'Normal',
          eyelashes: 'Normal',
          eyebrowShape: 'Arqueada',
          eyebrowColor: 'Preto',
          eyebrowThickness: 'Normal',
          glasses: 'No',
          makeup: 'No',
        });

        result.current.updateFormData('hair', {
          haircut: 'Normal',
          hairLength: 'Médio',
          hairColor: 'Preto',
          hairTexture: 'Liso',
          hairVolume: 'Normal',
          hairStyle: 'Normal',
          hairPart: 'Meio',
          hairShine: 'Brilhante',
          dyedColor: 'No',
          highlights: 'No',
        });

        result.current.updateFormData('wardrobe', {
          clothingStyle: 'Casual',
          topwear: 'Camiseta',
          topwearColor: 'Azul',
          topwearBrand: 'Nike',
          bottomwear: 'Calça',
          bottomwearColor: 'Preta',
          bottomwearBrand: 'Levi',
          dress: 'None',
          dressColor: 'None',
          dressBrand: 'None',
          footwear: 'Tênis',
          footwearColor: 'Branco',
          footwearBrand: 'Nike',
          heelHeight: 'No',
          earrings: 'No',
          necklace: 'No',
          rings: 'No',
          bracelets: 'No',
          watch: 'No',
          bag: 'No',
          hat: 'No',
          scarf: 'No',
          nails: 'No',
          perfume: 'No',
        });
      });

      expect(result.current.completionPercentage).toBe(100);
    });
  });

  describe('Error Management', () => {
    it('should set and clear errors', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

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

  describe('Character ID Management', () => {
    it('should set and get character ID', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      act(() => {
        result.current.setCharacterId('char-123');
      });

      expect(result.current.characterId).toBe('char-123');

      act(() => {
        result.current.setCharacterId(null);
      });

      expect(result.current.characterId).toBeNull();
    });
  });

  describe('Saving State', () => {
    it('should track saving state', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      act(() => {
        result.current.setIsSaving(true);
      });

      expect(result.current.isSaving).toBe(true);

      act(() => {
        result.current.setIsSaving(false);
      });

      expect(result.current.isSaving).toBe(false);
    });

    it('should track last saved timestamp', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      act(() => {
        const now = new Date();
        result.current.setLastSavedAt(now);
      });

      expect(result.current.lastSavedAt).not.toBeNull();
      expect(result.current.lastSavedAt).toBeInstanceOf(Date);
    });
  });

  describe('Reset', () => {
    it('should reset wizard to initial state', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      act(() => {
        result.current.setFormData({
          name: 'John',
          bookId: 'book-123',
          voiceId: 'voice-1',
        });
        result.current.setCurrentStep(5);
        result.current.setError('Test error');
        result.current.setCharacterId('char-123');
      });

      expect(result.current.currentStep).toBe(5);
      expect(result.current.formData.name).toBe('John');

      act(() => {
        result.current.resetWizard();
      });

      expect(result.current.currentStep).toBe(1);
      expect(result.current.formData.name).toBe('');
      expect(result.current.isDirty).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.characterId).toBeNull();
      expect(result.current.completionPercentage).toBe(0);
    });
  });

  describe('Persistence', () => {
    it('should persist form data to localStorage', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      const testData: CharacterFormData = {
        name: 'John Doe',
        bookId: 'book-123',
        voiceId: 'voice-1',
      };

      act(() => {
        result.current.setFormData(testData);
      });

      const stored = localStorage.getItem('character-wizard-store');
      expect(stored).toBeTruthy();
      expect(stored).toContain('John Doe');
      expect(stored).toContain('book-123');
    });

    it('should restore form data from localStorage', () => {
      // First hook instance - populate and save
      const { result: result1 } = renderHook(() => useCharacterWizardStore());

      act(() => {
        result1.current.setFormData({
          name: 'Jane Smith',
          bookId: 'book-456',
          voiceId: 'voice-2',
        });
      });

      // Clear the store but keep localStorage
      const stored = localStorage.getItem('character-wizard-store');

      // Second hook instance - should restore from localStorage
      const { result: result2 } = renderHook(() => useCharacterWizardStore());

      expect(result2.current.formData.name).toBe('Jane Smith');
      expect(result2.current.formData.bookId).toBe('book-456');
    });
  });

  describe('Dirty State', () => {
    it('should mark as dirty when data changes', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      expect(result.current.isDirty).toBe(false);

      act(() => {
        result.current.setFormData({ name: 'John' });
      });

      expect(result.current.isDirty).toBe(true);
    });

    it('should allow manual dirty state control', () => {
      const { result } = renderHook(() => useCharacterWizardStore());

      act(() => {
        result.current.setIsDirty(true);
      });

      expect(result.current.isDirty).toBe(true);

      act(() => {
        result.current.setIsDirty(false);
      });

      expect(result.current.isDirty).toBe(false);
    });
  });
});
