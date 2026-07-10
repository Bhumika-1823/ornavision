import { JewelryMetadata } from './JewelryMetadata';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  /** Metadata with unsafe values clamped/defaulted so rendering never crashes even if invalid. */
  sanitized: JewelryMetadata;
}

/**
 * MetadataValidator never throws. Bad metadata should degrade gracefully
 * (a slightly mis-scaled item) rather than break the try-on experience for
 * every other product in the catalog.
 */
export function validateMetadata(meta: JewelryMetadata): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sanitized: JewelryMetadata = JSON.parse(JSON.stringify(meta));

  if (!sanitized.id) errors.push('Missing id');
  if (!sanitized.image) errors.push('Missing image path');

  if (!(sanitized.defaultScale > 0)) {
    warnings.push(`defaultScale invalid (${sanitized.defaultScale}), defaulting to 1`);
    sanitized.defaultScale = 1;
  }
  if (!(sanitized.minScale > 0) || sanitized.minScale > sanitized.defaultScale) {
    warnings.push('minScale invalid relative to defaultScale, clamping');
    sanitized.minScale = sanitized.defaultScale * 0.5;
  }
  if (!(sanitized.maxScale >= sanitized.defaultScale)) {
    warnings.push('maxScale invalid relative to defaultScale, clamping');
    sanitized.maxScale = sanitized.defaultScale * 2;
  }

  if (sanitized.perspectiveCompression.maxCompression > 0.9) {
    warnings.push('perspectiveCompression.maxCompression too aggressive, clamping to 0.9');
    sanitized.perspectiveCompression.maxCompression = 0.9;
  }

  if (sanitized.renderOrder < 0) {
    sanitized.renderOrder = 0;
  }

  return { valid: errors.length === 0, errors, warnings, sanitized };
}
