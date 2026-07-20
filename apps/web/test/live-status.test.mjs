import test from 'node:test';
import assert from 'node:assert/strict';
import { addCompletionDay, calculateStreak, formatResetCountdown, normalizeCompletionDays, utcDayKey } from '../src/lib/live-status.js';

test('completion days are normalized and recorded once per UTC day', () => {
  assert.deepEqual(normalizeCompletionDays(['2026-07-20', 'bad', '2026-07-20', '2026-07-19']), ['2026-07-19', '2026-07-20']);
  assert.equal(utcDayKey(new Date('2026-07-21T23:59:00Z')), '2026-07-21');
  assert.deepEqual(addCompletionDay(['2026-07-20'], new Date('2026-07-21T10:00:00Z')), ['2026-07-20', '2026-07-21']);
});

test('streak includes today or preserves a streak ending yesterday', () => {
  const now = new Date('2026-07-21T12:00:00Z');
  assert.equal(calculateStreak(['2026-07-19', '2026-07-20', '2026-07-21'], now), 3);
  assert.equal(calculateStreak(['2026-07-18', '2026-07-19', '2026-07-20'], now), 3);
  assert.equal(calculateStreak(['2026-07-19'], now), 0);
});

test('reset countdown targets the next UTC challenge day', () => {
  assert.equal(formatResetCountdown(new Date('2026-07-21T18:17:30Z')), '05:42:30');
  assert.equal(formatResetCountdown(new Date('2026-07-21T23:59:59.500Z')), '00:00:01');
});
