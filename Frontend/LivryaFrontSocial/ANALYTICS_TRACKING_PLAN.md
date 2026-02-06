# 📊 Plano de Tagueamento - Google Analytics 4

## Informações da Conta
- **ID de Medição**: `G-0VZYW339W8`
- **Plataforma**: Google Analytics 4 (GA4)
- **Tipo**: Web + Mobile Web

---

## 🎯 Objetivos de Negócio

### Objetivos Primários
1. **Engajamento de Escritores**: Medir criação e gestão de conteúdo
2. **Uso da Plataforma**: Entender como usuários interagem com livros, capítulos e personagens
3. **Conversão**: Acompanhar jornada do usuário desde cadastro até criação de conteúdo
4. **Retenção**: Identificar pontos de abandono e oportunidades de melhoria

### Objetivos Secundários
1. Medir engajamento social (curtidas, comentários, compartilhamentos)
2. Entender uso de funcionalidades premium (TTS, vozes customizadas)
3. Analisar performance de diferentes seções da plataforma

---

## 📐 Estrutura de Tagueamento

### 1. Eventos de Página (Page Views)

#### Implementação Atual
- ✅ Automático via Google Analytics tag
- ✅ Custom page view tracking com títulos descritivos

#### Páginas Principais
| Página | Event Name | Parâmetros |
|--------|-----------|-----------|
| Lista de Livros | `page_view` | `page_title`, `page_path` |
| Detalhes do Livro | `page_view` | `page_title: "Book Details: {title}"`, `page_path` |
| Edição de Livro | `page_view` | `page_title`, `page_path` |
| Lista de Capítulos | `page_view` | `page_title`, `page_path` |
| Feed Social | `page_view` | `page_title`, `page_path` |

---

## 🎪 Eventos Customizados

### 2. Eventos de Livros (Books)

#### 2.1 Visualização de Livro
**Event Name**: `view_book`
```javascript
{
  book_id: string,
  book_title: string,
  content_type: 'book'
}
```
**Quando**: Usuário acessa página de detalhes do livro
**Objetivo**: Medir interesse em livros específicos

#### 2.2 Criação de Livro
**Event Name**: `create_book`
```javascript
{
  book_id: string,
  book_title: string,
  content_type: 'book'
}
```
**Quando**: Usuário cria um novo livro
**Objetivo**: Conversão - criação de conteúdo

#### 2.3 Edição de Livro
**Event Name**: `edit_book`
```javascript
{
  book_id: string,
  book_title: string,
  content_type: 'book'
}
```
**Quando**: Usuário salva alterações em um livro
**Objetivo**: Engajamento - manutenção de conteúdo

#### 2.4 Exclusão de Livro
**Event Name**: `delete_book`
```javascript
{
  book_id: string,
  book_title: string,
  content_type: 'book'
}
```
**Quando**: Usuário exclui um livro
**Objetivo**: Identificar padrões de abandono

---

### 3. Eventos de Capítulos (Chapters)

#### 3.1 Criação de Capítulo
**Event Name**: `create_chapter`
```javascript
{
  book_id: string,
  chapter_id: string,
  chapter_title: string,
  content_type: 'chapter'
}
```
**Quando**: Usuário cria um novo capítulo
**Objetivo**: Progressão na escrita

#### 3.2 Visualização de Capítulo
**Event Name**: `view_chapter`
```javascript
{
  book_id: string,
  chapter_id: string,
  chapter_title: string,
  content_type: 'chapter'
}
```
**Quando**: Usuário visualiza detalhes de um capítulo
**Objetivo**: Engajamento com conteúdo

#### 3.3 Edição de Capítulo
**Event Name**: `edit_chapter`
```javascript
{
  book_id: string,
  chapter_id: string,
  chapter_title: string,
  content_type: 'chapter'
}
```
**Quando**: Usuário salva edições em um capítulo
**Objetivo**: Iteração e refinamento de conteúdo

---

### 4. Eventos de Personagens (Characters)

#### 4.1 Criação de Personagem
**Event Name**: `create_character`
```javascript
{
  book_id: string,
  character_id: string,
  character_name: string,
  content_type: 'character'
}
```
**Quando**: Usuário cria um novo personagem
**Objetivo**: Desenvolvimento de narrativa

