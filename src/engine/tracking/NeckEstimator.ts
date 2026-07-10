import { FrameState, Point2D } from "../types";

export interface NeckMetrics {
  neckCenter: Point2D;
  neckWidthPx: number;
  neckAngle: number;
  neckRotation: number;
  chestCenter: Point2D;
  shoulderLine: { left: Point2D; right: Point2D };
  shoulderWidthPx: number;
  bodyRotation: number;
  shoulderSymmetry: number;
  trackingQuality: number;
}

export class NeckEstimator {
  /**
   * Computes anatomical metrics specific to necklace placement.
   * Extracts robust metrics from FrameState, combining face and body points.
   */
  static estimate(frame: FrameState): NeckMetrics | null {
    if (!frame.face) return null;

    const face = frame.face;
    const body = frame.body;

    // Base neck anchor from face (usually base of jaw)
    let neckCenter = face.neckAnchor;

    // Approximate neck width based on face/jaw width
    const neckWidthPx = face.faceWidthPx * 0.75;

    // Neck angle in screen space (tilt)
    const neckAngle = face.pose.roll;

    // Neck rotation in 3D (yaw)
    const neckRotation = face.pose.yaw;

    // Body fallbacks if body tracking is missing
    let chestCenter: Point2D = {
      x: neckCenter.x,
      y: neckCenter.y + face.faceWidthPx * 1.5,
    };

    let leftShoulder: Point2D = {
      x: neckCenter.x - face.faceWidthPx * 1.2,
      y: neckCenter.y + face.faceWidthPx * 0.8,
    };

    let rightShoulder: Point2D = {
      x: neckCenter.x + face.faceWidthPx * 1.2,
      y: neckCenter.y + face.faceWidthPx * 0.8,
    };

    let shoulderWidthPx = face.faceWidthPx * 2.5;
    let bodyRot = face.pose.roll * 0.2;
    let shoulderSymmetry = 0.5;

    if (body) {
      chestCenter = body.chestCenter;
      leftShoulder = body.leftShoulder;
      rightShoulder = body.rightShoulder;
      shoulderWidthPx = body.shoulderWidthPx;
      bodyRot = body.bodyRotation;

      // Calculate symmetry based on distance from neck center to each shoulder
      const dLeft = Math.hypot(
        leftShoulder.x - neckCenter.x,
        leftShoulder.y - neckCenter.y,
      );
      const dRight = Math.hypot(
        rightShoulder.x - neckCenter.x,
        rightShoulder.y - neckCenter.y,
      );
      const symmetryDiff = Math.abs(dLeft - dRight) / (shoulderWidthPx || 1);
      shoulderSymmetry = Math.max(0, 1.0 - symmetryDiff * 2);
    } else {
      // Simulate symmetry based on face yaw if body missing
      shoulderSymmetry = Math.max(0, 1.0 - Math.abs(face.pose.yaw));
    }

    // Tracking quality: combination of face confidence, body presence, and symmetry
    let quality = face.confidence;
    if (body) {
      quality = (quality + body.confidence) / 2;
    } else {
      quality *= 0.7; // penalize if body tracking is missing for necklaces
    }

    // Drop quality if yaw/pitch are extreme or symmetry is very low
    quality *= 0.5 + 0.5 * shoulderSymmetry;
    quality = Math.max(0.1, Math.min(1.0, quality));

    return {
      neckCenter,
      neckWidthPx,
      neckAngle,
      neckRotation,
      chestCenter,
      shoulderLine: { left: leftShoulder, right: rightShoulder },
      shoulderWidthPx,
      bodyRotation: bodyRot,
      shoulderSymmetry,
      trackingQuality: quality,
    };
  }
}
