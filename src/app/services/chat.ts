import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';
import { ChatMessage } from '../models/chat-message.model';
import { AuthService } from './auth';
 
@Injectable({ providedIn: 'root' })
export class ChatService {
 
  private stompClient!: Client;
  private messageSubject = new Subject<ChatMessage>();
  public messages$ = this.messageSubject.asObservable();
 
  constructor(private authService: AuthService) {}
 
  connect(roomId: string): void {
    const token = this.authService.getToken();
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS('https://chat-backend-vdje.onrender.com/ws') as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        console.log('WebSocket connected!');
        this.stompClient.subscribe(`/topic/room/${roomId}`, (msg: IMessage) => {
          this.messageSubject.next(JSON.parse(msg.body));
        });
      },
      onStompError: (frame) => console.error('WebSocket error:', frame)
    });
    this.stompClient.activate();
  }
 
  sendMessage(roomId: string, message: ChatMessage): void {
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: `/app/chat/${roomId}/send`,
        body: JSON.stringify(message)
      });
    }
  }
 
  disconnect(): void { this.stompClient?.deactivate(); }
}