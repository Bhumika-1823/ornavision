import { JewelryMetadata } from "../metadata/JewelryMetadata";
import { FrameState, Transform2D } from "../types";
import {
  applyCalibration,
  baseTransform,
  computePerspectiveScaleX,
  heightForWidth,
} from "./common";
import { AssetBundle } from "../assets/AssetManager";
import { UserAdjust } from "./UserAdjust";

export function computeNoseRingTransform(
  meta: JewelryMetadata,
  frame: FrameState,
  asset: AssetBundle,
  userAdjust: UserAdjust,
): Transform2D | null {
  const { face } = frame;
  if (!face) return null;
  if (!asset.image.complete || asset.image.naturalWidth === 0) return null;

  // Nose pin scale should be relative to nose width, not full face width.
  // Eye distance × 0.35 gives a good approximation of nose width.
  const noseWidth = face.eyeDistancePx * 0.35;
  let drawWidth = noseWidth * meta.defaultScale * userAdjust.scale;
  let drawHeight = heightForWidth(
    drawWidth,
    asset.image.naturalWidth,
    asset.image.naturalHeight,
  );
  const scaleX = computePerspectiveScaleX(meta, face.pose);

  const offsetX = meta.anchors.offsetUnits.x * noseWidth;
  const offsetY = meta.anchors.offsetUnits.y * noseWidth;

  // Anchor at the right nostril (traditional Indian nose pin side).
  // Fall back to noseTip if rightNostril is not available.
  const anchor = face.rightNostril ?? face.noseTip;

  let transform: Transform2D = {
    ...baseTransform(meta.renderOrder),
    x: anchor.x + offsetX + userAdjust.offsetX,
    y: anchor.y + offsetY + userAdjust.offsetY,
    rotation: face.pose.roll + meta.rotationOffset,
    width: drawWidth,
    height: drawHeight,
    scaleX,
  };

  if (meta.id === "traditional-maharashtrian-nath" && face.rightEar) {
    // Distance from nose to ear
    const dx = face.rightEar.x - anchor.x;
    const dy = face.rightEar.y - anchor.y;
    const dist = Math.hypot(dx, dy);

    // Make the chain length (which is the width of the image) match the distance to the ear
    drawWidth = dist * userAdjust.scale * 1.05; // 5% slack
    drawHeight =
      drawWidth * (asset.image.naturalHeight / asset.image.naturalWidth);

    // The image has the ring on the left and chain pointing right.
    // We want the rightward chain to point to the ear.
    const angleToEar = Math.atan2(dy, dx);
    transform.rotation = angleToEar;
    transform.width = drawWidth;
    transform.height = drawHeight;

    // CanvasRenderer uses pivot {0.5, 0.5}, drawing the image centered at (x,y).
    // We want the ring (left edge, x=0 or roughly 5% in) to be at the anchor.
    // The vector from the ring to the center is (drawWidth * 0.45) in the direction of the ear.
    const centerOffsetDist = 0.45 * drawWidth;
    transform.x =
      anchor.x +
      Math.cos(angleToEar) * centerOffsetDist +
      offsetX +
      userAdjust.offsetX;
    transform.y =
      anchor.y +
      Math.sin(angleToEar) * centerOffsetDist +
      offsetY +
      userAdjust.offsetY;
  }

  transform = applyCalibration(meta, transform);
  return transform;
}
