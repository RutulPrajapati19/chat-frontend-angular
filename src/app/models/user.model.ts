export interface User {
  id?: string;
  username: string;
  email: string;
  status?: string;
}

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
}