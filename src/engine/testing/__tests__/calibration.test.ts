import { describe, it, expect } from "vitest";
import { BatchValidator } from "../../calibration/BatchValidator";
import { CapabilityManager } from "../../core/CapabilityManager";
import { ProductPackage } from "../../metadata/ProductPackage";

describe("Product Pipeline & AI Calibration RC7", () => {
  it("detects capability constraints on low-end devices", () => {
    // Mock global flag for tier testing
    (globalThis as any).__FORCE_TIER__ = "low";
    // Clear static cache to force redetect
    (CapabilityManager as any).capabilities = null;

    const caps = CapabilityManager.get();
    expect(caps.tier).toBe("low");
    expect(caps.canUseBloom).toBe(false);
    expect(caps.canUseSegmentation).toBe(false);

    // Reset
    (globalThis as any).__FORCE_TIER__ = undefined;
    (CapabilityManager as any).capabilities = null;
  });

  it("BatchValidator passes valid packages", () => {
    const pkg: ProductPackage = {
      manifest: {
        version: "1.0",
        id: "valid-product",
        category: "necklace",
        subcategory: "choker",
        assets: {
          diffuse: "test.webp",
        },
      },
      calibration: {
        defaultScale: 1.0,
      },
    };
    const report = BatchValidator.validate([pkg]);
    expect(report.passed).toBe(1);
    expect(report.warnings).toBe(0);
    expect(report.errors).toBe(0);
  });

  it("BatchValidator catches missing required fields and outputs errors", () => {
    const pkg: ProductPackage = {
      manifest: {
        version: "1.0",
        id: "", // missing
        category: "", // missing
        subcategory: "",
        assets: {} as any, // missing diffuse
      },
      calibration: {
        defaultScale: -1, // invalid
      },
    };
    const report = BatchValidator.validate([pkg]);
    expect(report.passed).toBe(0);
    expect(report.errors).toBe(1);
    expect(report.details[0].messages).toContain(
      "Missing required manifest fields (id, category).",
    );
    expect(report.details[0].messages).toContain("defaultScale must be > 0.");
  });

  it("BatchValidator outputs warnings for missing calibration or heavy shadows", () => {
    const pkg: ProductPackage = {
      manifest: {
        version: "1.0",
        id: "warn-product",
        category: "necklace",
        subcategory: "choker",
        assets: { diffuse: "test.webp" },
      },
      calibration: {
        shadowSpec: {
          opacity: 0.5,
          blur: 5,
          offsetX: 2,
          offsetY: 2,
          color: "black",
        },
        reflectionSpec: { intensity: 1 } as any,
      },
    };

    const pkg2: ProductPackage = {
      manifest: pkg.manifest,
      calibration: undefined as any, // missing calibration object
    };

    const report = BatchValidator.validate([pkg, pkg2]);
    expect(report.warnings).toBe(1); // one for missing calibration // one for heavy shadow, one for missing calibration
  });
});
