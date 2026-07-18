import { distance, angle, median, signedLineOffset, dot, subtract, magnitude } from './geometry.js';

export function extractFeatures(landmarks, side) {
  const p = (joint) => landmarks[`${side}${joint[0].toUpperCase()}${joint.slice(1)}`];
  const shoulder = p('shoulder'); const elbow = p('elbow'); const wrist = p('wrist'); const hip = p('hip'); const knee = p('knee'); const ankle = p('ankle');
  const ear = landmarks[`${side}Ear`];
  const scale = median([distance(shoulder, hip), distance(hip, knee), distance(knee, ankle)]);
  if (![shoulder, elbow, wrist, hip, knee, ankle, scale].every(Boolean) || !scale) return null;
  const floorAxis = subtract(ankle, elbow); const floorLength = magnitude(floorAxis);
  const shoulderStack = floorLength ? dot(subtract(shoulder, elbow), floorAxis) / floorLength / scale : null;
  const bodyDirection = Math.sign(knee.x - shoulder.x) || 1;
  return {
    scale,
    hipOffset: signedLineOffset(hip, shoulder, knee) * bodyDirection / scale,
    hipAngle: angle(shoulder, hip, knee),
    shoulderStack,
    elbowAngle: angle(shoulder, elbow, wrist),
    kneeAngle: angle(hip, knee, ankle),
    neckAngle: ear ? angle(ear, shoulder, hip) : null,
  };
}
