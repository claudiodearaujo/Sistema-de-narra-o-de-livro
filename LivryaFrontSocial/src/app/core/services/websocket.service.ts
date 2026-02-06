import { Injectable, inject, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject, filter, share } from 'rxjs';
import { environment } from '../../../environments/environment';

/**
 * Connection status enum
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * WebSocket event wrapper
 */
interface SocketEvent<T = unknown> {
    event: string;
    data: T;
}

/**
 * WebSocket Service with authentication support
 * Handles real-time communication for messages, notifications, and live updates
 */
@Injectable({
    providedIn: 'root'
})
export class WebSocketService {
    private socket: Socket | null = null;
    private readonly URL = environment.wsUrl || environment.apiUrl.replace('/api', '');
    
    // Event stream for all incoming events
    private readonly events$ = new Subject<SocketEvent>();
    
    // Reactive connection status
    private readonly _status = signal<ConnectionStatus>('disconnected');
    readonly status = this._status.asReadonly();
    
    // Track if we've attempted connection
    private _initialized = false;

    /**
     * Initialize WebSocket connection with auth token
     */
    connect(token?: string): void {
        if (this.socket?.connected) {
            return;
        }

        // Get token from storage if not provided
        const authToken = token || localStorage.getItem('token');
        
        this._status.set('connecting');
        
        this.socket = io(this.URL, {
            auth: authToken ? { token: authToken } : undefined,
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000
        });

        this.setupEventHandlers();
        this._initialized = true;
    }

    /**
     * Setup core socket event handlers
     */
    private setupEventHandlers(): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            this._status.set('connected');
            console.log('[WebSocket] Connected:', this.socket?.id);
        });

        this.socket.on('disconnect', (reason) => {
            this._status.set('disconnected');
            console.log('[WebSocket] Disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            this._status.set('error');
            console.error('[WebSocket] Connection error:', error.message);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            this._status.set('connected');
            console.log('[WebSocket] Reconnected after', attemptNumber, 'attempts');
        });

        // Listen for all events and pipe through subject
        this.socket.onAny((event, data) => {
            this.events$.next({ event, data });
        });
    }

    /**
     * Listen for a specific event type
     */
    on<T = unknown>(event: string): Observable<T> {
        return this.events$.pipe(
            filter(e => e.event === event),
            share()
        ) as unknown as Observable<T>;
    }

    /**
     * Listen for any event (legacy compatibility)
     */
    onEvent<T = unknown>(event: string): Observable<T> {
        return this.on<T>(event);
    }

    /**
     * Emit an event to the server
     */
    emit(event: string, data?: unknown): void {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        } else {
            console.warn('[WebSocket] Cannot emit, not connected');
        }
    }

    /**
     * Emit with acknowledgment callback
     */
    emitWithAck<T = unknown>(event: string, data?: unknown): Promise<T> {
        return new Promise((resolve, reject) => {
            if (!this.socket?.connected) {
                reject(new Error('Not connected'));
                return;
            }
            
            this.socket.emit(event, data, (response: T) => {
                resolve(response);
            });
        });
    }

    // ===== Chapter Events =====

    joinChapter(chapterId: string): void {
        this.emit('join:chapter', chapterId);
    }

    leaveChapter(chapterId: string): void {
        this.emit('leave:chapter', chapterId);
    }

    // ===== Conversation Events =====

    joinConversation(userId: string): void {
        this.emit('conversation:join', userId);
    }

    leaveConversation(userId: string): void {
        this.emit('conversation:leave', userId);
    }

    // ===== Presence =====

    checkPresence(userIds: string[]): void {
        this.emit('presence:check', userIds);
    }

    // ===== Connection Management =====

    /**
     * Reconnect with new token (after login/token refresh)
     */
    reconnectWithToken(token: string): void {
        this.disconnect();
        setTimeout(() => this.connect(token), 100);
    }

    /**
     * Check if connected
     */
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    /**
     * Get socket ID
     */
    getSocketId(): string | undefined {
        return this.socket?.id;
    }

    /**
     * Disconnect from server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            this._status.set('disconnected');
        }
    }

    /**
     * Cleanup on destroy
     */
    ngOnDestroy(): void {
        this.disconnect();
        this.events$.complete();
    }
}
