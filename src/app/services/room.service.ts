import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';
 
export interface RoomSummary {
  id: string;
  name: string;
  createdBy: string;
  isAdmin: boolean;
  membershipStatus: 'ADMIN' | 'MEMBER' | 'PENDING' | 'NONE';
  memberCount: number;
}
 
export interface JoinRequestItem {
  id: string;
  roomId: string;
  roomName: string;
  username: string;
  status: string;
  requestedAt: string;
}
 
@Injectable({ providedIn: 'root' })
export class RoomApiService {
 
  private BASE = `${environment.apiUrl}/api/rooms`;
 
  constructor(private http: HttpClient, private authService: AuthService) {}
 
  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }
 
  getAllRooms(): Observable<RoomSummary[]> {
    return this.http.get<RoomSummary[]>(this.BASE, { headers: this.headers() });
  }
 
  createRoom(name: string, password: string): Observable<any> {
    return this.http.post(this.BASE, { name, password }, { headers: this.headers() });
  }
 
  requestToJoin(roomId: string, password: string): Observable<any> {
    return this.http.post(`${this.BASE}/${roomId}/join`, { password }, { headers: this.headers() });
  }
 
  checkAccess(roomId: string): Observable<{ hasAccess: boolean }> {
    return this.http.get<{ hasAccess: boolean }>(`${this.BASE}/${roomId}/access`, { headers: this.headers() });
  }
 
  getPendingRequests(roomId: string): Observable<JoinRequestItem[]> {
    return this.http.get<JoinRequestItem[]>(`${this.BASE}/${roomId}/requests`, { headers: this.headers() });
  }
 
  approveRequest(roomId: string, requestId: string): Observable<any> {
    return this.http.post(`${this.BASE}/${roomId}/requests/${requestId}/approve`, {}, { headers: this.headers() });
  }
 
  declineRequest(roomId: string, requestId: string): Observable<any> {
    return this.http.post(`${this.BASE}/${roomId}/requests/${requestId}/decline`, {}, { headers: this.headers() });
  }
 
  removeMember(roomId: string, username: string): Observable<any> {
    return this.http.delete(`${this.BASE}/${roomId}/members/${username}`, { headers: this.headers() });
  }
}
 