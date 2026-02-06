import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../shared/stores';
import { http, endpoints } from '../shared/api';

/**
 * OAuth callback page
 * Handles the redirect from SSO with authorization code
 */
export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const storedState = sessionStorage.getItem('oauth_state');
      const verifier = sessionStorage.getItem('pkce_verifier');

      // Validate state
      if (!state || state !== storedState) {
        throw new Error('Invalid state parameter');
      }

      if (!code) {
        throw new Error('No authorization code received');
      }

      if (!verifier) {
        throw new Error('No PKCE verifier found');
      }

      // Exchange code for tokens
      const response = await http.post(endpoints.auth.token, {
        grant_type: 'authorization_code',
        code,
        redirect_uri: import.meta.env.VITE_SSO_REDIRECT_URI,
        client_id: import.meta.env.VITE_SSO_CLIENT_ID,
        code_verifier: verifier,
      });

      const { access_token, refresh_token, expires_in } = response.data;

      // Get user info
      const userResponse = await http.get(endpoints.auth.userInfo, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      // Store tokens and user
      login(userResponse.data, {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresIn: expires_in,
      });

      // Clean up session storage
      sessionStorage.removeItem('pkce_verifier');
      sessionStorage.removeItem('oauth_state');

      // Redirect to home
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Auth callback error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-zinc-200 mb-2">Erro na Autenticação</h1>
          <p className="text-zinc-400 mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
        <p className="text-zinc-400">Finalizando autenticação...</p>
      </div>
    </div>
  );
}
