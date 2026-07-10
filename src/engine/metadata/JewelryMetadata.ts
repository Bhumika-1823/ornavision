/**
 * engine/metadata/JewelryMetadata.ts
 *
 * The full metadata schema every jewelry product must satisfy. Nothing
 * about how a piece is placed, scaled, rotated, lit, or rendered should
 * ever live in component/engine code — it all comes from here so the
 * catalog can scale to thousands of products without touching TypeScript.
 */

export type JewelryCategory =
  | "necklace"
  | "earrings"
  | "ring"
  | "bracelet"
  | "watch"
  | "forehead"
  | "nose_ring";

export type JewelrySubcategory =
  | "choker"
  | "bridal_necklace"
  | "long_chain"
  | "pendant"
  | "layered_necklace"
  | "stud"
  | "hoop"
  | "dangler"
  | "jhumka"
  | "long_earring"
  | "band"
  | "statement_ring"
  | "bangle"
  | "cuff"
  | "watch"
  | "maang_tikka"
  | "nath"
  | "nose_stud"
  | "generic";

export type QualityLevel = "draft" | "standard" | "premium";

export interface AnchorSpec {
  /** Fraction (0-1) of the asset's own bounding box used as the pivot point when rotating/scaling. */
  pivot: { x: number; y: number };
  /** Additional vertical offset, expressed in units of reference-scale (e.g. face width), not raw px. */
  offsetUnits: { x: number; y: number };
}

export interface PerspectiveCompressionSpec {
  /** How much horizontal squeeze to apply per unit of yaw (0 = none, 1 = full profile compression). */
  yawFactor: number;
  /** How much vertical compression to apply per unit of pitch. */
  pitchFactor: number;
  /** Max compression clamp so assets never invert or vanish. */
  maxCompression: number;
}

export interface LightingSpec {
  /** How strongly ambient brightness affects the rendered overlay (0 = ignore, 1 = full match). */
  brightnessResponse: number;
  contrastResponse: number;
  /** Whether this asset has a reflective/metallic surface that should pick up a highlight. */
  reflective: boolean;
}

export interface CalibrationSpec {
  /** Per-product fine-tune multiplier layered on top of defaultScale, set via a future calibration UI. */
  scaleCorrection: number;
  rotationCorrectionRad: number;
  offsetCorrection: { x: number; y: number };
}

export interface TrackingRequirements {
  face: boolean;
  hands: boolean;
  body: boolean;
}

export interface ShadowSpec {
  opacity: number;
  blur: number;
  offsetX: number;
  offsetY: number;
  color: string;
}

export interface ReflectionSpec {
  mode: "gold" | "silver" | "diamond" | "pearl" | "gem";
  intensity: number;
  color?: string; // Optional custom tint for highlights
}

export interface PostProcessSpec {
  bloom?: number; // 0-1 intensity
  sharpen?: boolean;
  gamma?: number; // >1 brightens midtones, <1 darkens
}

export interface PendantSpec {
  /** Pendant length in units of reference-scale (e.g. face width). */
  pendantLength: number;
  /** Where the pendant attaches to the necklace (relative to necklace center). */
  attachmentPoint: { x: number; y: number };
  /** Offset for the chain. */
  chainOffset: { x: number; y: number };
  /** Local center offset for the pendant body. */
  centerOffset: { x: number; y: number };
  /** Local rotation offset in radians. */
  rotationOffset: number;

  /** Weight factor for gravity simulation. */
  gravityWeight: number;
  /** Spring stiffness for harmonic swing simulation. */
  swingStiffness: number;
  /** Damping factor to prevent infinite oscillation (0-1). */
  damping: number;
  /** Maximum swing angle in radians. */
  maxSwing: number;

  /** Dynamic shadow offset for the pendant body. */
  shadowOffset?: { x: number; y: number };
}

export interface EarringSpec {
  /** Where the earring attaches relative to the ear lobe center (in units of reference scale). */
  attachmentPoint: { x: number; y: number };
  /** General display offset. */
  offset: { x: number; y: number };
  /** Local rotation offset in radians. */
  rotationOffset: number;

  /** Weight for gravity simulation. 0 means rigid stud. >0 means heavy/swinging earring. */
  swingWeight: number;
  /** Damping factor for swing simulation (0-1). */
  damping: number;
  /** Max swing angle in radians. */
  maxSwing: number;

  /** Fade curve based on yaw.
   * startYaw: Earring is fully visible.
   * endYaw: Earring is fully hidden/faded. */
  fadeCurve: { startYaw: number; endYaw: number };

  /** Shadow offset (if any). */
  shadowOffset?: { x: number; y: number };
}

