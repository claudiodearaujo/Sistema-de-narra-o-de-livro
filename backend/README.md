# Backend API (Sistema de Narração de Livro)

## Contrato oficial de autenticação (refresh token)

O padrão oficial do backend é:

- **Refresh token em cookie HttpOnly** (`refreshToken`), com `SameSite=Lax` e `path=/api/auth`.
- O cookie é emitido em `POST /api/auth/login`, `POST /api/auth/signup` e atualizado em `POST /api/auth/refresh`.
- `POST /api/auth/logout` invalida o token e remove o cookie.

### Compatibilidade temporária

Enquanto clientes antigos são migrados, `POST /api/auth/refresh` e `POST /api/auth/logout` também aceitam `refreshToken` no body.

> Prioridade de leitura no backend: **cookie HttpOnly primeiro**, depois `body.refreshToken`.

## Resumo de endpoints de auth

- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Retorno: `accessToken` + dados de usuário (e `refreshToken` para compatibilidade legada)
  - Efeito colateral: define cookie HttpOnly `refreshToken`

- `POST /api/auth/refresh`
  - Body: `{}` (padrão oficial)
  - Fallback legado: `{ refreshToken }`
  - Retorno: novo `accessToken` e rotação de `refreshToken`
  - Efeito colateral: atualiza cookie HttpOnly `refreshToken`

- `POST /api/auth/logout`
  - Body: `{}` (padrão oficial)
  - Fallback legado: `{ refreshToken }`
  - Efeito colateral: limpa cookie HttpOnly `refreshToken`

