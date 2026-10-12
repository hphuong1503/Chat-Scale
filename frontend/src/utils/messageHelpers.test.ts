import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeMessages } from './messageHelpers.ts';
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
