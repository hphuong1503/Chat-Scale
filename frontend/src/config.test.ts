import test from 'node:test';
import assert from 'node:assert/strict';
import { getConfig } from './config.ts';

test('getConfig returns default endpoints when environment is not set', () => {
  const cfg = getConfig();
  assert.ok(cfg.apiUrl);
  assert.ok(cfg.wsUrl);
  assert.ok(!cfg.apiUrl.endsWith('/'));
  assert.ok(!cfg.wsUrl.endsWith('/'));
});