#### 4.2 Visualização de Lista de Personagens
**Event Name**: `view_characters`
```javascript
{
  book_id: string,
  content_type: 'character_list'
}
```
**Quando**: Usuário acessa aba/página de personagens
**Objetivo**: Interesse em gestão de personagens

---

### 5. Eventos de Falas/Narrações (Speeches)

#### 5.1 Criação de Fala
**Event Name**: `create_speech`
```javascript
{
  book_id: string,
  chapter_id: string,
  character_id: string,
  content_type: 'speech'
}
```
**Quando**: Usuário cria uma nova fala/narração
**Objetivo**: Criação de conteúdo narrativo

#### 5.2 Reprodução de Fala
**Event Name**: `play_speech`
```javascript
{
  speech_id: string,
  book_id: string,
  content_type: 'speech'
}
```
**Quando**: Usuário reproduz áudio de uma fala
**Objetivo**: Consumo de conteúdo narrado

#### 5.3 Geração de TTS
**Event Name**: `generate_tts`
```javascript
{
  speech_id: string,
  voice_id: string,
  content_type: 'tts'
}
```
**Quando**: Usuário gera áudio usando Text-to-Speech
**Objetivo**: Uso de funcionalidade premium

---

### 6. Eventos de Navegação (Navigation)

#### 6.1 Navegação Geral
**Event Name**: `navigation`
```javascript
{
  from_page: string,
  to_page: string,
  action: string
}
```
**Quando**: Usuário navega entre páginas usando botões/links
**Objetivo**: Entender fluxo de navegação

**Exemplos**:
- `from_page: 'book-detail'`, `to_page: 'book-edit'`, `action: 'edit_button_click'`
- `from_page: 'book-detail'`, `to_page: 'book-list'`, `action: 'back_button_click'`
- `from_page: 'book-detail'`, `to_page: 'chapter-create'`, `action: 'new_chapter_button_click'`

#### 6.2 Ações Rápidas
**Event Name**: `quick_action`
```javascript
{
  action_name: string,
  book_id: string
}
```
**Quando**: Usuário clica em botões de ação rápida
**Objetivo**: Medir uso de atalhos de produtividade

**Ações**:
- `view_characters`
- `new_chapter`

#### 6.3 Mudança de Abas
**Event Name**: `tab_switch`
```javascript
{
  tab_name: string,
  context: string
}
```
**Quando**: Usuário troca de aba em componentes com tabs
**Objetivo**: Interesse em diferentes seções

**Tabs**:
- `chapters` / `characters` (context: `book-detail`)

---

### 7. Eventos Sociais (Social)

#### 7.1 Compartilhamento
**Event Name**: `share`
```javascript
{
  content_type: string,
  content_id: string,
  method: string
}
```
**Quando**: Usuário compartilha conteúdo
**Objetivo**: Viralidade e alcance

#### 7.2 Curtida
**Event Name**: `like`
```javascript
{
  content_type: string,
  content_id: string
}
```
**Quando**: Usuário curte conteúdo
**Objetivo**: Engajamento social

#### 7.3 Comentário
**Event Name**: `comment`
```javascript
{
  content_type: string,
  content_id: string
}
```
**Quando**: Usuário comenta em conteúdo
**Objetivo**: Interação social

#### 7.4 Seguir
**Event Name**: `follow`
```javascript
{
  target_user_id: string
}
```
**Quando**: Usuário segue outro usuário
**Objetivo**: Construção de rede social

---

### 8. Eventos de Usuário (User)

#### 8.1 Login
**Event Name**: `login`
```javascript
{
  method: string
}
```
**Quando**: Usuário faz login
**Objetivo**: Rastrear métodos de autenticação

#### 8.2 Cadastro
**Event Name**: `sign_up`
```javascript
{
  method: string
}
```
**Quando**: Usuário completa cadastro
**Objetivo**: Conversão de aquisição

#### 8.3 Logout
**Event Name**: `logout`
```javascript
{}
```
**Quando**: Usuário faz logout
**Objetivo**: Padrões de uso de sessão

---

### 9. Eventos de Engajamento (Engagement)

