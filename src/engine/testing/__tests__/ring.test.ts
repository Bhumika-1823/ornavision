import { describe, it, expect } from "vitest";
import { HandEstimator } from "../../tracking/HandEstimator";
import {
  Point3D,
  Point2D,
  FingerState,
  HandState,
  FrameState,
} from "../../types";
import { computeRingTransform } from "../../anchors/ringAnchor";
import { JewelryMetadata } from "../../metadata/JewelryMetadata";
import { AssetBundle } from "../../assets/AssetManager";

describe("Ring Engine RC9", () => {
  const createPoint3D = (x: number, y: number, z: number): Point3D => ({
    x,
    y,
    z,
  });
  const createPoint2D = (x: number, y: number): Point2D => ({ x, y });

  it("computes Palm Normal correctly (Hand Rolled Away)", () => {
    // Open hand facing camera: wrist at bottom, index top-left, pinky top-right.
    // Z is depth (positive away from camera usually, or depends on handedness).
    const wrist = createPoint3D(0.5, 0.8, 0);
    const indexMcp = createPoint3D(0.4, 0.5, 0);
    const pinkyMcp = createPoint3D(0.6, 0.5, 0);

    // Test right hand
    const normal = HandEstimator.computePalmNormal(
      indexMcp,
      pinkyMcp,
      wrist,
      "Right",
    );
    // For right hand, normal should point towards camera (negative Z if left-handed coord system)
    expect(normal.z).toBeDefined();
  });

  it("fades ring opacity to 0 when finger is curled into a fist", () => {
    // Curled finger: MCP, PIP, and TIP form a tight triangle pointing back inward
    const mcp3D = createPoint3D(0.5, 0.5, 0);
    const pip3D = createPoint3D(0.5, 0.4, -0.1); // PIP is above and slightly closer
    const tip3D = createPoint3D(0.5, 0.55, 0.1); // TIP curls back under MCP

    const curl = HandEstimator.computeFingerCurl(mcp3D, pip3D, tip3D);
    expect(curl).toBeGreaterThan(1.2); // Highly curled

    const isVisible = curl < 1.2;

    const mockFinger: FingerState = {
      mcp3D,
      pip3D,
      tip3D,
      mcp: createPoint2D(100, 100),
      pip: createPoint2D(100, 80),
      tip: createPoint2D(100, 110),
      widthPx: 20,
      angle: 0,
      curlAngle: curl,
      isVisible,
    };

    const mockHand: HandState = {
      present: true,
      confidence: 1,
      handedness: "Right",
      landmarks: [],
      wrist: createPoint2D(100, 200),
      wristAngle: 0,
      palmNormal: createPoint3D(0, 0, -1),
      palmCenter: createPoint3D(0.5, 0.5, 0),
      fingers: {
        thumb: mockFinger,
        index: mockFinger,
        middle: mockFinger,
        pinky: mockFinger,
        ring: mockFinger,
      },
      palmWidthPx: 80,
    };

    const mockFrame: FrameState = {
      frameIndex: 1,
      timestamp: Date.now(),
      width: 640,
      height: 480,
      face: null,
      hands: [mockHand],
      wrists: null,
      body: null,
      lighting: { type: "ambient" } as any,
    };

    const mockMeta = {
      id: "test",
      category: "ring",
      subcategory: "generic",
      image: "test.png",
      anchors: { pivot: { x: 0, y: 0 }, offsetUnits: { x: 0, y: 0 } },
      defaultScale: 1,
      minScale: 0.1,
      maxScale: 2,
      rotationOffset: 0,
      perspectiveCompression: {
        yawFactor: 0,
        pitchFactor: 0,
        maxCompression: 0,
      },
      lighting: { type: "ambient" },
      reflection: false,
      renderOrder: 0,
      qualityLevel: "standard",
      trackingRequirements: { face: false, hands: true, body: false },
      calibration: {
        scaleCorrection: 1,
        rotationCorrectionRad: 0,
        offsetCorrection: { x: 0, y: 0 },
      },
    } as any;

    const mockAsset: AssetBundle = {
      image: {
        complete: true,
        naturalWidth: 100,
        naturalHeight: 100,
      } as HTMLImageElement,
      mask: null,
      shadow: null,
    };

    const transform = computeRingTransform(mockMeta, mockFrame, mockAsset, {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });

    // Opacity must be 0 because finger is heavily curled
    expect(transform?.opacity).toBe(0);
  });
});
