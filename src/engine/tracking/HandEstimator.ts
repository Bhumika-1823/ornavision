import { Point2D, Point3D } from "../types";

/** Compute a 3D cross product */
function cross(a: Point3D, b: Point3D): Point3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/** Compute dot product */
function dot(a: Point3D, b: Point3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** Vector subtraction */
function sub(a: Point3D, b: Point3D): Point3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/** Vector magnitude */
function mag(a: Point3D): number {
  return Math.hypot(a.x, a.y, a.z);
}

/** Normalize vector */
function normalize(a: Point3D): Point3D {
  const m = mag(a);
  if (m === 0) return { x: 0, y: 0, z: 0 };
  return { x: a.x / m, y: a.y / m, z: a.z / m };
}

export class HandEstimator {
  /**
   * Computes the 3D Palm Normal (vector pointing out from the palm).
   * Assumes right-hand coordinate system rules based on MCP points.
   */
  static computePalmNormal(
    indexMcp: Point3D,
    pinkyMcp: Point3D,
    wrist: Point3D,
    handedness: "Left" | "Right" | "Unknown",
  ): Point3D {
    // Vector from wrist to index
    const v1 = sub(indexMcp, wrist);
    // Vector from wrist to pinky
    const v2 = sub(pinkyMcp, wrist);

    // Cross product gives normal. Depending on handedness, we might need to flip it
    // so the normal always points out of the palm face.
    let normal = cross(v1, v2);

    // For a right hand, (Index - Wrist) x (Pinky - Wrist) points INTO the palm (in MediaPipe coords, +z is away).
    // Let's standardise so normal points away from palm.
    if (handedness === "Right") {
      normal = { x: -normal.x, y: -normal.y, z: -normal.z };
    }

    return normalize(normal);
  }

  /**
   * Computes finger curl (pitch) in radians.
   * Compares the vector from MCP->PIP to the vector from PIP->TIP.
   * High values (> 1 rad) usually indicate the finger is curled inward.
   */
  static computeFingerCurl(mcp: Point3D, pip: Point3D, tip: Point3D): number {
    const v1 = normalize(sub(pip, mcp));
    const v2 = normalize(sub(tip, pip));

    // Dot product gives cosine of angle
    let d = dot(v1, v2);
    // clamp to [-1, 1] for acos
    d = Math.max(-1, Math.min(1, d));

    return Math.acos(d);
  }
}
