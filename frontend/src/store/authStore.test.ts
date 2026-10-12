import test from 'node:test';
import assert from 'node:assert/strict';
import { useAuthStore } from './authStore.ts';

test('authStore in-memory updates and logout', () => {
  // Initial state reset
  useAuthStore.getState().logout();
  assert.equal(useAuthStore.getState().isAuthenticated, false);
  assert.equal(useAuthStore.getState().accessToken, null);
  assert.equal(useAuthStore.getState().refreshToken, null);
  assert.equal(useAuthStore.getState().user, null);

  // setAuth
  useAuthStore.getState().setAuth('access-123', 'refresh-456', {
    id: 1,
    username: 'alice',
    email: 'alice@example.com',
  });

  assert.equal(useAuthStore.getState().isAuthenticated, true);
  assert.equal(useAuthStore.getState().accessToken, 'access-123');
  assert.equal(useAuthStore.getState().refreshToken, 'refresh-456');
  assert.equal(useAuthStore.getState().user?.username, 'alice');

  // updateAccessToken
  useAuthStore.getState().updateAccessToken('access-789');
  assert.equal(useAuthStore.getState().accessToken, 'access-789');
  assert.equal(useAuthStore.getState().refreshToken, 'refresh-456');

  // logout
  useAuthStore.getState().logout();
  assert.equal(useAuthStore.getState().isAuthenticated, false);
  assert.equal(useAuthStore.getState().accessToken, null);
  assert.equal(useAuthStore.getState().refreshToken, null);
  assert.equal(useAuthStore.getState().user, null);
});
