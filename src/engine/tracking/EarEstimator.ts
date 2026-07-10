import { FrameState, Point2D } from "../types";

export interface EarMetrics {
  leftEar: Point2D;
  rightEar: Point2D;
  leftVisibility: number;
  rightVisibility: number;
  headRoll: number;
  headYaw: number;
  headPitch: number;
  faceWidthPx: number;
  trackingQuality: number;
  jawAngle: number;
}

export class EarEstimator {
  /**
   * Estimates anatomical ear metrics, calculating occlusion, visibility, and tracking quality.
   */
  static estimate(frame: FrameState): EarMetrics | null {
    const { face } = frame;
    if (!face || !face.present) return null;

    // Head rotation
    const { roll, yaw, pitch } = face.pose;

    // Jaw angle: simple heuristic based on face rotation, but can be derived from jaw point relative to center
    // Let's use the angle from jaw to left/right ear
    const dy = face.jaw.y - face.center.y;
    const dx = face.jaw.x - face.center.x;
    const jawAngle = Math.atan2(dy, dx);

    // Visibility heuristic based on yaw
    // As yaw increases (head turns), the far ear becomes occluded.
    // Normalized yaw is typically in [-1, 1].
    // +yaw = turned toward viewer's left (their right ear more visible, left ear occluded)
    // -yaw = turned toward viewer's right (their left ear more visible, right ear occluded)
    let leftVis = 1.0;
    let rightVis = 1.0;

    if (yaw > 0) {
      // Looking left, left ear is occluded
      leftVis = Math.max(0, 1 - yaw * 1.5);
    } else {
      // Looking right, right ear is occluded
      rightVis = Math.max(0, 1 + yaw * 1.5);
    }

    // Tracking Quality
    // Degrades if face confidence is low, or if ears are off-screen
    let quality = face.confidence;

    // Check boundaries (very rough heuristic)
    const margin = face.faceWidthPx * 0.1;
    if (
      face.leftEar.x < -margin ||
      face.leftEar.x > frame.width + margin ||
      face.leftEar.y < -margin ||
      face.leftEar.y > frame.height + margin
    ) {
      quality *= 0.5;
    }
    if (
      face.rightEar.x < -margin ||
      face.rightEar.x > frame.width + margin ||
      face.rightEar.y < -margin ||
      face.rightEar.y > frame.height + margin
    ) {
      quality *= 0.5;
    }

    return {
      leftEar: face.leftEar,
      rightEar: face.rightEar,
      leftVisibility: leftVis,
      rightVisibility: rightVis,
      headRoll: roll,
      headYaw: yaw,
      headPitch: pitch,
      faceWidthPx: face.faceWidthPx,
      trackingQuality: Math.max(0, quality),
      jawAngle,
    };
  }
}
