import { POSE_RULE_CONFIG } from './config.js';
import { normalizeLandmarks, qualityGate } from './landmarks.js';
import { createTemporalSmoother } from './smoothing.js';
import { createStableSideSelector } from './side-selector.js';
import { extractFeatures } from './features.js';
import { createRuleEvaluator } from './rules.js';
import { createCorrectionArbiter } from './correction-arbiter.js';
import { describeFraming } from './setup-machine.js';

export function createPoseAnalyzer() {
  const smoother = createTemporalSmoother({ timeConstantMs: POSE_RULE_CONFIG.smoothingTimeConstantMs });
  const sideSelector = createStableSideSelector();
  const rules = createRuleEvaluator();
  const arbiter = createCorrectionArbiter();
  let stableSince = null;
  let lastTrackedAt = -Infinity;
  let lastTrackedLandmarks = null;
  let lastTrackedQuality = null;
  let lastAnalysisSide = null;
  function analyze(pose, { width = 1, height = 1, now = performance.now() } = {}) {
    const landmarks = normalizeLandmarks(pose, width, height);
    const measuredQuality = qualityGate(landmarks);
    let analysisLandmarks = landmarks;
    let quality = measuredQuality;
    if (measuredQuality.tracked) {
      lastTrackedAt = now;
      lastTrackedLandmarks = landmarks;
      lastTrackedQuality = measuredQuality;
    } else if (lastTrackedLandmarks && lastTrackedQuality && now - lastTrackedAt <= POSE_RULE_CONFIG.trackingLossGraceMs) {
      analysisLandmarks = lastTrackedLandmarks;
      quality = {
        ...lastTrackedQuality,
        leftScore: measuredQuality.leftScore,
        rightScore: measuredQuality.rightScore,
        selectedMeanScore: measuredQuality.selectedMeanScore,
        visibleLandmarkCount: measuredQuality.visibleLandmarkCount,
        supportedLandmarkCount: measuredQuality.supportedLandmarkCount,
        requiredLandmarksVisible: false,
        transientLoss: true,
      };
    } else {
      stableSince = null;
      smoother.update({}, now, false);
      arbiter.reset();
      rules.reset();
      return { tracking: false, form: 'tracking', correction: null, quality: measuredQuality, setupReady: false, setupMessage: describeFraming(measuredQuality) };
    }
    const side = quality.transientLoss
      ? lastAnalysisSide || lastTrackedQuality.side
      : sideSelector.update({ left: quality.leftScore, right: quality.rightScore }, now);
    lastAnalysisSide = side;
    const selectedPoints = Object.fromEntries(Object.entries(analysisLandmarks).filter(([name]) => name.startsWith(side)));
    const smoothed = smoother.update(selectedPoints, now, true);
    const features = extractFeatures(smoothed, side);
    const framed = !quality.transientLoss && !quality.clipped && quality.margin >= POSE_RULE_CONFIG.framing.minMargin && quality.occupancy >= POSE_RULE_CONFIG.framing.minOccupancy && quality.occupancy <= POSE_RULE_CONFIG.framing.maxOccupancy && quality.centered;
    if (framed) stableSince ??= now; else stableSince = null;
    const setupReady = Boolean(stableSince !== null && now - stableSince >= POSE_RULE_CONFIG.framing.stableMs);
    const errors = features ? rules.evaluate(features, now) : [];
    const correction = arbiter.select(errors, now);
    const form = correction?.kind === 'hips-low' ? 'hips-low' : correction?.kind === 'hips-high' ? 'hips-high' : correction ? 'invalid' : 'valid';
    const resolvedQuality = { ...quality, side, framed, stable: setupReady };
    const setupMessage = setupReady ? 'READY' : quality.transientLoss ? 'HOLD STILL' : describeFraming(resolvedQuality);
    return { tracking: true, form, correction, quality: resolvedQuality, setupReady, setupMessage, features };
  }
  function reset() { smoother.reset(); sideSelector.reset(); rules.reset(); arbiter.reset(); stableSince = null; lastTrackedAt = -Infinity; lastTrackedLandmarks = null; lastTrackedQuality = null; lastAnalysisSide = null; }
  return { analyze, reset };
}

const defaultAnalyzer = createPoseAnalyzer();
export function analyzePoseFrame(pose, options) { return defaultAnalyzer.analyze(pose, options); }
export function resetPoseAnalyzer() { defaultAnalyzer.reset(); }
export { POSE_RULE_CONFIG };
