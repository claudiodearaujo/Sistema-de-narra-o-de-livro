# Análise de Fluxo de Obtenção de Capítulos

**Data:** 2026-02-12  
**Autor:** Análise Técnica do Sistema  
**URL Problemática:** https://writer.livrya.com.br/book/bc1e2edb-2fe9-4e48-bb6c-64252a1c39ad

---

## 1. Fluxo de Obtenção de Capítulos - Frontend Social (LivryaFrontSocial)

### 1.1 Estrutura do Frontend Social
- **Framework:** Angular (standalone components)
- **Localização:** `/Frontend/LivryaFrontSocial`
- **Componente Principal:** `chapter-list.component.ts`

### 1.2 Fluxo de Requisição

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND SOCIAL - ANGULAR                                       │
└─────────────────────────────────────────────────────────────────┘

1. Componente: chapter-list.component.ts
   ├─ Método: loadChapters()
   ├─ Chama: chapterService.getByBookId(bookId)
   └─ Localização: src/app/features/writer/pages/chapters/chapter-list/

2. Service: ChapterService
   ├─ Método: getByBookId(bookId: string): Observable<Chapter[]>
   ├─ Endpoint: ${apiUrl}/books/${bookId}/chapters
   ├─ HTTP: GET request via HttpClient
   └─ Localização: src/app/core/services/chapter.service.ts

3. Configuração de Ambiente
   ├─ Arquivo: src/environments/environment.ts
   ├─ API URL (dev): https://sistema-de-narra-o-de-livro.onrender.com/api
   ├─ API URL (prod): https://sistema-de-narra-o-de-livro.onrender.com/api
   └─ WebSocket: https://sistema-de-narra-o-de-livro.onrender.com

4. URL Final da Requisição:
   https://sistema-de-narra-o-de-livro.onrender.com/api/books/{bookId}/chapters
```

### 1.3 Código do Service (Social)

```typescript
// Frontend/LivryaFrontSocial/src/app/core/services/chapter.service.ts
getByBookId(bookId: string): Observable<Chapter[]> {
    return this.http.get<Chapter[]>(`${this.apiUrl}/books/${bookId}/chapters`);
}
```

**Status:** ✅ **FUNCIONANDO CORRETAMENTE**

---

## 2. Fluxo de Obtenção de Capítulos - Frontend Writer (WriterCenterFront)

### 2.1 Estrutura do Frontend Writer
- **Framework:** React + TypeScript + Vite
- **Localização:** `/Frontend/WriterCenterFront`
- **Página Principal:** `StudioPage.tsx`
- **State Management:** Zustand stores
- **Data Fetching:** TanStack Query (React Query)

### 2.2 Fluxo de Requisição

```
┌─────────────────────────────────────────────────────────────────┐
│ FRONTEND WRITER - REACT                                         │
└─────────────────────────────────────────────────────────────────┘

1. Rota: /book/:bookId
   ├─ Componente: StudioPage.tsx
   ├─ Params: { bookId: "bc1e2edb-2fe9-4e48-bb6c-64252a1c39ad" }
   └─ Localização: src/features/studio/StudioPage.tsx

2. Hook: useStudio()
   ├─ Chama: useChapters(activeBookId)
   ├─ Extrai: bookId dos params da rota
   ├─ Define: activeBookId no store Zustand
   └─ Localização: src/features/studio/hooks/useStudio.ts

3. Hook de Dados: useChapters(bookId)
   ├─ Query Key: ['chapters', bookId]
   ├─ Query Function: http.get(endpoints.chapters.list(bookId))
   ├─ Enabled: !!bookId
   ├─ Stale Time: 30 segundos
   └─ Localização: src/shared/hooks/useChapters.ts

4. Configuração de Endpoints
   ├─ Arquivo: src/shared/api/endpoints.ts
   ├─ Endpoint: `/books/${bookId}/chapters`
   └─ Base URL: Definida em http.ts via env.apiUrl

5. Cliente HTTP (Axios)
   ├─ Arquivo: src/shared/api/http.ts
   ├─ Base URL: env.apiUrl (de src/shared/lib/env.ts)
   ├─ Timeout: 30s
   ├─ Headers: 'X-Client-Id', 'Authorization'
   └─ With Credentials: true (cookies)

