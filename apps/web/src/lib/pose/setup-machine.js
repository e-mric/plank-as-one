import { POSE_RULE_CONFIG } from './config.js';

export const CAMERA_CONSTRAINTS = {
  audio: false,
  video: {
    width: { ideal: 960 },
    height: { ideal: 540 },
    frameRate: { ideal: 30, max: 30 },
    facingMode: 'user',
  },
};

export function getCameraErrorMessage(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') return 'CAMERA PERMISSION NEEDED';
  if (error?.name === 'NotFoundError' || error?.name === 'OverconstrainedError') return 'NO USABLE CAMERA FOUND';
  if (typeof navigator !== 'undefined' && !window.isSecureContext) return 'CAMERA NEEDS HTTPS';
  return 'CAMERA SETUP FAILED';
}

export function describeFraming(quality) {
  if (!quality || !quality.pointCount) return 'MOVE INTO FRAME';
  if (!quality.requiredLandmarksVisible) return 'SHOW YOUR FULL SIDE';
  // A cropped body can have a deceptively small measured span because the missing
  // joints are outside the image. Resolve clipping before using occupancy as distance.
  if (quality.clipped || quality.margin <= POSE_RULE_CONFIG.framing.clippedMargin) return 'MOVE BACK';
  if (quality.occupancy < POSE_RULE_CONFIG.framing.minOccupancy) return 'MOVE CLOSER';
  if (quality.occupancy > POSE_RULE_CONFIG.framing.maxOccupancy) return 'MOVE BACK';
  if (quality.margin < POSE_RULE_CONFIG.framing.minMargin) return quality.centered ? 'MOVE BACK' : quality.centerDirection === 'left' ? 'MOVE LEFT' : 'MOVE RIGHT';
  if (!quality.centered) return quality.centerDirection === 'left' ? 'MOVE LEFT' : 'MOVE RIGHT';
  return quality.stable ? 'READY' : 'HOLD STILL';
}

