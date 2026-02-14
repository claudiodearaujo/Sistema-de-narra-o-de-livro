# Configuração de Sessão - Sistema de Narração de Livro

## Visão Geral

Este documento descreve a configuração do sistema de sessão para o WriterCenterFront e backend, incluindo todas as variáveis de ambiente necessárias e seu comportamento padrão.

## Variáveis de Ambiente do Backend

### JWT Authentication

Configure estas variáveis no arquivo `.env` do backend para controlar a duração da sessão:

```bash
# Segredo para assinatura de tokens de acesso (obrigatório em produção)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Segredo para assinatura de tokens de refresh (obrigatório em produção)
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# Duração do token de acesso (padrão: 2d - 2 dias)
# Formatos suportados: 1h, 2d, 7d, etc.
# Este controle por quanto tempo o usuário permanece logado
JWT_EXPIRES_IN=2d

# Duração do token de refresh (padrão: 30d - 30 dias)
# Formatos suportados: 7d, 30d, 90d, etc.
# Após este período, o usuário deve fazer login novamente
# Deve ser maior que JWT_EXPIRES_IN
JWT_REFRESH_EXPIRES_IN=30d
```

### Valores Padrão

Se as variáveis de ambiente não forem configuradas, o sistema usará os seguintes valores padrão:

- **JWT_EXPIRES_IN**: `2d` (2 dias = 172.800 segundos)
- **JWT_REFRESH_EXPIRES_IN**: `30d` (30 dias)

## Comportamento da Sessão

### 1. Login Inicial

Quando um usuário faz login:
- Um **access token** é gerado com validade de 2 dias (padrão)
- Um **refresh token** é gerado com validade de 30 dias (padrão)
- O refresh token é armazenado no banco de dados
- Ambos os tokens são enviados ao frontend

### 2. Persistência da Sessão

O frontend armazena:
- Dados do usuário
- Token de acesso
- Data de expiração da sessão
- Estado de autenticação

Ao retornar ao navegador:
- O sistema verifica se a sessão ainda é válida
- Se válida, restaura a sessão automaticamente
- Se expirada mas o refresh token for válido, renova automaticamente
- Se tudo expirou, redireciona para login

### 3. Renovação Automática

Quando um token de acesso expira:
- O sistema tenta renovar usando o refresh token
- Máximo de 3 tentativas com intervalo de 5 segundos
- Se bem-sucedido, obtém novo access token
- Se falhar, limpa a sessão e redireciona para login

### 4. Proteção Contra Loops

O sistema implementa proteções contra loops infinitos de requisições:

- **Limite de Tentativas**: Máximo de 3 tentativas de refresh
- **Cooldown**: 5 segundos entre tentativas de refresh
- **Cancelamento de Queries**: Todas as queries React Query são canceladas em erro 401
- **Sem Retry em 401**: Queries não são repetidas automaticamente em erros de autenticação

## Recomendações de Configuração

### Desenvolvimento

```bash
JWT_EXPIRES_IN=2d
JWT_REFRESH_EXPIRES_IN=30d
```

### Produção

```bash
# Tokens de curta duração (mais seguro)
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# OU tokens de longa duração (melhor UX)
JWT_EXPIRES_IN=2d
JWT_REFRESH_EXPIRES_IN=30d
```

**Importante**: Sempre use segredos fortes em produção. Gere-os com:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Segurança

### Boas Práticas

1. **Nunca commite** arquivos `.env` no Git
2. **Use segredos diferentes** para desenvolvimento e produção
3. **Tokens de refresh** devem ser mais longos que tokens de acesso
4. **Revogue tokens** ao trocar senha ou logout
5. **Monitore** tentativas de refresh falhadas

### Rotação de Tokens

Em caso de comprometimento:

1. Mude `JWT_SECRET` e `JWT_REFRESH_SECRET`
2. Todos os usuários precisarão fazer login novamente
3. Tokens antigos serão invalidados automaticamente

## Troubleshooting

### Problema: Sessão perde ao voltar ao navegador

**Solução**: Verifique se:
- localStorage não está sendo limpo pelo navegador
- Os tokens estão sendo salvos corretamente
- A data de expiração está sendo calculada corretamente

### Problema: Loop infinito de requisições

**Solução**: Já implementado:
- Limite de 3 tentativas de refresh
- Cooldown de 5 segundos
- Cancelamento de queries em 401
- Sem retry automático em erros de auth

### Problema: Sessão expira muito rápido

**Solução**: Aumente `JWT_EXPIRES_IN`:
```bash
JWT_EXPIRES_IN=7d  # 7 dias
```

### Problema: Usuários permanecem logados por muito tempo

**Solução**: Reduza `JWT_EXPIRES_IN` e `JWT_REFRESH_EXPIRES_IN`:
```bash
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

## Monitoramento

Logs importantes para monitorar:

```
[HTTP] Token refresh on cooldown
[HTTP] Max refresh attempts reached
[HTTP] Session expired, clearing auth
[AuthGuard] Session restored from storage
[AuthGuard] Session refreshed successfully
[QueryClient] Auth error detected, clearing all queries
```

Estes logs ajudam a diagnosticar problemas de sessão em produção.
