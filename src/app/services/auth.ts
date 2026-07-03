import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
 
@Injectable({ providedIn: 'root' })
export class AuthService {
 
  private BASE = `${environment.apiUrl}/api/auth`;
  private TOKEN_KEY = 'chat_token';
  private USER_KEY = 'chat_username';
 
  constructor(private http: HttpClient) {}
 
  login(body: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.BASE}/login`, body).pipe(
      tap(res => this.saveSession(res.token, res.username))
    );
  }
 
  register(body: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.BASE}/register`, body).pipe(
      tap(res => this.saveSession(res.token, res.username))
    );
  }
 
  saveSession(token: string, username: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, username);
  }
 
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }
 
  getUsername(): string | null {
    return localStorage.getItem(this.USER_KEY);
  }
 
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
 
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }
 
  getMyProfile(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
  }
 
  updateProfile(data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/api/users/me`, data, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
  }
}