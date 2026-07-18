import { POSE_RULE_CONFIG } from './config.js';

export function createCorrectionArbiter({ lockMs = POSE_RULE_CONFIG.correctionLockMs } = {}) {
  let selected = null; let selectedAt = 0;
  function select(errors, now) {
    if (!errors.length) { selected = null; return null; }
    const best = [...errors].sort((a, b) => b.priority - a.priority || b.severity - a.severity)[0];
    if (!selected || !errors.some((error) => error.correction.kind === selected.kind) || (best.correction.kind !== selected.kind && now - selectedAt >= lockMs)) {
      selected = best.correction; selectedAt = now;
    }
    return selected;
  }
  function reset() { selected = null; selectedAt = 0; }
  return { select, reset };
}

