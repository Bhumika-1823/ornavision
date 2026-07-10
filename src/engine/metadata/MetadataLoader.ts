import { JewelryMetadata } from './JewelryMetadata';
import { fromLegacy, LegacyTryonMetadata } from './legacyAdapter';
import { validateMetadata } from './MetadataValidator';
import { metadataCache } from './MetadataCache';

export interface LoadableProduct {
  id: string;
  /** Fully-specified metadata (preferred for new products). */
  tryonMetadataRich?: JewelryMetadata | null;
  /** Legacy shorthand metadata (still supported so existing catalog data keeps working). */
  tryonMetadata?: LegacyTryonMetadata | null;
}

/**
 * MetadataLoader is the single entry point that turns "whatever shape of
 * metadata a product happens to have" into a validated JewelryMetadata.
 * Adding a new jewelry product never requires touching engine code — only
 * adding metadata that this loader already knows how to interpret.
 */
export function loadMetadataForProduct(product: LoadableProduct): JewelryMetadata | null {
  // IMPORTANT: `product.id` here is frequently a stable *slot* key (e.g.
  // "necklace") rather than a unique product id, because the try-on UI
  // reuses one equipped slot across many different products the person
  // selects over time. A signature of the actual metadata *content* — not
  // just the id — must be checked, or switching products within the same
  // slot would keep serving the first product's cached metadata forever.
  const signature = JSON.stringify(product.tryonMetadataRich ?? product.tryonMetadata ?? null);
  const cached = metadataCache.get(product.id);
  if (cached && cached.signature === signature) return cached.metadata;

  let raw: JewelryMetadata | null = null;
  if (product.tryonMetadataRich) {
    raw = product.tryonMetadataRich;
  } else if (product.tryonMetadata) {
    raw = fromLegacy(product.id, product.tryonMetadata);
  }

  if (!raw) return null;

  const { sanitized, errors, warnings } = validateMetadata(raw);
  if (errors.length > 0) {
    console.error(`[MetadataLoader] Invalid metadata for "${product.id}":`, errors);
    return null;
  }
  if (warnings.length > 0) {
    console.warn(`[MetadataLoader] Metadata warnings for "${product.id}":`, warnings);
  }

  metadataCache.set(product.id, sanitized, signature);
  return sanitized;
}
