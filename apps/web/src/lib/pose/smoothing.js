export function createTemporalSmoother({ timeConstantMs = 80, maxContinuityMs = 180 } = {}) {
  let previous = null; let previousAt = null;
  function update(points, now, tracked = true) {
    if (!tracked || (previousAt !== null && now - previousAt > maxContinuityMs)) { previous = null; previousAt = now; return points; }
    const alpha = previousAt === null ? 1 : 1 - Math.exp(-(now - previousAt) / timeConstantMs);
    const next = {};
    for (const [name, point] of Object.entries(points || {})) {
      const prior = previous?.[name];
      next[name] = prior ? { ...point, x: alpha * point.x + (1 - alpha) * prior.x, y: alpha * point.y + (1 - alpha) * prior.y } : point;
    }
    previous = next; previousAt = now; return next;
  }
  function reset() { previous = null; previousAt = null; }
  return { update, reset };
}

