import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth';
import { RoomApiService, RoomSummary, JoinRequestItem } from '../../services/room.service';
 
@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-list.html'
})
export class RoomListComponent implements OnInit, OnDestroy {
  rooms: RoomSummary[] = [];
  username = '';
  loadingRooms = true;
  errorMsg = '';
  successMsg = '';
 
  newRoomName = '';
  newRoomPassword = '';
  creating = false;
 
  showJoinModal = false;
  joinTarget: RoomSummary | null = null;
  joinPassword = '';
  joinError = '';
  joining = false;
 
  adminRoomId: string | null = null;
  pendingRequests: JoinRequestItem[] = [];
  loadingRequests = false;
 
  private roomsSub!: Subscription;
  private pollSub!: Subscription;
 
  constructor(
    private authService: AuthService,
    private roomApi: RoomApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
 
  ngOnInit(): void {
    this.username = this.authService.getUsername() || '';
    this.loadRooms();
 
    // Poll every 8 seconds so admin sees new requests without refresh
    this.pollSub = interval(8000).pipe(
      switchMap(() => this.roomApi.getAllRooms())
    ).subscribe({
      next: rooms => {
        this.rooms = rooms;
        this.cdr.detectChanges();
        // Refresh pending requests if admin panel is open
        if (this.adminRoomId) {
          this.loadPendingRequests(this.adminRoomId);
        }
      },
      error: () => {}
    });
  }
 
  loadRooms(): void {
    this.loadingRooms = true;
    this.errorMsg = '';
    this.cdr.detectChanges();
 
    this.roomApi.getAllRooms().subscribe({
      next: rooms => {
        this.rooms = rooms;
        this.loadingRooms = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.rooms = [];
        this.loadingRooms = false;
        this.errorMsg = 'Could not load rooms. Server may be waking up — try again shortly.';
        this.cdr.detectChanges();
      }
    });
  }
 
  createRoom(): void {
    if (!this.newRoomName.trim()) {
      this.errorMsg = 'Room name is required.';
      return;
    }
    if (this.newRoomPassword.length < 4) {
      this.errorMsg = 'Room password must be at least 4 characters.';
      return;
    }
    this.creating = true;
    this.errorMsg = '';
    this.successMsg = '';
 
    this.roomApi.createRoom(this.newRoomName.trim(), this.newRoomPassword).subscribe({
      next: () => {
        this.newRoomName = '';
        this.newRoomPassword = '';
        this.creating = false;
        this.successMsg = 'Room created successfully.';
        this.loadRooms();
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'Could not create room.';
        this.creating = false;
        this.cdr.detectChanges();
      }
    });
  }
 
  handleRoomClick(room: RoomSummary): void {
    if (room.membershipStatus === 'ADMIN' || room.membershipStatus === 'MEMBER') {
      this.router.navigate(['/room', room.id]);
    } else if (room.membershipStatus === 'PENDING') {
      this.successMsg = 'Your request is pending admin approval.';
      this.cdr.detectChanges();
    } else {
      this.joinTarget = room;
      this.joinPassword = '';
      this.joinError = '';
      this.showJoinModal = true;
      this.cdr.detectChanges();
    }
  }
 
  cancelJoin(): void {
    this.showJoinModal = false;
    this.joinTarget = null;
    this.joinPassword = '';
    this.joinError = '';
  }
 
  submitJoinRequest(): void {
    if (!this.joinTarget || this.joining) return;
    if (!this.joinPassword) {
      this.joinError = 'Enter the room password.';
      return;
    }
    this.joining = true;
    this.joinError = '';
 
    this.roomApi.requestToJoin(this.joinTarget.id, this.joinPassword).subscribe({
      next: () => {
        this.joining = false;
        this.showJoinModal = false;
        this.successMsg = 'Request sent. You will receive an email when the admin approves.';
        this.loadRooms();
      },
      error: (err) => {
        this.joining = false;
        this.joinError = err?.error?.error || 'Could not send request. Check your password.';
        this.cdr.detectChanges();
      }
    });
  }
 
  openAdminPanel(roomId: string): void {
    if (this.adminRoomId === roomId) {
      this.adminRoomId = null;
      this.pendingRequests = [];
    } else {
      this.adminRoomId = roomId;
      this.loadPendingRequests(roomId);
    }
  }
 
  loadPendingRequests(roomId: string): void {
    this.loadingRequests = true;
    this.roomApi.getPendingRequests(roomId).subscribe({
      next: requests => {
        this.pendingRequests = requests;
        this.loadingRequests = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingRequests = false;
        this.cdr.detectChanges();
      }
    });
  }
 
  approveRequest(req: JoinRequestItem): void {
    this.roomApi.approveRequest(req.roomId, req.id).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== req.id);
        this.successMsg = `${req.username} approved.`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'Could not approve.';
        this.cdr.detectChanges();
      }
    });
  }
 
  declineRequest(req: JoinRequestItem): void {
    this.roomApi.declineRequest(req.roomId, req.id).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== req.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'Could not decline.';
        this.cdr.detectChanges();
      }
    });
  }
 
  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
 
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
 
  pendingCount(roomId: string): number {
    if (this.adminRoomId === roomId) return this.pendingRequests.length;
    return 0;
  }
 
  ngOnDestroy(): void {
    this.roomsSub?.unsubscribe();
    this.pollSub?.unsubscribe();
  }
}