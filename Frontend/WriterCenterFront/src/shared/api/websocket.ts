import { io, Socket } from 'socket.io-client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface NarrationProgressEvent {
  chapterId: string;
  speechId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  current: number;
  total: number;
  processedSpeeches: number;
  completedSpeeches: number;
  failedSpeeches: number;
  audioUrl?: string;
  error?: string;
}

export interface NarrationStartedEvent {
  chapterId: string;
  status: 'started';
  progress: number;
  totalSpeeches: number;
  processedSpeeches: number;
  completedSpeeches: number;
  failedSpeeches: number;
}

export interface NarrationCompletedEvent {
  chapterId: string;
  status: 'completed';
  progress: number;
  totalSpeeches: number;
  processedSpeeches: number;
  completedSpeeches: number;
  failedSpeeches: number;
}

export interface NarrationFailedEvent {
  chapterId: string;
  status: 'failed';
  progress: number;
  totalSpeeches: number;
  processedSpeeches: number;
  completedSpeeches: number;
  failedSpeeches: number;
  error: string;
}

export interface AiStreamEvent {
  chapterId: string;
  token: string;
  done: boolean;
}

export type WebSocketEventMap = {
  'narration:started': NarrationStartedEvent;
  'narration:progress': NarrationProgressEvent;
  'narration:completed': NarrationCompletedEvent;
  'narration:failed': NarrationFailedEvent;
  'narration:speech-completed': NarrationProgressEvent;
  'narration:speech-failed': NarrationProgressEvent;
  'ai:stream': AiStreamEvent;
};

import { env } from '../lib/env';
import { getAccessToken } from './http';

// ─── Singleton Socket Manager ────────────────────────────────────────────────

let socket: Socket | null = null;
let connectionAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function getSocketUrl(): string {
  // Use WS_URL if defined, otherwise derive from API_URL
  if (env.wsUrl) return env.wsUrl;
  
  const apiUrl = env.apiUrl;
  // Strip /api suffix if present, since WebSocket connects to the root
  return apiUrl.replace(/\/api\/?$/, '');
}

export function getSocket(): Socket {
  if (!socket) {
    const url = getSocketUrl();

    socket = io(url, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
        auth: () => {
          // Dynamically grab token from http module (memory/storage)
          const token = getAccessToken();
          return token ? { token } : {};
        },
      });

    socket.on('connect', () => {
      connectionAttempts = 0;
      console.debug('[WS] Connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.debug('[WS] Disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      connectionAttempts++;
      console.warn(`[WS] Connection error (${connectionAttempts}/${MAX_RECONNECT_ATTEMPTS}):`, err.message);

      if (connectionAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error('[WS] Max reconnection attempts reached. Giving up.');
        socket?.disconnect();
      }
    });
  }

  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    connectionAttempts = 0;
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

/**
 * Type-safe event listener helper.
 * Returns an unsubscribe function for convenience.
 */
export function onSocketEvent<K extends keyof WebSocketEventMap>(
  event: K,
  handler: (data: WebSocketEventMap[K]) => void,
): () => void {
  const s = getSocket();
  s.on(event as string, handler);
  return () => {
    s.off(event as string, handler);
  };
}

/**
 * Emit a typed event.
 */
export function emitSocketEvent(event: string, data?: unknown): void {
  const s = getSocket();
  if (s.connected) {
    s.emit(event, data);
  } else {
    console.warn('[WS] Cannot emit — socket not connected.');
  }
}
