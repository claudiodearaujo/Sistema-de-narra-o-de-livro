import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-writer-area',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './writer-area.component.html',
  styleUrl: './writer-area.component.css'
})
export class WriterAreaComponent implements OnInit {
  private seoService = inject(SeoService);
  private structuredDataService = inject(StructuredDataService);

  ngOnInit(): void {
    this.seoService.setInstitutionalPage(
      'Área do Escritor',
      'Publique suas histórias, receba feedback da comunidade, use ferramentas de narração por IA e encontre parcerias editoriais na LIVRIA.'
    );

    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Área do Escritor', url: 'https://livrya.com.br/institutional/writer-area' }
    ]);
  }
  features = [
    {
      icon: 'pi-pencil',
      title: 'Publicar textos e histórias',
      description: 'Compartilhe suas criações com uma comunidade engajada de leitores.'
    },
    {
      icon: 'pi-comments',
      title: 'Receber feedback da comunidade',
      description: 'Obtenha opiniões construtivas e melhore sua escrita.'
    },
    {
      icon: 'pi-users',
      title: 'Participar de grupos de divulgação',
      description: 'Conecte-se com outros autores e amplie seu alcance.'
    },
    {
      icon: 'pi-microphone',
      title: 'Ferramentas de áudio e imagem',
      description: 'Transforme suas histórias em experiências imersivas.'
    },
    {
      icon: 'pi-book',
      title: 'Apoio para publicação editorial',
      description: 'Receba orientação para publicar seu livro.'
    }
  ];
}
