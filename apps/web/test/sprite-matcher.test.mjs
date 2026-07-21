import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpriteStateMatcher, normalizeSpriteSkeleton, rankSpriteStates } from '../src/lib/pose/sprite-matcher.js';

const plankPoints = {
  left_shoulder: [0, 0], left_elbow: [0, 1], left_wrist: [0, 2],
  left_hip: [2, 0.2], left_knee: [4, 0.2], left_ankle: [6, 0.2],
};
const crouchPoints = {
  left_shoulder: [0, 0], left_elbow: [0.6, 0.8], left_wrist: [1.2, 1.5],
  left_hip: [1, 1], left_knee: [2, 2.2], left_ankle: [3, 1.3],
};
const manifest = {
  requiredPoints: ['shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle'],
  frames: [
    { id: 'plank', role: 'plank', side: 'left', points: plankPoints },
    { id: 'crouch', role: 'setup', side: 'left', points: crouchPoints },
    { id: 'unfinished', role: 'plank', side: 'left', points: {} },
  ],
};

function livePose(points, { scale = 100, offsetX = 400, offsetY = 300, mirror = false } = {}) {
  return {
    keypoints: Object.entries(points).map(([name, [x, y]]) => ({
      name,
      x: offsetX + (mirror ? -x : x) * scale,
      y: offsetY + y * scale,
      score: 0.95,
    })),
  };
}

test('sprite skeleton normalization ignores translation, scale, and horizontal facing', () => {
  const forward = normalizeSpriteSkeleton(plankPoints, { side: 'left' });
  const mirrored = normalizeSpriteSkeleton(Object.fromEntries(Object.entries(plankPoints).map(([name, [x, y]]) => [name, [800 - x * 40, 200 + y * 40]])), { side: 'left' });
  assert.deepEqual(
    Object.fromEntries(Object.entries(forward).map(([name, point]) => [name, [Number(point.x.toFixed(6)), Number(point.y.toFixed(6))]])),
    Object.fromEntries(Object.entries(mirrored).map(([name, point]) => [name, [Number(point.x.toFixed(6)), Number(point.y.toFixed(6))]])),
  );
});

test('nearest sprite state skips unfinished references and respects roles', () => {
  const pose = livePose(plankPoints, { mirror: true });
  assert.equal(rankSpriteStates(pose, { manifest, width: 1000, height: 1000, side: 'left' })[0].id, 'plank');
  assert.deepEqual(rankSpriteStates(pose, { manifest, width: 1000, height: 1000, side: 'left', roles: ['setup'] }).map((item) => item.id), ['crouch']);
});

test('state matcher requires a stable better candidate before switching', () => {
  const matcher = createSpriteStateMatcher(manifest, { minHoldMs: 200, switchMargin: 0 });
  assert.equal(matcher.update(livePose(plankPoints), { width: 1000, height: 1000, side: 'left', now: 0 }).id, 'plank');
  assert.equal(matcher.update(livePose(crouchPoints), { width: 1000, height: 1000, side: 'left', now: 100 }).id, 'plank');
  assert.equal(matcher.update(livePose(crouchPoints), { width: 1000, height: 1000, side: 'left', now: 310 }).id, 'crouch');
});
