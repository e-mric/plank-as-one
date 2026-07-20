import { ARTWORK_ROWS, ARTWORK_WIDTH, ARTWORK_HEIGHT } from './artwork.js';

export { ARTWORK_ROWS, ARTWORK_WIDTH, ARTWORK_HEIGHT };
export const GRID_WIDTH = ARTWORK_WIDTH;
export const GRID_HEIGHT = ARTWORK_HEIGHT;
export const SAFETY_COPY_VERSION = 'mvp-1';

export function createInitialState(overrides = {}) {
  const targetIds = ARTWORK_ROWS.flatMap((row, y) => row.map((pixel, x) => pixel === '1' ? y * GRID_WIDTH + x : null).filter((id) => id !== null));
  const lockedIds = new Set(targetIds.slice(0, 18));
  const otherIds = new Set(targetIds.slice(18, 21));
  const cells = ARTWORK_ROWS.flatMap((row, y) => row.map((pixel, x) => {
    const id = y * GRID_WIDTH + x;
    return {
      id,
      target: pixel === '1',
      // A few completed and anonymous reservations make the shared artwork visible in the mock.
      status: pixel !== '1' ? 'empty' : lockedIds.has(id) ? 'locked' : otherIds.has(id) ? 'other' : 'available',
    };
  }));
  return {
    mode: 'camera',
    modeLocked: false,
    stage: 'safety',
    safetyAcknowledged: false,
    safetyCopyVersion: SAFETY_COPY_VERSION,
    target: 30,
    countdown: 0,
    creditedMs: 0,
    graceMs: 0,
    trackingMs: 0,
    form: 'valid',
    correction: null,
    selectedCell: null,
    requestedCell: null,
    cells,
    liveCount: 4,
    todayCount: 0,
    streak: 0,
    completions: 0,
    dailyCompleted: false,
    existingDailyCompletion: false,
    completionMethod: null,
    lastOutcome: null,
    notice: '',
    demo: false,
    shared: false,
    ...overrides,
  };
}

export function applySharedCanvasSnapshot(state, rows, { ownedCellId = state.selectedCell } = {}) {
  const remote = new Map(
    (Array.isArray(rows) ? rows : [])
      .filter((row) => Number.isInteger(row?.cell_id) && ['available', 'pending', 'locked'].includes(row?.status))
      .map((row) => [row.cell_id, row.status]),
  );
  const cells = state.cells.map((cell) => {
    if (!cell.target) return { ...cell, status: 'empty' };
    const status = remote.get(cell.id) || 'available';
    if (status === 'pending') return { ...cell, status: cell.id === ownedCellId ? 'pending' : 'other' };
    return { ...cell, status };
  });
  const statuses = [...remote.values()];
  return {
    ...state,
    cells,
    liveCount: statuses.filter((status) => status === 'pending').length,
    todayCount: statuses.filter((status) => status === 'locked').length,
    shared: true,
  };
}

export function createGuidedDemoState(source, { target = 8 } = {}) {
  const cells = source.cells.map((cell) => ({
    ...cell,
    status: cell.status === 'pending' ? 'available' : cell.status,
  }));
  const base = {
    ...source,
    mode: 'camera',
    modeLocked: false,
    stage: 'ready',
    safetyAcknowledged: true,
    target,
    countdown: 0,
    creditedMs: 0,
    graceMs: 0,
    trackingMs: 0,
    form: 'valid',
    correction: null,
    selectedCell: null,
    requestedCell: null,
    cells,
    completions: 0,
    dailyCompleted: false,
    existingDailyCompletion: false,
    completionMethod: null,
    lastOutcome: null,
    notice: '',
    demo: true,
  };
  const available = cells.find((cell) => cell.status === 'available');
  return available ? startAttempt(base, available.id) : base;
}

export function chooseMode(state, mode) {
  if (!['camera', 'honor'].includes(mode)) return state;
  if (state.modeLocked || state.stage !== 'ready' || state.completions > 0 || state.dailyCompleted) return state;
  return { ...state, mode, notice: '' };
}

export function acknowledgeSafety(state) {
  if (!state.mode) return state;
  const acknowledged = { ...state, safetyAcknowledged: true, stage: 'ready', notice: '' };
  return state.requestedCell === null
    ? acknowledged
    : startAttempt(acknowledged, state.requestedCell);
}

function startAttempt(state, cellId) {
  const cell = state.cells.find((item) => item.id === cellId);
  if (!cell || cell.status !== 'available') return state;
  const cells = state.cells.map((item) => item.id === cellId ? { ...item, status: 'pending' } : item);
  const stage = state.mode === 'camera' ? 'positioning' : 'countdown';
  return { ...state, stage, countdown: stage === 'countdown' ? 3 : 0, creditedMs: 0, graceMs: 0, trackingMs: 0, form: 'valid', correction: null, selectedCell: cellId, requestedCell: null, lastOutcome: null, cells, notice: stage === 'positioning' ? 'GET IN POSITION' : '' };
}