6. Configuração de Ambiente
   ├─ Arquivo: src/shared/lib/env.ts
   ├─ VITE_API_URL (fallback): 'http://localhost:3000' ⚠️ PROBLEMA!
   ├─ VITE_API_URL (prod): 'https://sistema-de-narra-o-de-livro.onrender.com/api'
   └─ Arquivo .env.prod: VITE_API_URL=...onrender.com/api ✅

7. URL Final Esperada:
   https://sistema-de-narra-o-de-livro.onrender.com/api/books/{bookId}/chapters
```

### 2.3 Código do Hook (Writer)

```typescript
// Frontend/WriterCenterFront/src/shared/hooks/useChapters.ts
export function useChapters(bookId: string | null) {
  return useQuery({
    queryKey: chapterKeys.byBook(bookId ?? ''),
    queryFn: async (): Promise<Chapter[]> => {
      const { data } = await http.get(endpoints.chapters.list(bookId!));
      return data;
    },
    enabled: !!bookId,
    staleTime: 30_000,
  });
}
```

```typescript
// Frontend/WriterCenterFront/src/shared/api/endpoints.ts
chapters: {
  list: (bookId: string) => `/books/${bookId}/chapters`,
  byId: (id: string) => `/chapters/${id}`,
  // ...
}
```

**Status:** ⚠️ **PROBLEMA IDENTIFICADO**

---

## 3. Fluxo do Backend

### 3.1 Estrutura do Backend
- **Framework:** Express + TypeScript
- **Localização:** `/backend`
- **ORM:** Prisma
- **Database:** PostgreSQL (Supabase)

### 3.2 Fluxo de Processamento

```
┌─────────────────────────────────────────────────────────────────┐
│ BACKEND - EXPRESS                                               │
└─────────────────────────────────────────────────────────────────┘

1. Rota HTTP
   ├─ URL: GET /api/books/:bookId/chapters
   ├─ Middleware: optionalAuth (permite acesso com ou sem token)
   ├─ Controller: chaptersController.getByBookId
   └─ Localização: src/routes/chapters.routes.ts

2. Controller: chaptersController
   ├─ Método: getByBookId(req, res)
   ├─ Extrai: bookId dos params
   ├─ Chama: chaptersService.getByBookId(bookId)
   ├─ Transforma: chapter data (orderIndex -> order)
   ├─ Calcula: wordCount, speechesCount
   └─ Localização: src/controllers/chapters.controller.ts

3. Service: chaptersService
   ├─ Método: getByBookId(bookId)
   ├─ Query: prisma.chapter.findMany({ where: { bookId }, orderBy: { orderIndex: 'asc' }})
   ├─ Include: speeches (para contagem)
   └─ Localização: src/services/chapters.service.ts

4. Database Query
   ├─ Table: chapter
   ├─ Filters: WHERE bookId = '{bookId}'
   ├─ Order: ORDER BY orderIndex ASC
   ├─ Includes: speeches (relation)
   └─ Returns: Chapter[] com speeches

5. Response Format
   ├─ Transform: orderIndex → order
   ├─ Computed: wordCount (from speeches text)
   ├─ Computed: speechesCount (speeches.length)
   └─ HTTP 200: JSON array de chapters
