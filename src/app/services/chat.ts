import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ChatMessage } from '../models/chat-message.model';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class ChatService {

  messages$ = new Subject<ChatMessage>();

  private client!: Client;
  private stompSub!: StompSubscription;

  constructor(private authService: AuthService) {}

  connect(roomId: string): void {
    if (this.client?.active) {
      this.disconnect();
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${this.authService.getToken() ?? ''}`
      },
      reconnectDelay: 3000,
      onConnect: () => {
        // ✅ Fixed: matches @SendTo("/topic/room/{roomId}") in backend
        this.stompSub = this.client.subscribe(
          `/topic/room/${roomId}`,
          (frame: IMessage) => {
            try {
              const msg: ChatMessage = JSON.parse(frame.body);
              this.messages$.next(msg);
            } catch (e) {
              console.error('Parse error', e);
            }
          }
        );
      },
      onStompError: (frame) => console.error('STOMP error', frame),
      onDisconnect: () => console.log('STOMP disconnected')
    });

    this.client.activate();
  }

  sendMessage(roomId: string, message: ChatMessage): void {
    if (!this.client?.connected) {
      console.warn('WebSocket not connected yet');
      return;
    }
    // ✅ Fixed: matches @MessageMapping("/chat/{roomId}/send") in backend
    this.client.publish({
      destination: `/app/chat/${roomId}/send`,
      body: JSON.stringify(message)
    });
  }

  disconnect(): void {
    try {
      this.stompSub?.unsubscribe();
      this.client?.deactivate();
    } catch (e) {}
  }
}