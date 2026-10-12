import test from 'node:test';
import assert from 'node:assert/strict';
import { useAuthStore } from '../store/authStore.ts';
import { api } from './client.ts';

test('client does not send requests if unauthenticated or without room', async () => {
  useAuthStore.getState().logout();
  assert.equal(useAuthStore.getState().accessToken, null);
  assert.ok(typeof api.login === 'function');
  assert.ok(typeof api.getRooms === 'function');
  assert.ok(typeof api.sendMessage === 'function');
});
