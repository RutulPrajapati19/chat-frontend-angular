import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';
 
@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-list.html'
})
export class RoomListComponent implements OnInit {
  rooms: any[] = [];
  newRoomName = '';
  username = '';
 
  private backendUrl = 'https://chat-backend-vdje.onrender.com';
 
  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {}
 
  ngOnInit(): void {
    this.username = this.authService.getUsername() || '';
    this.loadRooms();
  }
 
  private headers() {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }
 
  loadRooms(): void {
    this.http.get<any[]>(`${this.backendUrl}/api/rooms`, { headers: this.headers() })
      .subscribe({ next: rooms => this.rooms = rooms, error: () => this.rooms = [] });
  }
 
  createRoom(): void {
    if (!this.newRoomName.trim()) return;
    this.http.post<any>(`${this.backendUrl}/api/rooms`, { name: this.newRoomName }, { headers: this.headers() })
      .subscribe({ next: room => { this.rooms.unshift(room); this.newRoomName = ''; } });
  }
 
  joinRoom(roomId: string): void { this.router.navigate(['/room', roomId]); }
 
  logout(): void { this.authService.logout(); this.router.navigate(['/login']); }
}