export function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
export function dot(a, b) { return a.x * b.x + a.y * b.y; }
export function subtract(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
export function magnitude(point) { return Math.hypot(point.x, point.y); }
export function distance(a, b) { return magnitude(subtract(a, b)); }
export function angle(a, b, c) {
  const ba = subtract(a, b); const bc = subtract(c, b);
  const divisor = magnitude(ba) * magnitude(bc);
  return divisor ? Math.acos(clamp(dot(ba, bc) / divisor, -1, 1)) * 180 / Math.PI : null;
}
export function projectPoint(point, start, end) {
  const axis = subtract(end, start); const denominator = dot(axis, axis);
  if (!denominator) return { ...start };
  const t = dot(subtract(point, start), axis) / denominator;
  return { x: start.x + t * axis.x, y: start.y + t * axis.y };
}
export function signedLineOffset(point, start, end) {
  const axis = subtract(end, start); const relative = subtract(point, start);
  const length = magnitude(axis);
  return length ? (axis.x * relative.y - axis.y * relative.x) / length : 0;
}
export function median(values) {
  const clean = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!clean.length) return null;
  const middle = Math.floor(clean.length / 2);
  return clean.length % 2 ? clean[middle] : (clean[middle - 1] + clean[middle]) / 2;
}

