import { describe, it, expect } from 'vitest';
import { dist, bodyScaleReference } from '../ScaleEstimator';

describe('ScaleEstimator', () => {
  describe('dist', () => {
    it('calculates the Euclidean distance between two points', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 3, y: 4 };
      expect(dist(p1, p2)).toBe(5);
    });

    it('handles negative coordinates', () => {
      const p1 = { x: -1, y: -1 };
      const p2 = { x: -4, y: -5 };
      expect(dist(p1, p2)).toBe(5);
    });

    it('returns 0 for the same point', () => {
      const p = { x: 10, y: 20 };
      expect(dist(p, p)).toBe(0);
    });
  });

  describe('bodyScaleReference', () => {
    it('returns face width if shoulder width is null', () => {
      expect(bodyScaleReference(100, null)).toBe(100);
    });

    it('returns face width if shoulder width is 0 or negative', () => {
      expect(bodyScaleReference(100, 0)).toBe(100);
      expect(bodyScaleReference(100, -50)).toBe(100);
    });

    it('blends face width and shoulder width correctly', () => {
      // faceWidthPx = 100
      // shoulderWidthPx = 280
      // impliedFaceWidth = 280 / 2.8 = 100
      // result = 100 * 0.6 + 100 * 0.4 = 100
      expect(bodyScaleReference(100, 280)).toBe(100);

      // faceWidthPx = 100
      // shoulderWidthPx = 560
      // impliedFaceWidth = 560 / 2.8 = 200
      // result = 100 * 0.6 + 200 * 0.4 = 140
      expect(bodyScaleReference(100, 560)).toBe(140);
    });
  });
});
