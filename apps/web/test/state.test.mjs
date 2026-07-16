import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, chooseMode, acknowledgeSafety, selectCell, tick, setForm, endSession, ARTWORK_WIDTH, ARTWORK_HEIGHT } from '../state.js';

const availableCell = (state, offset = 0) => state.cells.filter((cell) => cell.status === 'available')[offset].id;

test('shared canvas is the PLANK AS ONE artwork mask, not a generic grid', () => {
  const state = createInitialState();
  assert.equal(ARTWORK_WIDTH, 35);
  assert.equal(ARTWORK_HEIGHT, 23);
  assert.equal(state.cells.length, ARTWORK_WIDTH * ARTWORK_HEIGHT);
  assert.ok(state.cells.some((cell) => cell.target && cell.status === 'available'));
  assert.ok(state.cells.some((cell) => !cell.target && cell.status === 'empty'));
});

test('real route requires safety acknowledgment before reservation', () => {
  let s = createInitialState();
  s = chooseMode(s, 'honor');
  assert.equal(s.stage, 'safety');
  const cellId = availableCell(s);
  assert.equal(selectCell(s, cellId).stage, 'safety');
  s = acknowledgeSafety(s);
  assert.equal(s.stage, 'ready');
  s = selectCell(s, cellId);
  assert.equal(s.stage, 'countdown');
  assert.equal(s.cells[cellId].status, 'pending');
  assert.ok(s.cells.some((cell) => cell.status === 'other'));
});

test('countdown enters active and honor mode commits at target', () => {
  let s = acknowledgeSafety(chooseMode(createInitialState({ target: 2 }), 'honor'));
  s = selectCell(s, availableCell(s));
  s = tick(s, 3000);
  assert.equal(s.stage, 'active');
  s = tick(s, 2000);
  assert.equal(s.stage, 'complete');
  assert.equal(s.cells.find((cell) => cell.status === 'locked' && cell.id === s.selectedCell)?.status, 'locked');
  assert.equal(s.completions, 1);
  assert.equal(s.target, 7);
});

test('camera invalid form gets five-second grace and then pauses; valid resumes', () => {
  let s = acknowledgeSafety(chooseMode(createInitialState({ target: 10 }), 'camera'));
  s = selectCell(s, availableCell(s));
  s = tick(s, 3000);
  s = setForm(s, 'invalid');
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

test('camera tracking loss debounces for 500ms before pausing time', () => {
  let s = acknowledgeSafety(chooseMode(createInitialState({ target: 10 }), 'camera'));
  s = tick(selectCell(s, availableCell(s)), 3000);
  s = tick(s, 1000);
  s = setForm(s, 'tracking');
  s = tick(s, 499);
  assert.equal(s.stage, 'active');
  assert.equal(s.creditedMs, 1000);
  s = tick(s, 1);
  assert.equal(s.stage, 'paused');
  assert.equal(s.notice, 'MOVE INTO FRAME');
  s = setForm(s, 'valid');
  assert.equal(s.stage, 'active');
});

test('ending an attempt releases pending reservation and permits retry', () => {
  let s = acknowledgeSafety(chooseMode(createInitialState(), 'honor'));
  const cellId = availableCell(s);
  s = selectCell(s, cellId);
  s = endSession(s);
  assert.equal(s.stage, 'ready');
  assert.equal(s.cells[cellId].status, 'available');
  assert.equal(s.selectedCell, null);
});

test('a successful browser identity cannot earn a second pixel on the same day', () => {
  let s = acknowledgeSafety(chooseMode(createInitialState({ target: 1 }), 'honor'));
  s = tick(selectCell(s, availableCell(s)), 3000);
  s = tick(s, 1000);
  assert.equal(s.stage, 'complete');
  assert.equal(chooseMode(s, 'camera').stage, 'complete');
  assert.equal(selectCell(s, 5).completions, 1);
});
