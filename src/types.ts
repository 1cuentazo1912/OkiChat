export interface Room {
  id: string;
  nombre: string;
  capacidad: number;
  userCount?: number;
  isSpecial?: 'recien-llegados' | 'sala-silenciosa';
  description?: string;
}

export interface Profile {
  id: string;
  alias: string;
  color_texto: string;
  role?: 'user' | 'admin';
  created_at?: string;
  ultimo_cambio_alias?: string;
  silenciado_hasta?: string; // ISO string si está silenciado
  baneado?: boolean;
  email?: string;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  alias: string;
  contenido: string;
  color_texto?: string;
  created_at: string;
  is_system?: boolean;
  is_action?: boolean; // Para comando /me
  is_bot?: boolean; // Para Anfitrión OKI !
  reactions?: Record<string, string[]>; // { '👍': ['uid1', 'uid2'], '❤️': ['uid3'] }
}

export interface PrivateMessage {
  id: string;
  from_user: string;
  from_alias: string;
  to_user: string;
  to_alias: string;
  contenido: string;
  color_texto?: string;
  created_at: string;
}

export interface RoomUser {
  id: string;
  alias: string;
  color_texto: string;
  role?: 'user' | 'admin';
  created_at?: string;
  isSelf?: boolean;
  isBot?: boolean;
}

export interface Report {
  id: string;
  reporter_id: string;
  reporter_alias: string;
  reported_user_id: string;
  reported_alias: string;
  message_id?: string;
  message_content?: string;
  motivo: 'spam' | 'acoso' | 'contenido inapropiado' | 'datos personales' | 'otro';
  estado: 'pendiente' | 'revisado';
  created_at: string;
}

export interface Block {
  id: string;
  user_id: string;
  blocked_user_id: string;
  blocked_alias?: string;
  created_at: string;
}

export interface BannedWord {
  id: string;
  word: string;
  added_by?: string;
  created_at?: string;
}

export type EmojiReaction = '👍' | '😂' | '❤️' | '😮' | '😢';

export const REACTION_EMOJIS: EmojiReaction[] = ['👍', '😂', '❤️', '😮', '😢'];
