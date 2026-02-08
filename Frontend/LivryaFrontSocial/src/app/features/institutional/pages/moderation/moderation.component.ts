import { Component, OnInit, inject } from '@angular/core';

import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-moderation',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './moderation.component.html',
  styleUrl: './moderation.component.css'
})
export class ModerationComponent implements OnInit {
  private seoService = inject(SeoService);
  private structuredDataService = inject(StructuredDataService);

  ngOnInit(): void {
    this.seoService.setInstitutionalPage(
      'Denúncias e Moderação',
      'Saiba como denunciar conteúdo inadequado na LIVRIA. Nossa equipe de moderação trabalha para manter a comunidade segura.'
    );

    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Denúncias e Moderação', url: 'https://livrya.com.br/institutional/moderation' }
    ]);
  }
  reportReasons = [
    'Violação de direitos autorais',
    'Conteúdo ofensivo ou de ódio',
    'Assédio ou perseguição',
    'Conteúdo ilegal',
    'Spam ou conteúdo enganoso',
    'Informações pessoais expostas',
    'Outro motivo'
  ];
}
