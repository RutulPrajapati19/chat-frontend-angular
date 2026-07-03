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
  loading = true;
  accessDenied = false;

  private sub!: Subscription;
  private API = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private chatService: ChatService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    this.username = this.authService.getUsername() || '';

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });

    // Load message history — if 403, show access denied
    this.http.get<ChatMessage[]>(
      `${this.API}/api/messages/${this.roomId}`,
      { headers }
    ).subscribe({
      next: (msgs) => {
        this.messages = msgs ?? [];
        this.loading = false;
        this.cdr.detectChanges();
        this.scrollToBottom();
        this.connectWebSocket();
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 403) {
          this.accessDenied = true;
        } else {
          this.messages = [];
          this.connectWebSocket();
        }
        this.cdr.detectChanges();
      }
    });
  }

  private connectWebSocket(): void {
    this.chatService.connect(this.roomId);
    this.sub = this.chatService.messages$.subscribe(msg => {
      this.zone.run(() => {
        this.messages = [...this.messages, msg];
        this.cdr.detectChanges();
        this.scrollToBottom();
      });
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      try {
        this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' });
      } catch (e) {}
    }, 50);
  }

  sendMessage(): void {
    const text = this.inputText.trim();
    if (!text) return;
    this.chatService.sendMessage(this.roomId, {
      roomId: this.roomId,
      senderUsername: this.username,
      content: text,
      type: 'CHAT'
    });
    this.inputText = '';
  }

  goBack(): void {
    this.router.navigate(['/rooms']);
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

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.chatService.disconnect();
  }
}