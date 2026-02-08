import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

/**
 * Social Network Module Routes
 * 
 * This module handles all social features:
 * - Feed: Personalized post feed from followed users
 * - Explore: Discover trending posts and users
 * - Profile: User profiles with posts and stats
 * - Notifications: Real-time notifications
 * - Search: Search for users, posts, and books
 */
export const SOCIAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/social-layout.component').then(m => m.SocialLayoutComponent),
    canActivate: [authGuard],
    children: [
      // Feed - Main social page
      {
        path: 'feed',
        loadComponent: () => import('./pages/feed/feed.component').then(m => m.FeedComponent),
        title: 'Feed | Livrya'
      },

      // Explore - Discover content
      {
        path: 'explore',
        loadComponent: () => import('./pages/explore/explore.component').then(m => m.ExploreComponent),
        title: 'Explorar | Livrya'
      },

      // My Profile - Current user profile (MUST come before parametrized route)
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Meu Perfil | Livrya'
      },

      // Profile - User profiles (parametrized route comes after exact match)
      {
        path: 'profile/:username',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
        title: 'Perfil | Livrya'
      },

      // Post Detail
      {
        path: 'post/:id',
        loadComponent: () => import('./pages/post-detail/post-detail.component').then(m => m.PostDetailComponent),
        title: 'Post | Livrya'
      },

      // Search
      {
        path: 'search',
        loadComponent: () => import('./pages/search/search.component').then(m => m.SearchComponent),
        title: 'Buscar | Livrya'
      },

      // Notifications
      {
        path: 'notifications',
        loadComponent: () => import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent),
        title: 'Notificações | Livrya'
      },

      // Messages / Direct Messages
      {
        path: 'messages',
        loadComponent: () => import('./pages/messages/messages.component').then(m => m.MessagesComponent),
        title: 'Mensagens | Livrya'
      },

      // Conversation Detail
      {
        path: 'messages/:userId',
        loadComponent: () => import('./pages/conversation/conversation.component').then(m => m.ConversationComponent),
        title: 'Conversa | Livrya'
      },

      // Trending - Sprint 7
      {
        path: 'trending',
        loadComponent: () => import('./pages/trending/trending-page.component').then(m => m.TrendingPageComponent),
        title: 'Em Alta | Livrya'
      },

      // Groups - Sprint 11
      {
        path: 'groups',
        loadComponent: () => import('./pages/groups/group-list.component').then(m => m.GroupListComponent),
        title: 'Grupos | Livrya'
      },

      // Group Detail
      {
        path: 'groups/:id',
        loadComponent: () => import('./pages/groups/group-detail.component').then(m => m.GroupDetailComponent),
        title: 'Grupo | Livrya'
      },

      // Campaign Detail
      {
        path: 'campaigns/:id',
        loadComponent: () => import('./pages/campaigns/campaign-detail.component').then(m => m.CampaignDetailComponent),
        title: 'Campanha | Livrya'
      },

      // Default redirect to feed
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'feed'
      }
    ]
  }
];
