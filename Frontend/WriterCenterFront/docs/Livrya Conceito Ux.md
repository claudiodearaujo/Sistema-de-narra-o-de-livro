# Livrya Writer Studio — Novo Conceito de UX

**Versão**: 2.0  
**Data**: 2026-02-05  
**Objetivo**: Redesign completo do módulo de escritor com foco em usabilidade

---

## Diagnóstico dos Problemas Atuais

### Fragmentação da Experiência (Problema 1.1 e 1.2)

A arquitetura atual distribui o fluxo de escrita em **7+ telas separadas** com navegação hierárquica profunda:

```
Dashboard → Lista de Livros → Detalhe do Livro (3 abas)
  → Lista de Capítulos → Detalhe do Capítulo
    → Lista de Falas → Formulário de Fala (com SSML separado)
      → Ferramentas de IA (separadas)
      → Controle de Narração (separado)
      → Player de Áudio (separado)
```

Cada transição entre telas **quebra o fluxo criativo** do escritor. A navegação por breadcrumbs (`Escritor > Livros > Título > Capítulo 2 > Fala 3`) evidencia a profundidade excessiva.

### Área de Escrita Limitada (Problema 1.3)

Na tela atual de `ChapterDetailComponent`, o espaço útil é consumido por:
- Header do capítulo com informações de status
- Tabela de falas com 5 colunas (ordem, personagem, texto, status áudio, ações)
- Controles de narração fixos
- Player de áudio fixo
- Toolbar de exportação

O texto da fala fica comprimido em uma célula de tabela — o oposto de um ambiente de escrita confortável.

### Tags SSML Complexas (Problema 1.4)

O editor SSML atual expõe sintaxe XML bruta ao escritor:

```xml
<speak>
  <break time="500ms"/>
  <emphasis level="strong">Eu preciso sair daqui.</emphasis>
  <prosody rate="slow" pitch="low">Preciso encontrar respostas.</prosody>
</speak>
```

Escritores não são desenvolvedores. Isso cria uma barreira técnica desnecessária.

### Inclusão de Falas Trabalhosa (Problema 1.5)

O fluxo atual para adicionar uma fala requer:
1. Clicar em "Nova Fala" (abre modal/formulário)
2. Selecionar personagem (dropdown)
3. Digitar texto
4. Opcionalmente configurar SSML
5. Salvar
6. Voltar à lista

Além disso, as falas são exibidas como **tabela**, não como **texto narrativo**. Um escritor precisa ler seu trabalho como um livro.

---

## Conceito: Writer Studio (Tela Única)

### Filosofia

> "O melhor software de escrita é aquele que desaparece — deixando apenas o escritor e suas palavras."

O Writer Studio consolida **toda a experiência de criação** em uma única tela com três zonas:

```
┌─────────────────────────────────────────────────────────────────┐
│                        TOP BAR (fixa, 48px)                     │
│  [≡] 📖 Título do Livro          [Undo] [Redo] [Foco] [IA]   │
├──────────┬──────────────────────────────────────┬───────────────┤
│          │                                      │               │
│  LEFT    │       CANVAS DE ESCRITA              │    RIGHT      │
│  SIDEBAR │       (área principal)               │    PANEL      │
│  (264px) │                                      │   (288px)     │
│          │   Texto fluindo como um livro,       │               │
│ Capítulos│   com falas de personagens           │  IA Chat      │
│ Persona- │   identificadas por cor e avatar     │  Mídia        │
│ gens     │                                      │  Propriedades │
│ Ferramen-│   [+ Nova fala]                      │               │
│ tas      │                                      │               │
│          │                                      │               │
├──────────┴──────────────────────────────────────┴───────────────┤
│                     STATUS BAR (36px)                            │
│  6 falas · 847 palavras · 2/6 narradas         Salvo · ⌘K      │
└─────────────────────────────────────────────────────────────────┘
```

### As Três Zonas

**1. Sidebar Esquerda — Estrutura & Navegação**
- Árvore de capítulos com indicadores de status (•verde, •amarelo, •cinza)
- Expandir capítulo mostra mini-preview das falas
- Lista de personagens com cores e vozes
- Ferramentas do capítulo atual (trilha sonora, narrar tudo, IA, exportar)
- Estatísticas compactas (falas, palavras)
- Colapsável para maximizar área de escrita

**2. Canvas Central — Escrita Livre**
- Texto flui como um livro/manuscrito com tipografia serifada
- Falas do narrador em itálico cinza (sem indicador de personagem)
- Falas de personagens com borda colorida lateral + avatar + nome
- Clique no texto abre edição inline (sem modal, sem navegação)
- Tags SSML substituídas por **botões visuais** na barra de edição
- Indicadores discretos de mídia gerada (ícones de áudio, imagem)
- Ações rápidas aparecem ao passar o mouse (gerar áudio, imagem, IA)
- Botão "Nova fala" no final do fluxo, com seleção visual de personagem
- **Modo Foco**: esconde ambas sidebars, canvas ocupa 100%

**3. Painel Direito — Ferramentas Contextuais**
- **Aba IA**: Chat com assistente + ações rápidas (revisar, sugerir, enriquecer, reescrever)
- **Aba Mídia**: Gerar imagem, cena, áudio TTS, áudio ambiente para fala selecionada; trilha sonora e ambiente do capítulo
- **Aba Propriedades**: Título, status, notas do capítulo
- Colapsável quando não necessário

---

## Solução para Cada Problema

### 1.1 — Muitos Passos → Tela Única

