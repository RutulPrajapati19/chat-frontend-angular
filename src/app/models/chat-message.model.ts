export interface ChatMessage {
  id?: string;
  roomId: string;
  senderUsername: string;
  content: string;
  timestamp?: string;
  type: 'CHAT' | 'JOIN' | 'LEAVE' | 'SYSTEM';
}