import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Interface para configuracao de SEO
 */
export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'book' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

/**
 * Interface para dados de livro
 */
export interface BookSeoData {
  title: string;
  description: string;
  cover?: string;
  author: string;
}

/**
 * Interface para dados de autor
 */
export interface AuthorSeoData {
  name: string;
  bio: string;
  avatar?: string;
}

/**
 * Interface para dados de post
 */
export interface PostSeoData {
  title: string;
  excerpt: string;
  image?: string;
  author: string;
  publishedAt: string;
}

/**
 * Servico de SEO para gerenciamento dinamico de meta tags
 *
 * Este servico permite atualizar meta tags de forma dinamica por pagina,
 * incluindo Open Graph, Twitter Cards e tags canonicas.
 *
 * @example
 * ```typescript
 * // Em um componente de pagina
 * export class BookDetailComponent implements OnInit {
 *   private seoService = inject(SeoService);
 *
 *   ngOnInit() {
 *     this.seoService.setBookPage({
 *       title: this.book.title,
 *       description: this.book.synopsis,
 *       cover: this.book.coverUrl,
 *       author: this.book.authorName
 *     });
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private meta = inject(Meta);
  private title = inject(Title);
  private document = inject(DOCUMENT);
  private router = inject(Router);

  private readonly defaultConfig: SeoConfig = {
    title: 'LIVRIA - Rede Social para Escritores',
    description: 'LIVRIA - Rede social para escritores e leitores. Crie, compartilhe e descubra histórias incríveis com narração por IA.',
    image: 'https://livrya.com.br/assets/images/og-image.jpg',
    type: 'website',
    keywords: 'escritores, livros, rede social, literatura, escrever, publicar livros, narração, audiobook, IA'
  };

  private readonly baseUrl = 'https://livrya.com.br';

  constructor() {
    this.initRouteListener();
  }

  /**
   * Inicializa listener de rotas para atualizar canonical URL automaticamente
   */
  private initRouteListener(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateCanonicalUrl(this.baseUrl + event.urlAfterRedirects);
    });
  }

  /**
   * Atualiza todas as meta tags de SEO
   */
  updateSeoTags(config: Partial<SeoConfig>): void {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const fullUrl = config.url || this.baseUrl + this.router.url;

    // Titulo
    const fullTitle = config.title
      ? `${config.title} | LIVRIA`
      : this.defaultConfig.title;
    this.title.setTitle(fullTitle);

    // Meta tags basicas
    this.meta.updateTag({ name: 'description', content: mergedConfig.description });
    if (mergedConfig.keywords) {
      this.meta.updateTag({ name: 'keywords', content: mergedConfig.keywords });
    }

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: mergedConfig.description });
    this.meta.updateTag({ property: 'og:url', content: fullUrl });
    this.meta.updateTag({ property: 'og:type', content: mergedConfig.type || 'website' });

    if (mergedConfig.image) {
      this.meta.updateTag({ property: 'og:image', content: mergedConfig.image });
      this.meta.updateTag({ property: 'og:image:alt', content: fullTitle });
    }

    // Twitter Cards
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: mergedConfig.description });
    this.meta.updateTag({ name: 'twitter:url', content: fullUrl });

    if (mergedConfig.image) {
      this.meta.updateTag({ name: 'twitter:image', content: mergedConfig.image });
      this.meta.updateTag({ name: 'twitter:image:alt', content: fullTitle });
    }

    // Article-specific tags
    if (mergedConfig.type === 'article') {
      if (mergedConfig.author) {
        this.meta.updateTag({ property: 'article:author', content: mergedConfig.author });
      }
      if (mergedConfig.publishedTime) {
        this.meta.updateTag({ property: 'article:published_time', content: mergedConfig.publishedTime });
      }
      if (mergedConfig.modifiedTime) {
        this.meta.updateTag({ property: 'article:modified_time', content: mergedConfig.modifiedTime });
      }
      if (mergedConfig.section) {
        this.meta.updateTag({ property: 'article:section', content: mergedConfig.section });
      }
      if (mergedConfig.tags) {
        // Remove tags antigas
        this.meta.removeTag('property="article:tag"');
        mergedConfig.tags.forEach(tag => {
          this.meta.addTag({ property: 'article:tag', content: tag });
        });
      }
    }

    // Canonical URL
    this.updateCanonicalUrl(fullUrl);
  }

  /**
   * Atualiza a URL canonica
   */
  private updateCanonicalUrl(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }

  /**
   * Configura SEO para pagina de livro
   */
  setBookPage(book: BookSeoData): void {
    this.updateSeoTags({
      title: book.title,
      description: this.truncateText(book.description, 160),
      image: book.cover,
      type: 'book' as any,
      author: book.author
    });
  }

  /**
   * Configura SEO para pagina de autor/escritor
   */
  setAuthorPage(author: AuthorSeoData): void {
    this.updateSeoTags({
      title: `${author.name} - Escritor`,
      description: this.truncateText(author.bio, 160),
      image: author.avatar,
      type: 'profile'
    });
  }

  /**
   * Configura SEO para pagina de post
   */
  setPostPage(post: PostSeoData): void {
    this.updateSeoTags({
      title: post.title,
      description: this.truncateText(post.excerpt, 160),
      image: post.image,
      type: 'article',
      author: post.author,
      publishedTime: post.publishedAt
    });
  }

  /**
   * Configura SEO para pagina institucional
   */
  setInstitutionalPage(title: string, description: string): void {
    this.updateSeoTags({
      title,
      description: this.truncateText(description, 160),
      type: 'website'
    });
  }

  /**
   * Reseta para configuracoes padrao
   */
  resetToDefaults(): void {
    this.updateSeoTags(this.defaultConfig);
  }

  /**
   * Trunca texto para um tamanho maximo
   */
  private truncateText(text: string, maxLength: number): string {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Obtem a URL base
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Constroi URL completa a partir de path
   */
  buildUrl(path: string): string {
    return this.baseUrl + (path.startsWith('/') ? path : '/' + path);
  }
}
