# 🚀 Guia Rápido: Corrigir Erro 404 no Render.com

## Problema
Acessar rotas diretas como `https://www.livrya.com.br/auth/login` retorna erro 404.

## Solução (2 opções)

### ⭐ OPÇÃO 1: Arquivo render.yaml (Recomendado e Mais Simples)

O arquivo `render.yaml` já está criado! Basta fazer o commit:

```bash
git add render.yaml angular.json
git commit -m "fix: configure SPA routing for Render.com"
git push origin main
```

✅ O Render detectará automaticamente e aplicará as configurações!

### OPÇÃO 2: Configuração Manual no Dashboard

Se preferir configurar manualmente:

1. **Acesse o dashboard**: https://dashboard.render.com/static/srv-d5dshn6mcj7s73b0hn10

2. **Vá em "Redirects/Rewrites"** (pode estar em Settings)

3. **Adicione uma regra de Rewrite**:
   - Source: `/*`
   - Destination: `/index.html`
   - Action: `Rewrite` (NÃO redirect)

4. **Verifique Build Settings**:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist/frontend/browser`

5. **Salve e faça Manual Deploy**

## Testando

Após o deploy, teste acessando diretamente:
- ✅ https://www.livrya.com.br/
- ✅ https://www.livrya.com.br/auth/login
- ✅ https://www.livrya.com.br/feed
- ✅ https://www.livrya.com.br/profile

Nenhuma deve dar erro 404! 🎉

## Observações

- ✅ O arquivo `render.yaml` também configura headers de segurança
- ✅ A configuração está versionada no Git (boas práticas)
- ✅ Funciona com deploys automáticos via Git

## Precisa de Ajuda?

Verifique:
1. O arquivo `render.yaml` está na raiz do projeto? ✅
2. Foi feito commit e push?
3. O Render fez um novo deploy após o push?
4. A pasta de publicação está correta: `dist/frontend/browser`?