#### 9.1 Tempo na Página
**Event Name**: `time_on_page`
```javascript
{
  page_title: string,
  duration_seconds: number
}
```
**Quando**: Usuário sai da página (ngOnDestroy)
**Objetivo**: Medir profundidade de engajamento

#### 9.2 Busca
**Event Name**: `search`
```javascript
{
  search_term: string,
  results_count: number
}
```
**Quando**: Usuário realiza uma busca
**Objetivo**: Entender intenção e descoberta

---

### 10. Eventos de Erro (Errors)

#### 10.1 Erro Genérico
**Event Name**: `error`
```javascript
{
  error_type: string,
  error_message: string,
  context: string
}
```
**Quando**: Ocorre erro na aplicação
**Objetivo**: Identificar problemas técnicos

**Exemplos**:
- `error_type: 'book_load_error'`, `context: 'book-detail'`
- `error_type: 'api_error'`, `context: 'chapter-create'`

---

## 📈 Métricas e KPIs Sugeridos

### Métricas de Aquisição
- Total de cadastros (`sign_up`)
- Métodos de cadastro mais populares
- Taxa de conversão de visitante → usuário cadastrado

### Métricas de Ativação
- Tempo até primeira criação de livro
- % de usuários que criam pelo menos 1 livro
- % de usuários que criam pelo menos 1 capítulo

### Métricas de Engajamento
- Média de livros por usuário
- Média de capítulos por livro
- Média de personagens por livro
- Tempo médio na página de detalhes
- Taxa de retorno (usuários que voltam após 7 dias)

### Métricas de Retenção
- DAU (Daily Active Users)
- WAU (Weekly Active Users)
- MAU (Monthly Active Users)
- Taxa de abandono de livros (livros com 0 capítulos após 30 dias)

### Métricas de Funcionalidades
- Taxa de uso de TTS
- Vozes mais utilizadas
- Taxa de uso de ações rápidas
- Tabs mais acessadas

### Métricas Sociais
- Taxa de compartilhamento
- Média de curtidas por post
- Média de comentários por post
- Taxa de follow-back

### Métricas de Performance
- Tempo de carregamento de páginas
- Taxa de erro por tipo
- Páginas com maior taxa de erro

### Métricas de Core Web Vitals ✅ (Implementado)
- **LCP** (Largest Contentful Paint) - Meta: < 2.5s
- **FID** (First Input Delay) - Meta: < 100ms
- **CLS** (Cumulative Layout Shift) - Meta: < 0.1
- **TTFB** (Time to First Byte) - Meta: < 600ms
- **FCP** (First Contentful Paint) - Meta: < 1.8s

---

## 🛠️ Implementação Técnica

### Arquivos Modificados

