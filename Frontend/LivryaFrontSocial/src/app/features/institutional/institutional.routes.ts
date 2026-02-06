import { Routes } from '@angular/router';

export const INSTITUTIONAL_ROUTES: Routes = [
  // Home Page - without institutional layout (has its own header/footer)
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/home.component')
      .then(m => m.HomeComponent),
    title: 'Livrya - Histórias que ganham voz, forma e caminho'
  },
  // Home Page - alias route for navigation menu
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component')
      .then(m => m.HomeComponent),
    title: 'Livrya - Histórias que ganham voz, forma e caminho'
  },
  
  // Pages with institutional layout
  {
    path: '',
    loadComponent: () => import('./layouts/institutional-layout/institutional-layout.component')
      .then(m => m.InstitutionalLayoutComponent),
    children: [
      // Site Pages
      {
        path: 'about',
        loadComponent: () => import('./pages/about/about.component')
          .then(m => m.AboutComponent),
        title: 'Sobre Nós | Livrya'
      },
      {
        path: 'terms',
        loadComponent: () => import('./pages/terms/terms.component')
          .then(m => m.TermsComponent),
        title: 'Termos de Uso | Livrya'
      },
      {
        path: 'privacy',
        loadComponent: () => import('./pages/privacy/privacy.component')
          .then(m => m.PrivacyComponent),
        title: 'Política de Privacidade | Livrya'
      },
      {
        path: 'security',
        loadComponent: () => import('./pages/security/security.component')
          .then(m => m.SecurityComponent),
        title: 'Segurança | Livrya'
      },
      {
        path: 'code-conduct',
        loadComponent: () => import('./pages/code-conduct/code-conduct.component')
          .then(m => m.CodeConductComponent),
        title: 'Código de Conduta | Livrya'
      },
      {
        path: 'careers',
        loadComponent: () => import('./pages/careers/careers.component')
          .then(m => m.CareersComponent),
        title: 'Trabalhe Conosco | Livrya'
      },
      {
        path: 'contact',
        loadComponent: () => import('./pages/contact/contact.component')
          .then(m => m.ContactComponent),
        title: 'Contato | Livrya'
      },
      
      // Writer Pages
      {
        path: 'writer-area',
        loadComponent: () => import('./pages/writer-area/writer-area.component')
          .then(m => m.WriterAreaComponent),
        title: 'Área do Escritor | Livrya'
      },
      {
        path: 'copyright',
        loadComponent: () => import('./pages/copyright/copyright.component')
          .then(m => m.CopyrightComponent),
        title: 'Direitos Autorais | Livrya'
      },
      {
        path: 'publication',
        loadComponent: () => import('./pages/publication/publication.component')
          .then(m => m.PublicationComponent),
        title: 'Publicação e Monetização | Livrya'
      },
      {
        path: 'partners',
        loadComponent: () => import('./pages/partners/partners.component')
          .then(m => m.PartnersComponent),
        title: 'Parcerias e Editoras | Livrya'
      },
      {
        path: 'content-guidelines',
        loadComponent: () => import('./pages/content-guidelines/content-guidelines.component')
          .then(m => m.ContentGuidelinesComponent),
        title: 'Diretrizes de Conteúdo | Livrya'
      },
      
      // Community Pages
      {
        path: 'community',
        loadComponent: () => import('./pages/community/community.component')
          .then(m => m.CommunityComponent),
        title: 'Comunidade Livrya | Livrya'
      },
      {
        path: 'moderation',
        loadComponent: () => import('./pages/moderation/moderation.component')
          .then(m => m.ModerationComponent),
        title: 'Denúncias e Moderação | Livrya'
      },
      {
        path: 'transparency',
        loadComponent: () => import('./pages/transparency/transparency.component')
          .then(m => m.TransparencyComponent),
        title: 'Transparência e Valores | Livrya'
      },

      // Investment Page
      {
        path: 'investors',
        loadComponent: () => import('./pages/investors/investors.component')
          .then(m => m.InvestorsComponent),
        title: 'Investidores | Livrya'
      }
    ]
  }
];

