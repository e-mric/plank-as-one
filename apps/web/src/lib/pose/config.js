export const POSE_RULE_CONFIG = {
  version: 'movenet-plank-v1',
  minRequiredConfidence: 0.4,
  trackingDebounceMs: 500,
  correctionGraceMs: 5000,
  correctionLockMs: 750,
  smoothingTimeConstantMs: 80,
  framing: { minMargin: 0.08, minOccupancy: 0.55, maxOccupancy: 0.9, stableMs: 800 },
  rules: {
    hipOffset: { enterError: 0.10, leaveError: 0.06, enterDurationMs: 200, recoveryDurationMs: 300 },
    shoulderStack: { enterError: 0.16, leaveError: 0.10, enterDurationMs: 200, recoveryDurationMs: 300 },
    elbowAngle: { min: 65, max: 120, recoveryMin: 75, recoveryMax: 110, enterDurationMs: 200, recoveryDurationMs: 300 },
    kneeAngle: { enterError: 150, leaveError: 160, enterDurationMs: 200, recoveryDurationMs: 300 },
    neckAngle: { enterError: 145, leaveError: 155, enterDurationMs: 200, recoveryDurationMs: 300 },
  },
};

