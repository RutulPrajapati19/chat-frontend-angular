import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { RoomService } from '../../services/room';
import { RoomSummary } from '../../models/room.model';
 
@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-list.html'
})
export class RoomListComponent implements OnInit {
  rooms: RoomSummary[] = [];
  newRoomName = '';
  newRoomPassword = '';
  username = '';
  loading = true;
  errorMsg = '';
  successMsg = '';
 
  joiningRoomId: string | null = null;
  joinPasswordInput = '';
  joinError = '';
 
  constructor(
    private authService: AuthService,
    private roomService: RoomService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
 
  ngOnInit(): void {
    this.username = this.authService.getUsername() || '';
    this.loadRooms();
  }
 
  loadRooms(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.detectChanges();
 
    this.roomService.getAllRooms().subscribe({
      next: rooms => {
        this.rooms = rooms;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.rooms = [];
        this.loading = false;
        this.errorMsg = 'Could not load rooms. The server may be waking up. Try again shortly.';
        this.cdr.detectChanges();
        console.error('Failed to load rooms', err);
      }
    });
  }
 
  createRoom(): void {
    if (!this.newRoomName.trim()) return;
    if (this.newRoomPassword.length < 4) {
      this.errorMsg = 'Room password must be at least 4 characters.';
      this.cdr.detectChanges();
      return;
    }
 
    this.roomService.createRoom(this.newRoomName.trim(), this.newRoomPassword).subscribe({
      next: () => {
        this.newRoomName = '';
        this.newRoomPassword = '';
        this.errorMsg = '';
        this.successMsg = 'Room created.';
        this.loadRooms();
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'Could not create room.';
        this.cdr.detectChanges();
      }
    });
  }
 
  startJoinFlow(room: RoomSummary): void {
    if (room.membershipStatus === 'ADMIN' || room.membershipStatus === 'MEMBER') {
      this.router.navigate(['/room', room.id]);
      return;
    }
    if (room.membershipStatus === 'PENDING') {
      return;
    }
    this.joiningRoomId = room.id;
    this.joinPasswordInput = '';
    this.joinError = '';
    this.cdr.detectChanges();
  }
 
  cancelJoin(): void {
    this.joiningRoomId = null;
    this.joinPasswordInput = '';
    this.joinError = '';
  }
 
  submitJoinRequest(roomId: string): void {
    if (!this.joinPasswordInput) {
      this.joinError = 'Enter the room password.';
      this.cdr.detectChanges();
      return;
    }
 
    this.roomService.requestToJoin(roomId, this.joinPasswordInput).subscribe({
      next: () => {
        this.joiningRoomId = null;
        this.successMsg = 'Join request sent. Waiting for admin approval.';
        this.loadRooms();
      },
      error: (err) => {
        this.joinError = err?.error?.error || 'Could not join room.';
        this.cdr.detectChanges();
      }
    });
  }
 
  goToProfile(): void { this.router.navigate(['/profile']); }
 
  logout(): void { this.authService.logout(); this.router.navigate(['/login']); }
}