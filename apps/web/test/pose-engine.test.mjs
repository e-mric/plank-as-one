import test from 'node:test';
import assert from 'node:assert/strict';
import { angle, distance, projectPoint, signedLineOffset } from '../src/lib/pose/geometry.js';
import { normalizeLandmarks, qualityGate } from '../src/lib/pose/landmarks.js';
import { createTemporalSmoother } from '../src/lib/pose/smoothing.js';
import { createStableSideSelector } from '../src/lib/pose/side-selector.js';
import { createPoseAnalyzer } from '../src/lib/pose/engine.js';
import { extractFeatures } from '../src/lib/pose/features.js';
import { describeFraming } from '../src/lib/pose/setup-machine.js';
import { createRuleEvaluator } from '../src/lib/pose/rules.js';

const keypoints = (hipY = 0.4, confidence = 0.95) => [
  ['left_shoulder', 0.3, 0.4], ['left_elbow', 0.3, 0.5], ['left_wrist', 0.4, 0.5],
  ['left_hip', 0.45, hipY], ['left_knee', 0.7, 0.4], ['left_ankle', 0.9, 0.4], ['left_ear', 0.1, 0.4],
].map(([name, x, y]) => ({ name, x: x * 1000, y: y * 1000, score: confidence }));

const pose = (hipY = 0.4, confidence = 0.95) => ({ keypoints: keypoints(hipY, confidence) });

test('geometry is translation and scale invariant for angles and normalized offsets', () => {
  assert.equal(Math.round(angle({ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 })), 90);
  assert.equal(distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
  const projected = projectPoint({ x: 5, y: 2 }, { x: 0, y: 0 }, { x: 10, y: 0 });
  assert.deepEqual(projected, { x: 5, y: 0 });
  assert.equal(signedLineOffset({ x: 5, y: 2 }, { x: 0, y: 0 }, { x: 10, y: 0 }), 2);
});

test('hip direction remains correct when the participant faces the other way', () => {
  const forward = normalizeLandmarks(pose(0.58), 1000, 1000);
  const reversed = Object.fromEntries(Object.entries(forward).map(([name, point]) => [name, { ...point, x: 1 - point.x }]));
  assert.ok(extractFeatures(forward, 'left').hipOffset > 0);
  assert.ok(extractFeatures(reversed, 'left').hipOffset > 0);
});

test('landmark normalization and quality gate reject missing or low-confidence landmarks', () => {
  const normalized = normalizeLandmarks(pose(), 1000, 1000);
  assert.equal(normalized.leftHip.x, 0.45);
  assert.equal(qualityGate(normalized).tracked, true);
  assert.equal(qualityGate(normalizeLandmarks(pose(0.4, 0.2), 1000, 1000)).tracked, false);
  const missing = normalizeLandmarks({ keypoints: keypoints().slice(0, 4) }, 1000, 1000);
  assert.equal(qualityGate(missing).tracked, false);
});

test('quality gate tolerates one marginal landmark but not a broadly weak pose', () => {
  const oneMarginal = pose();
  oneMarginal.keypoints.find((point) => point.name === 'left_wrist').score = 0.25;
  const quality = qualityGate(normalizeLandmarks(oneMarginal, 1000, 1000));
  assert.equal(quality.tracked, true);
  assert.equal(quality.visibleLandmarkCount, 5);
  assert.equal(quality.supportedLandmarkCount, 6);

  const broadlyWeak = qualityGate(normalizeLandmarks(pose(0.4, 0.25), 1000, 1000));
  assert.equal(broadlyWeak.tracked, false);
});

test('cropped bodies are told to move back before occupancy is considered', () => {
  assert.equal(describeFraming({
    tracked: true,
    pointCount: 6,
    requiredLandmarksVisible: true,
    clipped: true,
    margin: -0.018,
    occupancy: 0.34,
    centered: true,
  }), 'MOVE BACK');
});

test('smoothing clears continuity after a long tracking gap', () => {
  const smoother = createTemporalSmoother({ timeConstantMs: 80, maxContinuityMs: 180 });
  smoother.update({ hip: { x: 0, y: 0, score: 1 } }, 0);
  const short = smoother.update({ hip: { x: 1, y: 1, score: 1 } }, 80);
  assert.ok(short.hip.x < 1);
  const afterGap = smoother.update({ hip: { x: 2, y: 2, score: 1 } }, 400);
  assert.equal(afterGap.hip.x, 2);
});

test('side selector waits one second before switching sides', () => {
  const selector = createStableSideSelector();
  assert.equal(selector.update({ left: 0.9, right: 0.2 }, 0), 'left');
  assert.equal(selector.update({ left: 0.2, right: 0.9 }, 1000), 'left');
  assert.equal(selector.update({ left: 0.2, right: 0.9 }, 1999), 'left');
  assert.equal(selector.update({ left: 0.2, right: 0.9 }, 2000), 'right');
});

test('analyzer distinguishes stable readiness, tracking loss, and hip corrections', () => {
  const analyzer = createPoseAnalyzer();
  const valid = analyzer.analyze(pose(), { width: 1000, height: 1000, now: 0 });
  assert.equal(valid.form, 'valid');
  assert.equal(analyzer.analyze(pose(), { width: 1000, height: 1000, now: 800 }).setupReady, true);
  const transientLoss = analyzer.analyze({ keypoints: [] }, { width: 1000, height: 1000, now: 900 });
  assert.equal(transientLoss.tracking, true);
  assert.equal(transientLoss.quality.transientLoss, true);
  assert.equal(transientLoss.setupMessage, 'HOLD STILL');
  assert.equal(analyzer.analyze({ keypoints: [] }, { width: 1000, height: 1000, now: 1100 }).form, 'tracking');

  const correctionAnalyzer = createPoseAnalyzer();
  correctionAnalyzer.analyze(pose(), { width: 1000, height: 1000, now: 0 });
  correctionAnalyzer.analyze(pose(), { width: 1000, height: 1000, now: 100 });
  const lowAtStart = correctionAnalyzer.analyze(pose(0.58), { width: 1000, height: 1000, now: 200 });
  assert.equal(lowAtStart.correction, null);
  const lowConfirmed = correctionAnalyzer.analyze(pose(0.58), { width: 1000, height: 1000, now: 600 });
  assert.equal(lowConfirmed.form, 'hips-low');
  assert.equal(lowConfirmed.correction.label, 'HIPS UP');
});

test('plank rules tolerate normal pose and camera variance but retain clear corrections', () => {
  const evaluator = createRuleEvaluator();
  const nearIdeal = {
    hipOffset: 0.12,
    shoulderStack: 0.22,
    elbowAngle: 60,
    kneeAngle: 145,
    neckAngle: 140,
  };

  assert.deepEqual(evaluator.evaluate(nearIdeal, 0), []);
  assert.deepEqual(evaluator.evaluate(nearIdeal, 1000), []);

  const clearlyLowHips = { ...nearIdeal, hipOffset: 0.24 };
  assert.deepEqual(evaluator.evaluate(clearlyLowHips, 1100), []);
  const confirmed = evaluator.evaluate(clearlyLowHips, 1500);
  assert.equal(confirmed.some((error) => error.name === 'hipOffset'), true);
  assert.equal(confirmed.find((error) => error.name === 'hipOffset').correction.kind, 'hips-low');
});
