import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-publication',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './publication.component.html',
  styleUrl: './publication.component.css'
})
export class PublicationComponent implements OnInit {
  private seoService = inject(SeoService);
  private structuredDataService = inject(StructuredDataService);

  ngOnInit(): void {
    this.seoService.setInstitutionalPage(
      'Publicação e Monetização',
      'Descubra como monetizar suas histórias na LIVRIA. Apoio de leitores, conteúdo premium, vendas diretas e parcerias editoriais.'
    );

    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Publicação e Monetização', url: 'https://livrya.com.br/institutional/publication' }
    ]);
  }
  monetizationMethods = [
    {
      icon: 'pi-heart',
      title: 'Apoio dos Leitores',
      description: 'Receba apoio financeiro diretamente dos seus fãs através de Livras.'
    },
    {
      icon: 'pi-lock',
      title: 'Conteúdo Premium',
      description: 'Ofereça capítulos exclusivos para assinantes.'
    },
    {
      icon: 'pi-book',
      title: 'Vendas Diretas',
      description: 'Venda suas obras completas na plataforma.'
    },
    {
      icon: 'pi-building',
      title: 'Parcerias Editoriais',
      description: 'Conecte-se com editoras parceiras para publicação.'
    }
  ];
}
