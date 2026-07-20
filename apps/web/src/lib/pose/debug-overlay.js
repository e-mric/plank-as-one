import { POSE_RULE_CONFIG } from './config.js';

const KEYPOINT_NAME_ALIASES = new Map([
  ['nose', 'nose'], ['left_eye', 'leftEye'], ['right_eye', 'rightEye'], ['left_ear', 'leftEar'], ['right_ear', 'rightEar'],
  ['left_shoulder', 'leftShoulder'], ['right_shoulder', 'rightShoulder'], ['left_elbow', 'leftElbow'], ['right_elbow', 'rightElbow'],
  ['left_wrist', 'leftWrist'], ['right_wrist', 'rightWrist'], ['left_hip', 'leftHip'], ['right_hip', 'rightHip'],
  ['left_knee', 'leftKnee'], ['right_knee', 'rightKnee'], ['left_ankle', 'leftAnkle'], ['right_ankle', 'rightAnkle'],
]);

export const POSE_DEBUG_BONES = [
  ['leftEar', 'leftShoulder'], ['rightEar', 'rightShoulder'], ['leftShoulder', 'rightShoulder'],
  ['leftShoulder', 'leftElbow'], ['leftElbow', 'leftWrist'], ['rightShoulder', 'rightElbow'], ['rightElbow', 'rightWrist'],
  ['leftShoulder', 'leftHip'], ['rightShoulder', 'rightHip'], ['leftHip', 'rightHip'],
  ['leftHip', 'leftKnee'], ['leftKnee', 'leftAnkle'], ['rightHip', 'rightKnee'], ['rightKnee', 'rightAnkle'],
];

const DIAGNOSTIC_LABELS = {
  'hips-low': 'HIPS TOO LOW',
  'hips-high': 'HIPS TOO HIGH',
  'knee-extension': 'KNEES DROPPING',
  'neck-alignment': 'NECK MISALIGNED',
  'shoulder-forward': 'SHOULDERS TOO FAR FORWARD',
  'shoulder-back': 'SHOULDERS TOO FAR BACK',
  'elbow-position': 'ELBOW ALIGNMENT',
};

function canonicalKeypointName(keypoint) {
  const raw = String(keypoint?.name || keypoint?.part || '').trim();
  const underscored = raw.replaceAll(' ', '_').toLowerCase();
  return KEYPOINT_NAME_ALIASES.get(underscored) || raw || null;
}

function round(value, digits = 2) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}

export function mapPoseKeypoints(pose) {
  return Object.fromEntries((pose?.keypoints || []).flatMap((keypoint) => {
    const name = canonicalKeypointName(keypoint);
    return name ? [[name, { x: keypoint.x, y: keypoint.y, score: keypoint.score ?? keypoint.confidence ?? 0 }]] : [];
  }));
}

export function getPoseDiagnosticLabel(result, stage = 'active') {
  if (!result?.tracking) return 'TRACKING LOST';
  if (stage === 'positioning') return result.setupReady ? 'FRAMING READY' : `FRAMING · ${result.setupMessage || 'CHECK POSITION'}`;
  if (result.correction?.kind) return DIAGNOSTIC_LABELS[result.correction.kind] || result.correction.label || 'FORM CORRECTION';
  return 'GOOD FORM';
}

export function createPoseDebugRecord({ pose, result, stage, capturedAt = new Date(), frameTimeMs = null, width = 1, height = 1, reason = 'automatic' }) {
  const features = result?.features || {};
  const quality = result?.quality || {};
  const keypoints = mapPoseKeypoints(pose);
  return {
    schemaVersion: 1,
    capturedAt: capturedAt.toISOString(),
    frameTimeMs: round(frameTimeMs, 1),
    reason,
    phase: stage === 'positioning' ? 'initial-framing' : 'plank-analysis',
    stage,
    diagnostic: getPoseDiagnosticLabel(result, stage),
    model: 'MoveNet SinglePose Lightning',
    poseRuleConfigVersion: POSE_RULE_CONFIG.version,
    frame: { width, height },
    tracking: Boolean(result?.tracking),
    setupReady: Boolean(result?.setupReady),
    correction: result?.correction ? { kind: result.correction.kind, label: result.correction.label } : null,
    quality: {
      side: quality.side || null,
      framed: Boolean(quality.framed),
      stable: Boolean(quality.stable),
      requiredLandmarksVisible: Boolean(quality.requiredLandmarksVisible),
      leftScore: round(quality.leftScore, 3),
      rightScore: round(quality.rightScore, 3),
      occupancy: round(quality.occupancy, 3),
      margin: round(quality.margin, 3),
      centered: Boolean(quality.centered),
    },
    features: {
      hipAngle: round(features.hipAngle, 1),
      elbowAngle: round(features.elbowAngle, 1),
      kneeAngle: round(features.kneeAngle, 1),
      neckAngle: round(features.neckAngle, 1),
      hipOffset: round(features.hipOffset, 3),
      shoulderStack: round(features.shoulderStack, 3),
    },
    keypoints: Object.fromEntries(Object.entries(keypoints).map(([name, point]) => [name, {
      x: round(point.x, 1), y: round(point.y, 1), score: round(point.score, 3),
    }])),
  };
}

function drawLabel(context, text, x, y, { fill = '#101820', background = 'rgba(255,250,245,.92)', fontSize = 14, align = 'left' } = {}) {
  context.save();
  context.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  context.textAlign = align;
  context.textBaseline = 'middle';
  const paddingX = 7;
  const metrics = context.measureText(text);
  const width = metrics.width + paddingX * 2;
  const left = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x;
  context.fillStyle = background;
  context.fillRect(left, y - fontSize, width, fontSize * 1.75);
  context.fillStyle = fill;
  context.fillText(text, x + (align === 'left' ? paddingX : align === 'right' ? -paddingX : 0), y);
  context.restore();
}

