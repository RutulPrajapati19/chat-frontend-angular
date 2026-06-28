import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../services/auth';

interface Room {
  id: string;
  name: string;
  createdBy?: string;
}

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-list.html'
})
export class RoomListComponent implements OnInit {
  rooms: Room[] = [];
  filteredRooms: Room[] = [];
  searchQuery = '';
  newRoomName = '';
  username = '';
  creating = false;
  loadingRooms = true;
  error = '';
  success = false;

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

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  loadRooms(): void {
    this.loadingRooms = true;
    this.http.get<any[]>('http://localhost:8080/api/rooms', { headers: this.getHeaders() })
      .subscribe({
        next: (rooms) => {
          this.rooms = (rooms ?? []).map(r => ({
            id: r.id || r._id,
            name: r.name,
            createdBy: r.createdBy
          }));
          this.filteredRooms = [...this.rooms];
          this.loadingRooms = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Rooms error:', err);
          this.rooms = [];
          this.filteredRooms = [];
          this.loadingRooms = false;
          this.cdr.detectChanges();
        }
      });
  }

  onSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredRooms = [...this.rooms];
    } else {
      this.filteredRooms = this.rooms.filter(r =>
        r.name.toLowerCase().includes(q)
      );
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredRooms = [...this.rooms];
  }

  createRoom(): void {
    const name = this.newRoomName.trim();
    if (!name || this.creating) return;

    this.creating = true;
    this.error = '';
    this.success = false;

    this.http.post<any>(
      'http://localhost:8080/api/rooms',
      { name },
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.newRoomName = '';
        this.creating = false;
        this.success = true;
        this.searchQuery = '';
        this.loadRooms();
      },
      error: () => {
        this.error = 'Failed to create room. Please try again.';
        this.creating = false;
      }
    });
  }

  joinRoom(room: Room): void {
    this.router.navigate(['/room', room.name]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}