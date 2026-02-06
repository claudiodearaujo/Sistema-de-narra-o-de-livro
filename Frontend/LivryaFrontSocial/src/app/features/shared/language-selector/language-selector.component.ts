import { Component, inject } from '@angular/core';

import { Select } from 'primeng/select';
import { SharedModule } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { LanguageService, Language } from '../../../core/i18n/language.service';

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [Select, FormsModule, TooltipModule, SharedModule],
  templateUrl: 'language-selector.component.html',
  styleUrls: ['./language-selector.component.css']
})
export class LanguageSelectorComponent {
  languageService = inject(LanguageService);

  selectedLanguage: Language = this.languageService.currentLanguage();

  onLanguageChange(event: { value: Language }): void {
    this.languageService.setLanguage(event.value);
  }
}
