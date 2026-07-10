import { describe, it, expect } from 'vitest';
import { validateMetadata } from '../MetadataValidator';
import { JewelryMetadata, DEFAULT_ANCHORS, DEFAULT_PERSPECTIVE, DEFAULT_LIGHTING, DEFAULT_CALIBRATION, DEFAULT_TRACKING_REQUIREMENTS } from '../JewelryMetadata';

describe('MetadataValidator', () => {
  const createValidMock = (): JewelryMetadata => ({
    id: 'test-123',
    category: 'necklace',
    subcategory: 'pendant',
    image: '/test.png',
    anchors: DEFAULT_ANCHORS.necklace,
    defaultScale: 1,
    minScale: 0.5,
    maxScale: 2,
    rotationOffset: 0,
    perspectiveCompression: { ...DEFAULT_PERSPECTIVE },
    lighting: { ...DEFAULT_LIGHTING },
    reflection: false,
    renderOrder: 0,
    qualityLevel: 'standard',
    trackingRequirements: { ...DEFAULT_TRACKING_REQUIREMENTS.necklace },
    calibration: { ...DEFAULT_CALIBRATION },
  });

  it('should pass a fully valid metadata object', () => {
    const meta = createValidMock();
    const result = validateMetadata(meta);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should fail if id or image is missing', () => {
    const meta = createValidMock();
    meta.id = '';
    meta.image = '';
    const result = validateMetadata(meta);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing id');
    expect(result.errors).toContain('Missing image path');
  });

  it('should sanitize invalid scale values and issue warnings', () => {
    const meta = createValidMock();
    meta.defaultScale = -1; // Invalid
    meta.minScale = 5; // Greater than defaultScale (which will be reset to 1)
    meta.maxScale = 0.1; // Less than defaultScale (which will be reset to 1)
    
    const result = validateMetadata(meta);
    expect(result.warnings.length).toBeGreaterThan(0);
    
    // Check sanitized values
    expect(result.sanitized.defaultScale).toBe(1);
    expect(result.sanitized.minScale).toBe(0.5); // Clamped to defaultScale * 0.5
    expect(result.sanitized.maxScale).toBe(2); // Clamped to defaultScale * 2
  });

  it('should clamp perspective maxCompression', () => {
    const meta = createValidMock();
    meta.perspectiveCompression.maxCompression = 2; // Invalid, > 0.9
    const result = validateMetadata(meta);
    
    expect(result.warnings).toContain('perspectiveCompression.maxCompression too aggressive, clamping to 0.9');
    expect(result.sanitized.perspectiveCompression.maxCompression).toBe(0.9);
  });
});
