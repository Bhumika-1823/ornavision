export interface AssetBundle {
  image: HTMLImageElement;
  mask: HTMLImageElement | null;
  shadow: HTMLImageElement | null;
}

interface CacheEntry {
  bundle: AssetBundle;
  sourceUrls: { image: string; mask?: string; shadow?: string };
}

/**
 * AssetManager owns every HTMLImageElement used by the renderer. Images are
 * loaded once per unique URL and reused across frames — the animation loop
 * only ever reads from this cache, it never constructs `new Image()`.
 */
class AssetManager {
  private entries = new Map<string, CacheEntry>();

  private loadImage(src: string): HTMLImageElement {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    return img;
  }

  /** Ensure the given image/mask/shadow trio is loading/loaded, returning the (possibly still-loading) bundle. */
  ensure(id: string, image: string, mask?: string, shadow?: string): AssetBundle {
    const existing = this.entries.get(id);
    if (
      existing &&
      existing.sourceUrls.image === image &&
      existing.sourceUrls.mask === mask &&
      existing.sourceUrls.shadow === shadow
    ) {
      return existing.bundle;
    }

    const bundle: AssetBundle = {
      image: this.loadImage(image),
      mask: mask ? this.loadImage(mask) : null,
      shadow: shadow ? this.loadImage(shadow) : null,
    };
    this.entries.set(id, { bundle, sourceUrls: { image, mask, shadow } });
    return bundle;
  }

  get(id: string): AssetBundle | undefined {
    return this.entries.get(id)?.bundle;
  }

  isReady(id: string): boolean {
    const bundle = this.entries.get(id)?.bundle;
    if (!bundle) return false;
    return bundle.image.complete && bundle.image.naturalWidth > 0;
  }

  /** Drop assets that are no longer worn, to bound memory in a catalog with thousands of items. */
  evictExcept(activeIds: Set<string>): void {
    for (const id of this.entries.keys()) {
      if (!activeIds.has(id)) this.entries.delete(id);
    }
  }

  clear(): void {
    this.entries.clear();
  }
}

export const assetManager = new AssetManager();
