import { JewelryMetadata } from "../metadata/JewelryMetadata";
import { FrameState, WristState, Transform2D } from "../types";
import { applyCalibration, baseTransform, heightForWidth } from "./common";
import { AssetBundle } from "../assets/AssetManager";
import { UserAdjust } from "./UserAdjust";

function pickWrist(
  wrists: WristState[],
  preferred?: "Left" | "Right" | "any",
): WristState | null {
  if (wrists.length === 0) return null;
  if (!preferred || preferred === "any") return wrists[0];
  return wrists.find((w) => w.handedness === preferred) ?? wrists[0];
}

/**
 * Bracelets/bangles/cuffs/watches anchor to the wrist and orient along the
 * forearm angle (wrist → mid-palm direction), so the band sits
 * perpendicular to the arm the way a real bracelet does even as the wrist
 * rotates.
 */
export function computeBraceletTransform(
  meta: JewelryMetadata,
  frame: FrameState,
  asset: AssetBundle,
  userAdjust: UserAdjust,
): Transform2D | null {
  if (!frame.wrists) return null;
  const wrist = pickWrist(frame.wrists, meta.preferredHand);
  if (!wrist || !wrist.isVisible) return null;
  if (!asset.image.complete || asset.image.naturalWidth === 0) return null;

  const spec = meta.braceletSpec || {
    physicsProfile: "rigid",
    wristOffsetUnits: 0,
  };
  const drawWidth = wrist.widthPx * meta.defaultScale * userAdjust.scale;
  const drawHeight = heightForWidth(
    drawWidth,
    asset.image.naturalWidth,
    asset.image.naturalHeight,
  );

  // Base placement: Wrist center
  let x = wrist.center.x;
  let y = wrist.center.y;
  let rotation = wrist.forearmRotation + meta.rotationOffset;

  // Apply wrist offset up/down the arm (e.g. wearing multiple bracelets, or watch sits higher)
  // forearmRotation points from wrist to elbow. To move up the arm, we add to it.
  const totalOffsetUnits =
    (spec.wristOffsetUnits || 0) + meta.anchors.offsetUnits.y;
  if (totalOffsetUnits) {
    const offsetPx = totalOffsetUnits * wrist.widthPx;
    x += Math.cos(wrist.forearmRotation) * offsetPx;
    y += Math.sin(wrist.forearmRotation) * offsetPx;
  }

  // Physics Profiles
  if (spec.physicsProfile === "bangle") {
    // Bangles hang down slightly due to gravity if the arm is raised.
    // Gravity is +Y in 2D space.
    // We add a slight Y offset and let it rotate freely.
    // For simplicity, we just add a small Y offset based on width.
    y += wrist.widthPx * 0.15;

    // Slight rotation decoupling to simulate looseness
    rotation = rotation * 0.9 + 0; // Bias slightly towards 0 (horizontal)
  } else if (spec.physicsProfile === "rigid") {
    // Watches and rigid cuffs map exactly to forearm and palm roll
    // If Palm roll indicates it's facing away, we might want to hide the watch dial?
    // Actually, watches stay on the top of the wrist.
    // For now, rigid means strict adherence to forearm.
  }

  // Perspective Compression
  // If the forearm is pointing heavily towards/away from the camera,
  // the Z component of forearmDirection will be large.
  // When Z is large, the forearm is foreshortened visually.
  // Bracelets/watches wrap AROUND the arm, so if the arm points towards the camera,
  // the bracelet should appear perfectly circular (scaleY = 1.0).
  // If the arm is parallel to the camera (Z=0), the bracelet is viewed edge-on (scaleY compressed).

  // Actually, wait:
  // Arm parallel to image plane (Z=0) -> Bracelet is viewed edge-on -> it should be heavily compressed (scaleY = 0.2).
  // Arm pointing at camera (abs(Z)=1) -> Bracelet is viewed face-on -> it should be circular (scaleY = 1.0).
  // Let's implement this!
  let scaleY = 1.0;
  let scaleX = 1.0;
  const z = Math.abs(wrist.forearmDirection.z);
  // Interpolate between edge-on (0.2) and face-on (1.0)
  const squeeze = 0.2 + 0.8 * z;

  // If the asset is rotated by 90 degrees (Math.PI/2), the X and Y axes relative
  // to the arm are swapped. We must squeeze the axis that crosses the arm.
  if (Math.abs(Math.abs(meta.rotationOffset) - Math.PI / 2) < 0.1) {
    scaleX = squeeze; // Squeeze the watch face (across the arm)
    scaleY = 1.0; // Keep the watch strap length normal (along the arm)
  } else {
    scaleX = 1.0;
    scaleY = squeeze;
  }

  let transform: Transform2D = {
    ...baseTransform(meta.renderOrder),
    x: x + userAdjust.offsetX,
    y: y + userAdjust.offsetY,
    rotation: rotation,
    width: drawWidth,
    height: drawHeight,
    scaleX,
    scaleY,
  };

  transform = applyCalibration(meta, transform);
  return transform;
}
