export const POSE_RULE_CONFIG = {
  version: 'movenet-plank-v3',
  minRequiredConfidence: 0.35,
  minFallbackConfidence: 0.2,
  minRequiredLandmarkCount: 5,
  minMeanConfidence: 0.45,
  trackingLossGraceMs: 250,
  trackingDebounceMs: 500,
  correctionGraceMs: 5000,
  correctionLockMs: 750,
  smoothingTimeConstantMs: 80,
  framing: { clippedMargin: 0.02, minMargin: 0.05, minOccupancy: 0.55, maxOccupancy: 0.9, stableMs: 800 },
  rules: {
    hipOffset: { enterError: 0.15, leaveError: 0.10, enterDurationMs: 400, recoveryDurationMs: 200 },
    shoulderStack: { enterError: 0.28, leaveError: 0.20, enterDurationMs: 400, recoveryDurationMs: 200 },
    elbowAngle: { min: 55, max: 130, recoveryMin: 65, recoveryMax: 120, enterDurationMs: 400, recoveryDurationMs: 200 },
    kneeAngle: { enterError: 140, leaveError: 150, enterDurationMs: 400, recoveryDurationMs: 200 },
    neckAngle: { enterError: 135, leaveError: 145, enterDurationMs: 400, recoveryDurationMs: 200 },
  },
};

