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
}

export interface ChatServerMessage {
  type: 'CHAT' | 'SYSTEM' | 'USER_LIST' | 'ERROR' | 'CHANNEL_JOIN';
  from?: string;
  to?: string;
  text?: string;
  timestamp?: number;
  users?: string[];
  channels?: string[];
  id?: string;
}
