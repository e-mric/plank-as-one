import { createClient } from '@supabase/supabase-js';

export const BUILD_WEEK_CHALLENGE_ID = 'openai-build-week-2026';

export function getSharedCanvasConfig(publicEnv = {}) {
  const url = publicEnv.PUBLIC_SUPABASE_URL?.trim();
  const key = publicEnv.PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && key ? { url, key } : null;
}

export function createSharedCanvasService({ url, key, challengeId = BUILD_WEEK_CHALLENGE_ID, client: suppliedClient = null }) {
  const client = suppliedClient || createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  let channel = null;
  let stopped = false;
  let refreshPromise = null;
  let snapshotListener = () => {};
  let statusListener = () => {};

  async function ensureIdentity() {
    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    if (sessionData.session) return sessionData.session.user;
    const { data, error } = await client.auth.signInAnonymously();
    if (error) throw error;
    return data.user;
  }

  async function refresh() {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      const { error: expiryError } = await client.rpc('expire_canvas_reservations');
      if (expiryError) throw expiryError;
      const { data, error } = await client
        .from('canvas_pixels')
        .select('cell_id,status')
        .eq('challenge_id', challengeId)
        .order('cell_id');
      if (error) throw error;
      if (!stopped) snapshotListener(data || []);
      return data || [];
    })().finally(() => { refreshPromise = null; });
    return refreshPromise;
  }

  async function connect({ onSnapshot = () => {}, onStatus = () => {} } = {}) {
    stopped = false;
    snapshotListener = onSnapshot;
    statusListener = onStatus;
    statusListener('connecting');
    await ensureIdentity();
    await refresh();
    channel = client
      .channel(`canvas:${challengeId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'canvas_pixels',
        filter: `challenge_id=eq.${challengeId}`,
      }, () => { void refresh().catch(() => statusListener('error')); })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') statusListener('live');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') statusListener('error');
        else if (status === 'CLOSED' && !stopped) statusListener('offline');
      });
  }

  async function call(functionName, args) {
    const { data, error } = await client.rpc(functionName, args);
    if (error) throw error;
    return data || { ok: false, reason: 'empty-response' };
  }

  async function reserve(cellId) {
    return call('reserve_canvas_pixel', { p_challenge_id: challengeId, p_cell_id: cellId });
  }

  async function release(cellId) {
    const result = await call('release_canvas_pixel', { p_challenge_id: challengeId, p_cell_id: cellId });
    await refresh();
    return result;
  }

  async function renew(cellId) {
    return call('renew_canvas_reservation', { p_challenge_id: challengeId, p_cell_id: cellId });
  }

  async function commit(cellId, completionMethod) {
    const result = await call('commit_canvas_pixel', {
      p_challenge_id: challengeId,
      p_cell_id: cellId,
      p_completion_method: completionMethod,
    });
    await refresh();
    return result;
  }

  async function disconnect() {
    stopped = true;
    statusListener('offline');
    if (channel) await client.removeChannel(channel);
    channel = null;
  }

  return { connect, refresh, reserve, release, renew, commit, disconnect };
}
