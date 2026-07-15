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

  const isDesignerNath = meta.id.startsWith("nosering-");
  const isTraditionalNath = meta.id === "traditional-maharashtrian-nath";
  
  // Anchor at the right nostril for traditional, left nostril for new designer naths.
  // Fall back to noseTip if not available.
  const anchor = isDesignerNath 
    ? (face.leftNostril ?? face.noseTip) 
    : (face.rightNostril ?? face.noseTip);

  let transform: Transform2D = {
    ...baseTransform(meta.renderOrder),
    x: anchor.x + offsetX + userAdjust.offsetX,
    y: anchor.y + offsetY + userAdjust.offsetY,
    rotation: face.pose.roll + meta.rotationOffset,
    width: drawWidth,
    height: drawHeight,
    scaleX,
  };

  if ((isTraditionalNath || isDesignerNath)) {
    const ear = isDesignerNath ? face.leftEar : face.rightEar;
    if (ear) {
      // Distance from nose to ear
      const dx = ear.x - anchor.x;
      const dy = ear.y - anchor.y;
      const dist = Math.hypot(dx, dy);

      // Make the chain length match the distance to the ear
      drawWidth = dist * userAdjust.scale * 1.05; // 5% slack
      drawHeight = drawWidth * (asset.image.naturalHeight / asset.image.naturalWidth);

      const angleToEar = Math.atan2(dy, dx);
      const centerOffsetDist = 0.45 * drawWidth;
      
      if (isDesignerNath) {
        // Designer naths have the ring on the RIGHT edge and chain on the LEFT edge.
        // Natural direction of the chain is pointing LEFT (angle Math.PI).
        transform.rotation = angleToEar - Math.PI; 
        
        // We want the ring (RIGHT edge) to be at the anchor.
        // The vector from the right edge to the center points in the direction of the chain (angleToEar).
        transform.x = anchor.x + Math.cos(angleToEar) * centerOffsetDist + offsetX + userAdjust.offsetX;
        transform.y = anchor.y + Math.sin(angleToEar) * centerOffsetDist + offsetY + userAdjust.offsetY;
      } else {
        // Traditional nath has the ring on the LEFT edge and chain on the RIGHT edge.
        transform.rotation = angleToEar;
        
        // We want the ring (LEFT edge) to be at the anchor.
        transform.x = anchor.x + Math.cos(angleToEar) * centerOffsetDist + offsetX + userAdjust.offsetX;
        transform.y = anchor.y + Math.sin(angleToEar) * centerOffsetDist + offsetY + userAdjust.offsetY;
      }
      
      transform.width = drawWidth;
      transform.height = drawHeight;
    }
  }

  transform = applyCalibration(meta, transform);
  return transform;
}
