import { JewelryMetadata } from '../metadata/JewelryMetadata';
import { FrameState, Transform2D } from '../types';
import { applyCalibration, baseTransform, computePerspectiveScaleX, heightForWidth } from './common';
import { AssetBundle } from '../assets/AssetManager';
import { UserAdjust } from './UserAdjust';
import { EarEstimator } from '../tracking/EarEstimator';
import { OneEuroFilter } from '../smoothing/OneEuroFilter';

export interface EarringMetrics {
  swingAngle: number;
  visibility: number;
  attachmentError: number;
  velocity: number;
}

export interface EarringTransforms {
  left: Transform2D | null;
  right: Transform2D | null;
  metrics: { left: EarringMetrics | null; right: EarringMetrics | null };
}

interface PhysicsState {
  velocity: number;
  angle: number;
  lastParentX: number;
  lastParentY: number;
  filter: OneEuroFilter;
}

const leftPhysicsStates = new Map<string, PhysicsState>();
const rightPhysicsStates = new Map<string, PhysicsState>();

function getPhysicsState(id: string, side: 'left' | 'right'): PhysicsState {
  const map = side === 'left' ? leftPhysicsStates : rightPhysicsStates;
  if (!map.has(id)) {
    map.set(id, {
      velocity: 0,
      angle: 0,
      lastParentX: 0,
      lastParentY: 0,
      filter: new OneEuroFilter({ minCutoff: 1.0, beta: 0.05 }),
    });
  }
  return map.get(id)!;
}

export function computeEarringTransforms(
  meta: JewelryMetadata,
  frame: FrameState,
  asset: AssetBundle,
  userAdjust: UserAdjust
): EarringTransforms {
  const defaultReturn: EarringTransforms = { left: null, right: null, metrics: { left: null, right: null } };
  
  if (!asset.image.complete || asset.image.naturalWidth === 0) return defaultReturn;

  const earMetrics = EarEstimator.estimate(frame);
  if (!earMetrics) return defaultReturn;

  const spec = meta.earring;
  // Defaults if spec not provided
  const swingWeight = spec?.swingWeight ?? 0;
  const swingStiffness = 0.1;
  const damping = spec?.damping ?? 0.2;
  const maxSwing = spec?.maxSwing ?? 0.5;
  const startYaw = spec?.fadeCurve?.startYaw ?? 0.2;
  const endYaw = spec?.fadeCurve?.endYaw ?? 0.7;
  const attachPoint = spec?.attachmentPoint ?? { x: 0, y: 0 };
  const baseOffset = spec?.offset ?? { x: 0, y: 0 };
  const baseRotOffset = spec?.rotationOffset ?? 0;

  const tSec = frame.timestamp / 1000;
  // Earring size should be proportional to the ear lobe, not the whole face.
  // The ear height is approximately 22% of face width — that's the natural earring scale base.
  const earSizeBase = earMetrics.faceWidthPx * 0.22;
  const drawWidth = earSizeBase * meta.defaultScale * userAdjust.scale;
  const drawHeight = heightForWidth(drawWidth, asset.image.naturalWidth, asset.image.naturalHeight);
  const scaleX = computePerspectiveScaleX(meta, frame.face!.pose);

  const offsetX = (meta.anchors.offsetUnits.x + baseOffset.x) * earSizeBase;
  const offsetY = (meta.anchors.offsetUnits.y + baseOffset.y) * earSizeBase;

  // Custom fade logic
  // Yaw: + is looking left (right ear visible), - is looking right (left ear visible)
  const absYaw = Math.abs(earMetrics.headYaw);
  
  // If looking left (+yaw), left ear fades
  let leftVisibility = 1.0;
  if (earMetrics.headYaw > startYaw) {
    leftVisibility = 1 - Math.min(1, (earMetrics.headYaw - startYaw) / (endYaw - startYaw));
  }

  // If looking right (-yaw), right ear fades
  let rightVisibility = 1.0;
  if (earMetrics.headYaw < -startYaw) {
    rightVisibility = 1 - Math.min(1, (Math.abs(earMetrics.headYaw) - startYaw) / (endYaw - startYaw));
  }

  // Clamp
  leftVisibility = Math.max(0, Math.min(1, leftVisibility));
  rightVisibility = Math.max(0, Math.min(1, rightVisibility));

  // Compute Left Transform
  const leftT = computeSingleEarring(
    'left',
    earMetrics.leftEar,
    leftVisibility,
    earMetrics,
    meta,
    swingWeight,
    swingStiffness,
    damping,
    maxSwing,
    tSec,
    drawWidth,
    drawHeight,
    scaleX,
    offsetX,
    offsetY,
    baseRotOffset,
    userAdjust
  );

  // Compute Right Transform
  const rightT = computeSingleEarring(
    'right',
    earMetrics.rightEar,
    rightVisibility,
    earMetrics,
    meta,
    swingWeight,
    swingStiffness,
    damping,
    maxSwing,
    tSec,
    drawWidth,
    drawHeight,
    scaleX,
    offsetX,
    offsetY,
    baseRotOffset,
    userAdjust
  );

  return {
    left: leftT.transform,
    right: rightT.transform,
    metrics: { left: leftT.metrics, right: rightT.metrics }
  };
}

