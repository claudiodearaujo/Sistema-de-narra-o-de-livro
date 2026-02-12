/**
 * API endpoint constants
 *
 * Paths are relative to VITE_API_URL which already includes the /api prefix.
 * e.g., VITE_API_URL=https://example.com/api → books.list resolves to https://example.com/api/books
 */
export const endpoints = {
  // Auth (OAuth endpoints)
  auth: {
    ssoAuthorize: '/auth/sso/authorize',
    token: '/oauth/token',
    tokenRefresh: '/auth/refresh',
    logout: '/auth/logout',
    userInfo: '/oauth/userinfo',
  },

  // Books
  books: {
    list: '/books',
    byId: (id: string) => `/books/${id}`,
    stats: (id: string) => `/books/${id}/stats`,
  },

  // Chapters
  chapters: {
    list: (bookId: string) => `/books/${bookId}/chapters`,
    byId: (id: string) => `/chapters/${id}`,
    reorder: (chapterId: string) => `/chapters/${chapterId}/reorder`,
    narration: {
      start: (id: string) => `/chapters/${id}/narration/start`,
      cancel: (id: string) => `/chapters/${id}/narration/cancel`,
      status: (id: string) => `/chapters/${id}/narration/status`,
    },
    soundtrack: (id: string) => `/chapters/${id}/soundtrack`,
  },

  // Speeches
  speeches: {
    list: (chapterId: string) => `/chapters/${chapterId}/speeches`,
    create: '/speeches',
    byId: (id: string) => `/speeches/${id}`,
    reorder: (chapterId: string) => `/chapters/${chapterId}/speeches/reorder`,
    bulk: (chapterId: string) => `/chapters/${chapterId}/speeches/bulk`,
    batchUpdate: '/speeches/batch-update',
    audio: (id: string) => `/speeches/${id}/audio`,
    sceneImage: (id: string) => `/speeches/${id}/scene-image`,
    ambientAudio: (id: string) => `/speeches/${id}/ambient-audio`,
    tools: {
      spellCheck: '/speeches/tools/spell-check',
      suggestions: '/speeches/tools/suggestions',
      characterContext: '/speeches/tools/character-context',
      dictation: '/speeches/tools/dictation',
      emotionImage: '/speeches/tools/emotion-image',
    },
  },

  // SSML Assistance (Sprint 4)
  ssml: {
    suggestTags: '/ssml/suggest-tags',
    suggestProperties: '/ssml/suggest-properties',
    applySuggestions: '/ssml/apply-suggestions',
    validate: '/ssml/validate',
  },

  // Media Generation (Sprint 5)
  media: {
    sceneImage: (speechId: string) => `/speeches/${speechId}/scene-image`,
    ambientAudio: (speechId: string) => `/speeches/${speechId}/ambient-audio`,
    chapterSoundtrack: (chapterId: string) => `/chapters/${chapterId}/soundtrack`,
    generateSoundtrack: (chapterId: string) => `/chapters/${chapterId}/soundtrack/generate`,
  },

  // Characters
  characters: {
    list: (bookId: string) => `/books/${bookId}/characters`,
    byId: (id: string) => `/characters/${id}`,
    create: '/characters',
    previewAudio: (characterId: string) => `/characters/${characterId}/preview-audio`,
  },
  
  // Voices (AI)
  voices: {
    list: '/voices',
    preview: '/voices/preview',
  },

  // AI Tools
  ai: {
    chat: '/ai/chat',
  },
} as const;
