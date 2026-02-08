# Livria Mobile - Fase 2: React Native Implementation Plan

Criação de aplicativo mobile nativo para iOS e Android usando React Native com Expo, baseado na especificação [LIVRIA_MOBILE.md](file:///c:/desenv/Sistema-de-narra-o-de-livro/doc/LIVRIA_MOBILE.md).

## User Review Required

> [!IMPORTANT]
> **Decisões que precisam de confirmação:**
>
> 1. **Localização do projeto:** O app será criado em `c:\desenv\livria-mobile\` - está ok?
> 2. **Expo SDK version:** Usaremos Expo SDK 52 (mais recente) - confirma?
> 3. **API Base URL:** O backend está em qual URL? (produção e desenvolvimento)

> [!WARNING]
> **Pré-requisitos necessários:**
> - Node.js 18+ instalado
> - Expo CLI (`npm install -g expo-cli` ou usar npx)
> - Para builds: Conta Expo (gratuita)
> - Para iOS: Xcode (somente Mac) - pode ser testado via Expo Go
> - Para Android: Android Studio OU Expo Go no dispositivo

---

## Proposed Changes

### Etapa 1: Inicialização do Projeto

#### [NEW] livria-mobile/

Criar projeto com Expo Router:

```bash
npx create-expo-app@latest livria-mobile --template tabs
cd livria-mobile
```

Dependências a instalar:
- `expo-router` - File-based routing
- `expo-secure-store` - Token storage
- `expo-notifications` - Push notifications  
- `expo-image-picker` - Seleção de imagens
- `expo-local-authentication` - Biometria
- `@shopify/flash-list` - Lista performática
- `react-native-reanimated` - Animações
- `react-native-gesture-handler` - Gestos
- `@gorhom/bottom-sheet` - Bottom sheets
- `zustand` - State management
- `date-fns` - Formatação de datas

---

### Etapa 2: Estrutura de Pastas

```
livria-mobile/
├── src/
│   ├── app/                    # Expo Router (file-based)
│   │   ├── _layout.tsx         # Root layout
│   │   ├── (auth)/             # Auth group
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── (tabs)/             # Main tabs
│   │   │   ├── _layout.tsx
│   │   │   ├── feed.tsx
│   │   │   ├── explore.tsx
│   │   │   ├── messages.tsx
│   │   │   ├── notifications.tsx
│   │   │   └── profile.tsx
│   │   ├── post/[id].tsx
│   │   ├── user/[username].tsx
│   │   └── book/[id].tsx
│   ├── components/
│   │   ├── common/             # Avatar, Button, Card, Input
│   │   ├── feed/               # PostCard, PostComposer, StoryBar
│   │   ├── profile/            # ProfileHeader, ProfileTabs
│   │   └── shared/             # LikeButton, FollowButton
│   ├── hooks/
│   ├── services/
│   ├── stores/
│   ├── theme/
│   ├── types/
│   └── utils/
├── assets/
│   ├── icon.png
│   ├── splash.png
│   └── adaptive-icon.png
├── app.json
├── eas.json
└── package.json
```

---

### Etapa 3: Configuração do Tema (Livria Colors)

#### [NEW] src/theme/index.ts

Adaptando as cores do design system Livria:

```typescript
export const theme = {
  colors: {
    primary: '#4F6F64',        // Livria green
    primaryLight: '#6B8F82',
    primaryDark: '#3D5A50',
    secondary: '#D4A574',      // Accent gold
    background: '#FDFBF7',     // Cream
    backgroundDark: '#1a1a2e',
    surface: '#FFFFFF',
    text: '#2C3E50',
    textSecondary: '#6b7280',
    border: '#E8E4DE',
    error: '#ef4444',
    success: '#22c55e',
  },
  // ... spacing, typography, etc
};
```

---

### Etapa 4: Core Components

Criar componentes base reutilizáveis:

| Componente | Descrição |
|------------|-----------|
| `Avatar` | Exibe foto de perfil com fallback |
| `Button` | Botão com variantes (primary, secondary, outline) |
| `Card` | Container com sombra e borda |
| `Input` | Campo de texto estilizado |
| `PostCard` | Card de post com ações (like, comment, share) |
| `EmptyState` | Estado vazio com ícone e CTA |

---

### Etapa 5: Navegação

#### [NEW] src/app/(tabs)/_layout.tsx

Tab navigator com 5 abas:
- 🏠 Feed - Timeline de posts
- 🔍 Explore - Descobrir conteúdo
- 💬 Messages - Mensagens diretas
- 🔔 Notifications - Notificações
- 👤 Profile - Perfil do usuário

---

### Etapa 6: Serviços API

#### [NEW] src/services/api.ts

Cliente HTTP configurado com:
- Base URL do backend Livria
- Interceptor para token JWT
- Refresh token automático
- Tratamento de erros

---

### Etapa 7: Push Notifications

#### [NEW] src/services/notifications.service.ts

- Registro de device token
- Handler de notificações em foreground
- Handler de tap em notificação (deep linking)
- Canal Android configurado

---

### Etapa 8: Deep Linking

Configurar scheme `livria://` para:
- `livria://post/{id}` → Abre post
- `livria://user/{username}` → Abre perfil
- `livria://book/{id}` → Abre livro

---

### Etapa 9: Assets

Criar/adaptar os seguintes assets:
- `icon.png` - 1024x1024 (app icon)
- `splash.png` - 1284x2778 (splash screen)
- `adaptive-icon.png` - 1024x1024 (Android adaptive)
- `notification-icon.png` - 96x96 (notificação)

---

## Verification Plan

### Testes Automatizados

Infelizmente para React Native, os testes automatizados serão limitados neste projeto inicial. O foco será em testes manuais.

### Verificação Manual

1. **Setup funciona:**
   ```bash
   cd c:\desenv\livria-mobile
   npx expo start
   ```
   ✓ App abre no Expo Go (Android/iOS)

2. **Navegação funciona:**
   - Todas as 5 tabs navegáveis
   - Rotas dinâmicas `/post/[id]` carregam

3. **Tema aplicado:**
   - Cores Livria visíveis
   - Tipografia consistente

4. **API conecta:**
   - Login funciona
   - Feed carrega posts

5. **Push notifications:**
   - Solicita permissão
   - Recebe notificação de teste

> [!TIP]
> **Sugestão:** Para testes mais completos, precisarei que você teste no seu dispositivo real usando o app Expo Go. Posso gerar um QR code após o build inicial.

---

## Timeline Estimado

| Etapa | Tempo |
|-------|-------|
| Setup e estrutura | 1-2 horas |
| Tema e componentes base | 2-3 horas |
| Navegação | 1 hora |
| Telas principais (Feed, Profile) | 3-4 horas |
| Serviços API | 2 horas |
| Push + Deep linking | 2 horas |
| **Total MVP** | **~12-15 horas** |
