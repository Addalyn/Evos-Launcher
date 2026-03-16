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
  reactions?: any;
  replied_to?: StrapiChatMessage;
}

/**
 * Encodes an emoji string to a safe hex format for Strapi keys.
 */
function encodeEmoji(emoji: string): string {
  return `__enc_${Array.from(emoji)
    .map((c) => c.codePointAt(0)?.toString(16))
    .join('_')}`;
}

/**
 * Decodes a hex format back to an emoji string.
 */
function decodeEmoji(encoded: string): string {
  if (!encoded || !encoded.startsWith('__enc_')) return encoded;
  return encoded
    .slice(6)
    .split('_')
    .map((hex) => String.fromCodePoint(parseInt(hex, 16)))
    .join('');
}

/**
 * Encodes all emojis in a text string to a safe hex format.
 */
function encodeText(text: string): string {
  // Matches characters outside the BMP (Surrogate pairs / 4-byte characters like emojis)
  return text.replace(/[\u{10000}-\u{10FFFF}]/gu, (match) =>
    encodeEmoji(match),
  );
}

/**
 * Decodes all hex-encoded blocks in a string back to emojis.
 */
function decodeText(text: string): string {
  // Matches the encoded pattern __enc_... (non-greedy specific termination)
  return text.replace(/__enc_[0-9a-f]+(?:_[0-9a-f]+)*/g, (match) =>
    decodeEmoji(match),
  );
}

/**
 * Encodes all keys in a reactions object.
 */
function encodeReactions(
  reactions: Record<string, string[]>,
): Record<string, string[]> {
  const encoded: Record<string, string[]> = {};
  Object.entries(reactions).forEach(([key, value]) => {
    encoded[encodeEmoji(key)] = value;
  });
  return encoded;
}

/**
 * Decodes all keys in a reactions object.
 */
function decodeReactions(
  reactions: Record<string, string[]>,
): Record<string, string[]> {
  const decoded: Record<string, string[]> = {};
  Object.entries(reactions).forEach(([key, value]) => {
    decoded[decodeEmoji(key)] = value;
  });
  return decoded;
}

/**
 * Saves a chat message to Strapi.
 */
export async function saveChatMessage(
  msg: ChatMessage,
  isChannel: boolean,
): Promise<void> {
  try {
    const payload: any = {
      messageId: msg.id,
      fromHandle: msg.from,
      toHandle: msg.to || '',
      text: encodeText(msg.text),
      sentAt: new Date(msg.timestamp).toISOString(),
      isChannel,
      reactions: encodeReactions(msg.reactions || {}),
    };

    if (msg.repliedTo) {
      const repliedToId =
        typeof msg.repliedTo === 'string' ? msg.repliedTo : msg.repliedTo.id;

      // Resolve numeric ID for the original message
      const { data: originalMsg } = await strapiClient
        .from<StrapiChatMessage>('chat-messages')
        .select()
        .equalTo('messageId', repliedToId)
        .get();

      if (originalMsg && originalMsg.length > 0) {
        payload.replied_to = originalMsg[0].id;
      }
    }

    await strapiClient.from('chat-messages').create(payload);
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
  pageSize: number = 10,
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
      .populateWith('replied_to', ['*'], true)
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
        text: decodeText(item.text),
        timestamp: new Date(item.sentAt).getTime(),
        reactions: decodeReactions(item.reactions || {}),
        repliedTo: item.replied_to
          ? {
              id: item.replied_to.messageId,
              from: item.replied_to.fromHandle,
              to: item.replied_to.toHandle,
              text: decodeText(item.replied_to.text),
              timestamp: new Date(item.replied_to.sentAt).getTime(),
            }
          : undefined,
      }))
      .reverse(); // Reverse so they are in chronological order for the UI
  } catch (error) {
    // console.error('Failed to fetch chat history from Strapi:', error);
    return [];
  }
}

/**
 * Updates reactions for a message in Strapi.
 */
export async function updateMessageReactions(
  messageId: string,
  reactions: Record<string, string[]>,
): Promise<void> {
  try {
    // Find the message in Strapi by its messageId
    const { data } = await strapiClient
      .from<StrapiChatMessage>('chat-messages')
      .select()
      .equalTo('messageId', messageId)
      .get();

    if (data && data.length > 0) {
      await strapiClient.from('chat-messages').update(data[0].id, {
        reactions: encodeReactions(reactions),
      });
    }
  } catch (error) {
    // console.error('Failed to update reactions in Strapi:', error);
  }
}
