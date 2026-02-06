# 📱 LIVRIA - Especificação Mobile

> **Objetivo:** Aplicativo mobile para iOS e Android  
> **Estratégia:** PWA (MVP) → React Native (Pós-investimento)  
> **Timeline:** PWA em 2 semanas, React Native em 4-6 semanas

---

## 📋 Índice

1. [Estratégia Mobile](#1-estratégia-mobile)
2. [PWA (Progressive Web App)](#2-pwa-progressive-web-app)
3. [React Native (Futuro)](#3-react-native-futuro)
4. [Features por Plataforma](#4-features-por-plataforma)
5. [UI/UX Mobile](#5-uiux-mobile)
6. [Performance](#6-performance)
7. [Deploy e Distribuição](#7-deploy-e-distribuição)

---

## 1. Estratégia Mobile

### 1.1 Por que PWA Primeiro?

| Critério | PWA | React Native |
|----------|-----|--------------|
| **Tempo de desenvolvimento** | 2 semanas | 4-6 semanas |
| **Reutilização de código** | 100% (Angular) | 30-40% |
| **Custo** | Baixo | Médio-Alto |
| **Performance** | Boa | Excelente |
| **Acesso às APIs nativas** | Limitado | Completo |
| **App Stores** | Não obrigatório | Obrigatório |
| **Atualizações** | Instantâneas | Review das stores |

### 1.2 Roadmap Mobile

```
FASE 1 - MVP (Semana 12)
├── PWA configurado
├── Manifest.json
├── Service Worker
├── Offline básico
├── Push notifications (Web Push)
└── Instalável na home screen

FASE 2 - Pós-Investimento (Mês 4-5)
├── React Native app
├── iOS + Android nativos
├── Push notifications nativas
├── Deep linking
└── App Store + Play Store
```

---

## 2. PWA (Progressive Web App)

### 2.1 Configuração do Manifest

```json
// frontend/src/manifest.webmanifest
{
  "name": "Livria - Plataforma Literária",
  "short_name": "Livria",
  "description": "Rede social para escritores com narração por IA",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#1a1a2e",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "assets/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "assets/screenshots/feed.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Feed de posts"
    },
    {
      "src": "assets/screenshots/profile.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Perfil do escritor"
    }
  ],
  "categories": ["social", "books", "entertainment"],
  "lang": "pt-BR",
  "dir": "ltr",
  "shortcuts": [
    {
      "name": "Novo Post",
      "short_name": "Post",
      "description": "Criar novo post",
      "url": "/social/feed?action=new-post",
      "icons": [{ "src": "assets/icons/new-post.png", "sizes": "96x96" }]
    },
    {
      "name": "Mensagens",
      "short_name": "DMs",
      "description": "Ver mensagens",
      "url": "/messages",
      "icons": [{ "src": "assets/icons/messages.png", "sizes": "96x96" }]
    }
  ],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "images",
          "accept": ["image/*"]
        }
      ]
    }
  }
}
```

### 2.2 Service Worker

```typescript
// frontend/ngsw-config.json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/**",
          "/*.(svg|cur|jpg|jpeg|png|apng|webp|avif|gif|otf|ttf|woff|woff2)"
        ]
      }
    }
  ],
  "dataGroups": [
    {
      "name": "api-feed",
      "urls": ["/api/posts/feed", "/api/posts/explore"],
      "cacheConfig": {
        "maxSize": 100,
        "maxAge": "5m",
        "timeout": "10s",
        "strategy": "freshness"
      }
    },
    {
      "name": "api-user",
      "urls": ["/api/users/*"],
      "cacheConfig": {
        "maxSize": 50,
        "maxAge": "1h",
        "timeout": "10s",
        "strategy": "freshness"
      }
    },
    {
      "name": "api-static",
      "urls": ["/api/achievements", "/api/livras/packages"],
      "cacheConfig": {
        "maxSize": 20,
        "maxAge": "1d",
        "strategy": "performance"
      }
    }
  ],
  "navigationUrls": [
    "/**",
    "!/__/*",
    "!/api/**"
  ]
}
```

### 2.3 Push Notifications (Web Push)

```typescript
// frontend/src/app/core/services/push-notification.service.ts
import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY';

  constructor(
    private swPush: SwPush,
    private http: HttpClient
  ) {}

  async requestPermission(): Promise<boolean> {
    if (!this.swPush.isEnabled) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        return false;
      }

      const subscription = await this.swPush.requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY,
      });

      // Enviar subscription para o backend
      await this.http.post('/api/notifications/subscribe', subscription).toPromise();
      
      return true;
    } catch (error) {
      console.error('Push subscription failed', error);
      return false;
    }
  }

  listenToNotifications() {
    this.swPush.messages.subscribe((message) => {
      console.log('Push message received', message);
      // Tratar notificação
    });

    this.swPush.notificationClicks.subscribe((click) => {
      console.log('Notification clicked', click);
      // Navegar para URL da notificação
      if (click.notification.data?.url) {
        window.open(click.notification.data.url, '_self');
      }
    });
  }
}

// Backend: Enviar push notification
// backend/src/services/push.service.ts
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:contato@livria.com.br',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function sendPushNotification(userId: string, notification: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge.png',
    data: {
      url: notification.url,
      type: notification.type,
    },
  });

  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(JSON.parse(sub.subscription), payload)
    )
  );

  // Remover subscriptions inválidas
  results.forEach((result, index) => {
    if (result.status === 'rejected' && result.reason.statusCode === 410) {
      prisma.pushSubscription.delete({
        where: { id: subscriptions[index].id },
      });
    }
  });
}
```

### 2.4 Offline Support

```typescript
// frontend/src/app/core/services/offline.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OfflineService {
  isOnline = signal(navigator.onLine);
  pendingActions = signal<PendingAction[]>([]);

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
    });
  }

  // Salvar ação para sincronizar depois
  queueAction(action: PendingAction) {
    const current = this.pendingActions();
    this.pendingActions.set([...current, action]);
    localStorage.setItem('pendingActions', JSON.stringify(this.pendingActions()));
  }

  // Sincronizar quando voltar online
  async syncPendingActions() {
    const actions = this.pendingActions();
    
    for (const action of actions) {
      try {
        await this.executeAction(action);
        this.removePendingAction(action.id);
      } catch (error) {
        console.error('Failed to sync action', action, error);
      }
    }
  }

  private async executeAction(action: PendingAction) {
    switch (action.type) {
      case 'CREATE_POST':
        await this.http.post('/api/posts', action.data).toPromise();
        break;
      case 'LIKE_POST':
        await this.http.post(`/api/posts/${action.data.postId}/like`, {}).toPromise();
        break;
      // ... outros tipos
    }
  }
}

// Componente de indicador offline
@Component({
  selector: 'app-offline-indicator',
  template: `
    @if (!offlineService.isOnline()) {
      <div class="offline-banner">
        <span>📴 Você está offline. Ações serão sincronizadas quando reconectar.</span>
      </div>
    }
  `,
  styles: [`
    .offline-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #f59e0b;
      color: white;
      padding: 8px;
      text-align: center;
      z-index: 9999;
    }
  `]
})
export class OfflineIndicatorComponent {
  constructor(public offlineService: OfflineService) {}
}
```

### 2.5 Install Prompt

```typescript
// frontend/src/app/core/services/install.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class InstallService {
  canInstall = signal(false);
  private deferredPrompt: any = null;

  constructor() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.canInstall.set(true);
    });

    window.addEventListener('appinstalled', () => {
      this.canInstall.set(false);
      this.deferredPrompt = null;
      // Analytics: app installed
    });
  }

  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) return false;

    this.deferredPrompt.prompt();
    const result = await this.deferredPrompt.userChoice;
    
    this.deferredPrompt = null;
    this.canInstall.set(false);
    
    return result.outcome === 'accepted';
  }

  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }
}

// Componente de prompt de instalação
@Component({
  selector: 'app-install-prompt',
  template: `
    @if (installService.canInstall() && !dismissed) {
      <div class="install-prompt">
        <div class="install-content">
          <img src="/assets/icons/icon-72x72.png" alt="Livria" />
          <div>
            <strong>Instalar Livria</strong>
            <p>Acesse rapidamente da sua tela inicial</p>
          </div>
        </div>
        <div class="install-actions">
          <button (click)="dismiss()">Agora não</button>
          <button class="primary" (click)="install()">Instalar</button>
        </div>
      </div>
    }
  `
})
export class InstallPromptComponent {
  dismissed = false;

  constructor(public installService: InstallService) {}

  async install() {
    const installed = await this.installService.promptInstall();
    if (installed) {
      // Analytics: user installed app
    }
  }

  dismiss() {
    this.dismissed = true;
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  }
}
```

---

## 3. React Native (Futuro)

### 3.1 Estrutura do Projeto

```
livria-mobile/
├── src/
│   ├── app/
│   │   ├── _layout.tsx          # Root layout (Expo Router)
│   │   ├── (auth)/
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx      # Tab navigator
│   │   │   ├── feed.tsx
│   │   │   ├── explore.tsx
│   │   │   ├── messages.tsx
│   │   │   ├── notifications.tsx
│   │   │   └── profile.tsx
│   │   ├── post/
│   │   │   └── [id].tsx
│   │   ├── user/
│   │   │   └── [username].tsx
│   │   └── book/
│   │       └── [id].tsx
│   ├── components/
│   │   ├── common/
│   │   │   ├── Avatar.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   ├── feed/
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostComposer.tsx
│   │   │   └── StoryBar.tsx
│   │   ├── profile/
│   │   │   ├── ProfileHeader.tsx
│   │   │   └── ProfileTabs.tsx
│   │   └── shared/
│   │       ├── LikeButton.tsx
│   │       ├── FollowButton.tsx
│   │       └── LivraBalance.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── usePosts.ts
│   │   ├── useNotifications.ts
│   │   └── useLivras.ts
│   ├── services/
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── post.service.ts
│   │   └── websocket.service.ts
│   ├── stores/
│   │   ├── auth.store.ts
│   │   ├── feed.store.ts
│   │   └── notification.store.ts
│   ├── utils/
│   │   ├── storage.ts
│   │   ├── formatters.ts
│   │   └── validators.ts
│   └── types/
│       └── index.ts
├── assets/
│   ├── fonts/
│   ├── images/
│   └── icons/
├── app.json
├── package.json
├── tsconfig.json
└── eas.json
```

### 3.2 Configuração do App

```json
// app.json
{
  "expo": {
    "name": "Livria",
    "slug": "livria",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a2e"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.livria.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSCameraUsageDescription": "Livria usa a câmera para tirar fotos de perfil e posts",
        "NSPhotoLibraryUsageDescription": "Livria acessa suas fotos para compartilhar em posts"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a1a2e"
      },
      "package": "com.livria.app",
      "versionCode": 1,
      "permissions": [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE"
      ]
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#6366f1"
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "Livria acessa suas fotos para compartilhar em posts"
        }
      ]
    ],
    "scheme": "livria",
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### 3.3 Componentes Principais

```tsx
// src/components/feed/PostCard.tsx
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar } from '../common/Avatar';
import { LikeButton } from '../shared/LikeButton';
import { Post } from '../../types';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
}

export function PostCard({ post, onLike, onComment, onShare }: PostCardProps) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <Link href={`/user/${post.user.username}`} asChild>
        <Pressable style={styles.header}>
          <Avatar src={post.user.avatar} size={40} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{post.user.name}</Text>
            <Text style={styles.userHandle}>
              @{post.user.username} · {formatDistanceToNow(new Date(post.createdAt), { locale: ptBR, addSuffix: true })}
            </Text>
          </View>
        </Pressable>
      </Link>

      {/* Content */}
      <Link href={`/post/${post.id}`} asChild>
        <Pressable>
          <Text style={styles.content}>{post.content}</Text>
          
          {post.mediaUrl && (
            <Image 
              source={{ uri: post.mediaUrl }} 
              style={styles.media}
              resizeMode="cover"
            />
          )}
        </Pressable>
      </Link>

      {/* Actions */}
      <View style={styles.actions}>
        <LikeButton
          isLiked={post.isLiked}
          count={post.likeCount}
          onPress={() => onLike(post.id)}
        />
        
        <Pressable style={styles.action} onPress={() => onComment(post.id)}>
          <Text>💬 {post.commentCount}</Text>
        </Pressable>
        
        <Pressable style={styles.action} onPress={() => onShare(post.id)}>
          <Text>🔄 {post.shareCount}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    marginLeft: 12,
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
  },
  userHandle: {
    color: '#666',
    fontSize: 14,
  },
  content: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  media: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
});
```

```tsx
// src/app/(tabs)/feed.tsx
import { useCallback, useEffect } from 'react';
import { FlatList, RefreshControl, View, ActivityIndicator } from 'react-native';
import { usePosts } from '../../hooks/usePosts';
import { PostCard } from '../../components/feed/PostCard';
import { StoryBar } from '../../components/feed/StoryBar';
import { PostComposer } from '../../components/feed/PostComposer';
import { EmptyState } from '../../components/common/EmptyState';

export default function FeedScreen() {
  const { 
    posts, 
    loading, 
    refreshing, 
    hasMore,
    loadPosts, 
    refreshPosts, 
    loadMore,
    likePost,
  } = usePosts();

  useEffect(() => {
    loadPosts();
  }, []);

  const renderItem = useCallback(({ item }) => (
    <PostCard 
      post={item} 
      onLike={likePost}
      onComment={(id) => router.push(`/post/${id}?focus=comment`)}
      onShare={(id) => {/* open share modal */}}
    />
  ), [likePost]);

  const renderHeader = useCallback(() => (
    <>
      <StoryBar />
      <PostComposer />
    </>
  ), []);

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View style={{ padding: 20 }}>
        <ActivityIndicator />
      </View>
    );
  }, [hasMore]);

  const renderEmpty = useCallback(() => (
    <EmptyState
      icon="📝"
      title="Seu feed está vazio"
      message="Siga escritores para ver seus posts aqui"
      actionLabel="Explorar"
      onAction={() => router.push('/explore')}
    />
  ), []);

  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={!loading && renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshPosts}
          tintColor="#6366f1"
        />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
    />
  );
}
```

### 3.4 Push Notifications (Expo)

```typescript
// src/services/notifications.service.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-project-id',
  });

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
  }

  // Enviar token para backend
  await api.post('/notifications/register-device', {
    token: token.data,
    platform: Platform.OS,
  });

  return token.data;
}