function computeSingleEarring(
  side: 'left' | 'right',
  anchorPt: { x: number; y: number },
  visibility: number,
  earMetrics: ReturnType<typeof EarEstimator.estimate>,
  meta: JewelryMetadata,
  swingWeight: number,
  swingStiffness: number,
  damping: number,
  maxSwing: number,
  tSec: number,
  drawWidth: number,
  drawHeight: number,
  scaleX: number,
  offsetX: number,
  offsetY: number,
  baseRotOffset: number,
  userAdjust: UserAdjust
): { transform: Transform2D | null; metrics: EarringMetrics | null } {
  if (visibility < 0.02) return { transform: null, metrics: null };

  const state = getPhysicsState(meta.id, side);

  // Drive physics with anchor movement
  let deltaX = 0;
  if (state.lastParentX !== 0 && state.lastParentY !== 0) {
    deltaX = anchorPt.x - state.lastParentX;
  }
  state.lastParentX = anchorPt.x;
  state.lastParentY = anchorPt.y;

  let smoothedAngle = 0;

  if (swingWeight > 0) {
    const maxDelta = 30; // clamp lateral movement
    const clampedDeltaX = Math.max(-maxDelta, Math.min(maxDelta, deltaX));
    const acceleration = (clampedDeltaX * 0.01) * swingWeight * (1 - damping);

    state.velocity += acceleration;
    state.velocity -= state.angle * swingStiffness; // spring
    state.velocity *= (1 - damping);
    state.angle += state.velocity;
    state.angle = Math.max(-maxSwing, Math.min(maxSwing, state.angle));

    state.filter.updateParams({ minCutoff: earMetrics!.trackingQuality < 0.5 ? 0.1 : 1.0, beta: 0.05 });
    smoothedAngle = state.filter.filter(state.angle, tSec);
  } else {
    state.velocity = 0;
    state.angle = 0;
    state.filter.reset();
  }

  // Final rotation incorporates head roll and local swing
  const finalRotation = earMetrics!.headRoll + baseRotOffset + smoothedAngle;

  let transform: Transform2D = {
    ...baseTransform(meta.renderOrder),
    x: anchorPt.x + offsetX + userAdjust.offsetX,
    y: anchorPt.y + offsetY + userAdjust.offsetY,
    rotation: finalRotation,
    width: drawWidth,
    height: drawHeight,
    scaleX,
    opacity: visibility,
    visible: true,
    flipX: side === 'right' // right earring is mirrored
  };

  transform = applyCalibration(meta, transform);

  const metrics: EarringMetrics = {
    swingAngle: smoothedAngle,
    visibility,
    attachmentError: 0,
    velocity: state.velocity
  };

  return { transform, metrics };
}
