# 🎨 LIVRIA – Design Brief para Estilização Frontend

> **Projeto:** Sistema de Narração de Livros (LIVRIA)  
> **Stack:** Angular 20 + Tailwind CSS 4 + PrimeNG 20  
> **Data:** Janeiro 2026  
> **Objetivo:** Definição de paleta de cores, tipografia e estilização completa do frontend

---

## 📋 Sumário

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Áreas do Sistema](#2-áreas-do-sistema)
3. [Componentes a Estilizar](#3-componentes-a-estilizar)
4. [Tokens de Design Necessários](#4-tokens-de-design-necessários)
5. [Referências de Layout](#5-referências-de-layout)
6. [Entregas Esperadas](#6-entregas-esperadas)
7. [Formato de Retorno](#7-formato-de-retorno)
8. [Guidelines de UI/UX para Devs](#8-guidelines-de-uiux-para-devs)

---

## 1. Visão Geral do Projeto

### 1.1 Sobre o LIVRIA

O **LIVRIA** é uma plataforma literária brasileira que une **escrita, escuta e publicação**, funcionando como:

- Sistema avançado de **narração por IA (TTS)** para transformar livros em audiobooks
- **Rede social literária**, focada em escritores, leitores e fandoms
- **Plataforma de crescimento**, com gamificação, campanhas, trocas e apoio editorial

A identidade visual do LIVRIA se baseia no conceito de:

> **"Biblioteca moderna viva"**  
> Um espaço digital que transmite calma, criatividade, pertencimento e profissionalismo.

---

### 1.2 Público-Alvo

- Escritores independentes brasileiros
- Autores de fanfic e ficção original
- Leitores digitais e ouvintes de audiobook
- Comunidade literária jovem-adulta (16+)
- Criadores que desejam transição para publicação profissional

---

### 1.3 Personalidade da Marca

| Atributo        | Descrição                          |
| --------------- | ---------------------------------- |
| **Tom**         | Acolhedor, inspirador, respeitoso  |
| **Estilo**      | Editorial moderno, clean, humano   |
| **Sensação**    | Papel, voz, cuidado, pertencimento |
| **Postura**     | Incentiva, não pressiona           |
| **Diferencial** | Literatura + tecnologia com afeto  |

---

### 1.4 Direção de Cores (Paleta Oficial)

A **paleta oficial do LIVRIA** é:

- 🌿 **Verde musgo editorial** — cor primária
- 📜 **Bege/papel quente** — cor secundária
- 🍷 **Vinho fechado** — accent (emoção e destaque)
- ⚪ **Neutros suaves e elegantes**

---

## 2. Áreas do Sistema

### 2.1 Área do Escritor (Writer Zone)

A Writer Zone tem visual **mais focado, calmo e produtivo**, lembrando uma mesa de escrita moderna.

#### Diretrizes visuais

- Background claro (bege/papel)
- Cards bem espaçados
- Tipografia confortável
- Pouca saturação
- Destaques sutis em verde

#### Páginas

| Página | Descrição | Direcionamento Visual |
|--------|-----------|----------------------|
| **Dashboard** | Visão geral do escritor | Cards elevados com sombra suave |
| **Lista de Livros** | Galeria de livros do autor | Grid clean, cards com capa |
| **Formulário de Livro** | Criação/edição de livro | Formulário espaçado, upload de capa |
| **Detalhes do Livro** | Visualização de um livro | Header com capa, tabs organizadas |
| **Lista de Capítulos** | Capítulos de um livro | Lista ordenável, status visual |
| **Editor de Capítulo** | Escrita do capítulo | Área branca ampla, fonte confortável, foco total no texto |
| **Controle de Narração** | Geração de áudio TTS | Visual técnico limpo, waveform em verde |
| **Player de Áudio** | Reprodução do audiobook | Controles arredondados, minimalistas |
| **Lista de Personagens** | Personagens do livro | Cards com avatar |
| **Formulário de Personagem** | Criar/editar personagem | Seletor de voz com preview |
| **Lista de Vozes** | Vozes customizadas | Cards com samples de áudio |
| **Formulário de Voz** | Criar voz customizada | Sliders elegantes |
| **Exportar Opções** | Download de áudio | Cards de opções |

#### Funcionalidades Especiais
- Drag & drop para reordenar capítulos
- Preview de voz em tempo real
- Waveform de áudio em verde
- Status de processamento TTS

---

### 2.2 Área Social (Social Zone)

A Social Zone é **mais viva**, mas sem perder elegância.

#### Diretrizes visuais

- Mais uso de accent (vinho) para interações
- Animações leves
- Cards com identidade visual consistente
- Stories circulares com borda verde

#### Páginas

| Página | Descrição | Componentes Principais |
|--------|-----------|------------------------|
| **Feed** | Timeline personalizada | Story bar, posts, infinite scroll |
| **Explore** | Descoberta de conteúdo | Trending, categorias, recomendações |
| **Perfil** | Página de usuário | Header, tabs (posts, livros, conquistas) |
| **Detalhes do Post** | Post completo | Post expandido, comentários, replies |
| **Busca** | Busca global | Search bar, tabs (pessoas, livros, posts) |
| **Mensagens** | DMs e conversas | Lista de conversas, chat individual |
| **Notificações** | Central de notificações | Lista agrupada, tipos de notificação |
| **Grupos** | Grupos literários | Lista, detalhes do grupo, membros |
| **Campanhas** | Campanhas de leitura | Progresso, participantes, metas |
| **Trending** | Em alta | Lista rankeada, períodos |

Feed e Explore seguem padrão editorial + social (Instagram + Medium).

---

### 2.3 Área de Gamificação

Gamificação no LIVRIA **não é infantil**.

#### Diretrizes visuais

- Tons dourados suaves
- Medalhas elegantes
- Animações discretas
- Confetti opcional e contido

#### Páginas

| Página | Descrição | Componentes Principais |
|--------|-----------|------------------------|
| **Livras** | Moeda virtual | Saldo, histórico, loja de pacotes |
| **Conquistas** | Medalhas e badges | Grid de conquistas, categorias, progresso |
| **Planos** | Assinaturas | Cards de planos, comparativo, CTA |
| **Checkout** | Pagamento | Integração Stripe, resumo |

---

### 2.4 Área de Autenticação

#### Diretrizes visuais

- Layout centralizado
- Logo em destaque
- Fundo bege/papel
- Ilustrações suaves
- Formulários claros e acessíveis

#### Páginas

| Página | Descrição | Componentes Principais |
|--------|-----------|------------------------|
| **Login** | Entrada | Form, social login, link cadastro |
| **Cadastro** | Registro | Form multi-step, validações |
| **Esqueci Senha** | Recuperação | Email input, instruções |
| **Perfil/Configurações** | Editar conta | Formulário, upload avatar, preferências |

---

## 3. Componentes a Estilizar

### Diretrizes Globais

- Cantos arredondados médios (8–16px)
- Sombras suaves
- Bordas claras
- Estados bem definidos (hover, focus, disabled)
- Cards sempre devem parecer **objetos físicos leves**, como livros ou cartões

### Botões

- **Primários:** fundo em verde
- **Secundários:** outline
- **CTA:** ocasionalmente em vinho

---

### 3.1 Componentes Globais

#### Layout

| Componente | Descrição | Elementos |
|------------|-----------|-----------|
| **Main Layout** | Layout principal área escritor | Top menu, sidebar (opcional), footer |
| **Social Layout** | Layout rede social | Header, sidebar, bottom nav (mobile) |
| **Auth Layout** | Layout autenticação | Centralizado, branding, form container |

#### Navegação

| Componente | Descrição | Estados |
|------------|-----------|---------|
| **Top Menu Bar** | Barra superior | Logo, menu items, avatar, notificações |
| **Sidebar Nav** | Navegação lateral | Items, active, collapsed |
| **Bottom Navigation** | Nav mobile | 5 items, badges, active |
| **Breadcrumb** | Migalhas de pão | Links, current |
| **Tab Navigation** | Abas de conteúdo | Active, hover, disabled |

---

### 3.2 Componentes de Conteúdo

#### Cards

| Componente | Descrição | Variações |
|------------|-----------|-----------|
| **Book Card** | Card de livro | Default, compact, featured |
| **Chapter Card** | Card de capítulo | List item, grid, with status |
| **Character Card** | Card de personagem | Avatar, voz atribuída |
| **Post Card** | Post no feed | Texto, imagem, link, quote |
| **User Card** | Card de usuário | Mini (lista), full (perfil) |
| **Achievement Card** | Card de conquista | Bloqueado, desbloqueado, progresso |
| **Stat Card** | Card de estatística | Ícone, número, label |
| **Plan Card** | Card de plano | Destaque, popular tag |
| **Group Card** | Card de grupo | Membros count, privado/público |
| **Campaign Card** | Card de campanha | Progresso, deadline |
| **Message Card** | Conversa na lista | Avatar, preview, badge |
| **Notification Card** | Item de notificação | Tipos: like, comment, follow, achievement |

#### Listas

| Componente | Descrição | Features |
|------------|-----------|----------|
| **Comment List** | Lista de comentários | Nested replies, ações |
| **User List** | Lista de usuários | Follow button, bio snippet |
| **Transaction List** | Histórico de Livras | Tipo, valor, timestamp |
| **Search Results** | Resultados de busca | Tabs, highlight match |

---

### 3.3 Componentes Interativos

#### Formulários

| Componente | Descrição | Estados |
|------------|-----------|---------|
| **Input Text** | Campo de texto | Default, focus, error, disabled |
| **Textarea** | Campo multilinhas | Auto-resize, character count |
| **Select/Dropdown** | Seleção | Single, multi, searchable |
| **Checkbox/Radio** | Seleção booleana | Checked, unchecked, indeterminate |
| **Slider** | Controle deslizante | Range, value display |
| **File Upload** | Upload de arquivos | Drag zone, progress, preview |
| **Image Upload** | Upload de imagem | Crop, preview |
| **Rich Text Editor** | Editor Quill | Toolbar, content area |
| **Voice Selector** | Seletor de voz | Preview button, sample |

#### Botões

| Componente | Descrição | Variações |
|------------|-----------|-----------|
| **Primary Button** | Ação principal | Default, hover, loading, disabled |
| **Secondary Button** | Ação secundária | Outlined, text |
| **Icon Button** | Botão com ícone | Round, square |
| **Follow Button** | Seguir/Deixar de seguir | Following, not following, loading |
| **Like Button** | Curtir | Liked, not liked, animation |
| **Share Button** | Compartilhar | Dropdown menu |
| **CTA Button** | Call to action | Large, accent color |
| **Floating Action Button** | FAB mobile | Novo post, scroll top |

---

### 3.4 Componentes de Feedback

| Componente | Descrição | Variações |
|------------|-----------|-----------|
| **Toast/Notification** | Mensagens flutuantes | Success, error, warning, info |
| **Modal/Dialog** | Diálogos | Confirm, form, content |
| **Loading Skeleton** | Placeholder de loading | Card, list, text |
| **Empty State** | Estado vazio | Ilustração, mensagem, CTA |
| **Error State** | Estado de erro | Retry button |
| **Progress Bar** | Barra de progresso | Determinate, indeterminate |
| **Badge** | Badges/Tags | Count, status, category |
| **Tooltip** | Dicas contextuais | Dark, light |
| **Avatar** | Foto de perfil | Sizes, fallback initials, online indicator |

---

### 3.5 Componentes Especiais

#### Área Social

| Componente | Descrição | Detalhes |
|------------|-----------|----------|
| **Story Bar** | Barra de stories | Scroll horizontal, círculos com borda verde |
| **Story Viewer** | Visualizador fullscreen | Progress bar, tap zones |
| **Story Creator** | Criador de story | Capture/upload, texto overlay |
| **Post Composer** | Criar post | Textarea, mídia, emojis |
| **Share Modal** | Modal de compartilhamento | Quote ou repost simples |
| **Trending Section** | Seção trending | Lista rankeada |
| **Chat Bubble** | Mensagem no chat | Sent, received, timestamp |
| **Typing Indicator** | Digitando... | Animação de pontos |
| **Online Indicator** | Usuário online | Dot verde |

#### Área Escritor

| Componente | Descrição | Detalhes |
|------------|-----------|----------|
| **Audio Player** | Player de áudio | Waveform verde, controles arredondados |
| **Audio Preview Player** | Preview curto | Mini player, play/stop |
| **Voice Preview** | Preview de voz | Sample text, play |
| **Narration Progress** | Progresso de geração | Percentual, etapa atual |
| **Chapter Status** | Status do capítulo | Draft, published, narrated |
| **Export Card** | Opções de exportação | Formato, qualidade |

#### Gamificação

| Componente | Descrição | Detalhes |
|------------|-----------|----------|
| **Livra Balance** | Saldo no header | Ícone dourado, valor, animação |
| **Livra Animation** | Ganho/perda de Livras | +10 floating up |
| **Achievement Unlock** | Toast de conquista | Medalha elegante, confetti contido |
| **Level Progress** | Barra de nível | XP atual, próximo nível |
| **Leaderboard Item** | Item do ranking | Posição, avatar, score |

---

## 4. Tokens de Design Necessários

### 4.1 Paleta de Cores (Oficial LIVRIA)

#### PRIMÁRIA – Verde Musgo Editorial

```
primary-50:  #E9F1EE
primary-100: #D4E3DC
primary-200: #B8CFC4
primary-300: #9BBBAD
primary-400: #7FA797
primary-500: #4F6F64   ← DEFAULT
primary-600: #445F56
primary-700: #394F48
primary-800: #2F403A
primary-900: #25322D
primary-on:  #FFFFFF
```

---

#### SECUNDÁRIA – Bege / Papel

```
secondary-50:  #FAF7F2
secondary-100: #F2ECE2
secondary-200: #E8DDCF
secondary-300: #DCCBB8
secondary-400: #CDB39E
secondary-500: #B89A7F   ← DEFAULT
secondary-600: #9E846C
secondary-700: #7F6A56
secondary-800: #5F5042
secondary-900: #3E352E
secondary-on:  #2B2B2B
```

---

#### ACCENT – Vinho Fechado

```
accent-50:  #F4E9EC
accent-100: #E8D3D9
accent-200: #D6A8B3
accent-300: #C37C8D
accent-400: #9B4F60
accent-500: #6B2E3A   ← DEFAULT
accent-600: #5C2732
accent-700: #4B2028
accent-800: #3B191F
accent-900: #2A1216
accent-on:  #FFFFFF
```

---

#### SEMÂNTICAS

```
success-50:  #F1F9F1
success-100: #E2F2E3
success-200: #C6E5C7
success-300: #A9D9AB
success-400: #8CCC8F
success-500: #4CAF50   ← DEFAULT
success-600: #439A46
success-700: #3A853D
success-800: #317033
success-900: #285B2A
success-on:  #FFFFFF

warning-50:  #FDF8EB
warning-100: #FBF1D6
warning-200: #F7E3AD
warning-300: #F3D585
warning-400: #EFC75C
warning-500: #E6A700   ← DEFAULT
warning-600: #CA9300
warning-700: #AF7F00
warning-800: #936B00
warning-900: #785700
warning-on:  #1F1F1F

error-50:  #FAEFEE
error-100: #F5DFDD
error-200: #EBC0BB
error-300: #E1A099
error-400: #D78077
error-500: #C0392B   ← DEFAULT
error-600: #A93226
error-700: #922B21
error-800: #7B241C
error-900: #641E16
error-on:  #FFFFFF

info-50:  #EFF3F8
info-100: #DFE8F1
info-200: #C0D1E2
info-300: #A0B9D4
info-400: #81A2C5
info-500: #3A6EA5   ← DEFAULT
info-600: #336191
info-700: #2C547D
info-800: #25466A
info-900: #1E3956
info-on:  #FFFFFF
```

---

#### NEUTRAS

```
neutral-50:  #FAFAFA
neutral-100: #F4F4F5
neutral-200: #E4E4E7
neutral-300: #D4D4D8
neutral-400: #A1A1AA
neutral-500: #71717A
neutral-600: #52525B
neutral-700: #3F3F46
neutral-800: #27272A
neutral-900: #18181B
neutral-950: #0F0F12
```

---

#### SUPERFÍCIES (Light Mode)

```
surface-ground:   var(--color-secondary-50)   /* Fundo principal bege */
surface-subtle:   var(--color-secondary-100)
surface-card:     #FFFFFF
surface-elevated: #FFFFFF
surface-inset:    var(--color-neutral-50)
surface-border:   var(--color-neutral-200)
surface-divider:  var(--color-neutral-200)
surface-overlay:  rgba(0, 0, 0, 0.45)
```

---

#### TEXTOS

```
text-primary:   var(--color-neutral-900)
text-secondary: var(--color-neutral-600)
text-muted:     var(--color-neutral-400)
text-inverse:   #FFFFFF
link:           var(--color-primary-700)
link-hover:     var(--color-primary-800)
```

---

#### GAMIFICAÇÃO

```
color-livra:            #D4AF37   /* Dourado elegante */
achievement-bronze:     #CD7F32
achievement-silver:     #C0C0C0
achievement-gold:       #FFD700
color-level:            var(--color-accent-500)
```

---

### 4.2 Tipografia

```
FONT FAMILIES
├── font-heading: 'Playfair Display', serif    ← Títulos editoriais
├── font-body:    'Inter', sans-serif          ← Corpo e UI
├── font-mono:    'JetBrains Mono', monospace  ← Stats e código

FONT SIZES (rem)
├── text-xs:  0.75rem   (12px)
├── text-sm:  0.875rem  (14px)
├── text-md:  1rem      (16px)
├── text-lg:  1.125rem  (18px)
├── text-xl:  1.25rem   (20px)
├── text-2xl: 1.5rem    (24px)
├── text-3xl: 1.875rem  (30px)
├── text-4xl: 2.25rem   (36px)

FONT WEIGHTS
├── font-regular:  400
├── font-medium:   500
├── font-semibold: 600
├── font-bold:     700

LINE HEIGHTS
├── leading-tight:   1.2
├── leading-normal:  1.5
├── leading-relaxed: 1.7
```

**Hierarquia:**
- Títulos com **Playfair Display** (apenas títulos e chamadas editoriais)
- Corpo com **Inter** (leitura e UI)
- Números, stats e código com **JetBrains Mono**

---

### 4.3 Espaçamento

```
SPACING SCALE (rem)
├── space-0:  0rem
├── space-1:  0.25rem  (4px)
├── space-2:  0.5rem   (8px)
├── space-3:  0.75rem  (12px)
├── space-4:  1rem     (16px)
├── space-5:  1.25rem  (20px)
├── space-6:  1.5rem   (24px)
├── space-8:  2rem     (32px)
├── space-10: 2.5rem   (40px)
├── space-12: 3rem     (48px)
├── space-16: 4rem     (64px)
├── space-20: 5rem     (80px)
├── space-24: 6rem     (96px)

ESPECÍFICOS
├── card-padding: var(--space-6)
├── card-gap:     var(--space-4)
├── nav-height:   3.5rem (56px)
```

---

### 4.4 Bordas e Sombras

```
BORDER RADIUS
├── radius-sm:   0.25rem  (4px)
├── radius-md:   0.5rem   (8px)
├── radius-lg:   0.75rem  (12px)
├── radius-xl:   1rem     (16px)
├── radius-2xl:  1.5rem   (24px)
├── radius-full: 9999px

BORDER WIDTH
├── border-width: 1px

SHADOWS (suaves, editoriais)
├── shadow-xs:  0 1px 2px rgba(0,0,0,0.05)
├── shadow-sm:  0 2px 6px rgba(0,0,0,0.08)
├── shadow-md:  0 6px 18px rgba(0,0,0,0.10)
├── shadow-lg:  0 10px 30px rgba(0,0,0,0.12)
```

---

### 4.5 Transições e Animações

```
EASINGS
├── ease-standard: cubic-bezier(0.4, 0, 0.2, 1)
├── ease-emph:     cubic-bezier(0.2, 0, 0, 1)

DURATIONS
├── duration-fast:   120ms
├── duration-normal: 180ms
├── duration-slow:   240ms

ANIMAÇÕES ESPECÍFICAS
├── fade-in
├── slide-up
├── scale-in
├── like-pulse (animação do coração)
├── livra-float (moedas subindo)
├── skeleton-shimmer (loading)
```

**Regras:**
- Todas as interações usam `ease-in-out`
- Nada brusco
- Microanimações elegantes

---

### 4.6 Estados e Foco

```
FOCUS
├── focus-ring-color: rgba(79, 111, 100, 0.35)  /* primary-500 com alpha */
├── focus-ring: 0 0 0 3px var(--focus-ring-color)

ESTADOS
├── state-hover-overlay:  rgba(0,0,0,0.04)
├── state-active-overlay: rgba(0,0,0,0.06)
├── state-disabled-opacity: 0.55

CONTROLES
├── control-height-sm: 2.25rem  (36px)
├── control-height-md: 2.75rem  (44px)
├── control-height-lg: 3.25rem  (52px)
├── control-padding-x: 0.875rem (14px)
├── control-padding-y: 0.625rem (10px)
```

---

### 4.7 Z-Index

```
├── z-dropdown: 1000
├── z-sticky:   1100
├── z-overlay:  1200
├── z-modal:    1300
├── z-toast:    1400
├── z-tooltip:  1500
```

---

## 5. Referências de Layout

### 5.1 Desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────────────┐
│  HEADER (64px altura)                                            │
│  [Logo]     [Search Bar]              [Notif] [Msgs] [Avatar]   │
├──────────────┬───────────────────────────────────────────────────┤
│              │                                                   │
│   SIDEBAR    │              MAIN CONTENT                         │
│   (240px)    │              (flex, centralizado)                 │
│              │                                                   │
│   - Feed     │   ┌─────────────────────────────────────────┐     │
│   - Explore  │   │                                         │     │
│   - Grupos   │   │          Content Area                   │     │
│   - Livras   │   │          (max-width: 680px para feed)  │     │
│   - Perfil   │   │                                         │     │
│              │   └─────────────────────────────────────────┘     │
│   [Novo Post]│                                                   │
│              │                                                   │
│   ──────     │                                                   │
│   Área       │                                                   │
│   Escritor   │                                                   │
│              │                                                   │
└──────────────┴───────────────────────────────────────────────────┘
```

### 5.2 Mobile (<768px)

```
┌─────────────────────────┐
│  HEADER (56px)          │
│  [Logo]      [Icons]    │
├─────────────────────────┤
│                         │
│                         │
│      MAIN CONTENT       │
│      (full width)       │
│                         │
│                         │
│                         │
│                         │
├─────────────────────────┤
│  BOTTOM NAV (64px)      │
│  [Home][Search][+][Notif][Profile]
└─────────────────────────┘
```

### 5.3 Área do Escritor - Dashboard

```
┌──────────────────────────────────────────────────────────────────┐
│  [Título: Dashboard]    [Bem-vindo message]                      │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                    │
│  │ STAT 1 │ │ STAT 2 │ │ STAT 3 │ │ STAT 4 │   ← Stat Cards     │
│  │ Livros │ │Capítulos│ │Concluídos│ │Progresso│                 │
│  └────────┘ └────────┘ └────────┘ └────────┘                    │
├─────────────────────────┬────────────────────────────────────────┤
│    ┌─────────────────┐  │    ┌──────────────────────────────┐   │
│    │                 │  │    │  LIVROS RECENTES             │   │
│    │   CHART         │  │    │  [Book 1]                    │   │
│    │   (Doughnut)    │  │    │  [Book 2]                    │   │
│    │                 │  │    │  [Book 3]                    │   │
│    └─────────────────┘  │    │  [Ver Todos →]               │   │
│                         │    └──────────────────────────────┘   │
└─────────────────────────┴────────────────────────────────────────┘
```

---

## 6. Entregas Esperadas

### 6.1 Documento de Design System

1. **Paleta de Cores Completa** ✅
   - Cores primárias, secundárias, accent
   - Cores semânticas (success, error, warning, info)
   - Cores neutras (backgrounds, textos, borders)
   - Variações light/dark mode

2. **Tipografia** ✅
   - Font families escolhidas (Playfair Display, Inter, JetBrains Mono)
   - Escala tipográfica
   - Hierarquia de headings

3. **Componentes Estilizados** ✅
   - Referências visuais para cada componente listado
   - Estados (hover, active, disabled, focus)
   - Variações de tamanho quando aplicável

4. **Iconografia**
   - PrimeIcons como base
   - Estilo linear e elegante

---

## 7. Formato de Retorno

### 7.1 Arquivo CSS de Tokens (design-tokens.css)

```css
/* ==========================================================================
   LIVRIA — Design Tokens (Tailwind v4 + PrimeNG 20)
   Versão: 1.0.0 | Data: 2026-01-01
   ========================================================================== */

/* --------------------------------------------------------------------------
   0) Fontes (recomendação)
   - Inter
   - Playfair Display
   - JetBrains Mono
   Obs: carregar via <link> no index.html ou self-host.
   -------------------------------------------------------------------------- */

:root {
  /* ------------------------------------------------------------------------
     1) Cores — Brand
     ------------------------------------------------------------------------ */

  /* Primary — Verde musgo editorial */
  --color-primary-50:  #E9F1EE;
  --color-primary-100: #D4E3DC;
  --color-primary-200: #B8CFC4;
  --color-primary-300: #9BBBAD;
  --color-primary-400: #7FA797;
  --color-primary-500: #4F6F64;
  --color-primary-600: #445F56;
  --color-primary-700: #394F48;
  --color-primary-800: #2F403A;
  --color-primary-900: #25322D;
  --color-primary-on:  #FFFFFF;

  /* Secondary — Papel (bege quente) */
  --color-secondary-50:  #FAF7F2;
  --color-secondary-100: #F2ECE2;
  --color-secondary-200: #E8DDCF;
  --color-secondary-300: #DCCBB8;
  --color-secondary-400: #CDB39E;
  --color-secondary-500: #B89A7F;
  --color-secondary-600: #9E846C;
  --color-secondary-700: #7F6A56;
  --color-secondary-800: #5F5042;
  --color-secondary-900: #3E352E;
  --color-secondary-on:  #2B2B2B;

  /* Accent — Vinho fechado */
  --color-accent-50:  #F4E9EC;
  --color-accent-100: #E8D3D9;
  --color-accent-200: #D6A8B3;
  --color-accent-300: #C37C8D;
  --color-accent-400: #9B4F60;
  --color-accent-500: #6B2E3A;
  --color-accent-600: #5C2732;
  --color-accent-700: #4B2028;
  --color-accent-800: #3B191F;
  --color-accent-900: #2A1216;
  --color-accent-on:  #FFFFFF;

  /* ------------------------------------------------------------------------
     2) Cores — Semânticas
     ------------------------------------------------------------------------ */
  --color-success-50:  #F1F9F1;
  --color-success-100: #E2F2E3;
  --color-success-200: #C6E5C7;
  --color-success-300: #A9D9AB;
  --color-success-400: #8CCC8F;
  --color-success-500: #4CAF50;
  --color-success-600: #439A46;
  --color-success-700: #3A853D;
  --color-success-800: #317033;
  --color-success-900: #285B2A;
  --color-success-on:  #FFFFFF;

  --color-warning-50:  #FDF8EB;
  --color-warning-100: #FBF1D6;
  --color-warning-200: #F7E3AD;
  --color-warning-300: #F3D585;
  --color-warning-400: #EFC75C;
  --color-warning-500: #E6A700;
  --color-warning-600: #CA9300;
  --color-warning-700: #AF7F00;
  --color-warning-800: #936B00;
  --color-warning-900: #785700;
  --color-warning-on:  #1F1F1F;

  --color-error-50:  #FAEFEE;
  --color-error-100: #F5DFDD;
  --color-error-200: #EBC0BB;
  --color-error-300: #E1A099;
  --color-error-400: #D78077;
  --color-error-500: #C0392B;
  --color-error-600: #A93226;
  --color-error-700: #922B21;
  --color-error-800: #7B241C;
  --color-error-900: #641E16;
  --color-error-on:  #FFFFFF;

  --color-info-50:  #EFF3F8;
  --color-info-100: #DFE8F1;
  --color-info-200: #C0D1E2;
  --color-info-300: #A0B9D4;
  --color-info-400: #81A2C5;
  --color-info-500: #3A6EA5;
  --color-info-600: #336191;
  --color-info-700: #2C547D;
  --color-info-800: #25466A;
  --color-info-900: #1E3956;
  --color-info-on:  #FFFFFF;

  /* ------------------------------------------------------------------------
     3) Neutros
     ------------------------------------------------------------------------ */
  --color-neutral-50:  #FAFAFA;
  --color-neutral-100: #F4F4F5;
  --color-neutral-200: #E4E4E7;
  --color-neutral-300: #D4D4D8;
  --color-neutral-400: #A1A1AA;
  --color-neutral-500: #71717A;
  --color-neutral-600: #52525B;
  --color-neutral-700: #3F3F46;
  --color-neutral-800: #27272A;
  --color-neutral-900: #18181B;
  --color-neutral-950: #0F0F12;

  /* ------------------------------------------------------------------------
     4) Superfícies & Texto (Light)
     ------------------------------------------------------------------------ */
  --surface-ground:   var(--color-secondary-50);
  --surface-subtle:   var(--color-secondary-100);
  --surface-card:     #FFFFFF;
  --surface-elevated: #FFFFFF;
  --surface-inset:    var(--color-neutral-50);

  --surface-border:   var(--color-neutral-200);
  --surface-divider:  var(--color-neutral-200);
  --surface-overlay:  rgba(0, 0, 0, 0.45);

  --text-primary:     var(--color-neutral-900);
  --text-secondary:   var(--color-neutral-600);
  --text-muted:       var(--color-neutral-400);
  --text-inverse:     #FFFFFF;

  --link:             var(--color-primary-700);
  --link-hover:       var(--color-primary-800);

  /* ------------------------------------------------------------------------
     5) Tipografia
     ------------------------------------------------------------------------ */
  --font-heading: 'Playfair Display', serif;
  --font-body:    'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
  --font-mono:    'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;

  --font-weight-regular: 400;
  --font-weight-medium:  500;
  --font-weight-semibold:600;
  --font-weight-bold:    700;

  /* Escala de fontes (rem) */
  --text-xs:  0.75rem;
  --text-sm:  0.875rem;
  --text-md:  1rem;
  --text-lg:  1.125rem;
  --text-xl:  1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  --leading-tight:  1.2;
  --leading-normal: 1.5;
  --leading-relaxed:1.7;

  /* ------------------------------------------------------------------------
     6) Espaçamento (px -> rem)
     ------------------------------------------------------------------------ */
  --space-0:  0rem;
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-5:  1.25rem;
  --space-6:  1.5rem;
  --space-8:  2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;

  /* ------------------------------------------------------------------------
     7) Raios (border radius)
     ------------------------------------------------------------------------ */
  --radius-sm:   0.25rem;
  --radius-md:   0.5rem;
  --radius-lg:   0.75rem;
  --radius-xl:   1rem;
  --radius-2xl:  1.5rem;
  --radius-full: 9999px;

  /* ------------------------------------------------------------------------
     8) Sombras (suaves, editoriais)
     ------------------------------------------------------------------------ */
  --shadow-xs:  0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm:  0 2px 6px rgba(0,0,0,0.08);
  --shadow-md:  0 6px 18px rgba(0,0,0,0.10);
  --shadow-lg:  0 10px 30px rgba(0,0,0,0.12);

  /* ------------------------------------------------------------------------
     9) Motion & Transições
     ------------------------------------------------------------------------ */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-emph:     cubic-bezier(0.2, 0, 0, 1);

  --duration-fast:   120ms;
  --duration-normal: 180ms;
  --duration-slow:   240ms;

  /* ------------------------------------------------------------------------
     10) Z-Index
     ------------------------------------------------------------------------ */
  --z-dropdown:  1000;
  --z-sticky:    1100;
  --z-overlay:   1200;
  --z-modal:     1300;
  --z-toast:     1400;
  --z-tooltip:   1500;

  /* ------------------------------------------------------------------------
     11) Foco, bordas e estados
     ------------------------------------------------------------------------ */
  --border-width: 1px;

  --focus-ring-color: rgba(79, 111, 100, 0.35);
  --focus-ring: 0 0 0 3px var(--focus-ring-color);

  --state-hover-overlay: rgba(0,0,0,0.04);
  --state-active-overlay: rgba(0,0,0,0.06);
  --state-disabled-opacity: 0.55;

  /* ------------------------------------------------------------------------
     12) Tokens de componentes (base)
     ------------------------------------------------------------------------ */
  --control-height-sm: 2.25rem;
  --control-height-md: 2.75rem;
  --control-height-lg: 3.25rem;

  --control-padding-x: 0.875rem;
  --control-padding-y: 0.625rem;

  --card-padding: var(--space-6);
  --card-gap:     var(--space-4);

  --nav-height:   3.5rem;

  /* ------------------------------------------------------------------------
     13) Gamificação
     ------------------------------------------------------------------------ */
  --color-livra: #D4AF37;
  --color-achievement-bronze: #CD7F32;
  --color-achievement-silver: #C0C0C0;
  --color-achievement-gold:   #FFD700;
  --color-level: var(--color-accent-500);
}

/* --------------------------------------------------------------------------
   Dark Mode (classe .dark no html ou body)
   -------------------------------------------------------------------------- */
.dark {
  --surface-ground:   var(--color-neutral-950);
  --surface-subtle:   #141418;
  --surface-card:     #1A1A20;
  --surface-elevated: #202028;
  --surface-inset:    #121216;

  --surface-border:   rgba(228,228,231,0.12);
  --surface-divider:  rgba(228,228,231,0.10);
  --surface-overlay:  rgba(0, 0, 0, 0.60);

  --text-primary:     #F5F5F6;
  --text-secondary:   rgba(245,245,246,0.72);
  --text-muted:       rgba(245,245,246,0.50);
  --text-inverse:     var(--color-neutral-950);

  --link:       var(--color-primary-300);
  --link-hover: var(--color-primary-200);

  --focus-ring-color: rgba(159, 187, 173, 0.35);
  --state-hover-overlay: rgba(255,255,255,0.05);
  --state-active-overlay: rgba(255,255,255,0.07);
}

/* --------------------------------------------------------------------------
   Base helpers
   -------------------------------------------------------------------------- */
:root, .dark {
  color-scheme: light;
}
.dark {
  color-scheme: dark;
}

.livrya-focusable:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.livrya-card {
  background: var(--surface-card);
  border: var(--border-width) solid var(--surface-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}
```

---

### 7.2 Mapeamento para Tailwind v4 (CSS-first)

```css
@theme {
  --color-primary: var(--color-primary-500);
  --color-accent:  var(--color-accent-500);

  --radius-card: var(--radius-xl);
  --shadow-card: var(--shadow-sm);
}
```

---

### 7.3 Configuração PrimeNG Theme

```typescript
// primeng-theme-config.ts

import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

const LivriaPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#E9F1EE',
      100: '#D4E3DC',
      200: '#B8CFC4',
      300: '#9BBBAD',
      400: '#7FA797',
      500: '#4F6F64',
      600: '#445F56',
      700: '#394F48',
      800: '#2F403A',
      900: '#25322D',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#FFFFFF',
          50: '#FAF7F2',
          100: '#F2ECE2',
          200: '#E8DDCF',
          300: '#DCCBB8',
          400: '#CDB39E',
          500: '#B89A7F',
          600: '#9E846C',
          700: '#7F6A56',
          800: '#5F5042',
          900: '#3E352E',
        },
      },
      dark: {
        surface: {
          0: '#1A1A20',
          50: '#141418',
          100: '#202028',
          200: '#27272A',
          300: '#3F3F46',
          400: '#52525B',
          500: '#71717A',
          600: '#A1A1AA',
          700: '#D4D4D8',
          800: '#E4E4E7',
          900: '#F4F4F5',
        },
      },
    },
  },
});

export default LivriaPreset;
```

---

## 8. Guidelines de UI/UX para Devs

### 8.1 Princípios Inegociáveis

| Princípio | Descrição |
|-----------|-----------|
| **Editorial moderno** | Interface com "respiro", tipografia bonita, sem gritaria visual |
| **Acolhedor + tecnológico** | Tecnologia aparece na precisão e clareza, não em neon/efeitos |
| **Consistência > criatividade** | Qualquer variação precisa de justificativa funcional |
| **Leitura em primeiro lugar** | Texto e conteúdo são o produto |

---

### 8.2 Uso de Cores (Regras Práticas)

#### Primary (Verde)

✅ **Use para:** navegação, ações primárias, seleção ativa, progressos (quando neutro)  
❌ **Evite:** texto longo em verde; grandes áreas chapadas em verde

#### Secondary (Papel)

✅ **Use para:** fundo, áreas editoriais, seções grandes, estados "calmos"  
❌ **Evite:** botões e CTAs com secondary como preenchimento (vira "apagadão")

#### Accent (Vinho)

✅ **Use para:** interações sociais (curtir, seguir, salvar), CTA emocional, destaques raros  
⚠️ **Regra:** accent é "temperinho", não base

#### Semânticas

| Cor | Uso |
|-----|-----|
| **Success** | Confirmações e estados positivos |
| **Warning** | Atenção sem bloquear |
| **Error** | Bloqueios e validações críticas |
| **Info** | Dicas, notificações neutras |

---

### 8.3 Tipografia (Hierarquia)

| Tipo | Fonte | Uso |
|------|-------|-----|
| **Headings** | Playfair Display | Apenas títulos e chamadas editoriais |
| **Body** | Inter | Tudo que é leitura e UI |
| **Mono** | JetBrains Mono | IDs, tokens, stats técnicos, logs |

**Regras:**
- Títulos com Playfair devem ter contraste alto e espaçamento (evitar colar em bordas)
- Texto longo sempre com Inter, `leading-relaxed` em páginas de leitura/edição
- Evitar usar peso 700 em parágrafos; usar 500/600 para ênfase

---

### 8.4 Layout e Espaçamento

- **Grid mental:** 12 colunas no desktop, 4 no mobile
- **Padding padrão de seção:** 24–32px (`space-6` a `space-8`)
- **Cards:** use `--card-padding` e gap consistente (`space-4`)
- **Evite densidade:** preferir mais espaço do que mais bordas

---

### 8.5 Componentes (Padrões)

#### Botões

| Tipo | Estilo |
|------|--------|
| **Primário** | Fundo `primary-500`, texto branco |
| **Secundário** | Outline `primary-500`, fundo transparente |
| **Terciário/Link** | Sem fundo, com hover discreto |
| **Destrutivo** | `error-500` (use com parcimônia) |

**Estados:**
- **Hover:** overlay suave (não escurecer agressivo)
- **Focus:** sempre `box-shadow: var(--focus-ring)`
- **Disabled:** reduzir opacidade e remover sombras/hover

#### Inputs / Forms

- **Altura padrão:** `--control-height-md` (44px)
- **Bordas:** `surface-border`, fundo `surface-card`
- **Erro:** borda `error-500` + mensagem curta e objetiva
- **Ajuda (hint):** `text-secondary`, pequena e útil

**Validação:**
- Mostrar erro após blur ou submit
- Não "gritar" erro enquanto o usuário está digitando

#### Cards

- Sempre: borda leve + sombra suave
- Card = "objeto físico leve"
- Não usar gradientes chamativos

#### Modals / Dialogs

- Fundo overlay `--surface-overlay`
- Modal com `radius-2xl`, sombra `shadow-lg`
- Botão primário à direita, secundário à esquerda (padrão Brasil)

#### Tabelas

- Preferir linhas "respiradas"
- Zebra muito leve (opcional) com neutros
- Cabeçalho: texto sem gritar, peso 600, fundo `surface-subtle`

#### Badges/Chips

- Chips neutros para tags (secondary/neutral)
- Gamificação com dourados apenas em conquistas (não em tags comuns)

---

### 8.6 Writer Zone (Foco em Produtividade)

- **Fundo:** `secondary-50/100`
- **Editor:** área branca limpa, tipografia confortável
- Evitar excesso de widgets e bordas
- **Player e narração:** visual "técnico limpo", sem aparência gamer

---

### 8.7 Social Zone (Mais Vivo, Sem Virar Carnaval)

- Accent aparece mais (curtidas/ações sociais)
- Cards e mídia com cantos arredondados consistentes
- Animações leves (microinterações), sem exageros

---

### 8.8 Acessibilidade (Obrigatório)

- ✅ Focus visível em tudo navegável (teclado)
- ✅ Contraste: texto principal sempre bem legível no papel e no dark
- ✅ Botões e ícones com área clicável mínima confortável
- ✅ Evitar animações fortes; respeitar `prefers-reduced-motion` quando aplicável
- ✅ Labels e `aria-labels` em ícones (especialmente player, ações sociais)

---

### 8.9 Tailwind v4 — Regras de Uso

⚠️ **Proibido hardcode de hex nos componentes.**  
Sempre usar tokens via CSS vars (ou mapeamento do theme).

- Preferir classes utilitárias para layout (grid, gap, padding)
- Para valores tokenizados: usar `bg-[var(--surface-card)]`, `text-[var(--text-primary)]` etc.
- Componentes PrimeNG: usar PassThrough (`pt`) para aplicar classes Tailwind e manter padrão

**Exemplos práticos (padrão interno):**

```html
<!-- Fundo de página -->
<div class="bg-[var(--surface-ground)] text-[var(--text-primary)]">

<!-- Card -->
<div class="rounded-[var(--radius-xl)] border border-[var(--surface-border)] shadow-[var(--shadow-sm)] bg-[var(--surface-card)]">
```

---

### 8.10 PrimeNG 20 — Guideline de Integração

- Usar PrimeNG para **comportamento e acessibilidade base**, Tailwind para **estética**
- Padronizar `pt` (PassThrough) para:
  - `p-button` (root/label/icon)
  - `p-inputtext`
  - `p-dialog`
  - `p-toast`
  - `p-tabview`
  - `p-dropdown`
- Evitar sobrescrever CSS do Prime com "cascata bruta"; preferir tokens + pt

---

## 9. Checklist para Implementação

### Cores
- [x] Paleta primária (10 tons) — Verde musgo
- [x] Paleta secundária (10 tons) — Papel/Bege
- [x] Cor accent/destaque — Vinho
- [x] Cores semânticas (success, error, warning, info)
- [x] Cores neutras (backgrounds, borders, textos)
- [x] Cores especiais (Livras, conquistas)
- [x] Versão dark mode

### Tipografia
- [x] Fonte para headings — Playfair Display
- [x] Fonte para body text — Inter
- [x] Fonte mono — JetBrains Mono
- [x] Hierarquia de tamanhos
- [x] Pesos utilizados

### Componentes Principais
- [x] Botões (primary, secondary, text, icon)
- [x] Cards (book, post, user, achievement)
- [x] Formulários (inputs, selects, textareas)
- [x] Navegação (header, sidebar, bottom nav)
- [x] Modais e overlays
- [x] Toast/Notifications
- [x] Estados vazios e loading

### Layouts
- [x] Header desktop e mobile
- [x] Sidebar
- [x] Bottom navigation mobile
- [x] Grid de cards
- [x] Layout de perfil
- [x] Layout de feed

### Extras
- [x] Animações sugeridas
- [x] Guidelines de acessibilidade
- [x] Regras Tailwind v4
- [x] Integração PrimeNG 20

---

> **A Livrya agora é um produto de verdade.** 📚💚
