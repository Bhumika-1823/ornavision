import { JewelryMetadata } from '../metadata/JewelryMetadata';
import { HeadPose, Transform2D } from '../types';

/**
 * Computes a horizontal (and slight vertical) compression factor to
 * simulate perspective as the head/body turns or tilts, without ever
 * stretching the sprite unnaturally — compression is clamped by the
 * asset's own `maxCompression`.
 */
export function computePerspectiveScaleX(meta: JewelryMetadata, pose: HeadPose): number {
  const { yawFactor, pitchFactor, maxCompression } = meta.perspectiveCompression;
  const yawCompression = Math.abs(pose.yaw) * yawFactor;
  // X is mainly compressed by yaw. Pitch does a tiny bit.
  const pitchCompression = Math.abs(pose.pitch) * (pitchFactor * 0.5);
  const total = Math.min(yawCompression + pitchCompression, maxCompression);
  return 1 - total;
}

export function computePerspectiveScaleY(meta: JewelryMetadata, pose: HeadPose): number {
  const { pitchFactor, maxCompression } = meta.perspectiveCompression;
  // Y is mainly compressed by pitch.
  const pitchCompression = Math.abs(pose.pitch) * pitchFactor;
  const total = Math.min(pitchCompression, maxCompression);
  return 1 - total;
}

/** Applies the per-product calibration correction on top of an already-anatomically-placed transform. */
export function applyCalibration(meta: JewelryMetadata, transform: Transform2D): Transform2D {
  const { scaleCorrection, rotationCorrectionRad, offsetCorrection } = meta.calibration;
  return {
    ...transform,
    x: transform.x + offsetCorrection.x,
    y: transform.y + offsetCorrection.y,
    rotation: transform.rotation + rotationCorrectionRad,
    width: transform.width * scaleCorrection,
    height: transform.height * scaleCorrection,
  };
}

/** Builds a base Transform2D with sane defaults so every anchor function only overrides what it needs. */
export function baseTransform(renderOrder: number): Transform2D {
  return {
    x: 0,
    y: 0,
    rotation: 0,
    width: 0,
    height: 0,
    scaleX: 1,
    scaleY: 1,
    opacity: 1,
    visible: true,
    renderOrder,
    flipX: false,
  };
}

/** Standard width->height conversion preserving asset aspect ratio. */
export function heightForWidth(drawWidth: number, imgWidth: number, imgHeight: number): number {
  if (!imgWidth) return drawWidth;
  return (drawWidth / imgWidth) * imgHeight;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
