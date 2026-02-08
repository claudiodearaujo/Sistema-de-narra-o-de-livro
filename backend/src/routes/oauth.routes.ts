import { Router } from 'express';
import * as oauthController from '../controllers/oauth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Authorization endpoint - redirects to frontend SSO page
router.get('/authorize', oauthController.authorizeRedirect);

// Authorization endpoint - generates authorization code (requires auth)
router.post('/authorize', authenticate, oauthController.authorize);

// Token endpoint - exchanges code for tokens (public)
router.post('/token', oauthController.token);

// UserInfo endpoint - returns user info (requires auth)
router.get('/userinfo', authenticate, oauthController.userInfo);

export default router;
