export interface RoomSummary {
  id: string;
  name: string;
  createdBy: string;
  isAdmin: boolean;
  membershipStatus: 'ADMIN' | 'MEMBER' | 'PENDING' | 'NONE';
  memberCount: number;
}
 
export interface JoinRequestItem {
  id: string;
  roomId: string;
  roomName: string;
  username: string;
  status: string;
  requestedAt: string;
}