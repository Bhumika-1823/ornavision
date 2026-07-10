import { JewelryMetadata } from '../metadata/JewelryMetadata';
import { FrameState, HandState, Transform2D } from '../types';
import { applyCalibration, baseTransform, heightForWidth } from './common';
import { AssetBundle } from '../assets/AssetManager';
import { UserAdjust } from './UserAdjust';

function pickHand(hands: HandState[], preferred?: 'Left' | 'Right' | 'any'): HandState | null {
  if (hands.length === 0) return null;
  if (!preferred || preferred === 'any') return hands[0];
  return hands.find((h) => h.handedness === preferred) ?? hands[0];
}

/**
 * Ring placement tracks the chosen finger's MCP→PIP segment directly (not a
 * fixed hand-relative offset), so the ring rotates and scales with the
 * actual finger regardless of hand orientation, and multiple simultaneously
 * worn rings (future: different fingers) each get their own accurate anchor.
 */
export function computeRingTransform(
  meta: JewelryMetadata,
  frame: FrameState,
  asset: AssetBundle,
  userAdjust: UserAdjust
): Transform2D | null {
  const hand = pickHand(frame.hands, meta.preferredHand);
  if (!hand) return null;
  if (!asset.image.complete || asset.image.naturalWidth === 0) return null;

  const fingerName = meta.ringFinger ?? 'ring';
  const finger = hand.fingers[fingerName];

  const drawWidth = finger.widthPx * 0.95 * meta.defaultScale * userAdjust.scale;
  const drawHeight = heightForWidth(drawWidth, asset.image.naturalWidth, asset.image.naturalHeight);

  const midX = (finger.mcp.x + finger.pip.x) / 2;
  const midY = (finger.mcp.y + finger.pip.y) / 2;

  // Perspective Compression: As the finger pitches (points towards/away from camera),
  // the proximal phalange becomes shorter in 2D space.
  const phalangeLengthPx = Math.hypot(finger.pip.x - finger.mcp.x, finger.pip.y - finger.mcp.y);
  const expectedPhalangeLengthPx = finger.widthPx * 1.5; // Roughly 1.5x width
  
  let scaleY = 1.0;
  if (phalangeLengthPx < expectedPhalangeLengthPx) {
    const ratio = Math.max(0.2, phalangeLengthPx / expectedPhalangeLengthPx);
    scaleY = ratio;
  }

  let transform: Transform2D = {
    ...baseTransform(meta.renderOrder),
    x: midX + userAdjust.offsetX,
    y: midY + userAdjust.offsetY,
    rotation: finger.angle + meta.rotationOffset,
    width: drawWidth,
    height: drawHeight,
    scaleX: 1,
    scaleY: scaleY,
    opacity: finger.isVisible ? 1 : 0
  };

  transform = applyCalibration(meta, transform);
  return transform;
}
