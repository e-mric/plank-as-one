import { normalizeLandmarks } from './landmarks.js';

const DEFAULT_JOINTS = ['shoulder', 'elbow', 'wrist', 'hip', 'knee', 'ankle'];

function capitalize(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

function asPoint(value) {
  if (Array.isArray(value) && value.length >= 2) return { x: Number(value[0]), y: Number(value[1]), score: 1 };
  if (value && Number.isFinite(Number(value.x)) && Number.isFinite(Number(value.y))) {
    return { x: Number(value.x), y: Number(value.y), score: Number(value.score ?? 1) };
  }
  return null;
}

function readJoint(points, side, joint) {
  const camel = `${side}${capitalize(joint)}`;
  return asPoint(points?.[camel] ?? points?.[`${side}_${joint}`] ?? points?.[joint]);
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function normalizeSpriteSkeleton(points, { side = 'left', joints = DEFAULT_JOINTS } = {}) {
  const selected = Object.fromEntries(joints.map((joint) => [joint, readJoint(points, side, joint)]));
  if (joints.some((joint) => !selected[joint])) return null;
  const anchor = selected.hip;
  const scale = median([
    distance(selected.shoulder, selected.hip),
    distance(selected.hip, selected.knee),
    distance(selected.knee, selected.ankle),
    distance(selected.shoulder, selected.elbow),
    distance(selected.elbow, selected.wrist),
  ]);
  if (!Number.isFinite(scale) || scale <= 1e-6) return null;
  const horizontalDirection = Math.sign(selected.ankle.x - selected.shoulder.x)
    || Math.sign(selected.knee.x - selected.shoulder.x)
    || 1;
  return Object.fromEntries(joints.map((joint) => [joint, {
    x: ((selected[joint].x - anchor.x) * horizontalDirection) / scale,
    y: (selected[joint].y - anchor.y) / scale,
    score: selected[joint].score,
  }]));
}

export function spriteSkeletonDistance(a, b, joints = DEFAULT_JOINTS) {
  if (!a || !b) return Infinity;
  let weightedTotal = 0;
  let totalWeight = 0;
  for (const joint of joints) {
    if (!a[joint] || !b[joint]) return Infinity;
    const weight = Math.max(0.1, Math.min(1, a[joint].score ?? 1));
    const dx = a[joint].x - b[joint].x;
    const dy = a[joint].y - b[joint].y;
    weightedTotal += (dx * dx + dy * dy) * weight;
    totalWeight += weight;
  }
  return totalWeight ? Math.sqrt(weightedTotal / totalWeight) : Infinity;
}

export function rankSpriteStates(pose, {
  manifest,
  width = 1,
  height = 1,
  side = 'left',
  roles = null,
} = {}) {
  if (!manifest?.frames?.length || !pose) return [];
  const joints = manifest.requiredPoints?.length ? manifest.requiredPoints : DEFAULT_JOINTS;
  const liveLandmarks = pose.keypoints ? normalizeLandmarks(pose, width, height) : pose;
  const liveSkeleton = normalizeSpriteSkeleton(liveLandmarks, { side, joints });
  if (!liveSkeleton) return [];
  const acceptedRoles = roles?.length ? new Set(roles) : null;
  return manifest.frames
    .filter((frame) => frame.matchable !== false && (!acceptedRoles || acceptedRoles.has(frame.role)))
    .map((frame) => {
      const reference = normalizeSpriteSkeleton(frame.points, { side: frame.side || side, joints });
      return { id: frame.id, frame, distance: spriteSkeletonDistance(liveSkeleton, reference, joints) };
    })
    .filter((candidate) => Number.isFinite(candidate.distance))
    .sort((a, b) => a.distance - b.distance);
}

export function createSpriteStateMatcher(manifest, {
  minHoldMs = 180,
  switchMargin = 0.025,
  maxDistance = 1.25,
} = {}) {
  let current = null;
  let pendingId = null;
  let pendingSince = 0;

  function update(pose, options = {}) {
    const now = options.now ?? performance.now();
    const ranking = rankSpriteStates(pose, { ...options, manifest });
    const best = ranking[0];
    if (!best || best.distance > maxDistance) return current;
    if (!current) {
      current = best;
      return current;
    }
    const currentCandidate = ranking.find((candidate) => candidate.id === current.id);
    if (best.id === current.id) {
      current = best;
      pendingId = null;
      return current;
    }
    if (currentCandidate && best.distance + switchMargin >= currentCandidate.distance) {
      pendingId = null;
      return { ...current, distance: currentCandidate.distance };
    }
    if (pendingId !== best.id) {
      pendingId = best.id;
      pendingSince = now;
      return current;
    }
    if (now - pendingSince >= minHoldMs) {
      current = best;
      pendingId = null;
    }
    return current;
  }

  function reset() {
    current = null;
    pendingId = null;
    pendingSince = 0;
  }

  return { update, reset };
}

