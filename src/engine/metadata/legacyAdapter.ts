import {
  DEFAULT_CALIBRATION,
  DEFAULT_LIGHTING,
  DEFAULT_PERSPECTIVE,
  DEFAULT_TRACKING_REQUIREMENTS,
  JewelryCategory,
  JewelryMetadata,
} from './JewelryMetadata';

/** Shape of the original, pre-refactor per-product try-on metadata (kept for backward compatibility). */
export interface LegacyTryonMetadata {
  type: JewelryCategory;
  overlayImage: string;
  scale: number;
  offsetY: number;
  offsetX: number;
  rotationOffset?: number;
}

/**
 * Reference divisor used by the legacy necklace renderer (`offsetY * (faceWidth / 200)`).
 * We now apply the same convention uniformly across every category, rather than the
 * legacy code's inconsistent mix of "scaled" (necklace) vs. "raw pixel, ignores
 * distance-from-camera" (earrings/forehead/nose ring) offsets. Scaling every
 * anatomical offset by the current reference measurement is what actually
 * prevents jewelry from drifting off-position as a person moves closer to or
 * farther from the camera — a direct fix for the "floating" artifact called out
 * in the project brief.
 */
const LEGACY_OFFSET_DIVISOR = 200;

/**
 * Wraps a legacy metadata object into the full JewelryMetadata schema.
 * `offsetX/offsetY` become anatomical anchor offsets (scaled by the live
 * reference measurement every frame) instead of dead raw-pixel constants,
 * which improves accuracy while keeping every existing product's tuned
 * values meaningful without any data migration.
 */
/**
 * Pivot point (fraction of the asset's own bounding box) that the legacy
 * canvas renderer implicitly used per category — rings/bracelets were
 * always drawn centered on their anchor, nose rings top-left, everything
 * else centered horizontally / top-anchored vertically.
 */
const LEGACY_PIVOTS: Record<JewelryCategory, { x: number; y: number }> = {
  necklace: { x: 0.5, y: 0 },
  earrings: { x: 0.5, y: 0 },
  forehead: { x: 0.5, y: 0 },
  nose_ring: { x: 0.5, y: 0.5 },
  ring: { x: 0.5, y: 0.5 },
  bracelet: { x: 0.5, y: 0.5 },
  watch: { x: 0.5, y: 0.5 },
};

export function fromLegacy(id: string, legacy: LegacyTryonMetadata): JewelryMetadata {
  const category = legacy.type;
  return {
    id,
    category,
    subcategory: 'generic',
    image: legacy.overlayImage,
    anchors: {
      pivot: LEGACY_PIVOTS[category],
      offsetUnits: {
        x: legacy.offsetX / LEGACY_OFFSET_DIVISOR,
        y: legacy.offsetY / LEGACY_OFFSET_DIVISOR,
      },
    },
    defaultScale: legacy.scale,
    minScale: Math.max(0.05, legacy.scale * 0.5),
    maxScale: legacy.scale * 2.2,
    rotationOffset: legacy.rotationOffset ?? 0,
    perspectiveCompression: DEFAULT_PERSPECTIVE,
    lighting: DEFAULT_LIGHTING,
    reflection: false,
    renderOrder: defaultRenderOrder(category),
    qualityLevel: 'standard',
    trackingRequirements: DEFAULT_TRACKING_REQUIREMENTS[category],
    calibration: { ...DEFAULT_CALIBRATION },
  };
}

function defaultRenderOrder(category: JewelryCategory): number {
  switch (category) {
    case 'forehead':
      return 10;
    case 'necklace':
      return 20;
    case 'earrings':
      return 30;
    case 'nose_ring':
      return 40;
    case 'bracelet':
      return 50;
    case 'ring':
      return 60;
    default:
      return 0;
  }
}
