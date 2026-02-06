import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-investors',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './investors.component.html',
  styleUrl: './investors.component.css'
})
export class InvestorsComponent {
  projectHighlights = [
    {
      icon: 'pi-book',
      title: 'Plataforma Inovadora',
      description: 'Primeira rede social literária brasileira com narração por IA integrada.'
    },
    {
      icon: 'pi-users',
      title: 'Mercado em Crescimento',
      description: 'O mercado de audiobooks cresce 25% ao ano no Brasil, com potencial inexplorado.'
    },
    {
      icon: 'pi-globe',
      title: 'Escalabilidade Global',
      description: 'Tecnologia pronta para expansão internacional em mercados de língua portuguesa e espanhola.'
    },
    {
      icon: 'pi-chart-line',
      title: 'Modelo de Receita Diversificado',
      description: 'Assinaturas premium, monetização de conteúdo e parcerias com editoras.'
    }
  ];

  investmentBenefits = [
    {
      icon: 'pi-star',
      title: 'Participação Early-Stage',
      description: 'Entre como investidor no momento ideal, antes da escalada de crescimento.'
    },
    {
      icon: 'pi-cog',
      title: 'Tecnologia Proprietária',
      description: 'Sistema de narração por IA desenvolvido internamente com diferencial competitivo.'
    },
    {
      icon: 'pi-heart',
      title: 'Impacto Social',
      description: 'Democratização do acesso à literatura e inclusão de pessoas com deficiência visual.'
    },
    {
      icon: 'pi-shield',
      title: 'Propriedade Intelectual',
      description: 'Marca registrada e tecnologia protegida, garantindo vantagem competitiva duradoura.'
    }
  ];

  contactChannels = [
    {
      icon: 'pi-whatsapp',
      title: 'WhatsApp',
      value: '+55 11 97190-4955',
      link: 'https://wa.me/5511971904955?text=Olá! Tenho interesse em investir no projeto LIVRIA.',
      color: 'whatsapp'
    },
    {
      icon: 'pi-envelope',
      title: 'E-mail',
      value: 'claudiofaraujo@hotmail.com',
      link: 'mailto:claudiofaraujo@hotmail.com?subject=Interesse em Investir - LIVRIA',
      color: 'email'
    }
  ];

  developerInfo = {
    name: 'Claudio de Araújo',
    role: 'Fundador & Desenvolvedor',
    location: 'São Paulo, Brasil',
    bio: 'Empreendedor e desenvolvedor apaixonado por tecnologia e literatura. Criador da LIVRIA com a missão de democratizar o acesso à leitura através da narração inteligente.'
  };

  milestones = [
    { label: 'MVP Completo', status: 'completed', description: 'Plataforma funcional com recursos essenciais' },
    { label: 'Sistema de Narração IA', status: 'completed', description: 'Tecnologia de conversão texto-para-voz integrada' },
    { label: 'Rede Social Literária', status: 'completed', description: 'Feed, interações e comunidade de escritores' },
    { label: 'Sistema de Assinaturas', status: 'in-progress', description: 'Modelo de monetização premium' },
    { label: 'Expansão de Mercado', status: 'planned', description: 'Marketing e aquisição de usuários' },
    { label: 'Parcerias Editoriais', status: 'planned', description: 'Acordos com editoras e distribuidoras' }
  ];
}
