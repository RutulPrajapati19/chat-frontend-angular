import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from './auth';

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

    this.client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${this.authService.getToken() ?? ''}`
      },
      reconnectDelay: 3000,
      onConnect: () => {
        this.sub = this.client.subscribe(
          '/user/queue/notifications',
          (frame: IMessage) => {
            try {
              const notification: AppNotification = JSON.parse(frame.body);
              this.notifications$.next(notification);
            } catch (e) {
              console.error('Failed to parse notification', e);
            }
          }
        );
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