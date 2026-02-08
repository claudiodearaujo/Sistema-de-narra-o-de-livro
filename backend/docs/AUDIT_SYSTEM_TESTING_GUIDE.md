# 🧪 Guia de Testes Manuais - Sistema de Auditoria

## 📋 Objetivo

Este guia fornece um roteiro completo para testar manualmente todas as funcionalidades do sistema de auditoria antes do deploy em produção.

---

## ✅ Pré-requisitos

- [ ] Backend rodando em `http://localhost:3000`
- [ ] Frontend rodando em `http://localhost:4200`
- [ ] Banco de dados com migration `add_audit_logging` aplicada
- [ ] Usuário com role `ADMIN` criado
- [ ] Usuário com role `USER` criado (para testes de permissão)

---

## 🔐 Teste 1: Segurança WebSocket (CRÍTICO)

### **Objetivo:** Verificar que apenas admins recebem eventos de auditoria

### **Passos:**

1. **Abrir duas abas do navegador:**
   - Aba 1: Login como ADMIN
   - Aba 2: Login como USER

2. **Abrir DevTools (F12) em ambas as abas**
   - Ir para a aba "Network" → "WS" (WebSocket)

3. **Na Aba 1 (Admin):**
   - Navegar para `/admin/audit-logs`
   - Verificar no DevTools que o WebSocket conectou
   - Procurar mensagem: `Admin {userId} joined admin-room`

4. **Na Aba 2 (User):**
   - Tentar navegar para `/admin/audit-logs`
   - **Esperado:** Redirecionado para `/` (sem permissão)
   - Verificar no DevTools que NÃO há mensagem de `admin-room`

5. **Executar uma ação auditável (qualquer aba):**
   - Criar um livro
   - Fazer logout/login
   - Editar perfil

6. **Verificar eventos WebSocket:**
   - **Aba 1 (Admin):** Deve receber evento `audit:new` ✅
   - **Aba 2 (User):** NÃO deve receber evento `audit:new` ✅

### **Resultado Esperado:**
✅ Apenas admins recebem eventos de auditoria via WebSocket

---

## 📊 Teste 2: Dashboard de Auditoria

### **Objetivo:** Verificar funcionalidades do dashboard

### **Passos:**

1. **Login como ADMIN**
2. **Navegar para `/admin/audit-logs`**

3. **Verificar Cards de Estatísticas:**
   - [ ] "Total Geral" exibe número > 0
   - [ ] "Últimas 24h" exibe número correto
   - [ ] "Alertas Críticos" exibe contagem de logs CRITICAL
   - [ ] "Erros Sistema" exibe contagem de logs SYSTEM

4. **Verificar Tabela de Logs:**
   - [ ] Logs são exibidos em ordem decrescente (mais recente primeiro)
   - [ ] Colunas: Data, Usuário, Ação, Severidade, Recurso, Descrição
   - [ ] Paginação funciona (10, 25, 50, 100 registros por página)
   - [ ] Ordenação por coluna funciona (clique no header)

5. **Testar Filtros:**
   - **Busca Textual:**
     - Digitar email de um usuário
     - **Esperado:** Apenas logs desse usuário aparecem
   - **Severidade:**
     - Selecionar "CRITICAL"
     - **Esperado:** Apenas logs críticos aparecem
   - **Categoria:**
     - Selecionar "AUTH"
     - **Esperado:** Apenas logs de autenticação aparecem
   - **Período:**
     - Selecionar data de hoje
     - **Esperado:** Apenas logs de hoje aparecem

6. **Testar Debounce na Busca:**
   - Digitar rapidamente: "t", "te", "tes", "test"
   - Abrir DevTools → Network
   - **Esperado:** Apenas 1 request após 500ms ✅

7. **Limpar Filtros:**
   - Clicar em "Limpar Filtros"
   - **Esperado:** Todos os filtros resetados

### **Resultado Esperado:**
✅ Dashboard funciona corretamente com filtros e paginação

---

## 🔴 Teste 3: Alertas Críticos em Tempo Real

### **Objetivo:** Verificar notificações para eventos CRITICAL

### **Passos:**

1. **Login como ADMIN**
2. **Navegar para `/admin/audit-logs`**
3. **Deixar a página aberta**

4. **Em outra aba/janela:**
   - Fazer 5 tentativas de login com senha errada
   - OU executar uma ação administrativa crítica

5. **Voltar para a aba do dashboard:**
   - **Esperado:** Toast vermelho persistente aparece no canto da tela
   - **Conteúdo:** "ALERTA CRÍTICO: AUTH_LOGIN_FAILED: ..."
   - **Comportamento:** Toast não desaparece automaticamente (sticky: true)

