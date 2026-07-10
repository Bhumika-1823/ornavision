import { NeckEstimator } from "../../tracking/NeckEstimator";
import { describe, it, expect } from "vitest";
import { anchorEngine } from "../AnchorEngine";
import {
  JewelryMetadata,
  DEFAULT_ANCHORS,
  DEFAULT_PERSPECTIVE,
  DEFAULT_LIGHTING,
  DEFAULT_CALIBRATION,
  DEFAULT_TRACKING_REQUIREMENTS,
} from "../../metadata/JewelryMetadata";
import { FrameState, FaceState, BodyState } from "../../types";
import { AssetBundle } from "../../assets/AssetManager";
import { UserAdjust } from "../UserAdjust";

describe("AnchorEngine", () => {
  const createMockAsset = (): AssetBundle => {
    const img = new Image();
    // JSDOM mock for natural dimensions
    Object.defineProperty(img, "naturalWidth", { value: 100 });
    Object.defineProperty(img, "naturalHeight", { value: 100 });
    Object.defineProperty(img, "complete", { value: true });

    return {
      image: img,
      mask: null,
      shadow: null,
    };
  };

  const createMockFace = (): FaceState => ({
    present: true,
    confidence: 1,
    landmarks: [],
    pose: { roll: 0, yaw: 0, pitch: 0 },
    faceWidthPx: 200,
    eyeDistancePx: 80,
    center: { x: 500, y: 500 },
    jaw: { x: 500, y: 700 },
    neckAnchor: { x: 500, y: 750 },
    leftEar: { x: 400, y: 500 },
    rightEar: { x: 600, y: 500 },
    foreheadCenter: { x: 500, y: 300 },
    noseTip: { x: 500, y: 550 },
    leftNostril: { x: 480, y: 550 },
    rightNostril: { x: 520, y: 550 },
  });

  const createMockFrame = (
    face: FaceState | null = createMockFace(),
  ): FrameState => {
    const f: FrameState = {
      frameIndex: 1,
      timestamp: 0,
      width: 1000,
      height: 1000,
      face,
      hands: [],
      wrists: null,
      body: null,
      lighting: { brightness: 180, contrast: 1, warmth: 0 },
    };
    f.neckMetrics = face ? (NeckEstimator.estimate(f) ?? undefined) : undefined;
    return f;
  };

  const createMockMeta = (
    category: JewelryMetadata["category"],
  ): JewelryMetadata => ({
    id: `test-${category}`,
    category,
    subcategory: "generic" as any,
    image: "/test.png",
    anchors: DEFAULT_ANCHORS[category],
    defaultScale: 1,
    minScale: 0.5,
    maxScale: 2,
    rotationOffset: 0,
    perspectiveCompression: { ...DEFAULT_PERSPECTIVE },
    lighting: { ...DEFAULT_LIGHTING },
    reflection: false,
    renderOrder: 0,
    qualityLevel: "standard",
    trackingRequirements: { ...DEFAULT_TRACKING_REQUIREMENTS[category] },
    calibration: { ...DEFAULT_CALIBRATION },
  });

  const mockAdjust: UserAdjust = { scale: 1, offsetX: 0, offsetY: 0 };

  it("should return empty array if required tracking is missing (e.g. necklace without face)", () => {
    const meta = createMockMeta("necklace");
    meta.perspectiveCompression = {
      yawFactor: 0.5,
      pitchFactor: 0,
      maxCompression: 0.2,
    };
    const frame = createMockFrame(null); // No face
    const asset = createMockAsset();

    const transforms = anchorEngine.compute(meta, frame, asset, mockAdjust);
    expect(transforms).toHaveLength(0);
  });

  it("should compute valid necklace transform", () => {
    const meta = createMockMeta("necklace");
    const frame = createMockFrame();
    const asset = createMockAsset();

    const transforms = anchorEngine.compute(meta, frame, asset, mockAdjust);
    expect(transforms).toHaveLength(1);

    const t = transforms[0];
    expect(t.x).toBeDefined();
    expect(t.y).toBeDefined();
    // width should be based on face width (200) * bodyScaleReference * defaultScale * userAdjust
    // Since faceWidth is 200, scaleRef is typically faceWidth (if no body)
    expect(t.width).toBeGreaterThan(0);
    expect(t.height).toBeGreaterThan(0);
    expect(t.visible).toBe(true);
    expect(t.scaleX).toBe(1); // No yaw -> no compression
  });

  it("should apply perspective compression to scaleX based on yaw", () => {
    const meta = createMockMeta("necklace");
    meta.perspectiveCompression = {
      yawFactor: 0.5,
      pitchFactor: 0,
      maxCompression: 0.2,
    };
    const face = createMockFace();
    face.pose.yaw = 1; // max yaw

    // Provide a body that is facing straight ahead to ensure shoulderSymmetry = 1
    const body: BodyState = {
      present: true,
      confidence: 1,
      leftShoulder: { x: 400, y: 700 },
      rightShoulder: { x: 600, y: 700 },
      leftElbow: { x: 400, y: 900 },
      shoulderWidthPx: 200,
      bodyRotation: 0,
      chestCenter: { x: 500, y: 750 },
    };

    const frame = createMockFrame(face);
    frame.body = body;
    // Recompute neckMetrics with body
    frame.neckMetrics = NeckEstimator.estimate(frame) ?? undefined;

    const asset = createMockAsset();

    const transforms = anchorEngine.compute(meta, frame, asset, mockAdjust);
    expect(transforms[0].scaleX).toBeLessThan(1);
  });
});