export function useNotificationListener() {
  useEffect(() => {
    // Quando app está aberto
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Quando usuário toca na notificação
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        
        if (data.url) {
          router.push(data.url);
        }
      }
    );

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };
  }, []);
}
```

### 3.5 Deep Linking

```typescript
// src/app/_layout.tsx
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Handle deep links
    const handleDeepLink = (event: { url: string }) => {
      const url = event.url;
      
      // livria://post/123
      if (url.includes('post/')) {
        const postId = url.split('post/')[1];
        router.push(`/post/${postId}`);
      }
      
      // livria://user/joaosilva
      if (url.includes('user/')) {
        const username = url.split('user/')[1];
        router.push(`/user/${username}`);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="post/[id]" options={{ title: 'Post' }} />
      <Stack.Screen name="user/[username]" options={{ title: 'Perfil' }} />
    </Stack>
  );
}
```

---

## 4. Features por Plataforma

### 4.1 Matriz de Features

| Feature | Web | PWA | React Native |
|---------|-----|-----|--------------|
| Feed | ✅ | ✅ | ✅ |
| Posts (criar/editar) | ✅ | ✅ | ✅ |
| Curtir/Comentar | ✅ | ✅ | ✅ |
| Seguir usuários | ✅ | ✅ | ✅ |
| Mensagens (DM) | ✅ | ✅ | ✅ |
| Notificações | ✅ | ✅ (Web Push) | ✅ (Nativo) |
| Stories | ✅ | ✅ | ✅ |
| Busca | ✅ | ✅ | ✅ |
| Perfil | ✅ | ✅ | ✅ |
| Livras | ✅ | ✅ | ✅ |
| Planos | ✅ | ✅ | ✅ (IAP) |
| Grupos | ✅ | ✅ | ✅ |
| Campanhas | ✅ | ✅ | ✅ |
| Conquistas | ✅ | ✅ | ✅ |
| **Offline** | ❌ | ✅ (básico) | ✅ (completo) |
| **Camera** | ✅ | ✅ | ✅ (nativo) |
| **Biometria** | ❌ | ❌ | ✅ |
| **Share Sheet** | ✅ | ✅ | ✅ (nativo) |
| **Widgets** | ❌ | ❌ | ✅ |
| **Writer Module** | ✅ | ✅ | ❌ (só leitura) |
| **TTS Playback** | ✅ | ✅ | ✅ |

### 4.2 Features Mobile-Only

```tsx
// Biometria (React Native)
import * as LocalAuthentication from 'expo-local-authentication';

