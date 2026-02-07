"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRedirect = authorizeRedirect;
exports.authorize = authorize;
exports.token = token;
exports.userInfo = userInfo;
const oauthService = __importStar(require("../services/oauth.service"));
/**
 * GET /oauth/authorize
 * Redirect to frontend SSO page with OAuth parameters
 */
async function authorizeRedirect(req, res) {
    const { client_id, redirect_uri, response_type, scope, state, code_challenge, code_challenge_method } = req.query;
    // Validate required parameters
    if (!client_id || !redirect_uri || !response_type || !scope || !state || !code_challenge) {
        return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes' });
    }
    if (response_type !== 'code') {
        return res.status(400).json({ error: 'response_type deve ser "code"' });
    }
    // Validate client
    const validation = await oauthService.validateClient(client_id, redirect_uri);
    if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
    }
    // Redirect to frontend SSO authorize page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const params = new URLSearchParams({
        client_id: client_id,
        redirect_uri: redirect_uri,
        scope: scope,
        state: state,
        code_challenge: code_challenge,
        code_challenge_method: code_challenge_method || 'S256'
    });
    res.redirect(`${frontendUrl}/auth/sso/authorize?${params.toString()}`);
}
/**
 * POST /oauth/authorize
 * Generate authorization code (requires authenticated user)
 */
async function authorize(req, res) {
    try {
        const { client_id, redirect_uri, scope, state, code_challenge, code_challenge_method } = req.body;
        const userId = req.user?.userId;
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
    }
    catch (error) {
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
async function token(req, res) {
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
    }
    catch (error) {
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
async function userInfo(req, res) {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Usuário não autenticado' });
        }
        const user = await oauthService.getUserInfo(userId);
        res.json(user);
    }
    catch (error) {
        console.error('[OAuth] UserInfo error:', error);
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Erro ao obter informações do usuário'
        });
    }
}
