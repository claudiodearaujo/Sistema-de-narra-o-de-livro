import { Component } from '@angular/core';

import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-institutional-layout',
  standalone: true,
  imports: [RouterModule, RouterOutlet],
  templateUrl: './institutional-layout.component.html',
  styleUrl: './institutional-layout.component.css'
})
export class InstitutionalLayoutComponent {
  currentYear = new Date().getFullYear();
  
  mainNav = [
    { label: 'Início', path: '/institutional/home' },
    { label: 'Sobre Nós', path: '/institutional/about' },
    { label: 'Para Escritores', path: '/institutional/writer-area' },
    { label: 'Comunidade', path: '/institutional/community' },
    { label: 'Contato', path: '/institutional/contact' }
  ];
  
  footerLinks = {
    site: [
      { label: 'Sobre Nós', path: '/institutional/about' },
      { label: 'Termos de Uso', path: '/institutional/terms' },
      { label: 'Política de Privacidade', path: '/institutional/privacy' },
      { label: 'Segurança', path: '/institutional/security' },
      { label: 'Código de Conduta', path: '/institutional/code-conduct' },
      { label: 'Trabalhe Conosco', path: '/institutional/careers' },
      { label: 'Contato', path: '/institutional/contact' }
    ],
    writers: [
      { label: 'Área do Escritor', path: '/institutional/writer-area' },
      { label: 'Direitos Autorais', path: '/institutional/copyright' },
      { label: 'Publicação e Monetização', path: '/institutional/publication' },
      { label: 'Parcerias e Editoras', path: '/institutional/partners' },
      { label: 'Diretrizes de Conteúdo', path: '/institutional/content-guidelines' }
    ],
    community: [
      { label: 'Comunidade Livrya', path: '/institutional/community' },
      { label: 'Diretrizes da Comunidade', path: '/institutional/content-guidelines' },
      { label: 'Denúncias e Moderação', path: '/institutional/moderation' },
      { label: 'Transparência e Valores', path: '/institutional/transparency' }
    ]
  };
}
