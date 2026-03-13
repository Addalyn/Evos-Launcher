/**
 * @fileoverview Shared types for the chat feature to avoid dependency cycles.
 */

export interface ChatMessage {
  id: string;
  from: string;
  to?: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
  reactions?: Record<string, string[]>;
  repliedTo?: ChatMessage | string;
}

export interface ChatServerMessage {
  type: 'CHAT' | 'SYSTEM' | 'USER_LIST' | 'ERROR' | 'CHANNEL_JOIN' | 'REACTION';
  from?: string;
  to?: string;
  text?: string;
  timestamp?: number;
  users?: string[];
  channels?: string[];
  id?: string;
  messageId?: string; // For reactions
  reactions?: Record<string, string[]>; // For reactions
  repliedTo?: string; // ID of the message being replied to
  replied_to?: string; // ID of the message being replied to (snake_case)
}
