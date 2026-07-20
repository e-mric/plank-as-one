import test from 'node:test';
import assert from 'node:assert/strict';
import { createSharedCanvasService, getSharedCanvasConfig } from '../src/lib/shared-canvas.js';

test('shared canvas configuration requires both public values', () => {
  assert.equal(getSharedCanvasConfig({}), null);
  assert.equal(getSharedCanvasConfig({ PUBLIC_SUPABASE_URL: 'https://example.supabase.co' }), null);
  assert.deepEqual(getSharedCanvasConfig({
    PUBLIC_SUPABASE_URL: ' https://example.supabase.co ',
    PUBLIC_SUPABASE_PUBLISHABLE_KEY: ' publishable-key ',
  }), { url: 'https://example.supabase.co', key: 'publishable-key' });
});

test('shared canvas service authenticates, loads a snapshot, subscribes, and reserves through RPC', async () => {
  const rpcCalls = [];
  const statuses = [];
  const snapshots = [];
  const channel = {
    on() { return this; },
    subscribe(listener) { listener('SUBSCRIBED'); return this; },
  };
  const client = {
    auth: {
      async getSession() { return { data: { session: null }, error: null }; },
      async signInAnonymously() { return { data: { user: { id: 'anonymous-user' } }, error: null }; },
    },
    async rpc(name, args) {
      rpcCalls.push([name, args]);
      return { data: name === 'reserve_canvas_pixel' ? { ok: true, cell_id: args.p_cell_id } : 0, error: null };
    },
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        async order() { return { data: [{ cell_id: 1, status: 'locked' }], error: null }; },
      };
    },
    channel() { return channel; },
    async removeChannel() {},
  };
  const service = createSharedCanvasService({ url: 'unused', key: 'unused', client });

  await service.connect({ onSnapshot: (rows) => snapshots.push(rows), onStatus: (status) => statuses.push(status) });
  const reservation = await service.reserve(22);
  await service.disconnect();

  assert.deepEqual(snapshots, [[{ cell_id: 1, status: 'locked' }]]);
  assert.deepEqual(statuses, ['connecting', 'live', 'offline']);
  assert.deepEqual(reservation, { ok: true, cell_id: 22 });
  assert.equal(rpcCalls[0][0], 'expire_canvas_reservations');
  assert.deepEqual(rpcCalls[1], ['reserve_canvas_pixel', { p_challenge_id: 'openai-build-week-2026', p_cell_id: 22 }]);
});
