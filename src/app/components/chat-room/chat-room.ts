import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat';
import { AuthService } from '../../services/auth';
import { RoomService } from '../../services/room';
import { ChatMessage } from '../../models/chat-message.model';
import { JoinRequestItem } from '../../models/room.model';
 
@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-room.html'
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
 
  @ViewChild('messagesEnd') messagesEnd!: ElementRef;
 
  roomId = '';
  messages: ChatMessage[] = [];
  inputText = '';
  username = '';
  isConnected = false;
  checkingAccess = true;
  hasAccess = false;
  accessError = '';
 
  isAdmin = false;
  showAdminPanel = false;
  pendingRequests: JoinRequestItem[] = [];
  removeUsernameInput = '';
 
  private sub!: Subscription;
  private connSub!: Subscription;
  private backendUrl = 'https://chat-backend-vdje.onrender.com';
 
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private chatService: ChatService,
    private authService: AuthService,
    private roomService: RoomService,
    private cdr: ChangeDetectorRef
  ) {}
 
  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    this.username = this.authService.getUsername() || '';
 
    this.roomService.checkAccess(this.roomId).subscribe({
      next: (res) => {
        this.hasAccess = res.hasAccess;
        this.checkingAccess = false;
        this.cdr.detectChanges();
 
        if (this.hasAccess) {
          this.loadRoomData();
        }
      },
      error: () => {
        this.hasAccess = false;
        this.accessError = 'Could not verify access to this room.';
        this.checkingAccess = false;
        this.cdr.detectChanges();
      }
    });
 
    this.roomService.getAllRooms().subscribe(rooms => {
      const room = rooms.find(r => r.id === this.roomId);
      this.isAdmin = room?.isAdmin || false;
      this.cdr.detectChanges();
      if (this.isAdmin) this.loadPendingRequests();
    });
  }
 
  private loadRoomData(): void {
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
    this.http.get<ChatMessage[]>(`${this.backendUrl}/api/messages/${this.roomId}`, { headers })
      .subscribe({
        next: msgs => { this.messages = msgs; this.cdr.detectChanges(); },
        error: () => {}
      });
 
    this.chatService.connect(this.roomId);
 
    this.connSub = this.chatService.connected$.subscribe(status => {
      this.isConnected = status;
      this.cdr.detectChanges();
    });
 
    this.sub = this.chatService.messages$.subscribe(msg => {
      this.messages.push(msg);
      this.cdr.detectChanges();
    });
  }
 
  loadPendingRequests(): void {
    this.roomService.getPendingRequests(this.roomId).subscribe({
      next: requests => { this.pendingRequests = requests; this.cdr.detectChanges(); },
      error: () => {}
    });
  }
 
  toggleAdminPanel(): void {
    this.showAdminPanel = !this.showAdminPanel;
    if (this.showAdminPanel) this.loadPendingRequests();
  }
 
  approveRequest(requestId: string): void {
    this.roomService.approveRequest(this.roomId, requestId).subscribe({
      next: () => this.loadPendingRequests(),
      error: () => {}
    });
  }
 
  declineRequest(requestId: string): void {
    this.roomService.declineRequest(this.roomId, requestId).subscribe({
      next: () => this.loadPendingRequests(),
      error: () => {}
    });
  }
 
  removeMember(): void {
    if (!this.removeUsernameInput.trim()) return;
    this.roomService.removeMember(this.roomId, this.removeUsernameInput.trim()).subscribe({
      next: () => { this.removeUsernameInput = ''; },
      error: (err) => { this.accessError = err?.error?.error || 'Could not remove member'; this.cdr.detectChanges(); }
    });
  }
 
  ngAfterViewChecked(): void {
    this.messagesEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }
 
  sendMessage(): void {
    if (!this.inputText.trim()) return;
    const content = this.inputText;
    this.inputText = '';
 
    this.chatService.sendMessage(this.roomId, {
      roomId: this.roomId,
      senderUsername: this.username,
      content: content,
      type: 'CHAT'
    });
  }
 
  getAvatarColor(username: string): string {
    const colors = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#06b6d4','#f97316'];
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }
 
  formatTime(timestamp: string | undefined): string {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
 
  goBack(): void { this.router.navigate(['/rooms']); }
 
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.connSub?.unsubscribe();
    this.chatService.disconnect();
  }
}