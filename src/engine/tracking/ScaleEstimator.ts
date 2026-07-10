import { Point2D } from "../types";

/** Euclidean distance between two pixel-space points. */
export function dist(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * A body-scale reference combines face width and shoulder width (when
 * available) so necklace/bracelet sizing stays consistent even if the face
 * briefly loses tracking confidence but the body doesn't.
 */
export function bodyScaleReference(
  faceWidthPx: number,
  shoulderWidthPx: number | null,
): number {
  if (!shoulderWidthPx || shoulderWidthPx <= 0) return faceWidthPx;
  // Empirical ratio: shoulder width is typically ~2.6-3x face width for an average adult
  // facing the camera. Blend the two so a partially-turned body doesn't over-scale jewelry.
  const impliedFaceWidth = shoulderWidthPx / 2.8;
  return faceWidthPx * 0.6 + impliedFaceWidth * 0.4;
}
