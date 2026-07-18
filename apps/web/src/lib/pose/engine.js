import { POSE_RULE_CONFIG } from './config.js';
import { normalizeLandmarks, qualityGate } from './landmarks.js';
import { createTemporalSmoother } from './smoothing.js';
import { createStableSideSelector } from './side-selector.js';
import { extractFeatures } from './features.js';
import { createRuleEvaluator } from './rules.js';
import { createCorrectionArbiter } from './correction-arbiter.js';

export function createPoseAnalyzer() {
  const smoother = createTemporalSmoother({ timeConstantMs: POSE_RULE_CONFIG.smoothingTimeConstantMs });
  const sideSelector = createStableSideSelector();
  const rules = createRuleEvaluator();
  const arbiter = createCorrectionArbiter();
  let stableSince = null;
  function analyze(pose, { width = 1, height = 1, now = performance.now() } = {}) {
    const landmarks = normalizeLandmarks(pose, width, height);
    const quality = qualityGate(landmarks);
    if (!quality.tracked) { stableSince = null; smoother.update({}, now, false); arbiter.reset(); rules.reset(); return { tracking: false, form: 'tracking', correction: null, quality, setupReady: false, setupMessage: 'MOVE INTO FRAME' }; }
    const side = sideSelector.update({ left: quality.leftScore, right: quality.rightScore }, now);
    const selectedPoints = Object.fromEntries(Object.entries(landmarks).filter(([name]) => name.startsWith(side)));
    const smoothed = smoother.update(selectedPoints, now, true);
    const features = extractFeatures(smoothed, side);
    const framed = quality.margin >= POSE_RULE_CONFIG.framing.minMargin && quality.occupancy >= POSE_RULE_CONFIG.framing.minOccupancy && quality.occupancy <= POSE_RULE_CONFIG.framing.maxOccupancy && quality.centered;
    if (framed) stableSince ??= now; else stableSince = null;
    const setupReady = Boolean(stableSince !== null && now - stableSince >= POSE_RULE_CONFIG.framing.stableMs);
    const errors = features ? rules.evaluate(features, now) : [];
    const correction = arbiter.select(errors, now);
    const form = correction?.kind === 'hips-low' ? 'hips-low' : correction?.kind === 'hips-high' ? 'hips-high' : correction ? 'invalid' : 'valid';
    return { tracking: true, form, correction, quality: { ...quality, side, framed, stable: setupReady }, setupReady, setupMessage: setupReady ? 'READY' : framed ? 'HOLD STILL' : quality.occupancy < POSE_RULE_CONFIG.framing.minOccupancy ? 'MOVE CLOSER' : quality.occupancy > POSE_RULE_CONFIG.framing.maxOccupancy ? 'MOVE BACK' : quality.centered ? 'HOLD STILL' : quality.centerDirection === 'left' ? 'MOVE LEFT' : 'MOVE RIGHT', features };
  }
  function reset() { smoother.reset(); sideSelector.reset(); rules.reset(); arbiter.reset(); stableSince = null; }
  return { analyze, reset };
}

const defaultAnalyzer = createPoseAnalyzer();
export function analyzePoseFrame(pose, options) { return defaultAnalyzer.analyze(pose, options); }
export function resetPoseAnalyzer() { defaultAnalyzer.reset(); }
export { POSE_RULE_CONFIG };