#### 1. `/src/index.html`
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-0VZYW339W8"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-0VZYW339W8');
</script>
```

#### 2. `/src/app/core/services/analytics.service.ts`
Serviço centralizado para gerenciamento de todos os eventos de analytics.

**Principais métodos**:
- `trackEvent(eventName, eventParams)` - Evento genérico
- `trackPageView(pageTitle, pagePath)` - Visualização de página
- `trackBookView()`, `trackBookCreate()`, etc. - Eventos específicos de livros
- `trackChapterCreate()`, etc. - Eventos de capítulos
- `trackCharacterCreate()`, etc. - Eventos de personagens
- E outros métodos específicos...

#### 3. `/src/app/features/books/book-detail/book-detail.component.ts`
Implementação de rastreamento na página de detalhes do livro:

**Eventos implementados**:
- ✅ `view_book` - Ao carregar página
- ✅ `page_view` - Visualização customizada
- ✅ `time_on_page` - Tempo de permanência
- ✅ `navigation` - Navegação (voltar, editar)
- ✅ `quick_action` - Ações rápidas
- ✅ `tab_switch` - Mudança de abas
- ✅ `error` - Erros ao carregar livro

#### 4. `/src/app/core/services/web-vitals.service.ts` ✅ (Novo)
Monitoramento de Core Web Vitals integrado ao GA4:

**Métricas rastreadas**:
- ✅ `web_vitals` (LCP) - Largest Contentful Paint
- ✅ `web_vitals` (FID) - First Input Delay
- ✅ `web_vitals` (CLS) - Cumulative Layout Shift
- ✅ `web_vitals` (TTFB) - Time to First Byte
- ✅ `web_vitals` (FCP) - First Contentful Paint

#### 5. `/src/app/core/services/seo.service.ts` ✅ (Novo)
Gerenciamento dinâmico de meta tags para SEO:

**Funcionalidades**:
- ✅ Meta tags dinâmicas (title, description, keywords)
- ✅ Open Graph tags para redes sociais
- ✅ Twitter Cards
- ✅ Canonical URLs automáticas

#### 6. `/src/app/core/services/structured-data.service.ts` ✅ (Novo)
JSON-LD Structured Data para Rich Snippets:

**Schemas implementados**:
- ✅ Organization schema
- ✅ Website schema
- ✅ Book schema
- ✅ Person schema
- ✅ Article schema
- ✅ BreadcrumbList schema
- ✅ FAQ schema

#### 7. `/src/app/core/services/image-optimization.service.ts` ✅ (Novo)
Otimização de imagens para performance:

**Funcionalidades**:
- ✅ Detecção de suporte WebP/AVIF
- ✅ Geração de srcset para imagens responsivas
- ✅ Placeholder generation

---

## 📋 Checklist de Implementação

### Fase 1: Setup Inicial ✅
- [x] Instalar Google Analytics tag no index.html
- [x] Criar AnalyticsService
- [x] Implementar eventos na página de detalhes do livro

### Fase 2: Expandir Cobertura ✅ (Implementado em Janeiro 2026)
- [x] Adicionar tracking em outras páginas de livros (book-form, book-list)
- [x] Implementar eventos de capítulos (chapter-form, chapter-list)
- [x] Implementar eventos de personagens (character-form, character-list)
- [x] Implementar eventos de falas/TTS (speech-form, speech-list, narration-control, bulk-import)
- [x] Adicionar tracking no feed social (feed, likes, posts)
- [x] Implementar eventos de autenticação (login, signup)

### Fase 3: Eventos Avançados ✅ (Implementado em Janeiro 2026)
- [ ] Implementar enhanced ecommerce (se houver monetização) - *Pendente: aguardando definição de monetização*
- [x] Adicionar custom dimensions por tipo de usuário (user_type, is_creator, books_count)
- [x] Implementar event tracking para campanhas (UTM tracking)
- [x] Adicionar rastreamento de scroll depth (ScrollTrackerDirective)
- [x] Implementar tracking de formulários (FormTrackerDirective)

### Fase 4: Otimização ✅ (Implementado em Janeiro 2026)
- [x] Configurar funis no GA4 (eventos de funil + documentação)
- [x] Criar dashboards customizados (guia de configuração GA4)
- [x] Configurar alertas para métricas críticas (documentação)
- [x] Implementar A/B testing com GA4 (ABTestingService)

### Fase 5: SEO e Performance ✅ (Implementado em Janeiro 2026)
- [x] Criar WebVitalsService para Core Web Vitals (LCP, FID, CLS, TTFB, FCP)
- [x] Integrar métricas de performance com GA4
- [x] Criar SeoService para meta tags dinâmicas
- [x] Criar StructuredDataService para JSON-LD schemas
- [x] Adicionar preconnect/DNS prefetch para recursos externos
- [x] Implementar lazy loading de imagens (LazyImageDirective)
- [x] Criar ImageOptimizationService (WebP/AVIF detection)
- [x] Criar OptimizedImageComponent com suporte a WebP

---

## 🎯 Uso Recomendado no Google Analytics 4

### Configurações Essenciais

1. **Enhanced Measurement**
   - Ativar scroll tracking
   - Ativar video engagement
   - Ativar file downloads
   - Ativar site search

2. **Custom Dimensions**
   - User Type (Free, Premium)
   - Content Type (Book, Chapter, Character)
   - Author Genre (Fantasy, Fiction, etc.)

3. **Audiences**
   - Active Writers (criaram livro nos últimos 30 dias)
   - Power Users (>5 livros)
   - Engaged Users (>3 sessões/semana)
   - At-risk Users (não retornam há 14 dias)

4. **Conversions**
   - `create_book` - Conversão primária
   - `create_chapter` - Micro-conversão
   - `sign_up` - Conversão de aquisição
   - `generate_tts` - Conversão de feature premium

---

## 📊 Relatórios Sugeridos

### 1. Relatório de Criação de Conteúdo
**Objetivo**: Entender produtividade dos usuários

**Métricas**:
- Total de `create_book`
- Total de `create_chapter`
- Total de `create_character`
- Razão capítulos/livro
- Tempo médio entre criações

### 2. Relatório de Engajamento
**Objetivo**: Medir uso da plataforma

**Métricas**:
- Tempo médio de sessão
- Páginas por sessão
- Taxa de retorno
- Eventos por usuário

### 3. Relatório de Funcionalidades
**Objetivo**: Entender quais features são mais usadas

**Métricas**:
- Top eventos por categoria
- Taxa de uso de ações rápidas
- Tabs mais acessadas
- Features menos utilizadas (oportunidade de melhoria)

### 4. Relatório de Funil de Conversão
**Objetivo**: Identificar onde usuários abandonam

**Funil**:
1. Sign up
2. Primeiro login
3. Criar primeiro livro
4. Criar primeiro capítulo
5. Criar primeiro personagem
6. Criar primeira fala

### 5. Relatório de Erros
**Objetivo**: Identificar problemas técnicos

**Métricas**:
- Erros por tipo
- Páginas com mais erros
- Taxa de erro por device
- Tendência de erros ao longo do tempo

---

## 🔒 Privacidade e LGPD

### Boas Práticas Implementadas
1. ✅ Não rastreamos PII (Personally Identifiable Information)
2. ✅ Usamos IDs em vez de nomes de usuários
3. ✅ Não enviamos emails ou dados sensíveis
4. ✅ Dados anonimizados automaticamente pelo GA4

### Recomendações Adicionais
1. Adicionar banner de cookies conforme LGPD
2. Permitir opt-out de analytics
3. Documentar política de privacidade
4. Implementar data retention policy no GA4

---

## 🚀 Próximas Etapas

### Curto Prazo (1-2 semanas)
1. Expandir tracking para todas as páginas de gestão de livros
2. Implementar eventos de capítulos
3. Implementar eventos de personagens
4. Configurar primeiros relatórios no GA4

### Médio Prazo (1 mês)
1. Implementar eventos sociais completos
2. Adicionar tracking de TTS/vozes
3. Configurar conversões no GA4
4. Criar dashboards customizados

### Longo Prazo (3 meses)
1. Implementar enhanced ecommerce (se aplicável)
2. Integrar com Google Tag Manager
3. Adicionar tracking de campanhas de marketing
4. Implementar testes A/B com GA4

---

## 📞 Suporte e Documentação

### Recursos Úteis
- [Google Analytics 4 Documentation](https://support.google.com/analytics/answer/9744165)
- [GA4 Events Documentation](https://support.google.com/analytics/answer/9267735)
- [Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)

### Contatos
- **Implementação Técnica**: Equipe de Desenvolvimento
- **Análise de Dados**: Equipe de Produto/Marketing
- **Propriedade GA4**: Administrador da conta Google

---

**Última atualização**: 11 Janeiro 2026
**Versão**: 1.5.0
**Status**: TODAS AS FASES COMPLETAS ✅ (Fase 1 + 2 + 3 + 4 + 5)

### Changelog
<<<<<<< HEAD
=======
- **v1.5.0** (11/01/2026): Concluída Fase 4 - Otimização (ABTestingService, funis de conversão, GA4 Configuration Guide)
>>>>>>> 82a31958a7b8517aebc065df4c4bf2ae80d73017
- **v1.4.0** (11/01/2026): Concluída Fase 3 - Eventos Avançados (scroll depth, form tracking, UTM campaigns, user dimensions)
- **v1.3.0** (11/01/2026): Concluída Fase 2 - Eventos de TTS/falas (speech-form, speech-list, narration-control, bulk-import)
- **v1.2.0** (10/01/2026): Concluída Fase 2 - Tracking em livros, capítulos, personagens, feed social e autenticação
- **v1.1.0** (10/01/2026): Adicionada Fase 5 com SEO e Performance (WebVitals, SeoService, StructuredDataService, ImageOptimizationService)
- **v1.0.0** (09/01/2026): Implementação inicial com AnalyticsService e tracking de livros