async function authenticateWithBiometrics(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
  if (!hasHardware || !isEnrolled) {
    return false;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloqueie para acessar',
    cancelLabel: 'Cancelar',
    fallbackLabel: 'Usar senha',
  });

  return result.success;
}

// Share Sheet Nativo
import { Share } from 'react-native';

async function sharePost(post: Post) {
  await Share.share({
    message: `Confira esse post de @${post.user.username} na Livria!\n\n"${post.content.slice(0, 100)}..."`,
    url: `https://livria.com.br/post/${post.id}`,
    title: 'Compartilhar post',
  });
}

// Haptic Feedback
import * as Haptics from 'expo-haptics';

function onLike() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  // ... like logic
}
```

---

## 5. UI/UX Mobile

### 5.1 Design System Mobile

```typescript
// src/theme/index.ts
export const theme = {
  colors: {
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    secondary: '#ec4899',
    background: '#ffffff',
    backgroundDark: '#1a1a2e',
    surface: '#f5f5f5',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
    body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
    bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  },
};
```

### 5.2 Gestos e Animações

```tsx
// Swipe to like (React Native Gesture Handler + Reanimated)
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  runOnJS 
} from 'react-native-reanimated';

function SwipeablePostCard({ post, onLike }) {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = Math.max(0, e.translationX);
    })
    .onEnd((e) => {
      if (e.translationX > 100) {
        runOnJS(onLike)(post.id);
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <PostCard post={post} />
      </Animated.View>
    </GestureDetector>
  );
}

// Double tap to like
const doubleTapGesture = Gesture.Tap()
  .numberOfTaps(2)
  .onEnd(() => {
    runOnJS(onLike)();
    // Show heart animation
  });
```

### 5.3 Bottom Sheet

```tsx
// Modal de compartilhamento
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

function ShareBottomSheet({ isOpen, onClose, post }) {
  const snapPoints = useMemo(() => ['50%'], []);

  return (
    <BottomSheet
      index={isOpen ? 0 : -1}
      snapPoints={snapPoints}
      onChange={(index) => index === -1 && onClose()}
      backdropComponent={BottomSheetBackdrop}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Compartilhar</Text>
        
        <Pressable style={styles.option} onPress={() => shareToFeed(post)}>
          <Text>🔄 Repostar</Text>
        </Pressable>
        
        <Pressable style={styles.option} onPress={() => shareWithQuote(post)}>
          <Text>💬 Citar</Text>
        </Pressable>
        
        <Pressable style={styles.option} onPress={() => shareExternal(post)}>
          <Text>📤 Compartilhar via...</Text>
        </Pressable>
        
        <Pressable style={styles.option} onPress={() => copyLink(post)}>
          <Text>🔗 Copiar link</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}
```

---

## 6. Performance

### 6.1 Otimizações PWA

```typescript
// Lazy loading de imagens
<img 
  src={post.mediaUrl} 
  loading="lazy" 
  decoding="async"
  alt="Post image"
/>

// Virtual scrolling (Angular CDK)
import { ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="200" class="feed">
      <app-post-card 
        *cdkVirtualFor="let post of posts" 
        [post]="post"
      />
    </cdk-virtual-scroll-viewport>
  `
})
export class FeedComponent {}

// Preload de rotas críticas
// angular.json
{
  "preloadStrategy": "PreloadAllModules"
}

// Ou preload seletivo
@Injectable()
export class SelectivePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    if (route.data?.['preload']) {
      return load();
    }
    return of(null);
  }
}
```

### 6.2 Otimizações React Native

```tsx
// FlashList (mais performático que FlatList)
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={posts}
  renderItem={renderItem}
  estimatedItemSize={300}
  keyExtractor={(item) => item.id}
/>

// Memoização de componentes
const PostCard = memo(({ post, onLike }) => {
  // ...
}, (prev, next) => prev.post.id === next.post.id && prev.post.isLiked === next.post.isLiked);

// Imagens otimizadas
import { Image } from 'expo-image';

<Image
  source={{ uri: post.mediaUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>

// Skeleton loading
import { Skeleton } from 'moti/skeleton';

<Skeleton colorMode="light" width="100%" height={200} />
```

---

## 7. Deploy e Distribuição

### 7.1 PWA Deploy

```bash
# Build de produção
ng build --configuration production

# O output já inclui:
# - manifest.webmanifest
# - ngsw.json (service worker config)
# - ngsw-worker.js

# Deploy para Vercel/Netlify/Cloudflare
vercel --prod
```

### 7.2 React Native (EAS Build)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar projeto
eas build:configure

# Build para iOS
eas build --platform ios --profile production

# Build para Android
eas build --platform android --profile production

# Submit para stores
eas submit --platform ios
eas submit --platform android
```

### 7.3 eas.json

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "123456789"
      },
      "android": {
        "serviceAccountKeyPath": "./google-credentials.json"
      }
    }
  }
}
```

---

**Timeline Estimado:**
- PWA: 2 semanas (Sprint 12)
- React Native: 4-6 semanas (Pós-investimento)

**Recursos Necessários:**
- 1 desenvolvedor mobile (React Native)
- Apple Developer Account ($99/ano)
- Google Play Console ($25 única vez)
- EAS Build (gratuito para começar)