6. **Verificar atualização automática:**
   - **Esperado:** Card "Alertas Críticos" incrementa automaticamente
   - **Esperado:** Novo log aparece no topo da tabela (se estiver na página 1 sem filtros)

### **Resultado Esperado:**
✅ Alertas críticos são exibidos em tempo real com toast persistente

---

## 📥 Teste 4: Exportação de Logs

### **Objetivo:** Verificar exportação CSV e JSON

### **Passos:**

1. **Login como ADMIN**
2. **Navegar para `/admin/audit-logs`**

3. **Exportar CSV (sem filtros):**
   - Clicar em "CSV"
   - **Esperado:** Download de arquivo `audit-logs-{timestamp}.csv`
   - Abrir arquivo no Excel/Google Sheets
   - **Verificar:** Headers corretos, dados formatados

4. **Exportar JSON (sem filtros):**
   - Clicar em "JSON"
   - **Esperado:** Download de arquivo `audit-logs-{timestamp}.json`
   - Abrir arquivo em editor de texto
   - **Verificar:** JSON válido, dados completos

5. **Exportar com Filtros:**
   - Aplicar filtro: Severidade = "CRITICAL"
   - Clicar em "CSV"
   - **Esperado:** Apenas logs CRITICAL no arquivo

6. **Testar Rate Limiting:**
   - Criar >100.000 logs (via script ou seed)
   - Tentar exportar sem filtros
   - **Esperado:** Erro 400 com mensagem:
     ```json
     {
       "error": "Exportação limitada a 100000 registros. Total encontrado: 150000",
       "maxRecords": 100000
     }
     ```

### **Resultado Esperado:**
✅ Exportação funciona corretamente com rate limiting

---

## 🔍 Teste 5: Visualizador de Detalhes

### **Objetivo:** Verificar modal de detalhes do log

### **Passos:**

1. **Login como ADMIN**
2. **Navegar para `/admin/audit-logs`**
3. **Clicar no ícone de olho (👁️) em qualquer log**

4. **Verificar Modal:**
   - [ ] Título: "Detalhes do Log: {ACTION}"
   - [ ] Seção "Informações Básicas":
     - ID, Timestamp, Ação, Categoria, Severidade
   - [ ] Seção "Contexto":
     - Usuário, Email, IP, Resultado, Duração
   - [ ] Seção "Requisição":
     - Método HTTP, Endpoint, Status Code
   - [ ] Seção "Metadata / Payload":
     - JSON formatado e legível
     - Campos sensíveis aparecem como `[REDACTED]` ✅

5. **Verificar Sanitização:**
   - Procurar por campos como `password`, `token`, `apiKey`
   - **Esperado:** Todos aparecem como `[REDACTED]`

6. **Fechar Modal:**
   - Clicar em "Fechar"
   - **Esperado:** Modal fecha corretamente

### **Resultado Esperado:**
✅ Modal exibe detalhes completos com dados sensíveis sanitizados

---

## 🔄 Teste 6: Atualização Automática

### **Objetivo:** Verificar refresh automático de stats e logs

### **Passos:**

1. **Login como ADMIN**
2. **Navegar para `/admin/audit-logs`**
3. **Deixar a página aberta**

4. **Em outra aba/janela:**
   - Executar 10 ações auditáveis:
     - Criar 3 livros
     - Fazer 2 logins
     - Editar perfil 5 vezes

5. **Voltar para a aba do dashboard:**
   - **Verificar Cards:**
     - "Total Geral" incrementou em +10
     - "Últimas 24h" incrementou em +10
   - **Verificar Tabela:**
     - Novos logs aparecem no topo (se página 1, sem filtros)
     - Timestamp dos novos logs é recente

6. **Clicar em "Atualizar":**
   - **Esperado:** Loading spinner aparece
   - **Esperado:** Dados são recarregados do servidor

### **Resultado Esperado:**
✅ Dashboard atualiza automaticamente via WebSocket

---

## 🚫 Teste 7: Controle de Acesso

### **Objetivo:** Verificar que apenas admins acessam o dashboard

### **Passos:**

1. **Login como USER (não-admin)**
2. **Tentar navegar para `/admin/audit-logs`**
   - **Esperado:** Redirecionado para `/` ou `/writer`
   - **Esperado:** Mensagem de erro (opcional)

3. **Verificar Menu:**
   - **Esperado:** Menu "Admin" NÃO aparece no sidebar

