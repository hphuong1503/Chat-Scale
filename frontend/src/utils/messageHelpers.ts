import type { MessageItem, MessageSender } from '../types.ts';

/**
 * Normalizes a raw message payload (canonical DTO, WS event wire payload,
 * or legacy REST object) into a consistent MessageItem.
 */
export function normalizeMessage(raw: any): MessageItem {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      message: '',
      content: '',
      room: '',
      room_id: '',
      created_at: '',
      sender: null,
      sender_id: null,
      client_message_id: null,
      status: 'unknown',
    };
  }

  // Handle WebSocket wire payload wrapping canonical DTO in 'data'
  const source =
    raw.data && typeof raw.data === 'object'
      ? { ...raw, ...raw.data }
      : raw;

  const content = String(source.content ?? source.message ?? '');
  const message = String(source.message ?? source.content ?? '');
  const roomId = String(source.room_id ?? source.room ?? '');
  const room = String(source.room ?? source.room_id ?? '');

  let sender: MessageSender | null = null;
  if (source.sender && typeof source.sender === 'object') {
    sender = {
      id: Number(source.sender.id),
      username: String(source.sender.username || ''),
    };
  } else if (source.sender_id != null) {
    sender = {
      id: Number(source.sender_id),
      username: 'Member',
    };
  }

  return {
    id: String(source.id || ''),
    content,
    message,
    room_id: roomId,
    room,
    created_at: String(source.created_at || ''),
    sender,
    sender_id: sender
      ? sender.id
      : source.sender_id != null
      ? source.sender_id
      : null,
    client_message_id: source.client_message_id ?? null,
    status: source.status ?? 'persisted',
  };
}

/**
 * Deduplicates and sorts messages from oldest to newest by created_at,
 * preserving distinct messages with identical text and reconciling stable server IDs.
 */
export function mergeMessages(
  existing: (MessageItem | Record<string, any>)[],
  incoming: (MessageItem | Record<string, any>)[]
): MessageItem[] {
  const map = new Map<string, MessageItem>();

  for (const msg of existing) {
    const normalized = normalizeMessage(msg);
    if (normalized.id) {
      map.set(normalized.id, normalized);
    }
  }

  for (const msg of incoming) {
    const normalized = normalizeMessage(msg);
    if (normalized.id) {
      map.set(normalized.id, normalized);
    }
  }

  const merged = Array.from(map.values());

  merged.sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    if (isNaN(timeA) || isNaN(timeB)) return 0;
    return timeA - timeB;
  });

  return merged;
}

