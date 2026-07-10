import { JewelryMetadata } from "../metadata/JewelryMetadata";
import { assetManager } from "../assets/AssetManager";

export interface ValidationReport {
  valid: boolean;
  errors: string[];
}

export class ProductValidator {
  static async validate(metadata: JewelryMetadata): Promise<ValidationReport> {
    const errors: string[] = [];

    // 1. Asset Resolution Check
    try {
      const imgOk = await this.checkImageExists(metadata.image);
      if (!imgOk)
        errors.push(`Base image missing or unresolvable: ${metadata.image}`);

      if (metadata.mask) {
        const maskOk = await this.checkImageExists(metadata.mask);
        if (!maskOk)
          errors.push(`Mask image missing or unresolvable: ${metadata.mask}`);
      }

      if (metadata.shadow) {
        const shadowOk = await this.checkImageExists(metadata.shadow);
        if (!shadowOk)
          errors.push(
            `Shadow image missing or unresolvable: ${metadata.shadow}`,
          );
      }
    } catch (e: any) {
      errors.push(`Asset network error: ${e.message}`);
    }

    // 2. Calibration Bounds Check
    if (metadata.defaultScale <= 0) errors.push("defaultScale must be > 0");
    if (metadata.calibration.scaleCorrection <= 0)
      errors.push("scaleCorrection must be > 0");

    // 3. Anchor Check
    if (metadata.anchors.pivot.x < 0 || metadata.anchors.pivot.x > 1) {
      errors.push("Anchor pivot X must be between 0 and 1");
    }
    if (metadata.anchors.pivot.y < 0 || metadata.anchors.pivot.y > 1) {
      errors.push("Anchor pivot Y must be between 0 and 1");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private static checkImageExists(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }
}