export interface NecklaceSpec {
  /** How tightly it hugs the neck vs. dropping loosely. */
  curveTension: number;
  /** Ratios determining how much scaling relies on neck width vs. shoulder width. */
  scaleWeights: { neck: number; shoulder: number };
  /** Configurable drop for pendants in units of neckline-to-chest span. */
  pendantDropUnits?: number;
  /** Dynamic shadow casting coordinates offset in pixels per depth unit. */
  shadowOffset?: { x: number; y: number };
}

export interface BraceletSpec {
  /** 'rigid' = snaps firmly to forearm rotation (watches). 'bangle' = swings slightly with gravity. */
  physicsProfile: "rigid" | "bangle" | "tennis";
  /** Offset along the forearm from the wrist joint (in units of wrist width). Positive = up the arm. */
  wristOffsetUnits?: number;
}

/**
 * The canonical, fully-specified metadata for one try-on-capable jewelry
 * asset. `MetadataLoader` produces these from product data (migrating
 * legacy shorthand if needed), `MetadataValidator` checks them, and
 * `MetadataCache` memoizes them.
 */
export interface JewelryMetadata {
  id: string;
  category: JewelryCategory;
  subcategory: JewelrySubcategory;

  image: string;
  mask?: string;
  shadow?: string;
  thumbnail?: string;

  anchors: AnchorSpec;

  defaultScale: number;
  minScale: number;
  maxScale: number;

  /** Static rotation offset (radians) applied on top of tracked rotation, for assets drawn off-axis. */
  rotationOffset: number;

  perspectiveCompression: PerspectiveCompressionSpec;
  lighting: LightingSpec;

  shadowSpec?: ShadowSpec;
  reflectionSpec?: ReflectionSpec;
  postProcess?: PostProcessSpec;

  reflection: boolean; // Legacy flag, keep for backwards compatibility

  /** Draw order among simultaneously worn items. Higher = drawn later / on top. */
  renderOrder: number;
  qualityLevel: QualityLevel;
  trackingRequirements: TrackingRequirements;

  calibration: CalibrationSpec;
  pendant?: PendantSpec;
  necklace?: NecklaceSpec;
  earring?: EarringSpec;
  braceletSpec?: BraceletSpec;

  /** Which finger a ring is worn on. Defaults to 'ring' (matches legacy behavior). Rings only. */
  ringFinger?: "thumb" | "index" | "middle" | "ring" | "pinky";
  /** Which hand a ring/bracelet should render on when both hands are tracked: 'left' | 'right' | 'any' (first detected). */
  preferredHand?: "Left" | "Right" | "any";
}

export const DEFAULT_ANCHORS: Record<JewelryCategory, AnchorSpec> = {
  necklace: { pivot: { x: 0.5, y: 0 }, offsetUnits: { x: 0, y: 0.55 } },
  earrings: { pivot: { x: 0.5, y: 0 }, offsetUnits: { x: 0, y: 0.12 } },
  ring: { pivot: { x: 0.5, y: 0.5 }, offsetUnits: { x: 0, y: 0 } },
  bracelet: { pivot: { x: 0.5, y: 0.5 }, offsetUnits: { x: 0, y: 0 } },
  watch: { pivot: { x: 0.5, y: 0.5 }, offsetUnits: { x: 0, y: 0 } },
  forehead: { pivot: { x: 0.5, y: 1 }, offsetUnits: { x: 0, y: -0.15 } },
  nose_ring: { pivot: { x: 0.5, y: 0.5 }, offsetUnits: { x: -0.03, y: 0.02 } },
};

export const DEFAULT_PERSPECTIVE: PerspectiveCompressionSpec = {
  yawFactor: 0.25,
  pitchFactor: 0.15,
  maxCompression: 0.45,
};

export const DEFAULT_LIGHTING: LightingSpec = {
  brightnessResponse: 0.5,
  contrastResponse: 0.3,
  reflective: false,
};

export const DEFAULT_CALIBRATION: CalibrationSpec = {
  scaleCorrection: 1,
  rotationCorrectionRad: 0,
  offsetCorrection: { x: 0, y: 0 },
};

export const DEFAULT_TRACKING_REQUIREMENTS: Record<
  JewelryCategory,
  TrackingRequirements
> = {
  necklace: { face: true, hands: false, body: true },
  earrings: { face: true, hands: false, body: false },
  ring: { face: false, hands: true, body: false },
  bracelet: { face: false, hands: true, body: false },
  watch: { face: false, hands: true, body: false },
  forehead: { face: true, hands: false, body: false },
  nose_ring: { face: true, hands: false, body: false },
};
