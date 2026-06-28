import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

interface AuthResponse {
  token: string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private BASE = 'http://localhost:8080/api/auth';
  private TOKEN_KEY = 'chat_token';
  private USER_KEY  = 'chat_username';

  constructor(private http: HttpClient) {}

  login(body: { username: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE}/login`, body).pipe(
      tap(res => this.saveSession(res.token, res.username))
    );
  }

  register(body: { username: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE}/register`, body).pipe(
      tap(res => this.saveSession(res.token, res.username))
    );
  }

  saveSession(token: string, username: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.USER_KEY, username);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  getUsername(): string | null {
    return sessionStorage.getItem(this.USER_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
  }
}