| Antes (7+ telas) | Depois (1 tela) |
|---|---|
| Dashboard → Lista Livros → Detalhe → Capítulo → Falas | Sidebar mostra toda a árvore, clique direto no capítulo |
| Modal para editar fala | Clique inline no texto |
| Tela separada para IA | Painel lateral com chat integrado |
| Tela separada para narração | Botão direto na fala ou no capítulo |

### 1.2 — Navegação Confusa → Hierarquia Visual Clara

A sidebar esquerda funciona como um "file tree" (similar ao VS Code), onde:
- Capítulos são nós expansíveis
- Falas são sub-itens com preview
- Personagens são acessíveis no mesmo contexto
- Ferramentas do capítulo ficam agrupadas

Não há mais breadcrumbs profundos. A localização é sempre evidente.

### 1.3 — Área de Escrita Pequena → Canvas de Largura Total

O canvas central ocupa todo o espaço disponível (flexível) com:
- Largura máxima de 768px para leitura confortável
- Centralizado na tela
- Margem generosa para "respirar"
- Modo Foco esconde tudo menos o texto
- Sem tabelas, sem colunas de ações

### 1.4 — Tags SSML Técnicas → Botões Visuais

As tags SSML são abstraídas em uma **barra de ferramentas inline** que aparece durante a edição:

| Botão | Ação | SSML gerado (invisível para o usuário) |
|---|---|---|
| ⏸ Pausa | Insere marcador visual de pausa | `<break time="500ms"/>` |
| 📢 Ênfase | Destaca o texto selecionado | `<emphasis level="strong">` |
| ↑ Tom ↑ | Aumenta o tom | `<prosody pitch="high">` |
| ↓ Tom ↓ | Diminui o tom | `<prosody pitch="low">` |
| ⚡ Sussurro | Aplica sussurro | `<amazon:effect name="whispered">` |
| **N** Negrito | Negrito visual | Sem SSML, só formatação |
| *I* Itálico | Itálico visual | Sem SSML, só formatação |

O escritor vê:
```
O sol se punha lentamente ⏸500ms sobre a cidade de São Paulo.
```

O sistema gera internamente:
```xml
<speak>O sol se punha lentamente <break time="500ms"/> sobre a cidade de São Paulo.</speak>
```

### 1.5 — Inclusão Difícil + Leitura como Tabela → Fluxo de Livro

**Adicionar fala**: Botão no final do texto abre área inline com:
- Seleção visual de personagem (chips coloridos com avatar)
- Textarea amplo com placeholder convidativo
- Ctrl+Enter para adicionar rapidamente
- Fala adicionada flui diretamente no texto

**Leitura como livro**: As falas são renderizadas com tipografia literária:
- Narrador: texto em itálico, cor suave, sem borda
- Personagens: borda lateral colorida, nome e avatar discretos acima
- Emoção indicada como tag sutil (badge em itálico)
- Fluxo contínuo vertical como um manuscrito

### 1.6 — Tudo em Uma Tela

Todos os controles estão disponíveis sem navegação:
- **Selecionar falas**: Checkbox aparece no hover, barra de ações no topo
- **IA para seleção**: Selecionar 1+ falas → botão IA na toolbar
- **IA para capítulo inteiro**: Botão na sidebar esquerda
- **Narrar**: Botão por fala (hover) ou para capítulo (sidebar)
- **Trocar capítulo**: Clique na sidebar, canvas atualiza
- **Editar personagens**: Clique na sidebar, painel lateral abre

### 1.7 — Mídia por Fala e por Capítulo

**Por fala** (ações no hover):
- 🎙️ Gerar áudio TTS
- 📷 Gerar imagem da cena
- 🌧️ Gerar áudio ambiente
- ✨ Assistente IA

**Por capítulo** (sidebar esquerda):
- 🎵 Trilha sonora
- 🎙️ Narrar capítulo inteiro
- ✨ IA no capítulo todo
- 📥 Exportar áudio

### 1.8 — Usabilidade como Prioridade

Decisões de UX orientadas ao escritor:

- **Tipografia serifada** (Source Serif 4) no canvas — como escrever em um livro real
- **Tipografia sans-serif** (DM Sans) nos controles — clareza funcional
- **Tema escuro** — reduz fadiga visual em sessões longas de escrita
- **Modo Foco** — elimina todas as distrações
- **Atalhos de teclado** — Ctrl+Enter (salvar), Esc (cancelar), ⌘K (atalhos)
- **Auto-save** — nunca perder trabalho
- **Indicadores discretos** — mídia e status sem poluir a leitura
- **Animações suaves** — feedback visual sem interrupções

---

## Evolução Futura (Extensibilidade)

O design de painel direito com abas permite adicionar novas ferramentas facilmente:

| Ferramenta Futura | Implementação |
|---|---|
| Análise de consistência | Nova aba no painel direito |
| Geração de capas | Nova aba ou ação na sidebar |
| Colaboração em tempo real | Cursores no canvas + chat |
| Versões e histórico | Nova aba no painel direito |
| Tradução automática | Ação de IA no painel |
| Pesquisa de referências | Nova aba no painel direito |
| Mapa de personagens | Nova seção na sidebar |
| Timeline do enredo | Nova aba no painel direito |

---

## Impacto Esperado

| Métrica | Antes | Depois |
|---|---|---|
| Cliques para editar uma fala | 4-6 | 1 (clique inline) |
| Telas para escrever um capítulo | 3-4 | 1 |
| Tempo para adicionar fala | ~30s (modal + formulário) | ~5s (inline) |
| Tempo para aplicar tag SSML | ~20s (editar XML) | ~2s (clique no botão) |
| Curva de aprendizado | Alta (SSML, navegação) | Baixa (visual, intuitivo) |

---

**Este documento acompanha o protótipo interativo em `livrya-writer-studio.jsx`.**
