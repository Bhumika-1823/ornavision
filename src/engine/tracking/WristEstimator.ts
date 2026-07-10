import { HandState, BodyState, WristState, Point3D, Point2D } from '../types';

function normalize(v: Point3D): Point3D {
  const m = Math.hypot(v.x, v.y, v.z);
  if (m === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / m, y: v.y / m, z: v.z / m };
}

export class WristEstimator {
  /**
   * Computes WristState combining Hand and Body data.
   */
  static estimate(hand: HandState, body: BodyState | null): WristState {
    const wrist3D = hand.landmarks[0]; // WRIST is index 0
    const middleMcp3D = hand.landmarks[9]; // MIDDLE_FINGER_MCP is index 9
    
    // We want the vector pointing FROM the wrist UP the forearm towards the elbow.
    // If we have an elbow from body tracking, we use it. 
    // Wait, body landmarks are in 2D pixels right now in BodyState? Yes, body state has leftElbow/rightElbow as Point2D, 
    // but we can compute 3D direction if we pull it from raw, or just use 2D for rotation and fake 3D.
    // However, the simplest robust fallback for the forearm vector is simply the vector 
    // extending backwards from the hand's primary axis (middle knuckle -> wrist).
    // Let's use the hand's internal alignment for 3D forearm direction.
    
    // Vector from Middle Knuckle TO Wrist is roughly aligned with the forearm.
    const forearmDir3D = normalize({
      x: wrist3D.x - middleMcp3D.x,
      y: wrist3D.y - middleMcp3D.y,
      z: wrist3D.z - middleMcp3D.z
    });

    // 2D Rotation: If we have body elbow, we can compute exact 2D angle.
    let forearmRotation = 0;
    let usedElbow = false;

    if (body) {
      if (hand.handedness === 'Left' && body.leftElbow) {
        // From wrist to elbow
        forearmRotation = Math.atan2(body.leftElbow.y - hand.wrist.y, body.leftElbow.x - hand.wrist.x);
        usedElbow = true;
      } else if (hand.handedness === 'Right' && body.rightElbow) {
        forearmRotation = Math.atan2(body.rightElbow.y - hand.wrist.y, body.rightElbow.x - hand.wrist.x);
        usedElbow = true;
      }
    }

    if (!usedElbow) {
      // Fallback: Wrist angle from HandEstimator (which is mcp-to-wrist)
      forearmRotation = hand.wristAngle;
    }

    // Is the wrist visible? If the hand is present, we assume the wrist is visible unless clipped.
    // We'll just say it's visible if hand is confident.
    const isVisible = hand.confidence > 0.5;

    return {
      present: true,
      handedness: hand.handedness,
      center: hand.wrist,
      widthPx: hand.palmWidthPx * 1.1, // Wrist is typically slightly wider than the distance between index and pinky MCPs
      forearmRotation,
      forearmDirection: forearmDir3D,
      palmRotation: hand.palmNormal,
      isVisible
    };
  }
}
