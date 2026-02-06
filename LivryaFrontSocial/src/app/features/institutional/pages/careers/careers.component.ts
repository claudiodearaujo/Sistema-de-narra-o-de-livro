import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-careers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './careers.component.html',
  styleUrl: './careers.component.css'
})
export class CareersComponent implements OnInit {
  private seoService = inject(SeoService);
  private structuredDataService = inject(StructuredDataService);

  ngOnInit(): void {
    this.seoService.setInstitutionalPage(
      'Trabalhe Conosco',
      'Faça parte da equipe LIVRIA. Vagas em engenharia, produto, conteúdo e marketing. Venha transformar a literatura com tecnologia.'
    );

    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Trabalhe Conosco', url: 'https://livrya.com.br/institutional/careers' }
    ]);
  }
  values = [
    { icon: 'pi-book', title: 'Paixão por Literatura' },
    { icon: 'pi-code', title: 'Inovação Tecnológica' },
    { icon: 'pi-palette', title: 'Criatividade' },
    { icon: 'pi-heart', title: 'Empatia' }
  ];
  
  areas = [
    {
      title: 'Engenharia',
      description: 'Desenvolvedores, DevOps, QA',
      icon: 'pi-cog'
    },
    {
      title: 'Produto',
      description: 'Product Managers, UX/UI Designers',
      icon: 'pi-box'
    },
    {
      title: 'Conteúdo',
      description: 'Editores, Curadores, Community Managers',
      icon: 'pi-file-edit'
    },
    {
      title: 'Marketing',
      description: 'Growth, Social Media, Parcerias',
      icon: 'pi-megaphone'
    }
  ];
}
