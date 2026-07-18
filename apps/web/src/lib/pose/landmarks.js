import { POSE_RULE_CONFIG } from './config.js';

const aliases = new Map([
  ['left_eye', 'leftEye'], ['right_eye', 'rightEye'], ['left_ear', 'leftEar'], ['right_ear', 'rightEar'],
  ['left_shoulder', 'leftShoulder'], ['right_shoulder', 'rightShoulder'], ['left_elbow', 'leftElbow'], ['right_elbow', 'rightElbow'],
  ['left_wrist', 'leftWrist'], ['right_wrist', 'rightWrist'], ['left_hip', 'leftHip'], ['right_hip', 'rightHip'],
  ['left_knee', 'leftKnee'], ['right_knee', 'rightKnee'], ['left_ankle', 'leftAnkle'], ['right_ankle', 'rightAnkle'],
]);

export function normalizeLandmarks(pose, width = 1, height = 1) {
  const result = {};
  for (const keypoint of pose?.keypoints || []) {
    const rawName = String(keypoint.name || keypoint.part || '').replaceAll(' ', '_').toLowerCase();
    const name = aliases.get(rawName) || keypoint.name || keypoint.part;
    if (!name) continue;
    result[name] = { x: keypoint.x / width, y: keypoint.y / height, score: keypoint.score ?? keypoint.confidence ?? 0 };
  }
  return result;
}

export function meanConfidence(landmarks, names) {
  const values = names.map((name) => landmarks[name]?.score).filter((score) => Number.isFinite(score));
  return values.length ? values.reduce((sum, score) => sum + score, 0) / values.length : 0;
}

export function qualityGate(landmarks, { minConfidence = POSE_RULE_CONFIG.minRequiredConfidence } = {}) {
  const sideNames = (side) => ['Shoulder', 'Elbow', 'Wrist', 'Hip', 'Knee', 'Ankle'].map((joint) => `${side}${joint}`);
  const leftScore = meanConfidence(landmarks, sideNames('left'));
  const rightScore = meanConfidence(landmarks, sideNames('right'));
  const side = leftScore >= rightScore ? 'left' : 'right';
  const names = sideNames(side);
  const points = names.map((name) => landmarks[name]).filter(Boolean);
  const requiredLandmarksVisible = names.every((name) => landmarks[name]?.score >= minConfidence);
  if (!points.length) return { tracked: false, requiredLandmarksVisible: false, side, leftScore, rightScore, margin: 0, occupancy: 0, centered: false };
  const xs = points.map((point) => point.x); const ys = points.map((point) => point.y);
  const minX = Math.min(...xs); const maxX = Math.max(...xs); const minY = Math.min(...ys); const maxY = Math.max(...ys);
  const occupancy = maxX - minX;
  const margin = Math.min(minX, 1 - maxX, minY, 1 - maxY);
  const center = (minX + maxX) / 2;
  return { tracked: requiredLandmarksVisible, requiredLandmarksVisible, side, leftScore, rightScore, margin, occupancy, centered: center >= 0.18 && center <= 0.82, centerDirection: center < 0.18 ? 'left' : 'right', points };
}

