import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth';
import { NotificationService, AppNotification } from '../../services/notification.service';

interface Room { id: string; name: string; createdBy?: string; }
interface JoinRequest { requestId: string; roomId: string; roomName: string; username: string; }

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './room-list.html'
})
export class RoomListComponent implements OnInit, OnDestroy {
  rooms: Room[] = [];
  filteredRooms: Room[] = [];
  searchQuery = '';
  newRoomName = '';
  username = '';
  creating = false;
  loadingRooms = true;
  error = '';
  success = false;

  // Notification popup
  pendingRequests: JoinRequest[] = [];
  showNotificationPanel = false;

  // Join request popup for non-members
  showJoinModal = false;
  joinRoomTarget: Room | null = null;
  joinPassword = '';
  joinError = '';
  joining = false;

  private notifSub!: Subscription;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername() || '';
    this.loadRooms();
    this.notificationService.connect();
    this.notifSub = this.notificationService.notifications$.subscribe(n => {
      this.handleNotification(n);
    });
  }

  private handleNotification(n: AppNotification): void {
    if (n.type === 'JOIN_REQUEST') {
      this.pendingRequests = [...this.pendingRequests, {
        requestId: n.requestId!,
        roomId: n.roomId,
        roomName: n.roomName,
        username: n.username!
      }];
      this.showNotificationPanel = true;
      this.cdr.detectChanges();
    } else if (n.type === 'REQUEST_APPROVED') {
      alert(`✅ Your request to join #${n.roomName} was approved! You can now enter the room.`);
      this.loadRooms();
    } else if (n.type === 'REQUEST_DECLINED') {
      alert(`❌ Your request to join #${n.roomName} was declined.`);
    }
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  loadRooms(): void {
    this.loadingRooms = true;
    this.http.get<any[]>('http://localhost:8080/api/rooms', { headers: this.getHeaders() })
      .subscribe({
        next: (rooms) => {
          this.rooms = (rooms ?? []).map(r => ({ id: r.id || r._id, name: r.name, createdBy: r.createdBy }));
          this.filteredRooms = [...this.rooms];
          this.loadingRooms = false;
          this.cdr.detectChanges();
        },
        error: () => { this.rooms = []; this.filteredRooms = []; this.loadingRooms = false; }
      });
  }

  onSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredRooms = q ? this.rooms.filter(r => r.name.toLowerCase().includes(q)) : [...this.rooms];
  }

  clearSearch(): void { this.searchQuery = ''; this.filteredRooms = [...this.rooms]; }

  createRoom(): void {
    const name = this.newRoomName.trim();
    if (!name || this.creating) return;
    this.creating = true; this.error = ''; this.success = false;
    this.http.post<any>('http://localhost:8080/api/rooms', { name }, { headers: this.getHeaders() })
      .subscribe({
        next: () => { this.newRoomName = ''; this.creating = false; this.success = true; this.loadRooms(); },
        error: () => { this.error = 'Failed to create room.'; this.creating = false; }
      });
  }

  joinRoom(room: Room): void {
    // If user is admin or already member, go straight in
    if (room.createdBy === this.username) {
      this.router.navigate(['/room', room.name]);
      return;
    }
    // Otherwise show join request modal
    this.joinRoomTarget = room;
    this.joinPassword = '';
    this.joinError = '';
    this.showJoinModal = true;
  }

  submitJoinRequest(): void {
    if (!this.joinRoomTarget || this.joining) return;
    this.joining = true;
    this.joinError = '';

    this.http.post<any>(
      `http://localhost:8080/api/rooms/${this.joinRoomTarget.id}/request-join`,
      { password: this.joinPassword },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.joining = false;
        if (res.status === 'APPROVED') {
          this.showJoinModal = false;
          this.router.navigate(['/room', this.joinRoomTarget!.name]);
        } else {
          this.showJoinModal = false;
          alert('✅ Join request sent! You will be notified when the admin approves.');
        }
      },
      error: (err) => {
        this.joining = false;
        this.joinError = err.error?.error || 'Failed to send request';
      }
    });
  }

  approveRequest(req: JoinRequest): void {
    this.http.post<any>(
      `http://localhost:8080/api/rooms/${req.roomId}/requests/${req.requestId}/approve`,
      {},
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.requestId !== req.requestId);
        if (this.pendingRequests.length === 0) this.showNotificationPanel = false;
        this.cdr.detectChanges();
      },
      error: (err) => alert('Error: ' + (err.error?.error || 'Failed to approve'))
    });
  }

  declineRequest(req: JoinRequest): void {
    this.http.post<any>(
      `http://localhost:8080/api/rooms/${req.roomId}/requests/${req.requestId}/decline`,
      {},
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.requestId !== req.requestId);
        if (this.pendingRequests.length === 0) this.showNotificationPanel = false;
        this.cdr.detectChanges();
      },
      error: (err) => alert('Error: ' + (err.error?.error || 'Failed to decline'))
    });
  }

  logout(): void { this.authService.logout(); this.router.navigate(['/login']); }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
    this.notificationService.disconnect();
  }
}