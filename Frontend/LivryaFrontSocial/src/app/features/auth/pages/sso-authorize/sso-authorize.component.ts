import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../../../environments/environment';

interface SsoParams {
  client_id: string;
  redirect_uri: string;
  scope: string;
  state: string;
  code_challenge: string;
  code_challenge_method: string;
}

@Component({
  selector: 'app-sso-authorize',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    MessageModule,
    TranslocoModule
  ],
  templateUrl: './sso-authorize.component.html',
  styleUrl: './sso-authorize.component.css'
})
export class SsoAuthorizeComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  public authService = inject(AuthService);
  private translocoService = inject(TranslocoService);

  params: SsoParams | null = null;
  clientName = '';
  scopes: string[] = [];
  error: string | null = null;
  isLoading = false;
  isAuthorizing = false;

  // Scope descriptions for user-friendly display
  private scopeDescriptions: Record<string, string> = {
    'openid': 'Identificação básica',
    'profile': 'Seu perfil (nome, avatar)',
    'books': 'Acesso aos seus livros',
    'chapters': 'Acesso aos capítulos',
    'characters': 'Acesso aos personagens',
    'speeches': 'Acesso às falas e narrações'
  };

  ngOnInit(): void {
    // Check if user is logged in
    if (!this.authService.isSessionValid()) {
      // Redirect to login with return URL
      const currentUrl = this.router.url;
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: currentUrl }
      });
      return;
    }

    // Get OAuth parameters from URL
    const queryParams = this.route.snapshot.queryParams;
    
    const clientId = queryParams['client_id'];
    const redirectUri = queryParams['redirect_uri'];
    const scope = queryParams['scope'];
    const state = queryParams['state'];
    const codeChallenge = queryParams['code_challenge'];
    const codeChallengeMethod = queryParams['code_challenge_method'] || 'S256';

    // Validate required parameters
    if (!clientId || !redirectUri || !scope || !state || !codeChallenge) {
      this.error = 'Parâmetros OAuth inválidos ou ausentes';
      return;
    }

    this.params = {
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod
    };

    // Parse scopes for display
    this.scopes = scope.split(' ');
    
    // Get client name (for now just use the client_id)
    this.clientName = this.getClientDisplayName(clientId);
  }

  private getClientDisplayName(clientId: string): string {
    const clientNames: Record<string, string> = {
      'livrya-writer-studio': 'Writer Studio'
    };
    return clientNames[clientId] || clientId;
  }

  getScopeDescription(scope: string): string {
    return this.scopeDescriptions[scope] || scope;
  }

  getScopeIcon(scope: string): string {
    const icons: Record<string, string> = {
      'openid': 'pi pi-user',
      'profile': 'pi pi-id-card',
      'books': 'pi pi-book',
      'chapters': 'pi pi-file',
      'characters': 'pi pi-users',
      'speeches': 'pi pi-microphone'
    };
    return icons[scope] || 'pi pi-check';
  }

  async authorize(): Promise<void> {
    if (!this.params) return;

    this.isAuthorizing = true;
    this.error = null;

    try {
      const response = await this.http.post<{ code: string; state: string }>(
        `${environment.apiUrl}/oauth/authorize`,
        this.params
      ).toPromise();

      if (!response) {
        throw new Error('Resposta vazia do servidor');
      }

      // Redirect back to the client with authorization code
      const redirectUrl = new URL(this.params.redirect_uri);
      redirectUrl.searchParams.set('code', response.code);
      redirectUrl.searchParams.set('state', response.state);

      // Force redirect to external URL
      window.location.href = redirectUrl.toString();
    } catch (err: any) {
      console.error('[SSO] Authorization error:', err);
      this.error = err.error?.error || err.message || 'Erro ao autorizar aplicação';
      this.isAuthorizing = false;
    }
  }

  deny(): void {
    if (!this.params) {
      this.router.navigate(['/']);
      return;
    }

    // Redirect back with error
    const redirectUrl = new URL(this.params.redirect_uri);
    redirectUrl.searchParams.set('error', 'access_denied');
    redirectUrl.searchParams.set('error_description', 'O usuário negou a autorização');
    redirectUrl.searchParams.set('state', this.params.state);

    window.location.href = redirectUrl.toString();
  }
}
