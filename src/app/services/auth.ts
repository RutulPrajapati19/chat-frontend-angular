import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthRequest, AuthResponse } from '../models/user.model';
 
@Injectable({ providedIn: 'root' })
export class AuthService {
 
  private apiUrl = 'https://chat-backend-vdje.onrender.com/api/auth';
  private userUrl = 'https://chat-backend-vdje.onrender.com/api/users';
 
  constructor(private http: HttpClient) {}
 
  register(data: { username: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap(res => this.saveSession(res.token, res.username))
    );
  }
 
  login(data: AuthRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, data).pipe(
      tap(res => this.saveSession(res.token, res.username))
    );
  }
 
  private saveSession(token: string, username: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
  }
 
  getToken(): string | null { return localStorage.getItem('token'); }
  getUsername(): string | null { return localStorage.getItem('username'); }
  isLoggedIn(): boolean { return !!this.getToken(); }
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  }
 
  private headers() {
    return new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
  }
 
  getMyProfile(): Observable<any> {
    return this.http.get(`${this.userUrl}/me`, { headers: this.headers() });
  }
 
  updateProfile(data: { email?: string; currentPassword?: string; newPassword?: string }): Observable<any> {
    return this.http.put(`${this.userUrl}/me`, data, { headers: this.headers() });
  }
}