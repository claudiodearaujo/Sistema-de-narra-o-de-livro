/**
 * API endpoint constants
 */
export const endpoints = {
  // Auth (OAuth endpoints)
  auth: {
    ssoAuthorize: '/oauth/authorize',
    token: '/oauth/token',
    tokenRefresh: '/api/auth/refresh',
    logout: '/api/auth/logout',
    userInfo: '/oauth/userinfo',
  },

  // Books
  books: {
    list: '/api/books',
    byId: (id: string) => `/api/books/${id}`,
    stats: (id: string) => `/api/books/${id}/stats`,
  },

  // Chapters
  chapters: {
    list: (bookId: string) => `/api/books/${bookId}/chapters`,
    byId: (id: string) => `/api/chapters/${id}`,
    reorder: (chapterId: string) => `/api/chapters/${chapterId}/reorder`,
    narration: {
      start: (id: string) => `/api/chapters/${id}/narration/start`,
      cancel: (id: string) => `/api/chapters/${id}/narration/cancel`,
      status: (id: string) => `/api/chapters/${id}/narration/status`,
    },
    soundtrack: (id: string) => `/api/chapters/${id}/soundtrack`,
  },

  // Speeches
  speeches: {
    list: (chapterId: string) => `/api/chapters/${chapterId}/speeches`,
    create: '/api/speeches',
    byId: (id: string) => `/api/speeches/${id}`,
    reorder: (chapterId: string) => `/api/chapters/${chapterId}/speeches/reorder`,
    bulk: (chapterId: string) => `/api/chapters/${chapterId}/speeches/bulk`,
    batchUpdate: '/api/speeches/batch-update',
    audio: (id: string) => `/api/speeches/${id}/audio`,
    sceneImage: (id: string) => `/api/speeches/${id}/scene-image`,
    ambientAudio: (id: string) => `/api/speeches/${id}/ambient-audio`,
    tools: {
      spellCheck: '/api/speeches/tools/spell-check',
      suggestions: '/api/speeches/tools/suggestions',
      characterContext: '/api/speeches/tools/character-context',
      emotionImage: '/api/speeches/tools/emotion-image',
    },
  },

  // Characters
  characters: {
    list: (bookId: string) => `/api/books/${bookId}/characters`,
    create: '/api/characters',
    byId: (id: string) => `/api/characters/${id}`,
    previewAudio: (id: string) => `/api/characters/${id}/preview-audio`,
  },

  // Voices
  voices: {
    list: '/api/voices',
    preview: '/api/voices/preview',
  },

  // AI Tools
  ai: {
    chat: '/api/ai/chat',
  },

  // SSML
  ssml: {
    validate: '/api/ssml/validate',
  },
} as const;
