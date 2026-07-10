import { describe, it, expect } from 'vitest';
import { WristEstimator } from '../../tracking/WristEstimator';
import { HandState, BodyState, Point3D, Point2D, FrameState, WristState } from '../../types';
import { computeBraceletTransform } from '../../anchors/braceletAnchor';
import { JewelryMetadata } from '../../metadata/JewelryMetadata';
import { AssetBundle } from '../../assets/AssetManager';

describe('Bracelet & Watch Engine RC10', () => {
  const createPoint3D = (x: number, y: number, z: number): Point3D => ({ x, y, z });
  const createPoint2D = (x: number, y: number): Point2D => ({ x, y });

  it('computes WristState with elbow fallback', () => {
    // Left hand
    const wrist = createPoint2D(100, 200);
    const middleMcp = createPoint3D(100, 150, 0);
    const wrist3D = createPoint3D(100, 200, 0);

    const mockHand: HandState = {
      present: true,
      confidence: 1,
      handedness: 'Left',
      landmarks: [wrist3D, ...Array(8).fill(null), middleMcp] as any,
      wrist,
      wristAngle: -Math.PI / 2,
      palmNormal: createPoint3D(0, 0, -1),
      palmCenter: createPoint3D(100, 175, 0),
      fingers: {} as any,
      palmWidthPx: 50
    };

    // Elbow is straight down from wrist
    const mockBody: BodyState = {
      present: true,
      confidence: 1,
      leftShoulder: createPoint2D(150, 400),
      rightShoulder: createPoint2D(250, 400),
      leftElbow: createPoint2D(100, 300),
      shoulderWidthPx: 100,
      bodyRotation: 0,
      chestCenter: createPoint2D(200, 450)
    };

    const wristState = WristEstimator.estimate(mockHand, mockBody);
    
    expect(wristState.center.x).toBe(100);
    expect(wristState.center.y).toBe(200);
    expect(wristState.widthPx).toBeGreaterThan(50);
    // Forearm rotation from elbow (100,300) to wrist (100,200) should be -90 deg (-Math.PI/2) 
    // Wait, atan2(300-200, 100-100) = Math.PI / 2
    expect(wristState.forearmRotation).toBeCloseTo(Math.PI / 2);
  });

  it('applies bangle vs rigid physics profiles', () => {
    const mockWrist: WristState = {
      present: true,
      handedness: 'Left',
      center: createPoint2D(200, 200),
      widthPx: 50,
      forearmRotation: 0,
      forearmDirection: createPoint3D(1, 0, 0), // Parallel to camera (Z=0)
      palmRotation: createPoint3D(0, 0, -1),
      isVisible: true
    };

    const mockFrame: FrameState = {
      frameIndex: 1,
      timestamp: Date.now(),
      width: 640,
      height: 480,
      face: null,
      hands: [],
      wrists: [mockWrist],
      body: null,
      lighting: { type: 'ambient' } as any
    };

    const mockMetaBase = {
      id: 'test',
      category: 'bracelet',
      subcategory: 'generic',
      image: 'test.png',
      anchors: { pivot: { x: 0, y: 0 }, offsetUnits: { x: 0, y: 0 } },
      defaultScale: 1,
      minScale: 0.1,
      maxScale: 2,
      rotationOffset: 0,
      perspectiveCompression: { yawFactor: 0, pitchFactor: 0, maxCompression: 0 },
      lighting: { type: 'ambient' },
      reflection: false,
      renderOrder: 0,
      qualityLevel: 'standard',
      trackingRequirements: { face: false, hands: true, body: false },
      calibration: { scaleCorrection: 1, rotationCorrectionRad: 0, offsetCorrection: {x:0, y:0} }
    } as any;

    const mockAsset: AssetBundle = {
      image: { complete: true, naturalWidth: 100, naturalHeight: 100 } as HTMLImageElement,
      mask: null,
      shadow: null
    };

    const watchMeta = { ...mockMetaBase, category: 'watch' as any, braceletSpec: { physicsProfile: 'rigid' as const } };
    const watchTransform = computeBraceletTransform(watchMeta, mockFrame, mockAsset, { scale: 1, offsetX: 0, offsetY: 0 });
    
    const bangleMeta = { ...mockMetaBase, braceletSpec: { physicsProfile: 'bangle' as const } };
    const bangleTransform = computeBraceletTransform(bangleMeta, mockFrame, mockAsset, { scale: 1, offsetX: 0, offsetY: 0 });
    
    expect(watchTransform?.y).toBe(200); // Rigid watch stays exactly at center
    expect(bangleTransform?.y).toBeGreaterThan(200); // Bangle drops down via gravity
    
    // Perspective compression test (Z=0, edge-on)
    expect(watchTransform?.scaleY).toBeLessThan(0.3); // heavily compressed
  });
});
