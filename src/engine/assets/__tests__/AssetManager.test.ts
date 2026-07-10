import { describe, it, expect, beforeEach } from "vitest";
import { assetManager } from "../AssetManager";

describe("AssetManager", () => {
  beforeEach(() => {
    assetManager.clear();
  });

  it("loads and caches assets", () => {
    const bundle1 = assetManager.ensure("item1", "img1.png");
    const bundle2 = assetManager.ensure("item1", "img1.png");

    // Should return the exact same bundle reference
    expect(bundle1).toBe(bundle2);
  });

  it("evicts unused assets to prevent memory leaks", () => {
    assetManager.ensure("item1", "img1.png");
    assetManager.ensure("item2", "img2.png");
    assetManager.ensure("item3", "img3.png");

    expect(assetManager.get("item1")).toBeDefined();
    expect(assetManager.get("item2")).toBeDefined();
    expect(assetManager.get("item3")).toBeDefined();

    // Evict all except item2
    assetManager.evictExcept(new Set(["item2"]));

    expect(assetManager.get("item1")).toBeUndefined();
    expect(assetManager.get("item2")).toBeDefined();
    expect(assetManager.get("item3")).toBeUndefined();
  });

  it("reloads asset if urls change", () => {
    const bundle1 = assetManager.ensure("item1", "img1.png");
    const bundle2 = assetManager.ensure("item1", "img2-new.png");

    // Different URL for the same ID should cause a new bundle to be created
    expect(bundle1).not.toBe(bundle2);
  });
});
