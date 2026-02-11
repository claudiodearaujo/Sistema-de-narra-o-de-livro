/**
 * API endpoint constants
 *
 * Paths are relative to VITE_API_URL which already includes the /api prefix.
 * e.g., VITE_API_URL=https://example.com/api → books.list resolves to https://example.com/api/books
 */
export const endpoints = {
  // Auth (OAuth endpoints)
  auth: {
    ssoAuthorize: '/oauth/authorize',
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
      emotionImage: '/speeches/tools/emotion-image',
    },
  },

  // Characters
  characters: {
    list: (bookId: string) => `/books/${bookId}/characters`,
    create: '/characters',
    byId: (id: string) => `/characters/${id}`,
    previewAudio: (id: string) => `/characters/${id}/preview-audio`,
  },

  // Voices
  voices: {
    list: '/voices',
    preview: '/voices/preview',
  },

  // AI Tools
  ai: {
    chat: '/ai/chat',
  },

  // SSML
  ssml: {
    validate: '/ssml/validate',
  },
} as const;
