import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './security.component.html',
  styleUrl: './security.component.css'
})
export class SecurityComponent implements OnInit {
  private seoService = inject(SeoService);
  private structuredDataService = inject(StructuredDataService);

  ngOnInit(): void {
    this.seoService.setInstitutionalPage(
      'Segurança',
      'Conheça as medidas de segurança da LIVRIA. Criptografia, autenticação forte e backups para proteger seus dados e obras.'
    );

    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Segurança', url: 'https://livrya.com.br/institutional/security' }
    ]);
  }

  lastUpdated = '02 de Janeiro de 2026';
  
  securityMeasures = [
    {
      icon: 'pi-lock',
      title: 'Criptografia',
      description: 'Todos os dados sensíveis são criptografados em trânsito e em repouso.'
    },
    {
      icon: 'pi-server',
      title: 'Infraestrutura Segura',
      description: 'Servidores protegidos com firewalls e monitoramento 24/7.'
    },
    {
      icon: 'pi-key',
      title: 'Autenticação Forte',
      description: 'Suporte a autenticação de dois fatores para proteção adicional.'
    },
    {
      icon: 'pi-sync',
      title: 'Backups Regulares',
      description: 'Backups automáticos para garantir a recuperação de dados.'
    }
  ];
}
