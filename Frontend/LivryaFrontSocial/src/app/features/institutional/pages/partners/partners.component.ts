import { Component, OnInit, inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-partners',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './partners.component.html',
  styleUrl: './partners.component.css'
})
export class PartnersComponent implements OnInit {
  private seoService = inject(SeoService);
  private structuredDataService = inject(StructuredDataService);

  ngOnInit(): void {
    this.seoService.setInstitutionalPage(
      'Parcerias e Editoras',
      'Conheça as parcerias editoriais da LIVRIA. Orientação para publicação, revisão de originais e conexão com editoras.'
    );

    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Parcerias e Editoras', url: 'https://livrya.com.br/institutional/partners' }
    ]);
  }
  benefits = [
    'Orientação para publicação',
    'Revisão e preparação de originais',
    'Conexão com editoras parceiras',
    'Apoio em campanhas de divulgação',
    'Respeito à decisão final do autor'
  ];
}
