import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const challengeId = 'openai-build-week-2026';

function readLocalEnvironment() {
  try {
    return Object.fromEntries(
      readFileSync(new URL('../apps/web/.env', import.meta.url), 'utf8')
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#') && line.includes('='))
        .map((line) => {
          const separator = line.indexOf('=');
          return [line.slice(0, separator).replace(/^\uFEFF/, ''), line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2')];
        }),
    );
  } catch {
    return {};
  }
}

const localEnvironment = readLocalEnvironment();
const url = process.env.PUBLIC_SUPABASE_URL || localEnvironment.PUBLIC_SUPABASE_URL;
const key = process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || localEnvironment.PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) throw new Error('PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_PUBLISHABLE_KEY are required');

const makeClient = () => createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const clients = [makeClient(), makeClient()];
let selectedCell = null;
let realtimeChannel = null;

function waitForChannel(channel) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Realtime subscription timed out')), 10000);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        clearTimeout(timeout);
        resolve();
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        clearTimeout(timeout);
        reject(new Error(`Realtime subscription failed: ${status}`));
      }
    });
  });
}

try {
  await Promise.all(clients.map(async (client) => {
    const { error } = await client.auth.signInAnonymously();
    if (error) throw error;
  }));

  const { data: available, error: selectError } = await clients[0]
    .from('canvas_pixels')
    .select('cell_id')
    .eq('challenge_id', challengeId)
    .eq('status', 'available')
    .order('cell_id')
    .limit(1)
    .single();
  if (selectError) throw selectError;
  selectedCell = available.cell_id;

  const observedStatuses = [];
  const statusWaiters = new Map();
  realtimeChannel = clients[1]
    .channel(`deployment-smoke-${Date.now()}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'canvas_pixels',
      filter: `challenge_id=eq.${challengeId}`,
    }, ({ new: row }) => {
      if (row.cell_id !== selectedCell) return;
      observedStatuses.push(row.status);
      statusWaiters.get(row.status)?.();
    });
  await waitForChannel(realtimeChannel);

  const waitForStatus = (status) => observedStatuses.includes(status)
    ? Promise.resolve()
    : new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error(`Realtime did not report ${status}`)), 10000);
      statusWaiters.set(status, () => {
        clearTimeout(timeout);
        statusWaiters.delete(status);
        resolve();
      });
    });

  const pendingObserved = waitForStatus('pending');
  const reservations = await Promise.all(clients.map((client) => client.rpc('reserve_canvas_pixel', {
    p_challenge_id: challengeId,
    p_cell_id: selectedCell,
  })));
  reservations.forEach(({ error }) => { if (error) throw error; });
  const winners = reservations.map(({ data }, index) => ({ data, index })).filter(({ data }) => data?.ok);
  const losers = reservations.map(({ data }, index) => ({ data, index })).filter(({ data }) => !data?.ok);
  if (winners.length !== 1 || losers.length !== 1) throw new Error('Atomic reservation check did not produce one winner and one loser');
  if (!['cell-unavailable', 'reservation-conflict'].includes(losers[0].data?.reason)) {
    throw new Error(`Unexpected collision reason: ${losers[0].data?.reason || 'none'}`);
  }
  await pendingObserved;

  const availableObserved = waitForStatus('available');
  const { data: releaseResult, error: releaseError } = await clients[winners[0].index].rpc('release_canvas_pixel', {
    p_challenge_id: challengeId,
    p_cell_id: selectedCell,
  });
  if (releaseError) throw releaseError;
  if (!releaseResult?.ok) throw new Error(`Cleanup release failed: ${releaseResult?.reason || 'unknown'}`);
  await availableObserved;

  console.log(`PASS two-client reservation, collision, realtime, and release for cell ${selectedCell}`);
} finally {
  if (selectedCell !== null) {
    await Promise.allSettled(clients.map((client) => client.rpc('release_canvas_pixel', {
      p_challenge_id: challengeId,
      p_cell_id: selectedCell,
    })));
  }
  if (realtimeChannel) await clients[1].removeChannel(realtimeChannel);
  await Promise.allSettled(clients.map((client) => client.removeAllChannels()));
  clients.forEach((client) => client.realtime.disconnect());
}
