import { isDevMode, APP_INITIALIZER } from '@angular/core';
import { provideTransloco, TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { TranslocoHttpLoader } from './transloco-loader';
import { firstValueFrom } from 'rxjs';

export function preloadTranslations(translocoService: TranslocoService) {
  return () => {
    const defaultLang = 'pt-BR';
    translocoService.setActiveLang(defaultLang);
    return firstValueFrom(translocoService.load(defaultLang));
  };
}

export const translocoProviders = [
  provideTransloco({
    config: {
      availableLangs: ['pt-BR', 'en', 'es'],
      defaultLang: 'pt-BR',
      fallbackLang: 'pt-BR',
      reRenderOnLangChange: true,
      prodMode: !isDevMode(),
      missingHandler: {
        useFallbackTranslation: true
      }
    },
    loader: TranslocoHttpLoader
  }),
  {
    provide: APP_INITIALIZER,
    useFactory: preloadTranslations,
    deps: [TranslocoService],
    multi: true
  }
];

export { TranslocoModule };
