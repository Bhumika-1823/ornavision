import { JewelryMetadata } from './JewelryMetadata';

/**
 * MetadataCache avoids re-validating/re-normalizing metadata on every
 * render or selection change. Designed to scale to thousands of products —
 * a plain Map is O(1) and memory-cheap since JewelryMetadata objects are
 * small (no image bytes live here, only paths).
 */
interface CacheEntry {
  metadata: JewelryMetadata;
  /** Content fingerprint of the raw source metadata this was built from — see MetadataLoader. */
  signature: string;
}

class MetadataCache {
  private cache = new Map<string, CacheEntry>();

  get(id: string): CacheEntry | undefined {
    return this.cache.get(id);
  }

  set(id: string, meta: JewelryMetadata, signature: string): void {
    this.cache.set(id, { metadata: meta, signature });
  }

  invalidate(id: string): void {
    this.cache.delete(id);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const metadataCache = new MetadataCache();
