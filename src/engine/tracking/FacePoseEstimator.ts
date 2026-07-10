import { HeadPose, Point2D, Point3D } from '../types';

// MediaPipe FaceMesh landmark indices used throughout the engine.
export const FACE_IDX = {
  leftEyeOuter: 33,
  rightEyeOuter: 263,
  faceLeft: 234,
  faceRight: 454,
  chin: 152,
  noseTip: 4,
  foreheadCenter: 10,
  leftNostril: 64,
  rightNostril: 294,
  leftEarTragus: 234,
  rightEarTragus: 454,
  topLip: 13,
  browMid: 9,
};

/** In-plane roll angle (radians) of the face from the eye line. Positive = clockwise. */
export function estimateRoll(landmarks: Point3D[]): number {
  const l = landmarks[FACE_IDX.leftEyeOuter];
  const r = landmarks[FACE_IDX.rightEyeOuter];
  return Math.atan2(r.y - l.y, r.x - l.x);
}

/** Normalized yaw in [-1, 1] from nose-tip offset relative to face bounding width. */
export function estimateYaw(landmarks: Point3D[], widthPx: number): number {
  const noseTip = landmarks[FACE_IDX.noseTip].x * widthPx;
  const faceLeft = landmarks[FACE_IDX.faceLeft].x * widthPx;
  const faceRight = landmarks[FACE_IDX.faceRight].x * widthPx;
  const faceCenter = (faceLeft + faceRight) / 2;
  const faceWidth = faceRight - faceLeft;
  if (faceWidth < 1) return 0;
  return clamp((noseTip - faceCenter) / (faceWidth * 0.5), -1, 1);
}

/** Rough normalized pitch in [-1, 1] using nose-tip vertical offset vs. eye-to-chin span. */
export function estimatePitch(landmarks: Point3D[], heightPx: number): number {
  const eyeY = ((landmarks[FACE_IDX.leftEyeOuter].y + landmarks[FACE_IDX.rightEyeOuter].y) / 2) * heightPx;
  const chinY = landmarks[FACE_IDX.chin].y * heightPx;
  const noseY = landmarks[FACE_IDX.noseTip].y * heightPx;
  const span = chinY - eyeY;
  if (span < 1) return 0;
  const mid = eyeY + span * 0.5;
  return clamp((noseY - mid) / (span * 0.5), -1, 1);
}

export function estimateHeadPose(landmarks: Point3D[], widthPx: number, heightPx: number): HeadPose {
  return {
    roll: estimateRoll(landmarks),
    yaw: estimateYaw(landmarks, widthPx),
    pitch: estimatePitch(landmarks, heightPx),
  };
}

export function faceWidthPx(landmarks: Point3D[], widthPx: number): number {
  const l = landmarks[FACE_IDX.faceLeft];
  const r = landmarks[FACE_IDX.faceRight];
  return Math.hypot((r.x - l.x) * widthPx, (r.y - l.y) * widthPx);
}

export function eyeDistancePx(landmarks: Point3D[], widthPx: number, heightPx: number): number {
  const l = landmarks[FACE_IDX.leftEyeOuter];
  const r = landmarks[FACE_IDX.rightEyeOuter];
  return Math.hypot((r.x - l.x) * widthPx, (r.y - l.y) * heightPx);
}

export function toPx(p: Point3D, widthPx: number, heightPx: number): Point2D {
  return { x: p.x * widthPx, y: p.y * heightPx };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
