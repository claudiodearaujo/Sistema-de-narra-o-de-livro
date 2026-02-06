import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject, tap, catchError, map, of } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import {
  User,
  UserRole,
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
  PasswordResetRequest,
  PasswordResetConfirm,
  ProfileUpdate,
  ChangePassword
} from '../models/user.model';
import { AnalyticsService } from 'src/app/core/services/analytics.service';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'auth_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private analytics = inject(AnalyticsService);

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private translocoService = inject(TranslocoService);

  // Signals for reactive state management
  private currentUserSignal = signal<User | null>(null);
  private isLoadingSignal = signal<boolean>(false);

  // Public computed signals
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly userRole = computed(() => this.currentUserSignal()?.role);

  // BehaviorSubject for components that need Observable pattern
  private authStateSubject = new BehaviorSubject<boolean>(this.hasToken());
  authState$ = this.authStateSubject.asObservable();

  constructor() {
    this.loadStoredUser();
  }

  // ============ Authentication Methods ============

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);

    // Clear any existing tokens/session before attempting new login
    console.log('[AuthService] Clearing old session before login');
    this.clearAuth();

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        console.log('[AuthService] Login response:', response);
        this.handleAuthSuccess(response, credentials.rememberMe);
        console.log('[AuthService] Auth success handled, user:', this.currentUserSignal());
      }),
      catchError(error => {
        console.error('[AuthService] Login error:', error);
        this.isLoadingSignal.set(false);
        return this.handleError(error);
      }),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  signup(credentials: SignupCredentials): Observable<AuthResponse> {
    this.isLoadingSignal.set(true);

    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, credentials).pipe(
      tap(response => this.handleAuthSuccess(response, false)),
      catchError(error => this.handleError(error)),
      tap(() => this.isLoadingSignal.set(false))
    );
  }

  logout(): void {
    // Optional: Call backend to invalidate token
    this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      catchError(() => of(null))
    ).subscribe();

    this.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap(response => this.handleAuthSuccess(response, true)),
      catchError(error => {
        this.clearAuth();
        return throwError(() => error);
      })
    );
  }

  // ============ Password Management ============

  requestPasswordReset(data: PasswordResetRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/forgot-password`, data).pipe(
      catchError(error => this.handleError(error))
    );
  }

  resetPassword(data: PasswordResetConfirm): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password`, data).pipe(
      catchError(error => this.handleError(error))
    );
  }

  changePassword(data: ChangePassword): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/change-password`, data).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // ============ Profile Management ============

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/profile`).pipe(
      tap(user => this.currentUserSignal.set(user)),
      catchError(error => this.handleError(error))
    );
  }

  updateProfile(data: ProfileUpdate): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/profile`, data).pipe(
      tap(user => {
        this.currentUserSignal.set(user);
        this.storeUser(user);
      }),
      catchError(error => this.handleError(error))
    );
  }

  uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.http.post<{ avatarUrl: string }>(`${this.apiUrl}/profile/avatar`, formData).pipe(
      tap(response => {
        const currentUser = this.currentUserSignal();
        if (currentUser) {
          const updatedUser = { ...currentUser, avatar: response.avatarUrl };
          this.currentUserSignal.set(updatedUser);
          this.storeUser(updatedUser);
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  // ============ Email Verification ============

  verifyEmail(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/verify-email`, { token }).pipe(
      tap(() => {
        const currentUser = this.currentUserSignal();
        if (currentUser) {
          this.currentUserSignal.set({ ...currentUser, isVerified: true });
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  resendVerificationEmail(): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/resend-verification`, {}).pipe(
      catchError(error => this.handleError(error))
    );
  }

  // ============ Token Management ============

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  hasToken(): boolean {
    return !!this.getToken();
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiry = payload.exp * 1000; // Convert to milliseconds
      console.log('[AuthService] Token expiry time:', new Date(expiry));
      return Date.now() >= expiry;
    } catch {
      console.warn('[AuthService] Failed to parse token payload');
      return true;
    }
  }

  /**
   * Check if there is a valid active session
   * @returns true if user has a valid, non-expired token
   */
  isSessionValid(): boolean {
    const hasToken = this.hasToken();
    const isExpired = this.isTokenExpired();
    const hasUser = !!this.currentUserSignal();

    return hasToken && !isExpired && hasUser;
  }

  // ============ Private Helper Methods ============

  private handleAuthSuccess(response: AuthResponse, rememberMe?: boolean): void {
    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem(TOKEN_KEY, response.accessToken);
    if (response.refreshToken) {
      storage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    }

    this.storeUser(response.user);
    this.currentUserSignal.set(response.user);
    this.authStateSubject.next(true);

    // Set analytics user dimensions
    this.setAnalyticsUserDimensions(response.user);
  }

  private setAnalyticsUserDimensions(user: User): void {
    // Set user ID for cross-device tracking
    this.analytics.setUserId(user.id);

    // Set user type dimension
    const userType = user.role === UserRole.ADMIN ? 'admin' :
      (user as any).isPremium ? 'premium' : 'free';
    this.analytics.setUserType(userType as any);

    // Set creator status
    const booksCount = (user as any).booksCount || 0;
    this.analytics.setCreatorStatus(booksCount > 0, booksCount);
  }

  private storeUser(user: User): void {
    const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
    storage.setItem(USER_KEY, JSON.stringify(user));
  }

  private loadStoredUser(): void {
    const userJson = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    if (userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this.currentUserSignal.set(user);
        this.authStateSubject.next(true);
        // Set analytics dimensions for returning user
        this.setAnalyticsUserDimensions(user);
      } catch {
        this.clearAuth();
      }
    }
  }

  private clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);

    this.currentUserSignal.set(null);
    this.authStateSubject.next(false);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.isLoadingSignal.set(false);

    let errorMessage = 'Ocorreu um erro inesperado';
    let shouldClearAuth = false;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || this.translocoService.translate('errors.invalidData');
          break;
        case 401:
          errorMessage = this.translocoService.translate('errors.invalidCredentials');
          shouldClearAuth = true; // Clear session on unauthorized
          break;
        case 403:
          errorMessage = this.translocoService.translate('errors.unauthorized');
          shouldClearAuth = true; // Clear session on forbidden
          break;
        case 404:
          errorMessage = this.translocoService.translate('errors.notFound');
          break;
        case 409:
          errorMessage = error.error?.message || this.translocoService.translate('errors.conflict');
          break;
        case 422:
          errorMessage = error.error?.message || this.translocoService.translate('errors.invalidInput');
          break;
        case 429:
          errorMessage = this.translocoService.translate('errors.tooManyRequests');
          break;
        case 500:
          errorMessage = this.translocoService.translate('errors.serverError');
          break;
        default:
          errorMessage = error.error?.message || this.translocoService.translate('errors.connectionError');
      }
    }

    // Clear auth only for authentication/authorization errors
    if (shouldClearAuth) {
      console.log('[AuthService] Clearing session due to auth error:', error.status);
      this.clearAuth();
    }

    return throwError(() => new Error(errorMessage));
  }
}
