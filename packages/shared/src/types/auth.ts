export interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SocialLoginRequest {
  provider: 'google' | 'kakao';
  code: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  churchId: string | null;
  role: string | null;
}
