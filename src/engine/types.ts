/**
 * engine/types.ts
 *
 * Core shared types for the TryonEngine.
 *
 * IMPORTANT ARCHITECTURAL RULE:
 * Raw MediaPipe results (multiFaceLandmarks, multiHandLandmarks, etc.) must
 * NEVER be passed outside of the tracking layer. Every consumer of tracking
 * processed `FrameState` object defined here.
 */

import { NeckMetrics } from './tracking/NeckEstimator';
import { PendantMetrics } from './anchors/PendantEngine';
import { EarringMetrics } from './anchors/earringAnchor';

/** A single normalized landmark point, x/y in [0,1] relative to frame, z is depth (relative). */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type Point2D = { x: number; y: number };

/** 2D affine-ish transform describing how to draw a jewelry sprite for one frame. */
export interface Transform2D {
  /** Anchor position in pixel space (canvas coordinates, pre-mirror). */
  x: number;
  y: number;
  /** Rotation in radians. */
  rotation: number;
  /** Uniform draw width in pixels (height derived from asset aspect ratio unless scaleY given). */
  width: number;
  height: number;
  /** Optional non-uniform horizontal compression for perspective (1 = none, <1 = compressed). */
  scaleX: number;
  /** Optional non-uniform vertical compression for perspective (1 = none, <1 = compressed). */
  scaleY?: number;
  /** Opacity in [0,1], used for soft visibility transitions instead of hard show/hide (prevents pop-in/out). */
  opacity: number;
  /** Whether this transform should be drawn at all this frame. */
  visible: boolean;
  /** Draw order among simultaneously-worn items; higher draws later (on top). */
  renderOrder: number;
  /** Horizontal mirror flag (used for the "right side" of symmetric pairs, e.g. right earring). */
  flipX: boolean;
}

export type HeadPose = {
  /** Radians, positive = clockwise roll (head tilted to viewer's right). */
  roll: number;
  /** Normalized yaw estimate in [-1, 1], 0 = facing camera. */
  yaw: number;
  /** Normalized pitch estimate in [-1, 1], 0 = level, + = looking down. */
  pitch: number;
};

export interface FaceState {
  present: boolean;
  confidence: number;
  /** All 468 (or 478 w/ iris) landmarks in normalized [0,1] + relative z. */
  landmarks: Point3D[];
  pose: HeadPose;
  /** Face width in pixels at current frame resolution (outer eye corner to outer eye corner). */
  faceWidthPx: number;
  /** Eye-to-eye distance in pixels, used as a stable scale reference. */
  eyeDistancePx: number;
  center: Point2D;
  jaw: Point2D;
  neckAnchor: Point2D;
  leftEar: Point2D;
  rightEar: Point2D;
  foreheadCenter: Point2D;
  noseTip: Point2D;
  leftNostril: Point2D;
  rightNostril: Point2D;
}

export interface HandState {
  present: boolean;
  confidence: number;
  handedness: 'Left' | 'Right' | 'Unknown';
  landmarks: Point3D[];
  wrist: Point2D;
  /** Rough forearm/wrist orientation in radians (2D). */
  wristAngle: number;
  /** 3D Palm Normal vector. Points out from the palm. */
  palmNormal: Point3D;
  /** 3D Palm Center */
  palmCenter: Point3D;
  /** Per-finger metrics for ring placement. */
  fingers: Record<'thumb' | 'index' | 'middle' | 'ring' | 'pinky', FingerState>;
  palmWidthPx: number;
}

export interface FingerState {
  /** 3D Metacarpophalangeal Joint */
  mcp3D: Point3D;
  /** 3D Proximal Interphalangeal Joint */
  pip3D: Point3D;
  /** 3D Tip */
  tip3D: Point3D;
  
  /** 2D screen positions */
  mcp: Point2D;
  pip: Point2D;
  tip: Point2D;

  /** Width of the proximal phalange in pixels */
  widthPx: number;
  
  /** 2D angle on screen */
  angle: number;
  
  /** Angle of curl relative to MCP-PIP vector. High value = curled into fist. */
  curlAngle: number;
  
  /** True if the finger is deemed visible (not curled into palm or occluded by hand roll). */
  isVisible: boolean;
}

export interface WristState {
  present: boolean;
  handedness: 'Left' | 'Right' | 'Unknown';
  /** Center of the wrist joint */
  center: Point2D;
  /** Width of the wrist in pixels (inferred) */
  widthPx: number;
  /** 2D angle of the forearm on screen */
  forearmRotation: number;
  /** 3D vector representing the direction of the forearm (from elbow to wrist) */
  forearmDirection: Point3D;
  /** Rotation of the palm (matches HandState.palmNormal, helps orient rigid watches) */
  palmRotation: Point3D;
  /** Whether the wrist is considered visible (e.g. not occluded by body) */
  isVisible: boolean;
}

export interface BodyState {
  present: boolean;
  confidence: number;
  leftShoulder: Point2D;
  rightShoulder: Point2D;
  leftElbow?: Point2D;
  rightElbow?: Point2D;
  shoulderWidthPx: number;
  bodyRotation: number;
  chestCenter: Point2D;
}

export interface LightingEstimate {
  brightness: number; // 0-255 average luma
  contrast: number; // relative contrast factor
  warmth: number; // -1 (cool) .. 1 (warm)
  lightDirection?: Point2D; // Normalized directional vector of primary light source
}

/**
 * FrameState is the ONLY object passed between tracking, anchor computation,
 * and rendering layers. It contains fully processed, smoothed, pixel-space
 * data and never a reference to a MediaPipe result object.
 */
export interface FrameState {
  frameIndex: number;
  timestamp: number;
  width: number;
  height: number;
  face: FaceState | null;
  hands: HandState[];
  wrists: WristState[] | null;
  body: BodyState | null;
  lighting: LightingEstimate;
  neckMetrics?: NeckMetrics;
  pendantMetrics?: PendantMetrics;
  earringMetrics?: { left: EarringMetrics | null; right: EarringMetrics | null };
}

export const EMPTY_LIGHTING: LightingEstimate = { brightness: 180, contrast: 1, warmth: 0 };
