export interface AuthResponse {
  token: string;
  username: string;
}
 
export interface AuthRequest {
  username: string;
  password: string;
}