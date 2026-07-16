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
    mode: null,
    stage: 'idle',
    safetyAcknowledged: false,
    safetyCopyVersion: SAFETY_COPY_VERSION,
    target: 30,
    countdown: 0,
    creditedMs: 0,
    graceMs: 0,
    trackingMs: 0,
    form: 'valid',
    selectedCell: null,
    cells,
    liveCount: 4,
    todayCount: 128,
    streak: 7,
    completions: 0,
    completionMethod: null,
    notice: '',
    ...overrides,
  };
}

export function chooseMode(state, mode) {
  if (!['camera', 'honor'].includes(mode)) return state;
  if (state.completions > 0 && state.stage === 'complete') return state;
  return { ...state, mode, stage: state.safetyAcknowledged ? 'ready' : 'safety', notice: '' };
}

export function acknowledgeSafety(state) {
  if (!state.mode) return state;
  return { ...state, safetyAcknowledged: true, stage: 'ready', notice: '' };
}

export function selectCell(state, cellId) {
  if (state.stage !== 'ready' || !state.safetyAcknowledged) return state;
  const cell = state.cells.find((item) => item.id === cellId);
  if (!cell || cell.status !== 'available') return state;
  const cells = state.cells.map((item) => item.id === cellId ? { ...item, status: 'pending' } : item);
  return { ...state, stage: 'countdown', countdown: 3, creditedMs: 0, graceMs: 0, trackingMs: 0, form: 'valid', selectedCell: cellId, cells, notice: '' };
}

export function setForm(state, form) {
  if (!['valid', 'invalid', 'tracking'].includes(form)) return state;
  if (state.stage !== 'active' && state.stage !== 'grace' && state.stage !== 'paused') return { ...state, form };
  if (form === 'valid') return { ...state, form, stage: 'active', graceMs: 0, trackingMs: 0, notice: '' };
  if (form === 'tracking') return { ...state, form, trackingMs: 0, notice: 'TRACKING LOSS · RECOVERING' };
  return { ...state, form, stage: 'grace', graceMs: 0, trackingMs: 0, notice: 'CORRECT FORM · 5 SEC GRACE' };
}

export function tick(state, milliseconds) {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return state;
  if (state.stage === 'countdown') {
    const remaining = state.countdown - milliseconds / 1000;
    return remaining > 0 ? { ...state, countdown: remaining } : { ...state, stage: 'active', countdown: 0, notice: state.mode === 'honor' ? 'FORM NOT CAMERA-VALIDATED' : 'FORM VALIDATED · TIME COUNTING' };
  }
  if (state.stage !== 'active' && state.stage !== 'grace') return state;
  if (state.mode === 'camera' && state.form === 'tracking') {
    const trackingMs = state.trackingMs + milliseconds;
    return trackingMs < 500 ? { ...state, trackingMs } : { ...state, stage: 'paused', trackingMs: 500, notice: 'MOVE INTO FRAME' };
  }
  if (state.mode === 'camera' && state.stage === 'grace') {
    const graceMs = state.graceMs + milliseconds;
    return graceMs < 5000 ? { ...state, graceMs } : { ...state, stage: 'paused', graceMs: 5000, notice: 'FORM PAUSED · RETURN TO VALID FORM' };
  }
  if (state.mode === 'camera' && state.form !== 'valid') return state;
  const creditedMs = state.creditedMs + milliseconds;
  if (creditedMs < state.target * 1000) return { ...state, creditedMs };
  const cells = state.cells.map((item) => item.id === state.selectedCell ? { ...item, status: 'locked' } : item);
  return {
    ...state, stage: 'complete', creditedMs: state.target * 1000, cells,
    completions: state.completions + 1, streak: state.streak + 1, todayCount: state.todayCount + 1,
    target: Math.min(120, state.target + 5), completionMethod: state.mode, notice: 'PIXEL COMMITTED · NICE WORK',
  };
}

export function endSession(state) {
  if (!['countdown', 'active', 'grace', 'paused'].includes(state.stage)) return state;
  const cells = state.cells.map((item) => item.id === state.selectedCell ? { ...item, status: 'available' } : item);
  return { ...state, stage: 'ready', cells, selectedCell: null, countdown: 0, creditedMs: 0, graceMs: 0, trackingMs: 0, notice: 'SESSION RELEASED · PICK A NEW CELL TO RETRY' };
}

export function reduce(state, action) {
  switch (action.type) {
    case 'choose-mode': return chooseMode(state, action.mode);
    case 'acknowledge-safety': return acknowledgeSafety(state);
    case 'select-cell': return selectCell(state, action.cellId);
    case 'set-form': return setForm(state, action.form);
    case 'tick': return tick(state, action.ms);
    case 'end-session': return endSession(state);
    default: return state;
  }
}
