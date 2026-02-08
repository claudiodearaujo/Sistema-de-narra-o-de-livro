# ⚡ Corrigir Erro 404 no Render - PASSO A PASSO

## 🎯 Problema
`https://www.livrya.com.br/auth/login` retorna 404

## ✅ Solução Rápida (5 minutos)

### PASSO 1: Acesse o Dashboard Render

1. Abra: https://dashboard.render.com/static/srv-d5dshn6mcj7s73b0hn10
2. Faça login se necessário

### PASSO 2: Configure Redirects/Rewrites

**Opção A: Se houver menu "Redirects/Rewrites":**
1. Procure no menu lateral por **"Redirects/Rewrites"** ou **"Redirect Rules"**
2. Clique nele
3. Clique em **"Add Rule"** ou **"New Redirect"**
4. Preencha:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action/Type**: `Rewrite` (NÃO Redirect - importante!)
5. Salve

**Opção B: Se estiver em Settings:**
1. Vá em **"Settings"** no menu lateral
2. Role até encontrar **"Redirect/Rewrite Rules"**
3. Clique em **"Add Rule"**
4. Preencha:
   ```
   Source: /*
   Destination: /index.html
   Type: Rewrite
   ```
5. Salve

### PASSO 3: Verifique Build Settings

Ainda em Settings, verifique se está assim:
- **Build Command**: `npm install && npm run build` ou `npm run build`
- **Publish Directory**: `dist/frontend/browser`

Se não estiver, corrija e salve.

### PASSO 4: Faça Deploy Manual

1. Volte para a página principal do serviço
2. Clique em **"Manual Deploy"** → **"Deploy latest commit"**
3. Aguarde o deploy (1-3 minutos)

### PASSO 5: Teste!

Após o deploy, teste diretamente no navegador:
- ✅ https://www.livrya.com.br/
- ✅ https://www.livrya.com.br/auth/login
- ✅ https://www.livrya.com.br/feed

## 🔧 Se Não Funcionar

Se ainda não aparecer a opção de Redirects/Rewrites:

### Alternativa: Usar arquivo `_redirects`

O arquivo `_redirects` já está sendo copiado no build. Você precisa:

1. Fazer commit e push:
   ```bash
   git add _redirects public/_redirects angular.json
   git commit -m "fix: add _redirects for Render SPA routing"
   git push origin main
   ```

2. O Render fará deploy automático e detectará o arquivo `_redirects`

## 📞 Suporte Render

Se nenhuma opção funcionar, entre em contato com o suporte do Render:
- Dashboard: https://dashboard.render.com
- Docs: https://render.com/docs/deploys
- Procure por "SPA" ou "Single Page Application" na documentação

## ✨ Resumo

A configuração mais importante é:
```
Source: /*
Destination: /index.html
Type: Rewrite
```

Isso faz com que TODAS as requisições sejam redirecionadas para `index.html`, permitindo que o Angular Router gerencie as rotas!
