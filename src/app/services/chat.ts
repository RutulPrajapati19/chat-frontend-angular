import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ChatMessage } from '../models/chat-message.model';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';
 
@Injectable({ providedIn: 'root' })
export class ChatService {
 
  messages$ = new Subject<ChatMessage>();
  connected$ = new BehaviorSubject<boolean>(false);
 
  private client!: Client;
  private stompSub!: StompSubscription;
  private pendingMessages: { roomId: string; message: ChatMessage }[] = [];
 
  constructor(private authService: AuthService) {}
 
  connect(roomId: string): void {
    if (this.client?.active) {
      this.disconnect();
    }
 
    this.client = new Client({
      webSocketFactory: () => new SockJS(`${environment.wsUrl}/ws`) as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${this.authService.getToken() ?? ''}`
      },
      reconnectDelay: 3000,
      onConnect: () => {
        this.connected$.next(true);
 
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
 
        // Flush pending messages
        while (this.pendingMessages.length > 0) {
          const pending = this.pendingMessages.shift();
          if (pending) this.publishNow(pending.roomId, pending.message);
        }
      },
      onDisconnect: () => this.connected$.next(false),
      onStompError: (frame) => {
        console.error('STOMP error', frame);
        this.connected$.next(false);
      }
    });
 
    this.client.activate();
  }
 
  private publishNow(roomId: string, message: ChatMessage): void {
    this.client.publish({
      destination: `/app/chat/${roomId}/send`,
      body: JSON.stringify(message)
    });
  }
 
  sendMessage(roomId: string, message: ChatMessage): void {
    if (this.client?.connected) {
      this.publishNow(roomId, message);
    } else {
      // Queue message and it sends automatically when connected
      this.pendingMessages.push({ roomId, message });
    }
  }
 
  disconnect(): void {
    try {
      this.pendingMessages = [];
      this.stompSub?.unsubscribe();
      this.client?.deactivate();
      this.connected$.next(false);
    } catch (e) {}
  }
}