4. **Tentar acessar API diretamente:**
   - Abrir DevTools → Console
   - Executar:
     ```javascript
     fetch('http://localhost:3000/api/admin/audit/logs', {
       headers: { 'Authorization': 'Bearer {user-token}' }
     }).then(r => r.json()).then(console.log)
     ```
   - **Esperado:** Erro 403 Forbidden

5. **Login como ADMIN**
6. **Verificar Menu:**
   - **Esperado:** Menu "Admin" aparece no sidebar
   - **Esperado:** Submenu "Logs de Auditoria" visível

### **Resultado Esperado:**
✅ Apenas admins podem acessar o sistema de auditoria

---

## 🧹 Teste 8: Purga de Logs Antigos

### **Objetivo:** Verificar retention policy

### **Passos:**

1. **Criar logs antigos (via SQL):**
   ```sql
   -- Criar log de 100 dias atrás (LOW severity)
   INSERT INTO audit_logs (
     id, action, category, severity, created_at
   ) VALUES (
     gen_random_uuid(), 'AUTH_LOGIN', 'AUTH', 'LOW', NOW() - INTERVAL '100 days'
   );
   ```

2. **Executar worker de purga:**
   ```bash
   cd backend
   npm run worker:audit-purge
   ```

3. **Verificar resultado:**
   - **Esperado:** Logs LOW com >90 dias foram deletados
   - **Esperado:** Logs CRITICAL com <365 dias foram mantidos

4. **Verificar logs do worker:**
   ```
   [AUDIT] Purged 150 old logs
   ```

### **Resultado Esperado:**
✅ Purga automática funciona conforme retention policy

---

## 📊 Teste 9: Performance

### **Objetivo:** Verificar performance com grande volume de dados

### **Passos:**

1. **Criar 10.000 logs de teste:**
   ```bash
   cd backend
   npm run seed:audit-logs
   ```

2. **Navegar para `/admin/audit-logs`**
3. **Medir tempo de carregamento:**
   - Abrir DevTools → Network
   - Verificar tempo de resposta da API `/api/admin/audit/logs`
   - **Esperado:** < 500ms

4. **Testar paginação:**
   - Navegar para página 100
   - **Esperado:** Carrega em < 500ms

5. **Testar busca:**
   - Digitar email de usuário
   - **Esperado:** Resultado em < 300ms (com debounce)

6. **Testar export:**
   - Exportar 10.000 logs como CSV
   - **Esperado:** Download completo em < 5s

### **Resultado Esperado:**
✅ Sistema mantém performance aceitável com 10k+ logs

---

## 🐛 Teste 10: Tratamento de Erros

### **Objetivo:** Verificar graceful degradation

### **Passos:**

1. **Simular falha de rede:**
   - Abrir DevTools → Network
   - Ativar "Offline"
   - Tentar carregar logs
   - **Esperado:** Mensagem de erro amigável

2. **Simular erro no backend:**
   - Parar o servidor backend
   - Tentar carregar logs
   - **Esperado:** Mensagem de erro + botão "Tentar Novamente"

3. **Simular WebSocket desconectado:**
   - Parar o servidor backend
   - Aguardar 10s
   - Reiniciar servidor
   - **Esperado:** WebSocket reconecta automaticamente

4. **Simular export muito grande:**
   - Tentar exportar >100k logs
   - **Esperado:** Erro 400 com mensagem clara

### **Resultado Esperado:**
✅ Sistema trata erros gracefully sem quebrar

---

## ✅ Checklist Final

Antes de aprovar para produção:

- [ ] Teste 1: Segurança WebSocket ✅
- [ ] Teste 2: Dashboard de Auditoria ✅
- [ ] Teste 3: Alertas Críticos ✅
- [ ] Teste 4: Exportação de Logs ✅
- [ ] Teste 5: Visualizador de Detalhes ✅
- [ ] Teste 6: Atualização Automática ✅
- [ ] Teste 7: Controle de Acesso ✅
- [ ] Teste 8: Purga de Logs Antigos ✅
- [ ] Teste 9: Performance ✅
- [ ] Teste 10: Tratamento de Erros ✅

---

## 📝 Relatório de Bugs

Se encontrar algum bug durante os testes, documente aqui:

| # | Teste | Descrição do Bug | Severidade | Status |
|---|-------|------------------|------------|--------|
| 1 | | | | |
| 2 | | | | |

---

## 👥 Responsáveis

- **QA Lead:** _____________
- **Dev Lead:** _____________
- **Data:** _____________

---

**Assinatura:** ___________________
