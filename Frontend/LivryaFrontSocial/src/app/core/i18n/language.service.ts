import { Injectable, inject, signal, computed } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

export type Language = 'pt-BR' | 'en' | 'es';

export interface LanguageOption {
  code: Language;
  name: string;
  flag: string;
  flagImage: string;
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private translocoService = inject(TranslocoService);

  private readonly STORAGE_KEY = 'livrya-language';

  readonly availableLanguages: LanguageOption[] = [
    { code: 'pt-BR', name: 'Português', flag: '🇧🇷', flagImage: '/assets/flags/br.png' },
    { code: 'en', name: 'English', flag: '🇺🇸', flagImage: '/assets/flags/us.png' },
    { code: 'es', name: 'Español', flag: '🇪🇸', flagImage: '/assets/flags/es.png' }
  ];

  currentLanguage = signal<Language>(this.getInitialLanguage());

  currentLanguageOption = computed(() =>
    this.availableLanguages.find(lang => lang.code === this.currentLanguage())
    ?? this.availableLanguages[0]
  );

  constructor() {
    this.initLanguage();
  }

  private getInitialLanguage(): Language {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Language | null;
    if (stored && this.isValidLanguage(stored)) {
      return stored;
    }

    const browserLang = navigator.language;
    if (browserLang.startsWith('pt')) return 'pt-BR';
    if (browserLang.startsWith('es')) return 'es';
    if (browserLang.startsWith('en')) return 'en';

    return 'pt-BR';
  }

  private isValidLanguage(lang: string): lang is Language {
    return ['pt-BR', 'en', 'es'].includes(lang);
  }

  private initLanguage(): void {
    this.translocoService.setActiveLang(this.currentLanguage());
  }

  setLanguage(lang: Language): void {
    this.currentLanguage.set(lang);
    localStorage.setItem(this.STORAGE_KEY, lang);
    this.translocoService.setActiveLang(lang);
  }

  getLanguageByCode(code: Language): LanguageOption | undefined {
    return this.availableLanguages.find(lang => lang.code === code);
  }
}
