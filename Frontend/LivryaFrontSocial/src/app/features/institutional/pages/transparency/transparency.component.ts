import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-transparency',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './transparency.component.html',
  styleUrl: './transparency.component.css'
})
export class TransparencyComponent implements OnInit {
  private seoService = inject(SeoService);
  private structuredDataService = inject(StructuredDataService);

  ngOnInit(): void {
    this.seoService.setInstitutionalPage(
      'Transparência e Valores',
      'Conheça os valores que guiam a LIVRIA. Paixão pela literatura, comunidade, segurança, inclusão e respeito aos autores.'
    );

    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Transparência e Valores', url: 'https://livrya.com.br/institutional/transparency' }
    ]);
  }
  values = [
    {
      icon: 'pi-heart',
      title: 'Paixão pela Literatura',
      description: 'Acreditamos no poder transformador das histórias e das palavras.'
    },
    {
      icon: 'pi-users',
      title: 'Comunidade em Primeiro Lugar',
      description: 'Decisões são tomadas pensando no bem-estar de autores e leitores.'
    },
    {
      icon: 'pi-shield',
      title: 'Segurança e Confiança',
      description: 'Protegemos dados, obras e a integridade da comunidade.'
    },
    {
      icon: 'pi-globe',
      title: 'Inclusão e Diversidade',
      description: 'Valorizamos todas as vozes e perspectivas literárias.'
    },
    {
      icon: 'pi-verified',
      title: 'Respeito aos Autores',
      description: 'A propriedade intelectual é sempre do criador.'
    },
    {
      icon: 'pi-sync',
      title: 'Melhoria Contínua',
      description: 'Evoluímos constantemente com feedback da comunidade.'
    }
  ];
}