function drawAngle(context, keypoints, jointName, label, value, scale) {
  const point = keypoints[jointName];
  if (!point || !Number.isFinite(value)) return;
  drawLabel(context, `${label} ${value.toFixed(1)}°`, point.x + 11 * scale, point.y - 14 * scale, {
    fontSize: 12 * scale,
    fill: '#fffaf5',
    background: 'rgba(16,24,32,.82)',
  });
}

export function drawPoseDebugOverlay({ canvas, video, pose, result, stage, capturedAt = new Date(), frameTimeMs = null, reason = 'automatic' }) {
  const width = video.videoWidth || video.width || 1280;
  const height = video.videoHeight || video.height || 720;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context unavailable');
  context.drawImage(video, 0, 0, width, height);

  const scale = Math.max(0.75, Math.min(1.75, width / 960));
  const keypoints = mapPoseKeypoints(pose);
  const confidenceThreshold = 0.25;
  const selectedSide = result?.quality?.side || null;

  context.save();
  context.lineCap = 'round';
  context.lineJoin = 'round';
  context.lineWidth = 4 * scale;
  for (const [startName, endName] of POSE_DEBUG_BONES) {
    const start = keypoints[startName];
    const end = keypoints[endName];
    if (!start || !end || start.score < confidenceThreshold || end.score < confidenceThreshold) continue;
    const selected = selectedSide && startName.startsWith(selectedSide) && endName.startsWith(selectedSide);
    context.strokeStyle = selected ? '#63ff90' : 'rgba(255,205,74,.78)';
    context.beginPath();
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
  }
  for (const [name, point] of Object.entries(keypoints)) {
    if (point.score < confidenceThreshold) continue;
    const selected = selectedSide && name.startsWith(selectedSide);
    context.fillStyle = selected ? '#63ff90' : '#ffcd4a';
    context.strokeStyle = '#101820';
    context.lineWidth = 2 * scale;
    context.beginPath();
    context.arc(point.x, point.y, 6 * scale, 0, Math.PI * 2);
    context.fill();
    context.stroke();
  }
  context.restore();

  const sidePrefix = selectedSide || 'left';
  const features = result?.features || {};
  drawAngle(context, keypoints, `${sidePrefix}Hip`, 'HIP', features.hipAngle, scale);
  drawAngle(context, keypoints, `${sidePrefix}Elbow`, 'ELBOW', features.elbowAngle, scale);
  drawAngle(context, keypoints, `${sidePrefix}Knee`, 'KNEE', features.kneeAngle, scale);
  drawAngle(context, keypoints, `${sidePrefix}Shoulder`, 'NECK', features.neckAngle, scale);

  const record = createPoseDebugRecord({ pose, result, stage, capturedAt, frameTimeMs, width, height, reason });
  const diagnosticColor = record.diagnostic === 'GOOD FORM' || record.diagnostic === 'FRAMING READY' ? '#63ff90' : '#ff7b59';
  context.fillStyle = 'rgba(16,24,32,.86)';
  context.fillRect(0, 0, width, 74 * scale);
  context.fillStyle = diagnosticColor;
  context.font = `800 ${22 * scale}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  context.textBaseline = 'middle';
  context.fillText(record.diagnostic, 20 * scale, 29 * scale);
  context.fillStyle = '#fffaf5';
  context.font = `600 ${12 * scale}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  context.fillText(`${record.phase.toUpperCase()} · ${record.model} · RULES ${record.poseRuleConfigVersion}`, 20 * scale, 55 * scale);

  const panelWidth = Math.min(width * 0.34, 340 * scale);
  const panelX = width - panelWidth;
  context.fillStyle = 'rgba(16,24,32,.78)';
  context.fillRect(panelX, 74 * scale, panelWidth, height - 74 * scale);
  const lines = [
    `TIME  ${record.capturedAt}`,
    `STAGE ${record.stage}`,
    `SIDE  ${record.quality.side || 'none'}`,
    `TRACK ${record.tracking ? 'yes' : 'no'}`,
    `FRAME ${record.quality.framed ? 'inside bounds' : 'adjust position'}`,
    `OCCUP ${(record.quality.occupancy ?? 0) * 100 | 0}%`,
    `MARGIN ${((record.quality.margin ?? 0) * 100).toFixed(1)}%`,
    '',
    `HIP ANGLE     ${record.features.hipAngle ?? 'n/a'}°`,
    `ELBOW ANGLE   ${record.features.elbowAngle ?? 'n/a'}°`,
    `KNEE ANGLE    ${record.features.kneeAngle ?? 'n/a'}°`,
    `NECK ANGLE    ${record.features.neckAngle ?? 'n/a'}°`,
    `HIP OFFSET    ${record.features.hipOffset ?? 'n/a'}`,
    `SHOULDER STACK ${record.features.shoulderStack ?? 'n/a'}`,
  ];
  context.fillStyle = '#fffaf5';
  context.font = `600 ${11 * scale}px ui-monospace, SFMono-Regular, Consolas, monospace`;
  context.textBaseline = 'top';
  lines.forEach((line, index) => context.fillText(line, panelX + 14 * scale, 94 * scale + index * 21 * scale));
  return record;
}

export function canvasToPngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('PNG export failed')), 'image/png');
  });
}
