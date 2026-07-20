import test from 'node:test';
import assert from 'node:assert/strict';
import { applySharedCanvasSnapshot, createGuidedDemoState, createInitialState, chooseMode, acknowledgeSafety, selectCell, confirmReadyPosition, tick, setForm, endSession, markDailyCompleted, reduce, ARTWORK_WIDTH, ARTWORK_HEIGHT } from '../state.js';

const availableCell = (state, offset = 0) => state.cells.filter((cell) => cell.status === 'available')[offset].id;

test('shared canvas is the OPENAI BUILD WEEK artwork mask, not a generic grid', () => {
  const state = createInitialState();
  assert.equal(ARTWORK_WIDTH, 35);
  assert.equal(ARTWORK_HEIGHT, 23);
  assert.equal(state.cells.length, ARTWORK_WIDTH * ARTWORK_HEIGHT);
  assert.ok(state.cells.some((cell) => cell.target && cell.status === 'available'));
  assert.ok(state.cells.some((cell) => !cell.target && cell.status === 'empty'));
});

test('camera is default, mode locks on pixel choice, and safety precedes reservation', () => {
  let s = createInitialState();
  assert.equal(s.mode, 'camera');
  assert.equal(s.stage, 'safety');
  assert.equal(s.dailyCompleted, false);
  s = acknowledgeSafety(s);
  assert.equal(s.stage, 'ready');
  s = chooseMode(s, 'honor');
  assert.equal(s.mode, 'honor');
  const cellId = availableCell(s);
  s = selectCell(s, cellId);
  assert.equal(s.stage, 'countdown');
  assert.equal(s.modeLocked, true);
  assert.equal(s.requestedCell, null);
  assert.equal(s.cells[cellId].status, 'pending');
  assert.equal(chooseMode(s, 'camera').mode, 'honor');
  assert.ok(s.cells.some((cell) => cell.status === 'other'));
});

test('countdown enters active and honor mode commits at target', () => {
  let s = chooseMode(acknowledgeSafety(createInitialState({ target: 2 })), 'honor');
  s = selectCell(s, availableCell(s));
  s = tick(s, 3000);
  assert.equal(s.stage, 'active');
  assert.equal(s.notice, '');
  s = tick(s, 2000);
  assert.equal(s.stage, 'complete');
  assert.equal(s.lastOutcome, 'complete');
  assert.equal(s.cells.find((cell) => cell.status === 'locked' && cell.id === s.selectedCell)?.status, 'locked');
  assert.equal(s.completions, 1);
  assert.equal(s.completionMethod, 'honor');
  assert.equal(s.dailyCompleted, true);
  assert.equal(s.existingDailyCompletion, false);
  assert.equal(s.target, 4);
});

test('an existing daily completion silently locks further mode and pixel selection', () => {
  const ready = createInitialState({ stage: 'ready', safetyAcknowledged: true, notice: 'OLD NOTICE' });
  const completed = markDailyCompleted(ready);
  assert.equal(completed.stage, 'ready');
  assert.equal(completed.dailyCompleted, true);
  assert.equal(completed.existingDailyCompletion, true);
  assert.equal(completed.modeLocked, true);
  assert.equal(completed.notice, '');
  assert.equal(chooseMode(completed, 'honor'), completed);
  assert.equal(selectCell(completed, availableCell(completed)), completed);
});

test('camera waits for a detected ready position before starting the countdown', () => {
  let s = acknowledgeSafety(createInitialState({ target: 2 }));
  const cellId = availableCell(s);
  s = selectCell(s, cellId);
  assert.equal(s.stage, 'positioning');
  assert.equal(s.countdown, 0);
  assert.equal(s.cells[cellId].status, 'pending');
  s = tick(s, 3000);
  assert.equal(s.stage, 'positioning');
  assert.equal(s.creditedMs, 0);
  s = confirmReadyPosition(s);
  assert.equal(s.stage, 'countdown');
  assert.equal(s.countdown, 3);
  s = tick(s, 3000);
  assert.equal(s.stage, 'active');
});

test('camera low-hips form gets five-second grace and then pauses; valid resumes', () => {
  let s = acknowledgeSafety(createInitialState({ target: 10 }));
  s = selectCell(s, availableCell(s));
  s = confirmReadyPosition(s);
  s = tick(s, 3000);
  s = setForm(s, 'hips-low');
  s = tick(s, 4999);
  assert.equal(s.stage, 'grace');
  assert.equal(s.creditedMs, 0);
  s = tick(s, 1);
  assert.equal(s.stage, 'paused');
  s = setForm(s, 'valid');
  assert.equal(s.stage, 'active');
  s = tick(s, 1000);
  assert.equal(s.creditedMs, 1000);
});

test('camera high-hips form enters the same correction grace state', () => {
  let s = acknowledgeSafety(createInitialState({ target: 10 }));
  s = confirmReadyPosition(selectCell(s, availableCell(s)));
  s = tick(s, 3000);
  s = setForm(s, 'hips-high');
  assert.equal(s.form, 'hips-high');
  assert.equal(s.stage, 'grace');
});

