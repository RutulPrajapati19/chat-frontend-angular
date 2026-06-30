import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, BehaviorSubject } from 'rxjs';
import { ChatMessage } from '../models/chat-message.model';
import { AuthService } from './auth';
 
@Injectable({ providedIn: 'root' })
export class ChatService {
 
  private stompClient!: Client;
  private messageSubject = new Subject<ChatMessage>();
  public messages$ = this.messageSubject.asObservable();
 
  private connectionStatus = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectionStatus.asObservable();
 
  private pendingMessages: { roomId: string; message: ChatMessage }[] = [];
 
  constructor(private authService: AuthService) {}
 
  connect(roomId: string): void {
    const token = this.authService.getToken();
    this.connectionStatus.next(false);
 
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('https://chat-backend-vdje.onrender.com/ws') as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        console.log('WebSocket connected!');
        this.connectionStatus.next(true);
 
        this.stompClient.subscribe(`/topic/room/${roomId}`, (msg: IMessage) => {
          this.messageSubject.next(JSON.parse(msg.body));
        });
 
        while (this.pendingMessages.length > 0) {
          const pending = this.pendingMessages.shift();
          if (pending) this.publishNow(pending.roomId, pending.message);
        }
      },
      onDisconnect: () => this.connectionStatus.next(false),
      onStompError: (frame) => {
        console.error('WebSocket error:', frame);
        this.connectionStatus.next(false);
      }
    });
 
    this.stompClient.activate();
  }
 
  private publishNow(roomId: string, message: ChatMessage): void {
    this.stompClient.publish({
      destination: `/app/chat/${roomId}/send`,
      body: JSON.stringify(message)
    });
  }
 
  sendMessage(roomId: string, message: ChatMessage): void {
    if (this.stompClient?.connected) {
      this.publishNow(roomId, message);
    } else {
      this.pendingMessages.push({ roomId, message });
    }
  }
 
  disconnect(): void {
    this.pendingMessages = [];
    this.connectionStatus.next(false);
    this.stompClient?.deactivate();
  }
}