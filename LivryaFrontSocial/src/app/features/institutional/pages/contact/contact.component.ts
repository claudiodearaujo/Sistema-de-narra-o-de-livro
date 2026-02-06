import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../../../core/services/seo.service';
import { StructuredDataService } from '../../../../core/services/structured-data.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.css'
})
export class ContactComponent implements OnInit {
  private seoService = inject(SeoService);
  private structuredDataService = inject(StructuredDataService);

  ngOnInit(): void {
    this.seoService.setInstitutionalPage(
      'Contato',
      'Entre em contato com a equipe LIVRIA. Tire dúvidas, envie sugestões ou solicite suporte técnico.'
    );

    this.structuredDataService.setBreadcrumbSchema([
      { name: 'Home', url: 'https://livrya.com.br/' },
      { name: 'Contato', url: 'https://livrya.com.br/institutional/contact' }
    ]);
  }
  contactForm = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };
  
  subjects = [
    'Dúvidas Gerais',
    'Suporte Técnico',
    'Denúncia de Conteúdo',
    'Parcerias',
    'Imprensa',
    'Sugestões',
    'Outro'
  ];
  
  contactChannels = [
    {
      icon: 'pi-envelope',
      title: 'E-mail',
      value: 'contato@livrya.com.br',
      link: 'mailto:contato@livrya.com.br'
    },
    {
      icon: 'pi-instagram',
      title: 'Instagram',
      value: '@livrya',
      link: 'https://instagram.com/livrya'
    },
    {
      icon: 'pi-twitter',
      title: 'Twitter',
      value: '@livrya',
      link: 'https://twitter.com/livrya'
    }
  ];
  
  isSubmitting = false;
  isSubmitted = false;
  
  onSubmit(): void {
    this.isSubmitting = true;
    // Simulate API call
    setTimeout(() => {
      this.isSubmitting = false;
      this.isSubmitted = true;
      this.contactForm = { name: '', email: '', subject: '', message: '' };
    }, 1500);
  }
}
