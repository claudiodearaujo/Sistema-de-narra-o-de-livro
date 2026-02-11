export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'reader' | 'writer' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
}