export function selectCell(state, cellId) {
  if (state.stage !== 'ready' || !state.mode || state.dailyCompleted) return state;
  const cell = state.cells.find((item) => item.id === cellId);
  if (!cell || cell.status !== 'available') return state;
  if (!state.safetyAcknowledged) {
    return { ...state, stage: 'safety', modeLocked: true, requestedCell: cellId, lastOutcome: null, notice: '' };
  }
  return startAttempt({ ...state, modeLocked: true }, cellId);
}

export function confirmReadyPosition(state) {
  if (state.mode !== 'camera' || state.stage !== 'positioning' || state.selectedCell === null) return state;
  return { ...state, stage: 'countdown', countdown: 3, form: 'valid', notice: 'HOLD READY' };
}

export function setForm(state, form, correction = null) {
  if (!['valid', 'invalid', 'hips-low', 'hips-high', 'tracking'].includes(form)) return state;
  if (state.stage !== 'active' && state.stage !== 'grace' && state.stage !== 'paused') return { ...state, form, correction };
  if (form === 'valid') return { ...state, form, correction: null, stage: 'active', graceMs: 0, trackingMs: 0, notice: '' };
  if (form === 'tracking') return { ...state, form, correction, trackingMs: 0, notice: 'HEY, COME BACK!' };
  const notice = form === 'hips-low' ? 'HIPS TOO LOW' : form === 'hips-high' ? 'HIPS TOO HIGH' : 'CORRECT FORM';
  return { ...state, form, correction, stage: 'grace', graceMs: 0, trackingMs: 0, notice };
}

export function applyPoseUpdate(state, { form, correction = null, ready = false } = {}) {
  if (ready && state.stage === 'positioning') return confirmReadyPosition(state);
  if (state.mode !== 'camera' || !form) return state;
  return setForm(state, form, correction);
}

export function tick(state, milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return state;
  if (state.stage === 'countdown') {
    const remaining = state.countdown - milliseconds / 1000;
    return remaining > 0 ? { ...state, countdown: remaining } : { ...state, stage: 'active', countdown: 0, notice: '' };
  }
  if (state.stage !== 'active' && state.stage !== 'grace') return state;
  if (state.mode === 'camera' && state.form === 'tracking') {
    const trackingMs = state.trackingMs + milliseconds;
    return trackingMs < 500 ? { ...state, trackingMs } : { ...state, stage: 'paused', trackingMs: 500, notice: 'HEY, COME BACK!' };
  }
  if (state.mode === 'camera' && state.stage === 'grace') {
    const graceMs = state.graceMs + milliseconds;
    return graceMs < 5000 ? { ...state, graceMs } : { ...state, stage: 'paused', graceMs: 5000, notice: 'FORM PAUSED · RETURN TO VALID FORM' };
  }
  if (state.mode === 'camera' && state.form !== 'valid') return state;
  const creditedMs = state.creditedMs + milliseconds;
  if (creditedMs < state.target * 1000) return { ...state, creditedMs };
  const cells = state.cells.map((item) => item.id === state.selectedCell ? { ...item, status: 'locked' } : item);
  const demo = Boolean(state.demo);
  return {
    ...state, stage: 'complete', creditedMs: state.target * 1000, correction: null, cells, dailyCompleted: !demo, existingDailyCompletion: false,
    completions: demo ? state.completions : state.completions + 1,
    streak: demo ? state.streak : state.streak + 1,
    todayCount: demo ? state.todayCount : state.todayCount + 1,
    target: demo ? state.target : Math.min(120, state.target + 2),
    completionMethod: demo ? 'guided-demo' : state.mode,
    lastOutcome: 'complete',
    notice: demo ? 'DEMO PIXEL COMPLETE · REAL PROGRESS UNCHANGED' : 'PIXEL COMMITTED · NICE WORK',
  };
}

export function endSession(state) {
  if (!['positioning', 'countdown', 'active', 'grace', 'paused'].includes(state.stage)) return state;
  const cells = state.cells.map((item) => item.id === state.selectedCell ? { ...item, status: 'available' } : item);
  return { ...state, stage: 'ready', modeLocked: false, cells, selectedCell: null, countdown: 0, creditedMs: 0, graceMs: 0, trackingMs: 0, correction: null, lastOutcome: 'failed', notice: '' };
}

export function markDailyCompleted(state) {
  return { ...state, dailyCompleted: true, existingDailyCompletion: true, modeLocked: true, notice: '' };
}

export function reduce(state, action) {
  switch (action.type) {
    case 'choose-mode': return chooseMode(state, action.mode);
    case 'acknowledge-safety': return acknowledgeSafety(state);
    case 'select-cell': return selectCell(state, action.cellId);
    case 'confirm-ready-position': return confirmReadyPosition(state);
    case 'set-form': return setForm(state, action.form, action.correction);
    case 'pose-update': return applyPoseUpdate(state, action);
    case 'mark-daily-completed': return markDailyCompleted(state);
    case 'tick': return tick(state, action.ms);
    case 'end-session': return endSession(state);
    default: return state;
  }
}
