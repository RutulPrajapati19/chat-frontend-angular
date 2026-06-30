import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';
import { RoomSummary, JoinRequestItem } from '../models/room.model';
 
@Injectable({ providedIn: 'root' })
export class RoomService {
 
  private apiUrl = 'https://chat-backend-vdje.onrender.com/api/rooms';
 
  constructor(private http: HttpClient, private authService: AuthService) {}
 
  private headers() {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }
 
  getAllRooms(): Observable<RoomSummary[]> {
    return this.http.get<RoomSummary[]>(this.apiUrl, { headers: this.headers() });
  }
 
  createRoom(name: string, password: string): Observable<any> {
    return this.http.post(this.apiUrl, { name, password }, { headers: this.headers() });
  }
 
  requestToJoin(roomId: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${roomId}/join`, { password }, { headers: this.headers() });
  }
 
  getPendingRequests(roomId: string): Observable<JoinRequestItem[]> {
    return this.http.get<JoinRequestItem[]>(`${this.apiUrl}/${roomId}/requests`, { headers: this.headers() });
  }
 
  approveRequest(roomId: string, requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${roomId}/requests/${requestId}/approve`, {}, { headers: this.headers() });
  }
 
  declineRequest(roomId: string, requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${roomId}/requests/${requestId}/decline`, {}, { headers: this.headers() });
  }
 
  removeMember(roomId: string, username: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${roomId}/members/${username}`, { headers: this.headers() });
  }
 
  checkAccess(roomId: string): Observable<{ hasAccess: boolean }> {
    return this.http.get<{ hasAccess: boolean }>(`${this.apiUrl}/${roomId}/access`, { headers: this.headers() });
  }
}