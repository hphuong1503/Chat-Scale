import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeMessages, normalizeMessage } from './messageHelpers.ts';

import type { MessageItem } from '../types.ts';

test('mergeMessages preserves distinct messages with identical text', () => {
  const existing: MessageItem[] = [
    {
      id: 'msg-1',
      message: 'Hello world',
      room: 'room-1',
      created_at: '2026-01-01T10:00:00Z',
    },
  ];
  const incoming: MessageItem[] = [
    {
      id: 'msg-2',
      message: 'Hello world',
      room: 'room-1',
      created_at: '2026-01-01T10:01:00Z',
    },
  ];

  const result = mergeMessages(existing, incoming);
  assert.equal(result.length, 2);
  assert.equal(result[0].id, 'msg-1');
  assert.equal(result[1].id, 'msg-2');
});

test('mergeMessages deduplicates messages with the same ID', () => {
  const existing: MessageItem[] = [
    {
      id: 'msg-1',
      message: 'Original text',
      room: 'room-1',
      created_at: '2026-01-01T10:00:00Z',
      status: 'queued',
    },
  ];
  const incoming: MessageItem[] = [
    {
      id: 'msg-1',
      message: 'Original text',
      room: 'room-1',
      created_at: '2026-01-01T10:00:00Z',
      status: 'persisted',
    },
  ];

  const result = mergeMessages(existing, incoming);
  assert.equal(result.length, 1);
  assert.equal(result[0].status, 'persisted');
});

test('mergeMessages sorts messages oldest to newest by created_at', () => {
  const unsorted: MessageItem[] = [
    {
      id: 'msg-3',
      message: 'Third',
      room: 'room-1',
      created_at: '2026-01-01T10:02:00Z',
    },
    {
      id: 'msg-1',
      message: 'First',
      room: 'room-1',
      created_at: '2026-01-01T10:00:00Z',
    },
    {
      id: 'msg-2',
      message: 'Second',
      room: 'room-1',
      created_at: '2026-01-01T10:01:00Z',
    },
  ];

  const result = mergeMessages([], unsorted);
  assert.equal(result.length, 3);
  assert.equal(result[0].id, 'msg-1');
  assert.equal(result[1].id, 'msg-2');
  assert.equal(result[2].id, 'msg-3');
});

test('normalizeMessage correctly extracts canonical DTO fields', () => {
  const canonicalDto = {
    id: 'e26a6dc3-2491-46ec-826d-d3f53f141b6d',
    client_message_id: null,
    room_id: 'f9cba0d9-8e27-498a-ac96-1573b205ea0d',
    sender: { id: 17, username: 'alice' },
    content: 'Hello canonical',
    created_at: '2026-10-12T03:00:00.000000Z',
  };

  const normalized = normalizeMessage(canonicalDto);
  assert.equal(normalized.id, 'e26a6dc3-2491-46ec-826d-d3f53f141b6d');
  assert.equal(normalized.content, 'Hello canonical');
  assert.equal(normalized.message, 'Hello canonical');
  assert.equal(normalized.room_id, 'f9cba0d9-8e27-498a-ac96-1573b205ea0d');
  assert.equal(normalized.room, 'f9cba0d9-8e27-498a-ac96-1573b205ea0d');
  assert.deepEqual(normalized.sender, { id: 17, username: 'alice' });
  assert.equal(normalized.sender_id, 17);
  assert.equal(normalized.client_message_id, null);
  assert.equal(normalized.created_at, '2026-10-12T03:00:00.000000Z');
});

test('normalizeMessage parses WebSocket wire payload with data envelope', () => {
  const wsPayload = {
    type: 'message.created',
    data: {
      id: 'ws-msg-123',
      client_message_id: null,
      room_id: 'room-ws-456',
      sender: { id: 42, username: 'bob' },
      content: 'Realtime message',
      created_at: '2026-10-12T03:05:00.000000Z',
    },
    message: 'Realtime message',
    sender_id: '42',
    room_id: 'room-ws-456',
  };

  const normalized = normalizeMessage(wsPayload);
  assert.equal(normalized.id, 'ws-msg-123');
  assert.equal(normalized.content, 'Realtime message');
  assert.equal(normalized.message, 'Realtime message');
  assert.equal(normalized.room_id, 'room-ws-456');
  assert.deepEqual(normalized.sender, { id: 42, username: 'bob' });
  assert.equal(normalized.sender_id, 42);
  assert.equal(normalized.client_message_id, null);
});

test('normalizeMessage falls back to legacy payload fields', () => {
  const legacyPayload = {
    id: 'legacy-msg-1',
    message: 'Legacy message body',
    room: 'legacy-room-1',
    sender_id: 99,
    created_at: '2026-01-01T00:00:00Z',
  };

  const normalized = normalizeMessage(legacyPayload);
  assert.equal(normalized.id, 'legacy-msg-1');
  assert.equal(normalized.content, 'Legacy message body');
  assert.equal(normalized.message, 'Legacy message body');
  assert.equal(normalized.room, 'legacy-room-1');
  assert.equal(normalized.room_id, 'legacy-room-1');
  assert.equal(normalized.sender_id, 99);
  assert.deepEqual(normalized.sender, { id: 99, username: 'Member' });
});

test('mergeMessages reconciles repeated IDs between WS and REST without duplicates', () => {
  const restMessages = [
    {
      id: 'msg-dup-1',
      content: 'Initial text',
      message: 'Initial text',
      room_id: 'room-1',
      room: 'room-1',
      sender: { id: 1, username: 'alice' },
      created_at: '2026-10-12T00:00:01Z',
    },
  ];

  const wsEvent = {
    type: 'message.created',
    data: {
      id: 'msg-dup-1',
      client_message_id: null,
      room_id: 'room-1',
      sender: { id: 1, username: 'alice' },
      content: 'Updated persisted text',
      created_at: '2026-10-12T00:00:01Z',
    },
    message: 'Updated persisted text',
    sender_id: '1',
    room_id: 'room-1',
  };

  const merged = mergeMessages(restMessages, [wsEvent]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'msg-dup-1');
  assert.equal(merged[0].content, 'Updated persisted text');
});

