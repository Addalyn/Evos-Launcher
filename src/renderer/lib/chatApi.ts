import { strapiClient } from './strapi';
import { ChatMessage } from '../types/chat.types';

export interface StrapiChatMessage {
  id: number;
  messageId: string;
  fromHandle: string;
  toHandle: string;
  text: string;
  sentAt: string;
  isChannel: boolean;
}

/**
 * Saves a chat message to Strapi.
 */
export async function saveChatMessage(
  msg: ChatMessage,
  isChannel: boolean,
): Promise<void> {
  try {
    await strapiClient.from('chat-messages').create({
      messageId: msg.id,
      fromHandle: msg.from,
      toHandle: msg.to || '',
      text: msg.text,
      sentAt: new Date(msg.timestamp).toISOString(),
      isChannel,
    });
  } catch (error) {
    // console.error('Failed to save chat message to Strapi:', error);
  }
}

/**
 * Fetches chat history from Strapi.
 * @param conversation Handle or channel name
 * @param myHandle Current user's handle (required for DMs)
 * @param isChannel Whether this is a channel or DM
 * @param page Page number (starting at 1)
 * @param pageSize Number of messages per page
 */
export async function fetchChatHistory(
  conversation: string,
  myHandle: string,
  isChannel: boolean,
  page: number = 1,
  pageSize: number = 50,
): Promise<ChatMessage[]> {
  try {
    let query = strapiClient.from<StrapiChatMessage>('chat-messages').select();

    if (isChannel) {
      query = query.equalTo('toHandle', conversation).equalTo('isChannel', 1);
    } else {
      // For DMs, we fetch by recipient = myHandle
      query = query.equalTo('toHandle', conversation).equalTo('isChannel', 0);
    }

    const { data, error } = await query
      .sortBy([{ field: 'sentAt', order: 'desc' }])
      .paginate(page, pageSize)
      .get();

    if (error || !data) {
      return [];
    }

    // Convert Strapi format back to ChatMessage format
    return data
      .map((item: StrapiChatMessage) => ({
        id: item.messageId,
        from: item.fromHandle,
        to: item.toHandle,
        text: item.text,
        timestamp: new Date(item.sentAt).getTime(),
      }))
      .reverse(); // Reverse so they are in chronological order for the UI
  } catch (error) {
    // console.error('Failed to fetch chat history from Strapi:', error);
    return [];
  }
}
