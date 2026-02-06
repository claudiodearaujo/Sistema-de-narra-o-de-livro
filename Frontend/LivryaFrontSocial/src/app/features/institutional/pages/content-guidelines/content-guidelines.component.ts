import { Component, OnInit, inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-content-guidelines',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './content-guidelines.component.html',
  styleUrl: './content-guidelines.component.css'
})
export class ContentGuidelinesComponent implements OnInit {
  private seoService = inject(SeoService);
  private structuredDataService = inject(StructuredDataService);

  ngOnInit(): void {
    this.seoService.setInstitutionalPage(
      'Diretrizes de Conteúdo',
      'Entenda o que pode e não pode ser publicado na LIVRIA. Diretrizes claras para manter uma comunidade saudável e criativa.'
    );

    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Diretrizes de Conteúdo', url: 'https://livrya.com.br/institutional/content-guidelines' }
    ]);
  }

  lastUpdated = '02 de Janeiro de 2026';
  
  allowed = [
    'Ficção de todos os gêneros',
    'Poesia e prosa',
    'Biografias e memórias',
    'Textos informativos e educacionais',
    'Roteiros e dramaturgia',
    'Textos opinativos (respeitosos)',
    'Fanfics (respeitando direitos)'
  ];
  
  notAllowed = [
    'Pornografia envolvendo menores',
    'Incitação ao ódio ou violência',
    'Conteúdo difamatório ou calunioso',
    'Plágio ou violação de direitos autorais',
    'Promoção de atividades ilegais',
    'Spam ou conteúdo enganoso',
    'Informações pessoais de terceiros'
  ];
}
