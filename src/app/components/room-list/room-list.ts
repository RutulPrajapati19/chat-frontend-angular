import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  loading = true;
  errorMsg = '';
 
  private backendUrl = 'https://chat-backend-vdje.onrender.com';
 
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
 
  ngOnInit(): void {
    this.username = this.authService.getUsername() || '';
    this.loadRooms();
  }
 
  private headers() {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }
 
  loadRooms(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();
 
    this.http.get<any[]>(`${this.backendUrl}/api/rooms`, { headers: this.headers() })
      .subscribe({
        next: rooms => {
          this.rooms = rooms;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.rooms = [];
          this.loading = false;
          this.errorMsg = 'Could not load rooms. The server may be waking up — try again in a moment.';
          this.cdr.detectChanges();
          console.error('Failed to load rooms', err);
        }
      });
  }
 
  createRoom(): void {
    if (!this.newRoomName.trim()) return;
    const name = this.newRoomName.trim();
    this.newRoomName = '';
 
    this.http.post<any>(`${this.backendUrl}/api/rooms`, { name }, { headers: this.headers() })
      .subscribe({
        next: room => {
          this.rooms = [room, ...this.rooms];
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMsg = 'Could not create room. Try again.';
          this.cdr.detectChanges();
          console.error('Failed to create room', err);
        }
      });
  }
 
  joinRoom(roomId: string): void { this.router.navigate(['/room', roomId]); }
 
  goToProfile(): void { this.router.navigate(['/profile']); }
 
  logout(): void { this.authService.logout(); this.router.navigate(['/login']); }
}