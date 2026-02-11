import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../shared/stores';
import { env } from '../shared/lib';
import { endpoints, http } from '../shared/api';
import { setAccessToken } from '../shared/api/http';

/**
 * Auth guard component that protects routes
 * Redirects to SSO if not authenticated
 */
export function AuthGuard() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) return;

    let isCancelled = false;

    const bootstrapSession = async () => {
      try {
        const response = await http.get(endpoints.auth.userInfo);
        if (isCancelled) return;

        const accessToken = response.headers['x-access-token'];
        if (typeof accessToken === 'string') {
          setAccessToken(accessToken);
        }

        setUser(response.data);
      } catch {
        if (!isCancelled) {
          initiateSSO();
        }
      }
    };

    bootstrapSession();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, setUser]);

  if (!isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Autenticando...</p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

/**
 * Generate PKCE code verifier and challenge
 */
async function generatePKCE() {
  const verifier = generateRandomString(128);
  const challenge = await generateCodeChallenge(verifier);
  return { verifier, challenge };
}

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateState(): string {
  return generateRandomString(32);
}

/**
 * Initiate SSO flow
 */
async function initiateSSO() {
  const { verifier, challenge } = await generatePKCE();
  const state = generateState();

  // Store PKCE verifier and state
  sessionStorage.setItem('pkce_verifier', verifier);
  sessionStorage.setItem('oauth_state', state);

  // Build SSO URL
  const params = new URLSearchParams({
    client_id: env.ssoClientId,
    redirect_uri: env.ssoRedirectUri,
    response_type: 'code',
    scope: 'openid profile books chapters characters speeches',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });

  const ssoUrl = `${env.ssoUrl}?${params.toString()}`;
  window.location.href = ssoUrl;
}
