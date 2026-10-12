export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
}

export interface RoomMember {
  user: User;
  role: string;
  joined_at: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  room_type: 'DIRECT' | 'GROUP';
  created_by?: number;
  created_at: string;
  updated_at?: string;
  members?: RoomMember[];
}

export interface MessageSender {
  id: number;
  username: string;
}

export interface MessageItem {
  id: string;
  message: string;
  room: string;
  created_at: string;
  sender?: MessageSender;
  sender_id?: number | string;
  status?: 'queued' | 'persisted' | 'unknown';
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export type WSConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
