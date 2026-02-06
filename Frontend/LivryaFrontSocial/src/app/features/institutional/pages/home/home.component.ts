import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private seoService = inject(SeoService);
  private structuredDataService = inject(StructuredDataService);

  ngOnInit(): void {
    // Configurar SEO para a home page
    this.seoService.updateSeoTags({
      title: 'Livrya - Histórias que ganham voz, forma e caminho',
      description: 'LIVRIA é a rede social para escritores e leitores. Crie, compartilhe e descubra histórias incríveis com narração por IA. Junte-se à nossa comunidade literária.',
      keywords: 'escritores, livros, rede social, literatura, escrever, publicar livros, narração, audiobook, IA, comunidade literária'
    });

    // Configurar Structured Data para a home page
    this.structuredDataService.setHomePageSchemas();
  }

  ngOnDestroy(): void {
    // Limpar schemas ao sair da página
    this.structuredDataService.setDefaultSchemas();
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
    { icon: 'pi-star', text: 'Toda história merece ser lida.' }
  ];

  navLinks = [
    { label: 'Sobre Nós', path: '/institutional/about' },
    { label: 'Funcionalidades', path: '/institutional/writer-area' },
    { label: 'Leitores', path: '/institutional/community' },
    { label: 'Blog', path: '/institutional/community' }
  ];
}
