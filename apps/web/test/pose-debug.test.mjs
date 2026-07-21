import test from 'node:test';
import assert from 'node:assert/strict';
import { createPoseDebugRecord, getPoseDiagnosticLabel, mapPoseKeypoints, POSE_DEBUG_BONES } from '../src/lib/pose/debug-overlay.js';
import { getPoseCaptureDecision } from '../src/lib/pose/debug-session.js';

const pose = {
  keypoints: [
    { name: 'left_shoulder', x: 100.04, y: 200.06, score: 0.95 },
    { name: 'left_elbow', x: 140, y: 260, score: 0.94 },
    { name: 'left_hip', x: 310, y: 220, score: 0.93 },
    { name: 'left_knee', x: 470, y: 230, score: 0.92 },
  ],
};

const result = {
  tracking: true,
  setupReady: false,
  setupMessage: 'HOLD STILL',
  correction: null,
  quality: { side: 'left', framed: true, stable: false, requiredLandmarksVisible: true, leftScore: 0.9321, rightScore: 0.2, occupancy: 0.6812, margin: 0.0923, centered: true },
  features: { hipAngle: 171.24, elbowAngle: 91.15, kneeAngle: 168.88, neckAngle: 157.44, hipOffset: 0.0254, shoulderStack: -0.0332 },
};

test('pose debug records use canonical keypoints and the pose engine diagnostics', () => {
  const points = mapPoseKeypoints(pose);
  assert.equal(points.leftShoulder.x, 100.04);
  assert.ok(POSE_DEBUG_BONES.some(([start, end]) => start === 'leftShoulder' && end === 'leftElbow'));
  assert.equal(getPoseDiagnosticLabel(result, 'positioning'), 'FRAMING · HOLD STILL');
  assert.equal(getPoseDiagnosticLabel({ ...result, setupReady: true }, 'positioning'), 'FRAMING READY');
  assert.equal(getPoseDiagnosticLabel({ ...result, correction: { kind: 'knee-extension', label: 'EXTEND KNEES' } }, 'active'), 'KNEES DROPPING');
  assert.equal(getPoseDiagnosticLabel({ tracking: false }, 'active'), 'TRACKING LOST');

  const record = createPoseDebugRecord({ pose, result, stage: 'active', capturedAt: new Date('2026-07-20T12:00:00Z'), frameTimeMs: 123.45, width: 1280, height: 720 });
  assert.equal(record.diagnostic, 'GOOD FORM');
  assert.equal(record.features.hipAngle, 171.2);
  assert.equal(record.quality.occupancy, 0.681);
  assert.deepEqual(record.keypoints.leftShoulder, { x: 100, y: 200.1, score: 0.95 });
  assert.equal(record.poseRuleConfigVersion, 'movenet-plank-v3');
});

test('visual logger captures state changes immediately and steady state periodically', () => {
  const first = getPoseCaptureDecision({ stage: 'positioning', result, frameTimeMs: 100, minIntervalMs: 2500 });
  assert.equal(first.capture, true);
  assert.equal(first.reason, 'state-change');
  assert.equal(first.signature, 'positioning:FRAMING · HOLD STILL');

  const unchanged = getPoseCaptureDecision({ lastSignature: first.signature, lastCaptureAt: 100, candidateSignature: first.signature, candidateSince: 100, stage: 'positioning', result, frameTimeMs: 1200, minIntervalMs: 2500 });
  assert.equal(unchanged.capture, false);

  const periodic = getPoseCaptureDecision({ lastSignature: first.signature, lastCaptureAt: 100, stage: 'positioning', result, frameTimeMs: 2600, minIntervalMs: 2500 });
  assert.equal(periodic.reason, 'periodic');

  const correction = { ...result, correction: { kind: 'hips-high', label: 'HIPS DOWN' } };
  const flicker = getPoseCaptureDecision({ lastSignature: 'active:GOOD FORM', lastCaptureAt: 2500, candidateSignature: 'active:GOOD FORM', candidateSince: 2500, stage: 'active', result: correction, frameTimeMs: 2600, minIntervalMs: 2500 });
  assert.equal(flicker.capture, false);
  const changed = getPoseCaptureDecision({ lastSignature: 'active:GOOD FORM', lastCaptureAt: 2500, candidateSignature: flicker.candidateSignature, candidateSince: flicker.candidateSince, stage: 'active', result: correction, frameTimeMs: 3000, minIntervalMs: 2500 });
  assert.equal(changed.capture, true);
  assert.equal(changed.reason, 'state-change');
  assert.equal(changed.signature, 'active:HIPS TOO HIGH');

  const workoutStarted = getPoseCaptureDecision({ lastSignature: first.signature, lastCaptureAt: 100, stage: 'countdown', result, frameTimeMs: 150, minIntervalMs: 2500 });
  assert.equal(workoutStarted.capture, true);
  assert.equal(workoutStarted.reason, 'state-change');
});
