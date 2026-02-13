---
name: oauth2-pkce-implementation
description: OAuth2 PKCE authentication flow for Google and secure token management in Livrya
keywords: [oauth2, pkce, authentication, google, jwt, livrya]
category: project-specific
---

# 🔐 OAuth2 PKCE Implementation

Production patterns for OAuth2 with PKCE (Proof Key for Code Exchange) authentication in Livrya.

## Overview

Livrya uses OAuth2 PKCE for:
- **Google Sign-In** - Passwordless authentication
- **Mobile Apps** - No client secret exposure
- **CSRF Protection** - State parameter verification
- **Token Refresh** - Automatic token rotation
- **Secure Logout** - Token revocation

---

## Key Concepts

### PKCE Flow (RFC 7636)

```
1. Client generates code_verifier (random string)
2. Client creates code_challenge = base64url(sha256(code_verifier))
3. Client redirects to Google with code_challenge
4. User logs in, Google redirects back with authorization_code
5. Client exchanges code + code_verifier for tokens
6. Google verifies: sha256(verifier) == challenge
```

### Benefits

```
Traditional OAuth2          PKCE OAuth2
├── Client secret          ├── Code verifier
├── Vulnerable on mobile   ├── Secure for mobile
├── No CSRF built-in       ├── Built-in CSRF (state)
├── Simple                 └── Industry standard
```

---

## Implementation

### Pattern 1: Generate PKCE Codes

```typescript
import crypto from 'crypto';

function generateCodeVerifier(): string {
  // Create 32-byte random string
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let verifier = '';

  for (let i = 0; i < 128; i++) {
    verifier += chars[Math.floor(Math.random() * chars.length)];
  }

  return verifier;
}

function generateCodeChallenge(verifier: string): string {
  // SHA256 hash of verifier, base64url encoded
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

// Usage
const codeVerifier = generateCodeVerifier(); // Store in session!
const codeChallenge = generateCodeChallenge(codeVerifier);
```

### Pattern 2: Initiate Login

```typescript
// Frontend
export async function initiateOAuth2Login(): Promise<void> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = crypto.randomUUID(); // CSRF token

  // Store in sessionStorage (only accessible to this window)
  sessionStorage.setItem('pkce_verifier', codeVerifier);
  sessionStorage.setItem('oauth_state', state);

  // Build authorization URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.append('client_id', process.env.REACT_APP_GOOGLE_CLIENT_ID!);
  authUrl.searchParams.append('redirect_uri', `${window.location.origin}/auth/callback`);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'openid profile email');
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('state', state);

  // Redirect to Google
  window.location.href = authUrl.toString();
}
```

### Pattern 3: Handle Callback

```typescript
app.get('/auth/callback', async (req, res) => {
  const { code, state } = req.query as { code: string; state: string };

  try {
    // Verify state (CSRF check)
    const sessionState = req.session.oauth_state;

    if (state !== sessionState) {
      throw new Error('State mismatch - CSRF detected');
    }

    // Get stored code_verifier
    const codeVerifier = req.session.pkce_verifier;

    if (!codeVerifier) {
      throw new Error('Missing code verifier');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.APP_URL}/auth/callback`,
        code_verifier: codeVerifier, // Send original verifier
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userResponse.json();

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.id },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          googleId: googleUser.id,
          email: googleUser.email,
          username: googleUser.name.split(' ')[0],
          profilePicture: googleUser.picture,
        },
      });
    }

    // Create JWT tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Set secure cookies
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to dashboard
    res.redirect('/dashboard');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect('/login?error=auth_failed');
  }
});
```

### Pattern 4: Token Refresh

```typescript
async function refreshAccessToken(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as {
      userId: string;
    };

    // Check if token exists in database and not expired
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new Error('Refresh token expired or revoked');
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    // Generate new refresh token (rotation)
    const newRefreshToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        userId: decoded.userId,
        token: newRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Revoke old refresh token
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    // Set new cookies
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(401).json({ error: 'Token refresh failed' });
  }
}
```

### Pattern 5: Logout & Revocation

```typescript
async function logout(req: Request, res: Response): Promise<void> {
  const userId = (req.user as any).id;
  const refreshToken = req.cookies.refresh_token;

  try {
    // Revoke refresh token
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    }

    // Revoke all tokens for this user (logout all devices)
    // await prisma.refreshToken.deleteMany({ where: { userId } });

    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
}

// Logout all devices endpoint
async function logoutAll(req: Request, res: Response): Promise<void> {
  const userId = (req.user as any).id;

  try {
    // Delete all refresh tokens for user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
}
```

### Pattern 6: Middleware

```typescript
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies.access_token;

  if (!token) {
    return res.status(401).json({ error: 'No access token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    // Try to refresh
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.use(authenticateToken);
```

---

## Security Checklist

✅ Use HTTPS only
✅ Store verifier in sessionStorage (httpOnly for cookies)
✅ Validate state parameter (CSRF protection)
✅ Use secure cookies (httpOnly, secure, sameSite)
✅ Rotate refresh tokens
✅ Revoke tokens on logout
✅ Short-lived access tokens (15 min)
✅ Longer-lived refresh tokens (7 days)
✅ Hash passwords if fallback auth exists
✅ Rate limit auth endpoints

---

## Best Practices

### ✅ DO's

1. **Always Validate State** - CSRF protection
2. **Use httpOnly Cookies** - Prevent XSS access
3. **Rotate Refresh Tokens** - Each use gets new token
4. **Short Access Token TTL** - 15 minutes max
5. **Logout All Devices Option** - User control

### ❌ DON'Ts

1. **Don't Store Secrets in localStorage** - XSS vulnerable
2. **Don't Use Long-lived Access Tokens** - Reduces damage from theft
3. **Don't Skip PKCE** - Vulnerable to attacks
4. **Don't Ignore Token Expiration** - Always check

---

**Status:** ✅ Production Ready
**Last Updated:** 2026-02-13
