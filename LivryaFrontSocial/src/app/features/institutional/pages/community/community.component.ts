import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-community',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './community.component.html',
  styleUrl: './community.component.css'
})
export class CommunityComponent implements OnInit {
  private seoService = inject(SeoService);
  private structuredDataService = inject(StructuredDataService);

  ngOnInit(): void {
    this.seoService.setInstitutionalPage(
      'Comunidade LIVRIA',
      'Faça parte da comunidade LIVRIA. Conecte-se com escritores e leitores, participe de discussões e descubra novas histórias.'
    );

    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Comunidade', url: 'https://livrya.com.br/institutional/community' }
    ]);
  }
  values = [
    {
      icon: 'pi-comments',
      title: 'Trocas Honestas',
      description: 'Opiniões sinceras e respeitosas que ajudam no crescimento.'
    },
    {
      icon: 'pi-heart',
      title: 'Apoio Mútuo',
      description: 'Criadores se apoiam mutuamente em suas jornadas.'
    },
    {
      icon: 'pi-book',
      title: 'Leitura Consciente',
      description: 'Valorizamos histórias diversas e pontos de vista únicos.'
    },
    {
      icon: 'pi-users',
      title: 'Inclusão',
      description: 'Um espaço para todos, independente de experiência.'
    }
  ];
}
