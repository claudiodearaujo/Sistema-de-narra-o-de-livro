import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Interface para metricas de Web Vitals
 */
export interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
}

/**
 * Servico para monitoramento de Core Web Vitals
 *
 * Monitora as seguintes metricas:
 * - LCP (Largest Contentful Paint): Tempo ate o maior elemento visivel ser renderizado
 * - FID (First Input Delay): Tempo de resposta a primeira interacao do usuario
 * - CLS (Cumulative Layout Shift): Mudancas inesperadas de layout
 * - TTFB (Time to First Byte): Tempo ate o primeiro byte da resposta
 * - FCP (First Contentful Paint): Tempo ate o primeiro conteudo ser pintado
 *
 * @example
 * ```typescript
 * export class AppComponent implements OnInit {
 *   private webVitals = inject(WebVitalsService);
 *
 *   ngOnInit() {
 *     this.webVitals.init();
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class WebVitalsService {
  private platformId = inject(PLATFORM_ID);

  // Thresholds baseados nas recomendacoes do Google
  private readonly thresholds = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 800, poor: 1800 },
    FCP: { good: 1800, poor: 3000 }
  };

  private metricsCollected: WebVitalMetric[] = [];

  /**
   * Inicializa o monitoramento de Web Vitals
   */
  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.measureLCP();
    this.measureFID();
    this.measureCLS();
    this.measureTTFB();
    this.measureFCP();

    // Log das metricas quando a pagina for descarregada
    this.setupUnloadListener();
  }

  /**
   * Mede o Largest Contentful Paint (LCP)
   */
  private measureLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];

        const metric = this.createMetric('LCP', lastEntry.startTime);
        this.metricsCollected.push(metric);
        this.logMetric(metric);
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      console.warn('LCP measurement not supported');
    }
  }

  /**
   * Mede o First Input Delay (FID)
   */
  private measureFID(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          const metric = this.createMetric('FID', entry.processingStart - entry.startTime);
          this.metricsCollected.push(metric);
          this.logMetric(metric);
        });
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('FID measurement not supported');
    }
  }

  /**
   * Mede o Cumulative Layout Shift (CLS)
   */
  private measureCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;

    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
      });

      observer.observe({ type: 'layout-shift', buffered: true });

      // Reportar CLS quando a visibilidade mudar
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          const metric = this.createMetric('CLS', clsValue);
          this.metricsCollected.push(metric);
          this.logMetric(metric);
        }
      }, { once: true });
    } catch (e) {
      console.warn('CLS measurement not supported');
    }
  }

  /**
   * Mede o Time to First Byte (TTFB)
   */
  private measureTTFB(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const [entry] = list.getEntries() as PerformanceNavigationTiming[];
        if (entry) {
          const metric = this.createMetric('TTFB', entry.responseStart);
          this.metricsCollected.push(metric);
          this.logMetric(metric);
        }
      });

      observer.observe({ type: 'navigation', buffered: true });
    } catch (e) {
      console.warn('TTFB measurement not supported');
    }
  }

  /**
   * Mede o First Contentful Paint (FCP)
   */
  private measureFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');

        if (fcpEntry) {
          const metric = this.createMetric('FCP', fcpEntry.startTime);
          this.metricsCollected.push(metric);
          this.logMetric(metric);
        }
      });

      observer.observe({ type: 'paint', buffered: true });
    } catch (e) {
      console.warn('FCP measurement not supported');
    }
  }

  /**
   * Cria um objeto de metrica com rating
   */
  private createMetric(name: string, value: number): WebVitalMetric {
    const threshold = this.thresholds[name as keyof typeof this.thresholds];
    let rating: 'good' | 'needs-improvement' | 'poor';

    if (value <= threshold.good) {
      rating = 'good';
    } else if (value <= threshold.poor) {
      rating = 'needs-improvement';
    } else {
      rating = 'poor';
    }

    return {
      name,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      rating
    };
  }

  /**
   * Loga a metrica no console (em desenvolvimento)
   */
  private logMetric(metric: WebVitalMetric): void {
    const color = metric.rating === 'good' ? '#0cce6b' :
                  metric.rating === 'needs-improvement' ? '#ffa400' : '#ff4e42';

    console.log(
      `%c[Web Vitals] ${metric.name}: ${metric.value}${metric.name === 'CLS' ? '' : 'ms'} (${metric.rating})`,
      `color: ${color}; font-weight: bold;`
    );
  }

  /**
   * Configura listener para enviar metricas quando a pagina for descarregada
   */
  private setupUnloadListener(): void {
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.metricsCollected.length > 0) {
        this.sendToAnalytics();
      }
    });
  }

  /**
   * Envia metricas para o Google Analytics
   */
  private sendToAnalytics(): void {
    if (typeof (window as any).gtag === 'function') {
      this.metricsCollected.forEach(metric => {
        (window as any).gtag('event', 'web_vitals', {
          event_category: 'Web Vitals',
          event_label: metric.name,
          value: metric.value,
          metric_rating: metric.rating,
          non_interaction: true
        });
      });
    }
  }

  /**
   * Retorna todas as metricas coletadas
   */
  getMetrics(): WebVitalMetric[] {
    return [...this.metricsCollected];
  }

  /**
   * Verifica se todas as metricas estao boas
   */
  isHealthy(): boolean {
    return this.metricsCollected.every(m => m.rating === 'good');
  }

  /**
   * Retorna um resumo das metricas
   */
  getSummary(): { total: number; good: number; needsImprovement: number; poor: number } {
    return {
      total: this.metricsCollected.length,
      good: this.metricsCollected.filter(m => m.rating === 'good').length,
      needsImprovement: this.metricsCollected.filter(m => m.rating === 'needs-improvement').length,
      poor: this.metricsCollected.filter(m => m.rating === 'poor').length
    };
  }
}
