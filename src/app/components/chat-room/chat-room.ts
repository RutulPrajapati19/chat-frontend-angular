import {
  Component, OnInit, OnDestroy,
  ViewChild, ElementRef, ChangeDetectorRef, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat';
import { AuthService } from '../../services/auth';
import { RoomApiService, JoinRequestItem } from '../../services/room.service';
import { ChatMessage } from '../../models/chat-message.model';
import { environment } from '../../../environments/environment';
 
@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-room.html'
})
export class ChatRoomComponent implements OnInit, OnDestroy {
 
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;
 
  roomId = '';
  messages: ChatMessage[] = [];
  inputText = '';
  username = '';
  connected = false;
  checkingAccess = true;
  hasAccess = false;
 
  isAdmin = false;
  showAdminPanel = false;
  pendingRequests: JoinRequestItem[] = [];
  removeUsername = '';
  adminError = '';
  adminSuccess = '';
 
  private msgSub!: Subscription;
  private connSub!: Subscription;
 
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private chatService: ChatService,
    private authService: AuthService,
    private roomApi: RoomApiService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}
 
  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    this.username = this.authService.getUsername() || '';
 
    // Check access first
    this.roomApi.checkAccess(this.roomId).subscribe({
      next: (res) => {
        this.hasAccess = res.hasAccess;
        this.checkingAccess = false;
        this.cdr.detectChanges();
 
        if (this.hasAccess) {
          this.loadHistory();
          this.checkIfAdmin();
        }
      },
      error: () => {
        this.hasAccess = false;
        this.checkingAccess = false;
        this.cdr.detectChanges();
      }
    });
  }
 
  private loadHistory(): void {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });
    this.http.get<ChatMessage[]>(`${environment.apiUrl}/api/messages/${this.roomId}`, { headers })
      .subscribe({
        next: msgs => {
          this.messages = msgs ?? [];
          this.cdr.detectChanges();
          this.scrollToBottom();
          this.startWebSocket();
        },
        error: () => {
          this.messages = [];
          this.startWebSocket();
        }
      });
  }
 
  private startWebSocket(): void {
    this.chatService.connect(this.roomId);
 
    this.connSub = this.chatService.connected$.subscribe(status => {
      this.zone.run(() => {
        this.connected = status;
        this.cdr.detectChanges();
      });
    });
 
    this.msgSub = this.chatService.messages$.subscribe(msg => {
      this.zone.run(() => {
        this.messages = [...this.messages, msg];
        this.cdr.detectChanges();
        this.scrollToBottom();
      });
    });
  }
 
  private checkIfAdmin(): void {
    this.roomApi.getAllRooms().subscribe(rooms => {
      const room = rooms.find(r => r.id === this.roomId);
      this.isAdmin = room?.isAdmin || false;
      this.cdr.detectChanges();
    });
  }
 
  toggleAdminPanel(): void {
    this.showAdminPanel = !this.showAdminPanel;
    if (this.showAdminPanel) this.loadPendingRequests();
  }
 
  loadPendingRequests(): void {
    this.roomApi.getPendingRequests(this.roomId).subscribe({
      next: reqs => { this.pendingRequests = reqs; this.cdr.detectChanges(); },
      error: () => {}
    });
  }
 
  approveRequest(req: JoinRequestItem): void {
    this.roomApi.approveRequest(this.roomId, req.id).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== req.id);
        this.adminSuccess = `${req.username} approved.`;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }
 
  declineRequest(req: JoinRequestItem): void {
    this.roomApi.declineRequest(this.roomId, req.id).subscribe({
      next: () => {
        this.pendingRequests = this.pendingRequests.filter(r => r.id !== req.id);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }
 
  removeMember(): void {
    if (!this.removeUsername.trim()) return;
    this.roomApi.removeMember(this.roomId, this.removeUsername.trim()).subscribe({
      next: () => {
        this.adminSuccess = `${this.removeUsername} removed.`;
        this.removeUsername = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.adminError = err?.error?.error || 'Could not remove member.';
        this.cdr.detectChanges();
      }
    });
  }
 
  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text) return;
    this.inputText = '';
    this.chatService.sendMessage(this.roomId, {
      roomId: this.roomId,
      senderUsername: this.username,
      content: text,
      type: 'CHAT'
    });
  }
 
  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' });
      } catch (e) {}
    }, 50);
  }
 
  getAvatarColor(username: string): string {
    const colors = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4','#f97316'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
 
  formatTime(ts: string | undefined): string {
    if (!ts) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
 
  goBack(): void { this.router.navigate(['/rooms']); }
 
  ngOnDestroy(): void {
    this.msgSub?.unsubscribe();
    this.connSub?.unsubscribe();
    this.chatService.disconnect();
  }
}
 