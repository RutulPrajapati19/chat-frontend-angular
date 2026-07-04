import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from './auth';
import { environment } from '../../environments/environment';

export interface AppNotification {
  type: 'JOIN_REQUEST' | 'REQUEST_APPROVED' | 'REQUEST_DECLINED';
  requestId?: string;
  roomId: string;
  roomName: string;
  username?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {

  notifications$ = new Subject<AppNotification>();

  private client!: Client;
  private sub!: StompSubscription;

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.client?.active) return;

    console.log('NotificationService: connecting...');

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${this.authService.getToken() ?? ''}`
      },
      reconnectDelay: 3000,
      onConnect: () => {
        console.log('NotificationService: WebSocket connected!');
        this.sub = this.client.subscribe(
          '/user/queue/notifications',
          (frame: IMessage) => {
            console.log('NotificationService: message received:', frame.body);
            try {
              const notification: AppNotification = JSON.parse(frame.body);
              console.log('NotificationService: parsed notification:', notification);
              this.notifications$.next(notification);
            } catch (e) {
              console.error('NotificationService: parse error', e);
            }
          }
        );
        console.log('NotificationService: subscribed to /user/queue/notifications');
      },
      onStompError: (frame) => {
        console.error('NotificationService: STOMP error', frame);
      },
      onDisconnect: () => {
        console.log('NotificationService: disconnected');
      },
      onWebSocketError: (error) => {
        console.error('NotificationService: WebSocket error', error);
      }
    });

    this.client.activate();
  }

  disconnect(): void {
    try {
      this.sub?.unsubscribe();
      this.client?.deactivate();
    } catch (e) {}
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}