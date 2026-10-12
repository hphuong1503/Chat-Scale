import type { MessageItem } from '../types';

/**
 * Deduplicates and sorts messages from oldest to newest by created_at,
 * preserving distinct messages with identical text and stable server IDs.
 */
export function mergeMessages(
  existing: MessageItem[],
  incoming: MessageItem[]
): MessageItem[] {
  const map = new Map<string, MessageItem>();

  for (const msg of existing) {
    map.set(msg.id, msg);
  }

  for (const msg of incoming) {
    // If incoming exists, replace to reflect persisted state
    map.set(msg.id, msg);
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
