export interface ChatMessage {
  roomId: string;
  senderUsername: string;
  content: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE';
  timestamp?: string;
}