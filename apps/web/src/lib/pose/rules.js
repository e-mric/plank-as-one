import { POSE_RULE_CONFIG } from './config.js';

const definitions = [
  { name: 'hipOffset', priority: 6, bad: (f, t) => Math.abs(f.hipOffset) > t.enterError, clear: (f, t) => Math.abs(f.hipOffset) <= t.leaveError, severity: (f, t) => Math.min(1, Math.max(0, (Math.abs(f.hipOffset) - t.leaveError) / (t.enterError - t.leaveError))), correction: (f) => f.hipOffset > 0 ? { kind: 'hips-low', label: 'HIPS UP', voice: 'Hips up.' } : { kind: 'hips-high', label: 'HIPS DOWN', voice: 'Hips down.' }, threshold: POSE_RULE_CONFIG.rules.hipOffset },
  { name: 'shoulderStack', priority: 5, bad: (f, t) => Math.abs(f.shoulderStack) > t.enterError, clear: (f, t) => Math.abs(f.shoulderStack) <= t.leaveError, severity: (f, t) => Math.min(1, Math.max(0, (Math.abs(f.shoulderStack) - t.leaveError) / (t.enterError - t.leaveError))), correction: (f) => f.shoulderStack < 0 ? { kind: 'shoulder-forward', label: 'SHIFT FORWARD', voice: 'Shift forward.' } : { kind: 'shoulder-back', label: 'SHIFT BACK', voice: 'Shift back.' }, threshold: POSE_RULE_CONFIG.rules.shoulderStack },
  { name: 'elbowAngle', priority: 4, bad: (f, t) => f.elbowAngle < t.min || f.elbowAngle > t.max, clear: (f, t) => f.elbowAngle >= t.recoveryMin && f.elbowAngle <= t.recoveryMax, severity: (f, t) => Math.min(1, Math.max(0, Math.max(t.min - f.elbowAngle, f.elbowAngle - t.max) / 20)), correction: () => ({ kind: 'elbow-position', label: 'ELBOWS UNDER SHOULDERS', voice: 'Elbows under shoulders.' }), threshold: POSE_RULE_CONFIG.rules.elbowAngle },
  { name: 'kneeAngle', priority: 3, bad: (f, t) => f.kneeAngle < t.enterError, clear: (f, t) => f.kneeAngle >= t.leaveError, severity: (f, t) => Math.min(1, Math.max(0, (t.leaveError - f.kneeAngle) / (t.leaveError - t.enterError))), correction: () => ({ kind: 'knee-extension', label: 'EXTEND KNEES', voice: 'Extend your knees.' }), threshold: POSE_RULE_CONFIG.rules.kneeAngle },
  { name: 'neckAngle', priority: 2, bad: (f, t) => f.neckAngle !== null && f.neckAngle < t.enterError, clear: (f, t) => f.neckAngle === null || f.neckAngle >= t.leaveError, severity: (f, t) => Math.min(1, Math.max(0, (t.leaveError - f.neckAngle) / (t.leaveError - t.enterError))), correction: () => ({ kind: 'neck-alignment', label: 'NEUTRAL NECK', voice: 'Keep your neck neutral.' }), threshold: POSE_RULE_CONFIG.rules.neckAngle },
];

export function createRuleEvaluator() {
  const state = new Map();
  function evaluate(features, now) {
    if (!features) return [];
    return definitions.flatMap((definition) => {
      const metricState = state.get(definition.name) || { confirmed: false, badSince: null, clearSince: null };
      const bad = definition.bad(features, definition.threshold);
      if (bad) {
        metricState.clearSince = null;
        metricState.badSince ??= now;
        if (!metricState.confirmed && now - metricState.badSince >= definition.threshold.enterDurationMs) metricState.confirmed = true;
      } else if (metricState.confirmed) {
        metricState.badSince = null;
        metricState.clearSince ??= now;
        if (definition.clear(features, definition.threshold) && now - metricState.clearSince >= definition.threshold.recoveryDurationMs) metricState.confirmed = false;
      } else { metricState.badSince = null; metricState.clearSince = null; }
      state.set(definition.name, metricState);
      return metricState.confirmed ? [{ name: definition.name, priority: definition.priority, severity: definition.severity(features, definition.threshold), correction: definition.correction(features) }] : [];
    });
  }
  function reset() { state.clear(); }
  return { evaluate, reset };
}

