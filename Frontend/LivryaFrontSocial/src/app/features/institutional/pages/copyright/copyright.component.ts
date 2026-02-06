import { Component, OnInit, inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-copyright',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './copyright.component.html',
  styleUrl: './copyright.component.css'
})
export class CopyrightComponent implements OnInit {
  private seoService = inject(SeoService);
  private structuredDataService = inject(StructuredDataService);

  ngOnInit(): void {
    this.seoService.setInstitutionalPage(
      'Direitos Autorais',
      'Saiba como a LIVRIA protege os direitos autorais dos escritores. Sua propriedade intelectual é sempre respeitada.'
    );

    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Direitos Autorais', url: 'https://livrya.com.br/institutional/copyright' }
    ]);
  }

  lastUpdated = '02 de Janeiro de 2026';
}
