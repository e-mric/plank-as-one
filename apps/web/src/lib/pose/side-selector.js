export function createStableSideSelector({ switchAfterMs = 1000 } = {}) {
  let selected = null; let candidate = null; let candidateSince = null;
  function update(scores, now) {
    const preferred = scores.left >= scores.right ? 'left' : 'right';
    if (!selected) { selected = preferred; return selected; }
    if (preferred === selected) { candidate = null; candidateSince = null; return selected; }
    if (candidate !== preferred) { candidate = preferred; candidateSince = now; return selected; }
    if (now - candidateSince >= switchAfterMs) { selected = candidate; candidate = null; candidateSince = null; }
    return selected;
  }
  function reset() { selected = null; candidate = null; candidateSince = null; }
  return { update, reset, get selected() { return selected; } };
}

