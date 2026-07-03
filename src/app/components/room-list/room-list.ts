import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';
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
  adminSuccess = '';
  adminError = '';
 
  private pollSub!: Subscription;
 
  constructor(
    private authService: AuthService,
    private roomApi: RoomApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}
 
  ngOnInit(): void {
    this.username = this.authService.getUsername() || '';
 
    // Poll every 10 seconds, starts immediately
    this.pollSub = interval(10000).pipe(
      startWith(0),
      switchMap(() => this.roomApi.getAllRooms())
    ).subscribe({
      next: rooms => {
        this.rooms = rooms;
        this.loadingRooms = false;
        this.cdr.detectChanges();
        if (this.adminRoomId) {
          this.loadPendingRequests(this.adminRoomId, false);
        }
      },
      error: () => {
        this.loadingRooms = false;
        this.errorMsg = 'Could not load rooms. Server may be waking up — wait 30 seconds and refresh.';
        this.cdr.detectChanges();
      }
    });
  }
 
  canEnter(room: RoomSummary): boolean {
    return room.membershipStatus === 'ADMIN' || room.membershipStatus === 'MEMBER';
  }
 
  handleRoomClick(room: RoomSummary): void {
    this.errorMsg = '';
    this.successMsg = '';
 
    if (this.canEnter(room)) {
      this.router.navigate(['/room', room.id]);
      return;
    }
 
    if (room.membershipStatus === 'PENDING') {
      this.successMsg = 'Your request is still pending admin approval. You will receive an email when approved.';
      this.cdr.detectChanges();
      return;
    }
 
    // NONE — show join modal
    this.joinTarget = room;
    this.joinPassword = '';
    this.joinError = '';
    this.showJoinModal = true;
    this.cdr.detectChanges();
  }
 
  cancelJoin(): void {
    this.showJoinModal = false;
    this.joinTarget = null;
    this.joinPassword = '';
    this.joinError = '';
  }
 
  submitJoinRequest(): void {
    if (!this.joinTarget || this.joining) return;
    if (!this.joinPassword.trim()) {
      this.joinError = 'Enter the room password.';
      this.cdr.detectChanges();
      return;
    }
    this.joining = true;
    this.joinError = '';
 
    this.roomApi.requestToJoin(this.joinTarget.id, this.joinPassword).subscribe({
      next: () => {
        this.joining = false;
        this.showJoinModal = false;
        this.successMsg = 'Request sent! You will receive an email when the admin approves.';
        // Reload rooms to update status to PENDING
        this.roomApi.getAllRooms().subscribe(rooms => {
          this.rooms = rooms;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.joining = false;
        this.joinError = err?.error?.error || 'Wrong password or request already sent.';
        this.cdr.detectChanges();
      }
    });
  }
 
  createRoom(): void {
    this.errorMsg = '';
    this.successMsg = '';
 
    if (!this.newRoomName.trim()) {
      this.errorMsg = 'Room name is required.';
      return;
    }
    if (this.newRoomPassword.length < 4) {
      this.errorMsg = 'Room password must be at least 4 characters.';
      return;
    }
 
    this.creating = true;
 
    this.roomApi.createRoom(this.newRoomName.trim(), this.newRoomPassword).subscribe({
      next: () => {
        this.newRoomName = '';
        this.newRoomPassword = '';
        this.creating = false;
        this.successMsg = 'Room created! You are the admin.';
        this.roomApi.getAllRooms().subscribe(rooms => {
          this.rooms = rooms;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.errorMsg = err?.error?.error || 'Could not create room.';
        this.creating = false;
        this.cdr.detectChanges();
      }
    });
  }
 
  toggleAdminPanel(roomId: string): void {
    if (this.adminRoomId === roomId) {
      this.adminRoomId = null;
      this.pendingRequests = [];
    } else {
      this.adminRoomId = roomId;
      this.loadPendingRequests(roomId, true);
    }
    this.cdr.detectChanges();
  }
 
  loadPendingRequests(roomId: string, showLoading: boolean): void {
    if (showLoading) this.loadingRequests = true;
    this.roomApi.getPendingRequests(roomId).subscribe({
      next: reqs => {
        this.pendingRequests = reqs;
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
    this.adminError = '';
    this.adminSuccess = '';
    this.roomApi.approveRequest(req.roomId, req.id).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== req.id);
        this.adminSuccess = `${req.username} approved and notified by email.`;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.adminError = err?.error?.error || 'Could not approve.';
        this.cdr.detectChanges();
      }
    });
  }
 
  declineRequest(req: JoinRequestItem): void {
    this.adminError = '';
    this.roomApi.declineRequest(req.roomId, req.id).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== req.id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.adminError = err?.error?.error || 'Could not decline.';
        this.cdr.detectChanges();
      }
    });
  }
 
  goToProfile(): void { this.router.navigate(['/profile']); }
 
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
 
  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}