import { Request, Response } from 'express';
import * as oauthService from '../services/oauth.service';

/**
 * GET /oauth/authorize
 * Redirect to frontend SSO page with OAuth parameters
 */
export async function authorizeRedirect(req: Request, res: Response) {
  const { client_id, redirect_uri, response_type, scope, state, code_challenge, code_challenge_method } = req.query;

  // Validate required parameters
  if (!client_id || !redirect_uri || !response_type || !scope || !state || !code_challenge) {
    return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes' });
  }

  if (response_type !== 'code') {
    return res.status(400).json({ error: 'response_type deve ser "code"' });
  }

  // Validate client
  const validation = await oauthService.validateClient(
    client_id as string,
    redirect_uri as string
  );

  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  // Redirect to frontend SSO authorize page
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
  const params = new URLSearchParams({
    client_id: client_id as string,
    redirect_uri: redirect_uri as string,
    scope: scope as string,
    state: state as string,
    code_challenge: code_challenge as string,
    code_challenge_method: (code_challenge_method as string) || 'S256'
  });

  res.redirect(`${frontendUrl}/auth/sso/authorize?${params.toString()}`);
}

/**
 * POST /oauth/authorize
 * Generate authorization code (requires authenticated user)
 */
export async function authorize(req: Request, res: Response) {
  try {
    const { client_id, redirect_uri, scope, state, code_challenge, code_challenge_method } = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Validate required parameters
    if (!client_id || !redirect_uri || !scope || !state || !code_challenge) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes' });
    }

    // Create authorization code
    const code = await oauthService.createAuthorizationCode({
      clientId: client_id,
      redirectUri: redirect_uri,
      scope,
      state,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method || 'S256',
      userId
    });

    res.json({ code, state });
  } catch (error) {
    console.error('[OAuth] Authorize error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Erro ao gerar código de autorização'
    });
  }
}

/**
 * POST /oauth/token
 * Exchange authorization code for tokens
 */
export async function token(req: Request, res: Response) {
  try {
    const { grant_type, code, redirect_uri, client_id, code_verifier } = req.body;

    // Validate required parameters
    if (!grant_type || !code || !redirect_uri || !client_id || !code_verifier) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes' });
    }

    const tokens = await oauthService.exchangeCodeForTokens({
      grantType: grant_type,
      code,
      redirectUri: redirect_uri,
      clientId: client_id,
      codeVerifier: code_verifier
    });

    res.json(tokens);
  } catch (error) {
    console.error('[OAuth] Token error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Erro ao trocar código por tokens'
    });
  }
}

/**
 * GET /oauth/userinfo
 * Get authenticated user info
 */
export async function userInfo(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const user = await oauthService.getUserInfo(userId);
    res.json(user);
  } catch (error) {
    console.error('[OAuth] UserInfo error:', error);
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Erro ao obter informações do usuário'
    });
  }
}
