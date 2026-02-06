import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Interface para dados de livro no schema
 */
export interface BookSchemaData {
  name: string;
  description: string;
  author: string;
  datePublished: string;
  image?: string;
  isbn?: string;
  genre?: string[];
  numberOfPages?: number;
  publisher?: string;
  inLanguage?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

/**
 * Interface para dados de pessoa no schema
 */
export interface PersonSchemaData {
  name: string;
  description: string;
  image?: string;
  url?: string;
  sameAs?: string[];
}

/**
 * Interface para dados de artigo no schema
 */
export interface ArticleSchemaData {
  headline: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  publisher?: string;
}

/**
 * Interface para item de breadcrumb
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Interface para FAQ
 */
export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Servico para gerenciamento de Structured Data (JSON-LD)
 *
 * Este servico permite adicionar e remover schemas JSON-LD para
 * melhorar a indexacao e exibicao nos resultados de busca.
 *
 * @example
 * ```typescript
 * export class HomeComponent implements OnInit {
 *   private structuredData = inject(StructuredDataService);
 *
 *   ngOnInit() {
 *     this.structuredData.setOrganizationSchema();
 *     this.structuredData.setWebsiteSchema();
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class StructuredDataService {
  private document = inject(DOCUMENT);

  private readonly baseUrl = 'https://livrya.com.br';

  /**
   * Schema da organizacao LIVRIA
   */
  private readonly organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'LIVRIA',
    'alternateName': 'Livrya',
    'url': this.baseUrl,
    'logo': `${this.baseUrl}/assets/images/logo.png`,
    'description': 'Rede social para escritores e leitores. Crie, compartilhe e descubra histórias incríveis com narração por IA.',
    'foundingDate': '2024',
    'sameAs': [
      'https://www.facebook.com/livrya',
      'https://www.instagram.com/livrya',
      'https://twitter.com/livrya',
      'https://www.linkedin.com/company/livrya'
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'customer service',
      'availableLanguage': ['Portuguese']
    }
  };

  /**
   * Schema do website
   */
  private readonly websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'LIVRIA',
    'url': this.baseUrl,
    'description': 'Rede social para escritores e leitores',
    'potentialAction': {
      '@type': 'SearchAction',
      'target': {
        '@type': 'EntryPoint',
        'urlTemplate': `${this.baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };

  /**
   * Schema de aplicacao de software
   */
  private readonly softwareAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'LIVRIA',
    'operatingSystem': 'Web',
    'applicationCategory': 'SocialNetworkingApplication',
    'description': 'Plataforma para escritores criarem, compartilharem e narrarem suas histórias com tecnologia de IA.',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'BRL'
    }
  };

  /**
   * Define o schema da organizacao
   */
  setOrganizationSchema(): void {
    this.setJsonLd('organization-schema', this.organizationSchema);
  }

  /**
   * Define o schema do website
   */
  setWebsiteSchema(): void {
    this.setJsonLd('website-schema', this.websiteSchema);
  }

  /**
   * Define o schema de aplicacao de software
   */
  setSoftwareAppSchema(): void {
    this.setJsonLd('software-schema', this.softwareAppSchema);
  }

  /**
   * Define o schema de um livro
   */
  setBookSchema(book: BookSchemaData): void {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Book',
      'name': book.name,
      'description': book.description,
      'author': {
        '@type': 'Person',
        'name': book.author
      },
      'datePublished': book.datePublished,
      'publisher': {
        '@type': 'Organization',
        'name': book.publisher || 'LIVRIA'
      },
      'inLanguage': book.inLanguage || 'pt-BR'
    };

    if (book.image) {
      schema.image = book.image;
    }

    if (book.isbn) {
      schema.isbn = book.isbn;
    }

    if (book.genre && book.genre.length > 0) {
      schema.genre = book.genre;
    }

    if (book.numberOfPages) {
      schema.numberOfPages = book.numberOfPages;
    }

    if (book.aggregateRating) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        'ratingValue': book.aggregateRating.ratingValue,
        'reviewCount': book.aggregateRating.reviewCount
      };
    }

    this.setJsonLd('book-schema', schema);
  }

  /**
   * Define o schema de uma pessoa (autor/escritor)
   */
  setPersonSchema(person: PersonSchemaData): void {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      'name': person.name,
      'description': person.description
    };

    if (person.image) {
      schema.image = person.image;
    }

    if (person.url) {
      schema.url = person.url;
    }

    if (person.sameAs && person.sameAs.length > 0) {
      schema.sameAs = person.sameAs;
    }

    this.setJsonLd('person-schema', schema);
  }

  /**
   * Define o schema de breadcrumb (navegacao)
   */
  setBreadcrumbSchema(items: BreadcrumbItem[]): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': items.map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': item.url
      }))
    };

    this.setJsonLd('breadcrumb-schema', schema);
  }

  /**
   * Define o schema de um artigo/post
   */
  setArticleSchema(article: ArticleSchemaData): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': article.headline,
      'description': article.description,
      'author': {
        '@type': 'Person',
        'name': article.author
      },
      'datePublished': article.datePublished,
      'dateModified': article.dateModified || article.datePublished,
      'image': article.image,
      'publisher': {
        '@type': 'Organization',
        'name': article.publisher || 'LIVRIA',
        'logo': {
          '@type': 'ImageObject',
          'url': `${this.baseUrl}/assets/images/logo.png`
        }
      },
      'mainEntityOfPage': {
        '@type': 'WebPage'
      }
    };

    this.setJsonLd('article-schema', schema);
  }

  /**
   * Define o schema de FAQ
   */
  setFAQSchema(faqs: FAQItem[]): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer
        }
      }))
    };

    this.setJsonLd('faq-schema', schema);
  }

  /**
   * Define um schema JSON-LD no documento
   */
  private setJsonLd(id: string, schema: object): void {
    this.removeJsonLd(id);

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.text = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }

  /**
   * Remove um schema JSON-LD pelo ID
   */
  removeJsonLd(id: string): void {
    const existing = this.document.getElementById(id);
    if (existing) {
      existing.remove();
    }
  }

  /**
   * Remove todos os schemas JSON-LD
   */
  removeAllJsonLd(): void {
    const scripts = this.document.querySelectorAll('script[type="application/ld+json"]');
    scripts.forEach(script => script.remove());
  }

  /**
   * Define schemas basicos para a home page
   */
  setHomePageSchemas(): void {
    this.setOrganizationSchema();
    this.setWebsiteSchema();
    this.setSoftwareAppSchema();
  }

  /**
   * Limpa schemas e define apenas o da organizacao
   */
  setDefaultSchemas(): void {
    this.removeAllJsonLd();
    this.setOrganizationSchema();
  }
}
