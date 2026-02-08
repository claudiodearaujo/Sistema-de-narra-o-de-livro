import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-code-conduct',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './code-conduct.component.html',
  styleUrl: './code-conduct.component.css'
})
export class CodeConductComponent implements OnInit {
  private seoService = inject(SeoService);
  private structuredDataService = inject(StructuredDataService);

  ngOnInit(): void {
    this.seoService.setInstitutionalPage(
      'Código de Conduta',
      'Conheça o código de conduta da LIVRIA. Regras para uma convivência respeitosa e segura na nossa comunidade literária.'
    );

    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Código de Conduta', url: 'https://livrya.com.br/institutional/code-conduct' }
    ]);
  }

  lastUpdated = '02 de Janeiro de 2026';
  
  prohibited = [
    { icon: 'pi-ban', text: 'Discurso de ódio' },
    { icon: 'pi-exclamation-triangle', text: 'Assédio ou perseguição' },
    { icon: 'pi-times-circle', text: 'Conteúdo ilegal' },
    { icon: 'pi-copy', text: 'Plágio ou falsidade autoral' }
  ];
}
