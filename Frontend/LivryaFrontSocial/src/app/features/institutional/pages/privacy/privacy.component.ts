import { Component, OnInit, inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.css'
})
export class PrivacyComponent implements OnInit {
  private seoService = inject(SeoService);
  private structuredDataService = inject(StructuredDataService);

  ngOnInit(): void {
    this.seoService.setInstitutionalPage(
      'Política de Privacidade',
      'Saiba como a LIVRIA coleta, usa e protege seus dados pessoais. Transparência e segurança são prioridades para nós.'
    );

    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Política de Privacidade', url: 'https://livrya.com.br/institutional/privacy' }
    ]);
  }

  lastUpdated = '02 de Janeiro de 2026';
}
