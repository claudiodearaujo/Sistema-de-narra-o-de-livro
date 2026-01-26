# Relatório de Revisão de Código - Backend

**Data:** 25 de Janeiro de 2026
**Escopo:** Módulo Backend (`src/services`, `src/controllers`, `src/utils`)
**Revisor:** Agente Antigravity

Este documento detalha as descobertas da revisão de código realizada com base no checklist de padrões de segurança, funcionalidade e qualidade.

---

## 🚨 1. Problemas Críticos de Segurança (Alta Prioridade)

Estes problemas representam riscos imediatos à segurança da aplicação e dos dados dos usuários. Devem ser corrigidos imediatamente.

### A. Vulnerabilidade IDOR (Referência Direta Insegura a Objetos)
**Local:** `src/services/books.service.ts` (métodos `update` e `delete`)

**Descrição:**
Os métodos de atualização e exclusão de livros aceitam um `id` e executam a ação sem verificar se o usuário autenticado é realmente o **dono** daquele livro.

**Impacto:**
Qualquer usuário com perfil de escritor pode alterar ou deletar **QUALQUER** livro do sistema apenas adivinhando ou iterando sobre os IDs.

**Correção Recomendada:**
Alterar a assinatura dos métodos para receber o `userId` e validar a propriedade antes de prosseguir.

```typescript
// ❌ Atual (Vulnerável)
async update(id: string, data: UpdateBookDto) {
    // Busca apenas pelo ID
    const book = await prisma.book.findUnique({ where: { id } });
    // ...
}

// ✅ Recomendado
async update(id: string, userId: string, data: UpdateBookDto) {
    const book = await prisma.book.findUnique({ where: { id } });
    
    if (!book) throw new Error('Livro não encontrado');
    
    // Validação de Propriedade
    if (book.userId !== userId) {
        throw new Error('Acesso não autorizado a este livro');
    }
    // ... prosseguir com atualização
}
```

### B. Vazamento de Dados Sensíveis em Logs
**Local:** `src/services/auth.service.ts` (linhas 123, 144, 146, 148)

**Descrição:**
O serviço de autenticação está registrando explicitamente nos logs do console informações críticas como e-mails de usuários, **Tokens de Acesso (Access Tokens)** e **Tokens de Atualização (Refresh Tokens)**.

```typescript
// ❌ Código Problemático
console.log('generate access token:', accessToken); 
console.log('generate refresh token:', refreshToken);
```

**Impacto:**
Se estes logs forem persistidos (ex: CloudWatch, Datadog ou logs do Render), um atacante com acesso de leitura aos logs pode sequestrar qualquer sessão de usuário, incluindo administradores.

**Correção Recomendada:**
Remover imediatamente todas as chamadas de `console.log` que imprimem credenciais ou tokens.

---

## 🛡️ 2. Melhores Práticas de Segurança (Média Prioridade)

Melhorias para prevenir falhas futuras e fortalecer a postura de segurança.

### A. Uso de Segredos Padrão (Hardcoded Secrets)
**Local:** `src/utils/jwt.utils.ts`

**Descrição:**
O código fornece valores padrão inseguros ("fallback") caso as variáveis de ambiente não estejam definidas.

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
```

**Risco:**
Se a variável de ambiente falhar ao carregar em produção, o sistema continuará rodando silenciosamente com uma chave pública e insegura, permitindo a falsificação de tokens JWT.

**Correção Recomendada:**
Remover os valores padrão e lançar um erro fatal se a variável não estiver presente.

```typescript
if (!process.env.JWT_SECRET) {
    throw new Error('CRITICAL: JWT_SECRET environment variable is missing');
}
```

### B. Configuração CORS Permissiva
**Local:** `src/index.ts`

**Descrição:**
A configuração de CORS permite **todas** as origens quando `NODE_ENV === 'development'`.

**Risco:**
Isso pode mascarar problemas de integração que só aparecerão em produção e, se um ambiente de staging/produção for acidentalmente iniciado com esta flag, expõe a API a ataques CSRF/XSS de qualquer origem.

---

## 🧹 3. Qualidade e Manutenibilidade do Código

### A. Isolamento de Serviço (Service Layer Pattern)
Os controladores (`books.controller.ts`) estão corretamente delegando a lógica para os serviços. No entanto, a falta de contexto de usuário nos métodos do `BooksService` (mencionado no item 1.A) quebra o encapsulamento correto da lógica de negócio, pois obrigaria o Controller a fazer verificações extras ou deixaria o Serviço "cego" quanto a quem está operando.

### B. Tratamento de Erros
O código utiliza blocos `try/catch` nos controladores, o que é bom. Sugere-se padronizar as mensagens de erro ou criar uma classe `AppError` para gerenciar códigos HTTP (400, 401, 403, 404) de forma centralizada, evitando lógica repetitiva de `if (error.message === 'Book not found')` nos controladores.

---

## ✅ Plano de Ação Imediato

1.  **Sanepar Logs:** Editar `src/services/auth.service.ts` e remover logs de tokens.
2.  **Corrigir IDOR:** Refatorar `BooksService` e `BooksController` para impor verificação de propriedade (`userId`).
3.  **Endurecer Configuração:** Editar `src/utils/jwt.utils.ts` para exigir variáveis de ambiente.
