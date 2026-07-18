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
  if (!quality?.tracked) return 'MOVE INTO FRAME';
  if (!quality.requiredLandmarksVisible) return 'SHOW YOUR FULL SIDE';
  if (quality.margin < POSE_RULE_CONFIG.framing.minMargin) return quality.occupancy < POSE_RULE_CONFIG.framing.minOccupancy ? 'MOVE CLOSER' : 'MOVE BACK';
  if (quality.occupancy > POSE_RULE_CONFIG.framing.maxOccupancy) return 'MOVE BACK';
  if (!quality.centered) return quality.centerDirection === 'left' ? 'MOVE LEFT' : 'MOVE RIGHT';
  return quality.stable ? 'READY' : 'HOLD STILL';
}

