import { JewelryMetadata, PendantSpec } from '../metadata/JewelryMetadata';
import { FrameState, Transform2D } from '../types';
import { OneEuroFilter } from '../smoothing/OneEuroFilter';

export interface PendantMetrics {
  swingAngle: number;
  velocity: number;
  attachmentError: number;
}

interface PhysicsState {
  velocity: number;
  angle: number;
  lastParentX: number;
  lastParentY: number;
  filter: OneEuroFilter;
}

const physicsStates = new Map<string, PhysicsState>();

function getPhysicsState(id: string): PhysicsState {
  if (!physicsStates.has(id)) {
    physicsStates.set(id, {
      velocity: 0,
      angle: 0,
      lastParentX: 0,
      lastParentY: 0,
      filter: new OneEuroFilter({ minCutoff: 1.0, beta: 0.05 }),
    });
  }
  return physicsStates.get(id)!;
}

/**
 * PendantEngine acts as a hierarchical child to the Necklace Engine.
 * It inherits the parent's base transform (position, scale, perspective)
 * and applies local offsets, gravity, and a damped harmonic oscillator for swing.
 */
export class PendantEngine {
  static compute(
    parentTransform: Transform2D,
    meta: JewelryMetadata,
    frame: FrameState
  ): { transform: Transform2D; metrics: PendantMetrics } {
    const spec = meta.pendant!;
    const state = getPhysicsState(meta.id);
    const tSec = frame.timestamp / 1000;

    // 1. Hierarchical offset: Attach to the parent's center
    // Parent transform already includes user offset and scale.
    // The attachment point is offset relative to the parent's scale.
    const attachX = parentTransform.x + spec.attachmentPoint.x * parentTransform.width;
    const attachY = parentTransform.y + spec.attachmentPoint.y * parentTransform.height;

    // 2. Compute physics (Harmonic Oscillator for Swing)
    // Calculate parent's movement delta to drive the swing
    let deltaX = 0;
    if (state.lastParentX !== 0 && state.lastParentY !== 0) {
      deltaX = attachX - state.lastParentX;
    }
    state.lastParentX = attachX;
    state.lastParentY = attachY;

    // Acceleration driven by lateral movement of the attachment point
    // We dampen the delta so it doesn't cause explosions on tracking jumps
    const maxDelta = 50 * parentTransform.scaleX; // Clamp delta
    const clampedDeltaX = Math.max(-maxDelta, Math.min(maxDelta, deltaX));
    
    const acceleration = (clampedDeltaX * 0.005) * (1 - spec.damping);

    // Apply physics
    state.velocity += acceleration;
    
    // Apply spring stiffness (pulls back to 0)
    state.velocity -= state.angle * spec.swingStiffness;
    
    // Apply damping
    state.velocity *= (1 - spec.damping);

    // Update angle
    state.angle += state.velocity;

    // Clamp angle to max swing
    state.angle = Math.max(-spec.maxSwing, Math.min(spec.maxSwing, state.angle));

    // Smooth the angle with OneEuro filter to prevent micro-jitters
    // Adjust cutoff based on tracking quality
    const quality = frame.neckMetrics?.trackingQuality ?? 1.0;
    state.filter.updateParams({ minCutoff: quality < 0.5 ? 0.1 : 1.0, beta: 0.05 });
    const smoothedAngle = state.filter.filter(state.angle, tSec);

    // 3. Gravity
    // Gravity pulls downwards. We blend the smoothed swing angle with body rotation (gravity influence).
    const bodyRot = frame.neckMetrics?.bodyRotation ?? 0;
    
    // Gravity vector pulls toward 0 (straight down in screen space), counteracting body rotation.
    // If body rotates left (-), gravity should pull right (+) locally.
    const gravityPull = -bodyRot * spec.gravityWeight;
    
    const finalLocalRotation = smoothedAngle + gravityPull + spec.rotationOffset;

    // 4. Calculate Final Transform
    // Apply chain and center offsets, rotated by the final local rotation.
    const totalOffsetX = (spec.chainOffset.x + spec.centerOffset.x) * parentTransform.width;
    const totalOffsetY = (spec.chainOffset.y + spec.centerOffset.y) * parentTransform.height;

    // Rotate offset around attachment point
    const cosR = Math.cos(finalLocalRotation);
    const sinR = Math.sin(finalLocalRotation);
    
    const rotatedOffsetX = totalOffsetX * cosR - totalOffsetY * sinR;
    const rotatedOffsetY = totalOffsetX * sinR + totalOffsetY * cosR;

    const finalX = attachX + rotatedOffsetX;
    const finalY = attachY + rotatedOffsetY;

    // The pendant inherits the parent's scale and perspective
    // Note: Shadow offset is passed back via side channels or standard draw, 
    // but here we just produce the transform.
    
    // Attachment Error is 0 mathematically because we strictly derive from attachX/Y.
    // If we were using IK or constraint solving, error would be > 0.
    const metrics: PendantMetrics = {
      swingAngle: smoothedAngle,
      velocity: state.velocity,
      attachmentError: 0 
    };

    const transform: Transform2D = {
      ...parentTransform, // Inherit render order, visibility
      x: finalX,
      y: finalY,
      rotation: parentTransform.rotation + finalLocalRotation, // Parent rotation + Local rotation
    };

    return { transform, metrics };
  }
}
