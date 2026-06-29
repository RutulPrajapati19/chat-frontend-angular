import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { ChatService } from '../../services/chat';
import { AuthService } from '../../services/auth';
import { ChatMessage } from '../../models/chat-message.model';
 
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
  private sub!: Subscription;
 
  private backendUrl = 'https://chat-backend-vdje.onrender.com';
 
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private chatService: ChatService,
    private authService: AuthService
  ) {}
 
  ngOnInit(): void {
    this.roomId = this.route.snapshot.paramMap.get('id') || '';
    this.username = this.authService.getUsername() || '';
 
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
    this.http.get<ChatMessage[]>(`${this.backendUrl}/api/messages/${this.roomId}`, { headers })
      .subscribe({ next: msgs => this.messages = msgs, error: () => {} });
 
    this.chatService.connect(this.roomId);
    this.sub = this.chatService.messages$.subscribe(msg => this.messages.push(msg));
  }
 
  ngAfterViewChecked(): void {
    this.messagesEnd?.nativeElement.scrollIntoView({ behavior: 'smooth' });
  }
 
  sendMessage(): void {
    if (!this.inputText.trim()) return;
    this.chatService.sendMessage(this.roomId, {
      roomId: this.roomId,
      senderUsername: this.username,
      content: this.inputText,
      type: 'CHAT'
    });
    this.inputText = '';
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
    this.chatService.disconnect();
  }
}