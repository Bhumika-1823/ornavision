import { JewelryMetadata } from '../metadata/JewelryMetadata';
import { FrameState, Transform2D } from '../types';
import { applyCalibration, baseTransform, clamp, computePerspectiveScaleX, heightForWidth } from './common';
import { AssetBundle } from '../assets/AssetManager';
import { UserAdjust } from './UserAdjust';
import { OneEuroPointFilter, OneEuroFilter } from '../smoothing/OneEuroFilter';
import { NeckMetrics } from '../tracking/NeckEstimator';

interface FilterState {
  pointFilter: OneEuroPointFilter;
  rotationFilter: OneEuroFilter;
  scaleFilter: OneEuroFilter;
}

const filterStates = new Map<string, FilterState>();

function getFilterState(id: string): FilterState {
  if (!filterStates.has(id)) {
    filterStates.set(id, {
      pointFilter: new OneEuroPointFilter({ minCutoff: 1.5, beta: 0.05 }),
      rotationFilter: new OneEuroFilter({ minCutoff: 1.5, beta: 0.05 }),
      scaleFilter: new OneEuroFilter({ minCutoff: 1.0, beta: 0.01 })
    });
  }
  return filterStates.get(id)!;
}

function updateFilterParams(filters: FilterState, quality: number) {
  // If tracking quality is low (e.g. occlusion or fast movement), we drop the cutoff 
  // to aggressively smooth and prevent jitter or snapping.
  const isPoor = quality < 0.5;
  const cutoff = isPoor ? 0.5 : 1.5;
  const beta = isPoor ? 0.02 : 0.05;

  filters.pointFilter.updateParams({ minCutoff: cutoff, beta });
  filters.rotationFilter.updateParams({ minCutoff: cutoff, beta });
  filters.scaleFilter.updateParams({ minCutoff: cutoff, beta: beta * 0.5 });
}

export function computeNecklaceTransform(
  meta: JewelryMetadata,
  frame: FrameState,
  asset: AssetBundle,
  userAdjust: UserAdjust
): Transform2D | null {
  const { face, neckMetrics } = frame;
  if (!face || !neckMetrics) return null;
  if (!asset.image.complete || asset.image.naturalWidth === 0) return null;

  const filters = getFilterState(meta.id);
  updateFilterParams(filters, neckMetrics.trackingQuality);

  const tSec = frame.timestamp / 1000;
  
  // Base raw calculations
  let rawAnchorX = neckMetrics.neckCenter.x;
  let rawAnchorY = neckMetrics.neckCenter.y;
  let rawRotation = neckMetrics.neckAngle;
  let rawScale = neckMetrics.neckWidthPx;

  // Utilize NecklaceSpec if provided, else fallback to standard defaults based on subcategory
  const tension = meta.necklace?.curveTension ?? 1.0;
  const scaleWeights = meta.necklace?.scaleWeights ?? { neck: 0.7, shoulder: 0.3 };
  const dropUnits = meta.necklace?.pendantDropUnits ?? 0;

  if (meta.subcategory === 'choker') {
    // Chokers stick tightly to the neck width
    rawAnchorX = neckMetrics.neckCenter.x;
    rawAnchorY = neckMetrics.neckCenter.y;
    rawRotation = neckMetrics.neckAngle;
    rawScale = neckMetrics.neckWidthPx * 1.1; // Chokers scale primarily by neck
  } 
  else if (meta.subcategory === 'long_chain' || meta.subcategory === 'layered_necklace') {
    // Hangs freely, anchored closer to the chest
    const depthW = neckMetrics.shoulderWidthPx || neckMetrics.neckWidthPx * 3;
    rawAnchorX = neckMetrics.chestCenter.x;
    rawAnchorY = neckMetrics.chestCenter.y - (depthW * 0.15) + (dropUnits * depthW);
    rawRotation = neckMetrics.bodyRotation; // Freely hangs on chest, unaffected by head tilt
    rawScale = neckMetrics.neckWidthPx * scaleWeights.neck + (depthW * scaleWeights.shoulder);
  }
  else if (meta.subcategory === 'bridal_necklace') {
    // Covers neck to chest
    const depthW = neckMetrics.shoulderWidthPx || neckMetrics.neckWidthPx * 3;
    rawAnchorX = neckMetrics.chestCenter.x * 0.5 + neckMetrics.neckCenter.x * 0.5;
    rawAnchorY = neckMetrics.neckCenter.y + (neckMetrics.chestCenter.y - neckMetrics.neckCenter.y) * 0.4;
    rawRotation = neckMetrics.neckAngle * 0.2 + neckMetrics.bodyRotation * 0.8;
    rawScale = neckMetrics.neckWidthPx * 0.4 + depthW * 0.6;
  }
  else { 
    // standard or generic — anchor at neck center, scale by neck width
    rawAnchorX = neckMetrics.neckCenter.x;
    rawAnchorY = neckMetrics.neckCenter.y;
    rawRotation = neckMetrics.neckAngle;
    rawScale = neckMetrics.neckWidthPx * 1.3;
  }

  // Smooth the raw targets to eliminate drift/jitter
  const smoothedPt = filters.pointFilter.filter(rawAnchorX, rawAnchorY, 0, tSec);
  const smoothedRot = filters.rotationFilter.filter(rawRotation, tSec);
  const smoothedScale = filters.scaleFilter.filter(rawScale, tSec);

  const drawWidth = smoothedScale * meta.defaultScale * userAdjust.scale;
  const drawHeight = heightForWidth(drawWidth, asset.image.naturalWidth, asset.image.naturalHeight);

  // Advanced perspective based on tracking symmetries and relative yaw
  // NeckRotation is 3D yaw. Body rotation is 2D tilt. We need a 3D body yaw estimate to see if neck is turned relative to chest.
  // We use shoulder symmetry as a proxy for body yaw.
  const relativeYaw = neckMetrics.neckRotation * neckMetrics.shoulderSymmetry;
  
  // Perspective rules: compress horizontal scale based on relative yaw
  const pYawFactor = meta.perspectiveCompression?.yawFactor ?? 0.25;
  const pMax = meta.perspectiveCompression?.maxCompression ?? 0.45;
  
  // For long chains hanging on the body, head yaw matters less than shoulder symmetry.
  const isChestAnchored = meta.subcategory === 'long_chain' || meta.subcategory === 'layered_necklace';
  let perspectiveScaleX = 1.0;
  
  if (isChestAnchored) {
    // If anchored to chest, perspective strictly follows shoulder symmetry
    perspectiveScaleX = Math.max(pMax, neckMetrics.shoulderSymmetry);
  } else {
    // If anchored to neck, it follows the neck's rotation
    perspectiveScaleX = Math.max(pMax, 1.0 - (Math.abs(relativeYaw) * pYawFactor));
  }

  // Offset shift from metadata
  const anchorOffsetY = meta.anchors.offsetUnits.y * smoothedScale;
  const anchorOffsetX = meta.anchors.offsetUnits.x * smoothedScale;

  let transform: Transform2D = {
    ...baseTransform(meta.renderOrder),
    x: smoothedPt.x + anchorOffsetX + userAdjust.offsetX,
    y: smoothedPt.y + anchorOffsetY + userAdjust.offsetY,
    rotation: smoothedRot + meta.rotationOffset,
    width: clamp(drawWidth, 1, drawWidth),
    height: drawHeight,
    scaleX: perspectiveScaleX,
  };

  transform = applyCalibration(meta, transform);
  return transform;
}
