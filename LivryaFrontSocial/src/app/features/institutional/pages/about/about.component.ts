import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit {
  private seoService = inject(SeoService);
  private structuredDataService = inject(StructuredDataService);

  ngOnInit(): void {
    this.seoService.setInstitutionalPage(
      'Sobre Nós',
      'Conheça a LIVRIA, a rede social para escritores e leitores. Nossa missão é dar voz a histórias incríveis através de tecnologia e comunidade.'
    );

    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Sobre Nós', url: 'https://livrya.com.br/institutional/about' }
    ]);
  }
  features = [
    {
      icon: 'pi-book',
      title: 'Espaço Criativo',
      description: 'Um ambiente seguro e sem julgamentos para escrever, ouvir e compartilhar histórias.'
    },
    {
      icon: 'pi-heart',
      title: 'Comunidade Acolhedora',
      description: 'Leitores e criadores encontram apoio, feedbacks e conexões reais.'
    },
    {
      icon: 'pi-pencil',
      title: 'Publicar Suas Obras',
      description: 'Encontre seu público, brilhe na comunidade, firme parcerias e seja descoberto.'
    }
  ];

  beliefs = [
    { icon: 'pi-comments', text: 'Toda voz merece ser ouvida.' },
    { icon: 'pi-lightbulb', text: 'Toda imaginação merece forma.' },
    { icon: 'pi-map', text: 'Toda jornada merece ser contada.' },
    { icon: 'pi-star', text: 'Toda história merece seu espaço.' }
  ];
}
