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

export function computeForeheadTransform(
  meta: JewelryMetadata,
  frame: FrameState,
  asset: AssetBundle,
  userAdjust: UserAdjust,
): Transform2D | null {
  const { face } = frame;
  if (!face) return null;
  if (!asset.image.complete || asset.image.naturalWidth === 0) return null;

  const drawWidth = face.faceWidthPx * meta.defaultScale * userAdjust.scale;
  const drawHeight = heightForWidth(
    drawWidth,
    asset.image.naturalWidth,
    asset.image.naturalHeight,
  );
  const scaleX = computePerspectiveScaleX(meta, face.pose);

  const offsetX = meta.anchors.offsetUnits.x * face.faceWidthPx;
  const offsetY = meta.anchors.offsetUnits.y * face.faceWidthPx;

  let transform: Transform2D = {
    ...baseTransform(meta.renderOrder),
    x: face.foreheadCenter.x + offsetX + userAdjust.offsetX,
    y: face.foreheadCenter.y - drawHeight * 0.3 + offsetY + userAdjust.offsetY,
    rotation: face.pose.roll + meta.rotationOffset,
    width: drawWidth,
    height: drawHeight,
    scaleX,
  };

  transform = applyCalibration(meta, transform);
  return transform;
}
