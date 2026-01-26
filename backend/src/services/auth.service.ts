import { User, UserRole, AuthProvider } from '@prisma/client';
import { hashPassword, comparePassword, generateRandomToken } from '../utils/password.utils';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiresAt,
  TokenPayload
} from '../utils/jwt.utils';
import prisma from '../lib/prisma';

// Types
export interface SignupInput {
  name: string;
  email: string;
  password: string;
  username?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password' | 'verifyToken' | 'resetToken'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ProfileUpdateInput {
  name?: string;
  username?: string;
  bio?: string;
  avatar?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// Helper to sanitize user (remove sensitive fields)
function sanitizeUser(user: User): Omit<User, 'password' | 'verifyToken' | 'resetToken'> {
  const { password, verifyToken, resetToken, resetExpires, verifyExpires, ...sanitized } = user;
  return sanitized as Omit<User, 'password' | 'verifyToken' | 'resetToken'>;
}

// Helper to create token payload
function createTokenPayload(user: User): TokenPayload {
  return {
    userId: user.id,
    email: user.email,
    role: user.role
  };
}

/**
 * Register a new user
 */
export async function signup(input: SignupInput): Promise<AuthResponse> {
  const { name, email, password, username } = input;

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw new Error('Este e-mail já está cadastrado');
  }

  // Check if username already exists (if provided)
  if (username) {
    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      throw new Error('Este nome de usuário já está em uso');
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      username,
      role: UserRole.WRITER, // Default role for signup
      provider: AuthProvider.LOCAL,
      verifyToken: generateRandomToken(),
      verifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    }
  });

  // Generate tokens
  const payload = createTokenPayload(user);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiresAt()
    }
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
    expiresIn: 3600 // 1 hour in seconds
  };
}

/**
 * Login user
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  const { email, password } = input;
  console.log('[AUTH] Login attempt for email:', email);
  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Credenciais inválidas');
  }
  console.log('[AUTH] User found:', user.id);

  // Check if user has password (local auth)
  if (!user.password) {
    throw new Error('Esta conta usa login social. Use o botão correspondente.');
  }

  // Verify password
  const isValidPassword = await comparePassword(password, user.password);
  if (!isValidPassword) {
    throw new Error('Credenciais inválidas');
  }

  // Generate tokens
  const payload = createTokenPayload(user);
  console.log('create token payload for user:', payload);
  const accessToken = generateAccessToken(payload);
  console.log('generate access token:', accessToken);
  const refreshToken = generateRefreshToken(payload);
  console.log('generate refresh token:', refreshToken);

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiresAt()
    }
  });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
    expiresIn: 3600
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  // Verify the refresh token
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    throw new Error('Token de atualização inválido ou expirado');
  }

  // Check if token exists in database
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true }
  });

  if (!storedToken) {
    throw new Error('Token de atualização não encontrado');
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new Error('Token de atualização expirado');
  }

  // Delete old refresh token
  await prisma.refreshToken.delete({ where: { id: storedToken.id } });

  // Generate new tokens
  const user = storedToken.user;
  const payload = createTokenPayload(user);
  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  // Store new refresh token
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id,
      expiresAt: getRefreshTokenExpiresAt()
    }
  });

  return {
    user: sanitizeUser(user),
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 3600
  };
}

/**
 * Logout user (invalidate refresh token)
 */
export async function logout(refreshToken: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { token: refreshToken }
  });
}

/**
 * Logout from all devices
 */
export async function logoutAll(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId }
  });
}

/**
 * Get user profile
 */
export async function getProfile(userId: string): Promise<Omit<User, 'password' | 'verifyToken' | 'resetToken'>> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('Usuário não encontrado');
  }
  return sanitizeUser(user);
}

/**
 * Update user profile
 */
export async function updateProfile(userId: string, input: ProfileUpdateInput): Promise<Omit<User, 'password' | 'verifyToken' | 'resetToken'>> {
  // Check username uniqueness if changing
  if (input.username) {
    const existingUsername = await prisma.user.findFirst({
      where: {
        username: input.username,
        NOT: { id: userId }
      }
    });
    if (existingUsername) {
      throw new Error('Este nome de usuário já está em uso');
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: input
  });

  return sanitizeUser(user);
}

/**
 * Change password
 */
export async function changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.password) {
    throw new Error('Usuário não encontrado ou senha não definida');
  }

  // Verify current password
  const isValid = await comparePassword(input.currentPassword, user.password);
  if (!isValid) {
    throw new Error('Senha atual incorreta');
  }

  // Hash new password
  const hashedPassword = await hashPassword(input.newPassword);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  // Invalidate all refresh tokens (security measure)
  await logoutAll(userId);
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) {
    return { message: 'Se o e-mail estiver cadastrado, você receberá instruções de recuperação' };
  }

  // Generate reset token
  const resetToken = generateRandomToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken, resetExpires }
  });

  // TODO: Send email with reset link
  // await sendPasswordResetEmail(email, resetToken);
  console.log(`[AUTH] Password reset token for ${email}: ${resetToken}`);

  return { message: 'Se o e-mail estiver cadastrado, você receberá instruções de recuperação' };
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetExpires: { gt: new Date() }
    }
  });

  if (!user) {
    throw new Error('Token inválido ou expirado');
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetExpires: null
    }
  });

  // Invalidate all refresh tokens
  await logoutAll(user.id);
}

/**
 * Verify email
 */
export async function verifyEmail(token: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: {
      verifyToken: token,
      verifyExpires: { gt: new Date() }
    }
  });

  if (!user) {
    throw new Error('Token de verificação inválido ou expirado');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      verifyToken: null,
      verifyExpires: null
    }
  });
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(userId: string): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  if (user.isVerified) {
    throw new Error('E-mail já verificado');
  }

  const verifyToken = generateRandomToken();
  const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: userId },
    data: { verifyToken, verifyExpires }
  });

  // TODO: Send verification email
  console.log(`[AUTH] Verification token for ${user.email}: ${verifyToken}`);

  return { message: 'E-mail de verificação reenviado' };
}

/**
 * Find user by ID
 */
export async function findUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } });
}
