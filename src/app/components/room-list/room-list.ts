import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth';
import { NotificationService, AppNotification } from '../../services/notification.service';
import { environment } from '../../../environments/environment';

interface Room {
  id: string;
  name: string;
  createdBy: string;
  memberStatus: string;
  admin: boolean;
  memberCount: number;
}

interface JoinRequestItem {
  requestId: string;
  roomId: string;
  roomName: string;
  username: string;
}

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './room-list.html'
})
export class RoomListComponent implements OnInit, OnDestroy {
  rooms: Room[] = [];
  filteredRooms: Room[] = [];
  searchQuery = '';
  newRoomName = '';
  newRoomPassword = '';
  username = '';
  creating = false;
  loadingRooms = true;
  error = '';
  success = false;

  pendingRequests: JoinRequestItem[] = [];
  showNotificationPanel = false;

  showJoinModal = false;
  joinRoomTarget: Room | null = null;
  joinPassword = '';
  joinError = '';
  joining = false;

  private notifSub!: Subscription;
  private API = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.username = this.authService.getUsername() || '';
    this.loadRooms();

    // Handle approval message from email link
    this.route.queryParams.subscribe(params => {
      const msg = params['msg'];
      if (msg === 'approved') {
        alert('✅ Request approved successfully!');
        this.router.navigate(['/rooms'], { replaceUrl: true });
      } else if (msg === 'declined') {
        alert('✅ Request declined.');
        this.router.navigate(['/rooms'], { replaceUrl: true });
      } else if (msg === 'already_resolved') {
        alert('ℹ️ This request was already resolved.');
        this.router.navigate(['/rooms'], { replaceUrl: true });
      }
    });

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
    this.http.get<Room[]>(`${this.API}/api/rooms`, { headers: this.getHeaders() })
      .subscribe({
        next: (rooms) => {
          this.rooms = rooms ?? [];
          this.filteredRooms = [...this.rooms];
          this.loadingRooms = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.rooms = [];
          this.filteredRooms = [];
          this.loadingRooms = false;
          this.cdr.detectChanges();
        }
      });
  }

  onSearch(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.filteredRooms = q
      ? this.rooms.filter(r => r.name.toLowerCase().includes(q))
      : [...this.rooms];
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
      `${this.API}/api/rooms`,
      { name, password: this.newRoomPassword.trim() },
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.newRoomName = '';
        this.newRoomPassword = '';
        this.creating = false;
        this.success = true;
        this.loadRooms();
      },
      error: () => {
        this.error = 'Failed to create room.';
        this.creating = false;
      }
    });
  }

  joinRoom(room: Room): void {
    if (room.admin || room.memberStatus === 'ADMIN' || room.memberStatus === 'MEMBER') {
      this.router.navigate(['/room', room.name]);
      return;
    }
    if (room.memberStatus === 'PENDING') {
      alert('⏳ Your join request is pending admin approval.');
      return;
    }
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
      `${this.API}/api/rooms/${this.joinRoomTarget.id}/request-join`,
      { password: this.joinPassword },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        this.joining = false;
        this.showJoinModal = false;
        if (res.status === 'APPROVED') {
          this.router.navigate(['/room', this.joinRoomTarget!.name]);
        } else {
          alert('✅ Join request sent! You will be notified when admin approves.');
          this.loadRooms();
        }
      },
      error: (err) => {
        this.joining = false;
        this.joinError = err.error?.error || 'Failed to send request';
      }
    });
  }

  approveRequest(req: JoinRequestItem): void {
    this.http.post<any>(
      `${this.API}/api/rooms/${req.roomId}/requests/${req.requestId}/approve`,
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

  declineRequest(req: JoinRequestItem): void {
    this.http.post<any>(
      `${this.API}/api/rooms/${req.roomId}/requests/${req.requestId}/decline`,
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

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
    this.notificationService.disconnect();
  }
}