```

### 3.3 Código do Controller (Backend)

```typescript
// backend/src/controllers/chapters.controller.ts
async getByBookId(req: Request, res: Response) {
    try {
        const bookId = req.params.bookId as string;
        const chapters = await chaptersService.getByBookId(bookId);
        const transformed = chapters.map(transformChapter);
        res.json(transformed);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to fetch chapters',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
```

```typescript
// backend/src/services/chapters.service.ts
async getByBookId(bookId: string) {
    return await prisma.chapter.findMany({
        where: { bookId },
        orderBy: { orderIndex: 'asc' },
        include: {
            speeches: true,
        },
    });
}
```

**Status:** ✅ **FUNCIONANDO CORRETAMENTE**

---

## 4. PROBLEMA IDENTIFICADO

### 4.1 Localização do Problema

**Arquivo:** `/Frontend/WriterCenterFront/src/shared/lib/env.ts`  
**Linha:** 2

### 4.2 Código Problemático

```typescript
export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000', // ❌ FALTA /api
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  ssoUrl: import.meta.env.VITE_SSO_URL || 'http://localhost:4200/auth/sso/authorize',
  // ...
} as const;
```

### 4.3 Análise do Problema

#### Problema Principal: Fallback URL Incorreto

Quando a variável de ambiente `VITE_API_URL` não está definida (ou não é carregada corretamente), o código usa o valor fallback `'http://localhost:3000'`.

**O problema é:** O fallback está faltando o sufixo `/api`

#### Consequências

1. **URL Construída Incorretamente:**
   - Esperado: `http://localhost:3000/api/books/{bookId}/chapters`
   - Atual (com fallback): `http://localhost:3000/books/{bookId}/chapters`

2. **Rota Não Encontrada (404):**
   - O backend não tem rota registrada em `/books/...`
   - Todas as rotas estão sob `/api/...`

3. **Capítulos Não Carregam:**
   - O hook `useChapters` recebe erro 404
   - A UI mostra estado de loading infinito ou erro

### 4.4 Contexto do Problema

#### Por que acontece?

O problema ocorre quando:
- A aplicação roda em ambiente de produção
- As variáveis de ambiente não são carregadas corretamente
- O build/deploy não injeta as variáveis de ambiente
- O fallback é usado como valor padrão

#### Evidência em Produção

URL Problemática: `https://writer.livrya.com.br/book/bc1e2edb-2fe9-4e48-bb6c-64252a1c39ad`

Se o `.env.prod` não está sendo usado ou as variáveis não estão sendo injetadas no build, o app usa o fallback, resultando em:

```
Request URL: http://localhost:3000/books/bc1e2edb-2fe9-4e48-bb6c-64252a1c39ad/chapters
Expected URL: https://sistema-de-narra-o-de-livro.onrender.com/api/books/bc1e2edb-2fe9-4e48-bb6c-64252a1c39ad/chapters
```

Ou, se o VITE_API_URL estiver definido mas sem o `/api`:
```
Request URL: https://sistema-de-narra-o-de-livro.onrender.com/books/bc1e2edb-2fe9-4e48-bb6c-64252a1c39ad/chapters (404)
```

---

## 5. SOLUÇÃO RECOMENDADA

### 5.1 Correção Imediata

**Arquivo:** `/Frontend/WriterCenterFront/src/shared/lib/env.ts`

```typescript
export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', // ✅ Adicionar /api
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  ssoUrl: import.meta.env.VITE_SSO_URL || 'http://localhost:4200/auth/sso/authorize',
  ssoClientId: import.meta.env.VITE_SSO_CLIENT_ID || 'livrya-writer-studio',
  ssoRedirectUri: import.meta.env.VITE_SSO_REDIRECT_URI || 'http://localhost:5173/auth/callback',
  appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:4200',
  writerUrl: import.meta.env.VITE_WRITER_URL || 'http://localhost:5173',
} as const;
```

### 5.2 Verificação de Deploy

#### Garantir que o `.env.prod` está sendo usado no build de produção:

1. **Vite Build Configuration:**
   ```bash
   # No build de produção, usar:
   vite build --mode production
   ```

2. **Verificar arquivo `.env.prod`:**
   ```bash
   VITE_API_URL=https://sistema-de-narra-o-de-livro.onrender.com/api
   VITE_WS_URL=https://sistema-de-narra-o-de-livro.onrender.com
   VITE_SSO_URL=https://www.livrya.com.br/auth/sso/authorize
   VITE_SSO_CLIENT_ID=livrya-writer-studio
   VITE_SSO_REDIRECT_URI=https://writer.livrya.com.br/auth/callback
   VITE_APP_URL=https://www.livrya.com.br
   VITE_WRITER_URL=https://writer.livrya.com.br
   ```

3. **Verificar no navegador:**
   - Abrir DevTools → Console
   - Executar: `import.meta.env.VITE_API_URL`
   - Deve retornar: `"https://sistema-de-narra-o-de-livro.onrender.com/api"`

4. **Verificar CORS no Backend:**
   - Garantir que `ALLOWED_ORIGINS` no backend inclui o Writer Frontend
   - Adicionar em `.env` do backend:
   ```bash
   ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000,http://localhost:5173,https://www.livrya.com.br,https://writer.livrya.com.br
   ```

### 5.3 Melhorias Adicionais (Opcional)

#### Adicionar validação de ambiente:

```typescript
// src/shared/lib/env.ts
function getRequiredEnv(key: string, fallback: string): string {
  const value = import.meta.env[key] || fallback;
  
  if (import.meta.env.PROD && !import.meta.env[key]) {
    console.warn(`[ENV] Variable ${key} not set, using fallback: ${fallback}`);
  }
  
  return value;
}

export const env = {
  apiUrl: getRequiredEnv('VITE_API_URL', 'http://localhost:3000/api'),
  wsUrl: getRequiredEnv('VITE_WS_URL', 'ws://localhost:3000'),
  // ...
} as const;
```

---

## 6. COMPARAÇÃO: SOCIAL vs WRITER

### 6.1 Por que o Social Frontend funciona?

O Frontend Social (Angular) define a `apiUrl` corretamente em todos os ambientes:

```typescript
// Frontend/LivryaFrontSocial/src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'https://sistema-de-narra-o-de-livro.onrender.com/api', // ✅ Correto
  wsUrl: 'https://sistema-de-narra-o-de-livro.onrender.com',
  // ...
};
```

**Diferenças:**
1. Angular usa `environment.ts` e `environment.prod.ts` (sem variáveis de ambiente dinâmicas)
2. Os valores são hard-coded nos arquivos
3. Não depende de variáveis de ambiente em runtime
4. O build substitui os valores conforme a configuração

### 6.2 Por que o Writer Frontend falha?

O Frontend Writer (React/Vite) usa variáveis de ambiente dinâmicas:

1. **Vantagem:** Mais flexível, pode mudar sem rebuild
2. **Desvantagem:** Depende de configuração correta de deploy
3. **Problema:** Fallback incorreto causa falha silenciosa

---

## 8. POSSÍVEIS PROBLEMAS SECUNDÁRIOS

### 8.1 CORS - Cross-Origin Resource Sharing

**Descrição:** O backend pode bloquear requisições do Writer Frontend se a origem não estiver na lista de permitidos.

**Verificação:**
- Abrir DevTools → Network
- Verificar se há erro de CORS (status code `cors` ou mensagem de CORS blocked)

**Solução:**
Adicionar `https://writer.livrya.com.br` ao `ALLOWED_ORIGINS` no backend:

```bash
# backend/.env
ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000,http://localhost:5173,https://www.livrya.com.br,https://writer.livrya.com.br
```

### 8.2 Autenticação SSO

**Descrição:** O Writer Frontend usa SSO para autenticação. Se não estiver autenticado, algumas rotas podem falhar.

**Verificação:**
- A rota de capítulos usa `optionalAuth` (permite acesso sem token)
- Mas outras operações podem exigir autenticação

**Status:** Não deve ser a causa do problema atual (optionalAuth permite acesso)

### 8.3 Variáveis de Ambiente em Produção

**Descrição:** Se as variáveis de ambiente não forem injetadas corretamente no build, o fallback será usado.

**Verificação em Produção:**
1. Acessar https://writer.livrya.com.br
2. Abrir DevTools → Console
3. Executar: `window.location.origin` para confirmar o domínio
4. Verificar se há erros de rede no Network tab

**Possíveis Causas:**
- Build não usa `.env.prod`
- Variáveis de ambiente não definidas no host (Vercel, Netlify, etc.)
- Nome das variáveis não segue padrão `VITE_*`

---

## 9. CONCLUSÃO

## 9. CONCLUSÃO

### 9.1 Causa Raiz

**Problema:** Fallback URL em `env.ts` está faltando o sufixo `/api`

**Localização:** `/Frontend/WriterCenterFront/src/shared/lib/env.ts`, linha 2

**Impacto:** 
- Capítulos não carregam no Writer Frontend
- Requisição vai para URL incorreta (404 Not Found)
- UI fica travada em estado de loading ou mostra erro

### 9.2 Solução

**Ação Imediata:**
1. Adicionar `/api` ao fallback em `env.ts`
2. Verificar que `.env.prod` está sendo usado no build de produção
3. Rebuild e redeploy do Writer Frontend

**Ação de Longo Prazo:**
1. Adicionar testes de integração que validem URLs
2. Implementar health check que valida configuração de ambiente
3. Adicionar logs de debug para variáveis de ambiente em desenvolvimento

### 9.3 Status dos Componentes

| Componente | Status | Problema |
|------------|--------|----------|
| Backend API | ✅ Funcionando | Nenhum |
| Social Frontend (Angular) | ✅ Funcionando | Nenhum |
| Writer Frontend (React) | ❌ Com erro | Fallback URL incorreto |

### 9.4 Próximos Passos

1. ✅ Análise completa realizada
2. ⏳ Aplicar correção no código
3. ⏳ Testar localmente
4. ⏳ Deploy para produção
5. ⏳ Validar em https://writer.livrya.com.br/book/bc1e2edb-2fe9-4e48-bb6c-64252a1c39ad

---

**Documento gerado em:** 2026-02-12T23:34:00.000Z  
**Versão:** 1.0
