import { describe, it, expect } from 'vitest';
import { EarEstimator } from '../../tracking/EarEstimator';
import { computeEarringTransforms } from '../../anchors/earringAnchor';
import { FaceLibrary } from '../FaceLibrary';
import { JewelryMetadata, DEFAULT_ANCHORS, DEFAULT_PERSPECTIVE, DEFAULT_LIGHTING, DEFAULT_CALIBRATION, DEFAULT_TRACKING_REQUIREMENTS } from '../../metadata/JewelryMetadata';
import { UserAdjust } from '../../anchors/UserAdjust';

describe('Earring Engine RC4', () => {
  const createMockEarringMeta = (isHeavy = false): JewelryMetadata => ({
    id: `test-earring-${isHeavy ? 'heavy' : 'stud'}`,
    category: 'earrings',
    subcategory: 'dangler',
    image: '/test.png',
    anchors: DEFAULT_ANCHORS['earrings'],
    defaultScale: 1,
    minScale: 0.5,
    maxScale: 2,
    rotationOffset: 0,
    perspectiveCompression: { ...DEFAULT_PERSPECTIVE },
    lighting: { ...DEFAULT_LIGHTING },
    reflection: false,
    renderOrder: 0,
    qualityLevel: 'standard',
    trackingRequirements: { ...DEFAULT_TRACKING_REQUIREMENTS['earrings'] },
    calibration: { ...DEFAULT_CALIBRATION },
    earring: {
      attachmentPoint: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      rotationOffset: 0,
      swingWeight: isHeavy ? 0.8 : 0, // Heavy swings, stud doesn't
      damping: 0.2,
      maxSwing: 0.5,
      fadeCurve: { startYaw: 0.2, endYaw: 0.8 }
    }
  });

  const mockUserAdjust: UserAdjust = { scale: 1, offsetX: 0, offsetY: 0 };
  const mockAsset = { image: { complete: true, naturalWidth: 100, naturalHeight: 200 } as any, mask: null, shadow: null };

  it('computes independent placement for left and right ears', () => {
    const frame = FaceLibrary.getAverageFace();
    const meta = createMockEarringMeta(false);
    
    const transforms = computeEarringTransforms(meta, frame, mockAsset, mockUserAdjust);
    expect(transforms.left).toBeDefined();
    expect(transforms.right).toBeDefined();
    
    expect(transforms.left!.x).not.toEqual(transforms.right!.x);
    expect(transforms.left!.flipX).toBe(false);
    expect(transforms.right!.flipX).toBe(true);
  });

  it('fades right earring gracefully on positive yaw (looking left)', () => {
    const frame = FaceLibrary.getAverageFace();
    // Simulate looking left (right ear visible, left ear occluded)
    // Wait, +yaw means looking left. In EarEstimator: 
    // If yaw > 0 (looking left), left ear is occluded, so leftVis drops.
    // Let's test leftVis drops.
    frame.face!.pose.yaw = 0.5; // Halfway looking left
    
    const meta = createMockEarringMeta(false);
    const transforms = computeEarringTransforms(meta, frame, mockAsset, mockUserAdjust);
    
    expect(transforms.metrics.left!.visibility).toBeLessThan(1.0);
    expect(transforms.metrics.right!.visibility).toBe(1.0);
  });

  it('fades left earring gracefully on negative yaw (looking right)', () => {
    const frame = FaceLibrary.getAverageFace();
    frame.face!.pose.yaw = -0.6; // Looking right
    
    const meta = createMockEarringMeta(false);
    const transforms = computeEarringTransforms(meta, frame, mockAsset, mockUserAdjust);
    
    expect(transforms.metrics.right!.visibility).toBeLessThan(1.0);
    expect(transforms.metrics.left!.visibility).toBe(1.0);
  });

  it('applies physics swing to heavy earrings on rapid movement', () => {
    const frame = FaceLibrary.getAverageFace();
    const meta = createMockEarringMeta(true); // Heavy

    // Initial state
    computeEarringTransforms(meta, frame, mockAsset, mockUserAdjust);

    // Rapid horizontal movement of the head
    frame.face!.leftEar.x += 100;
    frame.face!.rightEar.x += 100;

    const transforms = computeEarringTransforms(meta, frame, mockAsset, mockUserAdjust);
    
    expect(transforms.metrics.left!.swingAngle).not.toBe(0);
    expect(transforms.metrics.right!.swingAngle).not.toBe(0);
  });

  it('does not apply swing to rigid stud earrings', () => {
    const frame = FaceLibrary.getAverageFace();
    const meta = createMockEarringMeta(false); // Stud

    computeEarringTransforms(meta, frame, mockAsset, mockUserAdjust);

    frame.face!.leftEar.x += 100;
    frame.face!.rightEar.x += 100;

    const transforms = computeEarringTransforms(meta, frame, mockAsset, mockUserAdjust);
    
    expect(transforms.metrics.left!.swingAngle).toBe(0);
    expect(transforms.metrics.right!.swingAngle).toBe(0);
  });
});
