import { describe, it, expect } from 'vitest';
import { NecklaceValidationSuite } from '../NecklaceValidationSuite';
import { JewelryMetadata, DEFAULT_ANCHORS, DEFAULT_PERSPECTIVE, DEFAULT_LIGHTING, DEFAULT_CALIBRATION, DEFAULT_TRACKING_REQUIREMENTS } from '../../metadata/JewelryMetadata';
import { BenchmarkSuite } from '../BenchmarkSuite';
import { NeckEstimator } from '../../tracking/NeckEstimator';
import { PendantEngine } from '../../anchors/PendantEngine';
import { FaceLibrary } from '../FaceLibrary';
import { Transform2D } from '../../types';

describe('Necklace Engine Phase 2', () => {
  const createMockMeta = (sub: string): JewelryMetadata => ({
    id: `test-${sub}`,
    category: 'necklace',
    subcategory: sub as any,
    image: '/test.png',
    anchors: DEFAULT_ANCHORS['necklace'],
    defaultScale: 1,
    minScale: 0.5,
    maxScale: 2,
    rotationOffset: 0,
    perspectiveCompression: { ...DEFAULT_PERSPECTIVE },
    lighting: { ...DEFAULT_LIGHTING },
    reflection: false,
    renderOrder: 0,
    qualityLevel: 'standard',
    trackingRequirements: { ...DEFAULT_TRACKING_REQUIREMENTS['necklace'] },
    calibration: { ...DEFAULT_CALIBRATION },
  });

  it('validates subcategory anchor independence', async () => {
    const report = await NecklaceValidationSuite.validateSubcategories(createMockMeta);
    expect(report.passed).toBe(true);
    expect(report.errors).toHaveLength(0);
    expect(report.metrics.choker_drift).toBeLessThan(2);
    expect(report.metrics.chain_drift).toBe(0);
  });
  
  it('measures FPS and Memory constraints for Necklaces', async () => {
    const products = [createMockMeta('standard'), createMockMeta('choker')];
    const report = await BenchmarkSuite.run(products);
    
    // FPS should remain high (headless runs will likely be > 100 FPS)
    expect(report.averageFps).toBeGreaterThan(30);
    // Drift should be minimal on stable synthetic faces
    expect(report.drift.maxDriftPx).toBeLessThan(5);
  });

  describe('NeckEstimator and Anatomy', () => {
    it('computes stable metrics for small faces', () => {
      const frame = FaceLibrary.getSmallFace();
      const metrics = NeckEstimator.estimate(frame);
      expect(metrics).toBeDefined();
      expect(metrics!.trackingQuality).toBeGreaterThan(0.8);
    });

    it('handles wide faces accurately', () => {
      const frame = FaceLibrary.getWideFace();
      const metrics = NeckEstimator.estimate(frame);
      expect(metrics!.neckWidthPx).toBeGreaterThan(FaceLibrary.getSmallFace().face!.faceWidthPx * 0.75);
    });

    it('reduces quality when body tracking is lost', () => {
      const frame = FaceLibrary.getAverageFace();
      frame.body = null;
      const metrics = NeckEstimator.estimate(frame);
      expect(metrics!.trackingQuality).toBeLessThan(0.8);
    });
    
    it('reduces tracking quality for fast movement or occlusion (asymmetrical shoulder)', () => {
      const frame = FaceLibrary.getAverageFace();
      frame.body!.leftShoulder.x -= 200; // Asymmetry
      const metrics = NeckEstimator.estimate(frame);
      expect(metrics!.trackingQuality).toBeLessThan(1.0);
      expect(metrics!.shoulderSymmetry).toBeLessThan(1.0);
    });
  });

  describe('Pendant Engine (RC3)', () => {
    const mockParentTransform: Transform2D = {
      x: 640, y: 360, rotation: 0, width: 200, height: 200, scaleX: 1, opacity: 1, visible: true, renderOrder: 0, flipX: false
    };

    const mockPendantMeta: JewelryMetadata = {
      ...createMockMeta('pendant'),
      pendant: {
        pendantLength: 50,
        attachmentPoint: { x: 0, y: 0.5 },
        chainOffset: { x: 0, y: 0 },
        centerOffset: { x: 0, y: 0.1 },
        rotationOffset: 0,
        gravityWeight: 0.5,
        swingStiffness: 0.1,
        damping: 0.2,
        maxSwing: 0.5,
      }
    };

    it('inherits parent transform and maintains zero detachment error', () => {
      const frame = FaceLibrary.getAverageFace();
      const { transform, metrics } = PendantEngine.compute(mockParentTransform, mockPendantMeta, frame);
      
      expect(transform).toBeDefined();
      expect(metrics.attachmentError).toBe(0); // Perfect hierarchy guarantee
      expect(transform.x).toBe(mockParentTransform.x);
      // y is shifted by attachmentPoint.y * height + centerOffset.y * height
      expect(transform.y).toBe(mockParentTransform.y + (0.5 * 200) + (0.1 * 200));
    });

    it('simulates damped harmonic swing when parent moves', () => {
      const frame = FaceLibrary.getAverageFace();
      
      // Initial state
      PendantEngine.compute(mockParentTransform, mockPendantMeta, frame);
      
      // Move parent horizontally rapidly
      const movedParent = { ...mockParentTransform, x: 800 };
      const { metrics } = PendantEngine.compute(movedParent, mockPendantMeta, frame);
      
      // Should induce swing velocity
      expect(metrics.velocity).not.toBe(0);
      expect(Math.abs(metrics.swingAngle)).toBeGreaterThan(0);
    });

    it('applies gravity rotation based on body rotation', () => {
      const frame = FaceLibrary.getAverageFace();
      frame.neckMetrics = { ...NeckEstimator.estimate(frame)!, bodyRotation: -0.2 };
      
      const { transform } = PendantEngine.compute(mockParentTransform, mockPendantMeta, frame);
      // Body rotated left (-0.2), gravity pulls right, so rotation should be positive
      expect(transform.rotation).toBeGreaterThan(0);
    });
  });
});
