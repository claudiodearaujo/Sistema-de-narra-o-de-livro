# Guia de Deploy - LIVRIA

## Problema: Erro 404 em Rotas Diretas

Quando você acessa uma rota diretamente (ex: `https://www.livrya.com.br/auth/login`), o servidor retorna 404. Isso acontece porque o servidor web está tentando encontrar um arquivo físico nesse caminho, mas em uma SPA (Single Page Application) Angular, todas as rotas são gerenciadas pelo JavaScript no lado do cliente.

## Solução

O servidor web precisa ser configurado para redirecionar **todas as requisições** para `index.html`, permitindo que o Angular Router gerencie as rotas.

---

## ⭐ Render.com (CONFIGURAÇÃO ATUAL)

O projeto está hospedado no Render.com. Siga estes passos:

### Opção 1: Usando arquivo `render.yaml` (Recomendado)

O arquivo `render.yaml` já está configurado na raiz do projeto. Ele será automaticamente detectado pelo Render.

**Passos:**
1. Faça commit do arquivo `render.yaml`:
   ```bash
   git add render.yaml
   git commit -m "feat: add Render.com configuration for SPA routing"
   git push origin main
   ```

2. No dashboard do Render (https://dashboard.render.com/static/srv-d5dshn6mcj7s73b0hn10):
   - O Render detectará automaticamente o `render.yaml`
   - Aguarde o deploy automático

3. Teste as rotas diretas após o deploy!

### Opção 2: Configuração Manual no Dashboard

Se preferir configurar manualmente no dashboard do Render:

1. Acesse: https://dashboard.render.com/static/srv-d5dshn6mcj7s73b0hn10
2. Vá em **Settings** ou **Redirects/Rewrites**
3. Adicione a regra de rewrite:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Type**: `Rewrite`

4. **Build Settings**:
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist/frontend/browser`

5. Salve e faça **Manual Deploy**

---

## Configurações por Servidor Web

### 1. **Nginx** (Recomendado)

Copie o arquivo `nginx.conf` para seu servidor ou use a configuração abaixo:

```nginx
server {
  listen 80;
  server_name livrya.com.br www.livrya.com.br;
  root /usr/share/nginx/html;
  index index.html;

  # CRÍTICO: Redireciona todas as requisições para index.html
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

**Como aplicar:**
```bash
# Copie nginx.conf para o servidor
sudo cp nginx.conf /etc/nginx/sites-available/livrya
sudo ln -s /etc/nginx/sites-available/livrya /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

### 2. **Apache**

O arquivo `.htaccess` já está criado. Copie para a pasta raiz do seu servidor:

```bash
cp .htaccess dist/frontend/browser/.htaccess
```

**Certifique-se que `mod_rewrite` está habilitado:**
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

---

### 3. **Netlify**

O arquivo `_redirects` já está criado. Adicione ao build:

1. O arquivo `_redirects` será copiado automaticamente no build
2. Faça deploy da pasta `dist/frontend/browser`

**Netlify automático via Git:**
- Build command: `npm run build`
- Publish directory: `dist/frontend/browser`

---

### 4. **Vercel**

O arquivo `vercel.json` já está criado na raiz do projeto.

**Deploy:**
```bash
npm i -g vercel
vercel --prod
```

Ou conecte seu repositório Git no painel da Vercel.

---

### 5. **Firebase Hosting**

Crie `firebase.json`:

```json
{
  "hosting": {
    "public": "dist/frontend/browser",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Deploy:**
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

### 6. **AWS S3 + CloudFront**

1. **S3**: Faça upload de `dist/frontend/browser/*`
2. **CloudFront**: Configure error pages:
   - Error Code: `403`, `404`
   - Response Page Path: `/index.html`
   - Response Code: `200`

---

### 7. **Hospedagem Compartilhada (cPanel)**

Use o arquivo `.htaccess`:

1. Faça build: `npm run build`
2. Copie o conteúdo de `dist/frontend/browser/*` para `public_html`
3. Copie `.htaccess` para `public_html`

---

## Checklist de Deploy

- [ ] Build de produção: `npm run build`
- [ ] Configuração do servidor aplicada
- [ ] SSL/HTTPS configurado (recomendado)
- [ ] Variáveis de ambiente configuradas (environment.prod.ts)
- [ ] Testar rotas diretas após deploy
- [ ] Verificar console do navegador por erros

---

## Testando

Após o deploy, teste acessando diretamente:
- ✅ `https://www.livrya.com.br/`
- ✅ `https://www.livrya.com.br/auth/login`
- ✅ `https://www.livrya.com.br/feed`
- ✅ `https://www.livrya.com.br/profile`

Todas devem funcionar sem erro 404!

---

## Dúvidas?

Se ainda tiver problemas, verifique:
1. O build foi feito corretamente? (`dist/frontend/browser/index.html` existe?)
2. A configuração do servidor está ativa?
3. O servidor foi reiniciado após as alterações?
4. Há logs de erro no servidor?