test('camera tracking loss debounces for 500ms before pausing time', () => {
  let s = acknowledgeSafety(createInitialState({ target: 10 }));
  s = confirmReadyPosition(selectCell(s, availableCell(s)));
  s = tick(s, 3000);
  s = tick(s, 1000);
  s = setForm(s, 'tracking');
  s = tick(s, 499);
  assert.equal(s.stage, 'active');
  assert.equal(s.creditedMs, 1000);
  s = tick(s, 1);
  assert.equal(s.stage, 'paused');
  assert.equal(s.notice, 'HEY, COME BACK!');
  s = setForm(s, 'valid');
  assert.equal(s.stage, 'active');
});

test('ending an attempt releases the pixel and mode lock for retry', () => {
  let s = chooseMode(acknowledgeSafety(createInitialState()), 'honor');
  const cellId = availableCell(s);
  s = selectCell(s, cellId);
  s = endSession(s);
  assert.equal(s.stage, 'ready');
  assert.equal(s.lastOutcome, 'failed');
  assert.equal(s.cells[cellId].status, 'available');
  assert.equal(s.selectedCell, null);
  assert.equal(s.modeLocked, false);
  assert.equal(s.notice, '');
  s = chooseMode(s, 'camera');
  assert.equal(s.mode, 'camera');
  assert.equal(s.stage, 'ready');
});

test('a successful browser identity cannot earn a second pixel on the same day', () => {
  let s = chooseMode(acknowledgeSafety(createInitialState({ target: 1 })), 'honor');
  s = tick(selectCell(s, availableCell(s)), 3000);
  s = tick(s, 1000);
  assert.equal(s.stage, 'complete');
  assert.equal(chooseMode(s, 'camera').stage, 'complete');
  assert.equal(selectCell(s, 5).completions, 1);
});

test('a pixel selected before safety acknowledgement is reserved only after acknowledgement', () => {
  let s = createInitialState({ stage: 'ready' });
  const cellId = availableCell(s);
  s = selectCell(s, cellId);
  assert.equal(s.stage, 'safety');
  assert.equal(s.modeLocked, true);
  assert.equal(s.requestedCell, cellId);
  assert.equal(s.cells[cellId].status, 'available');
  s = acknowledgeSafety(s);
  assert.equal(s.stage, 'positioning');
  assert.equal(s.requestedCell, null);
  assert.equal(s.cells[cellId].status, 'pending');
});

test('pose updates preserve the selected correction through the grace pause', () => {
  let s = acknowledgeSafety(createInitialState({ target: 10 }));
  s = confirmReadyPosition(selectCell(s, availableCell(s)));
  s = tick(s, 3000);
  const correction = { kind: 'hips-low', label: 'HIPS UP' };
  s = reduce(s, { type: 'pose-update', form: 'hips-low', correction });
  assert.equal(s.stage, 'grace');
  assert.deepEqual(s.correction, correction);
  s = reduce(s, { type: 'pose-update', form: 'valid' });
  assert.equal(s.stage, 'active');
  assert.equal(s.correction, null);
});

test('guided demo uses isolated state and never changes real progress counters', () => {
  const real = acknowledgeSafety(createInitialState({ target: 30, todayCount: 128, streak: 7 }));
  const snapshot = structuredClone(real);
  let demo = createGuidedDemoState(real, { target: 1 });
  assert.equal(demo.demo, true);
  assert.equal(demo.stage, 'positioning');
  assert.equal(demo.cells[demo.selectedCell].status, 'pending');
  demo = confirmReadyPosition(demo);
  demo = tick(demo, 3000);
  demo = tick(demo, 1000);
  assert.equal(demo.stage, 'complete');
  assert.equal(demo.completionMethod, 'guided-demo');
  assert.equal(demo.todayCount, 128);
  assert.equal(demo.streak, 7);
  assert.equal(demo.target, 1);
  assert.deepEqual(real, snapshot);
});

test('shared snapshots reconcile locked, peer-pending, and owned-pending pixels', () => {
  const source = createInitialState({ stage: 'active', selectedCell: 22 });
  const next = applySharedCanvasSnapshot(source, [
    { cell_id: 1, status: 'locked' },
    { cell_id: 22, status: 'pending' },
    { cell_id: 25, status: 'pending' },
  ]);

  assert.equal(next.shared, true);
  assert.equal(next.todayCount, 1);
  assert.equal(next.liveCount, 2);
  assert.equal(next.cells.find((cell) => cell.id === 1).status, 'locked');
  assert.equal(next.cells.find((cell) => cell.id === 22).status, 'pending');
  assert.equal(next.cells.find((cell) => cell.id === 25).status, 'other');
  assert.equal(next.cells.find((cell) => cell.id === 2).status, 'available');
});
