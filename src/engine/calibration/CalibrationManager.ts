import { JewelryMetadata } from "../metadata/JewelryMetadata";
import { ProductPackage } from "../metadata/ProductPackage";

/**
 * Exposes methods for a future Studio UI to mutate a ProductPackage in real-time,
 * apply AI analysis results, and export the final JSON.
 */
export class CalibrationManager {
  private activePackage: ProductPackage | null = null;
  private activeMetadata: JewelryMetadata | null = null;

  loadPackage(pkg: ProductPackage, meta: JewelryMetadata) {
    this.activePackage = pkg;
    this.activeMetadata = meta;
  }

  updateCalibration(patch: Partial<JewelryMetadata>) {
    if (!this.activeMetadata || !this.activePackage) return;

    // Mutate the live metadata (which the Renderer reads each frame)
    Object.assign(this.activeMetadata, patch);

    // Also save it to the package manifest
    Object.assign(this.activePackage.calibration, patch);
  }

  exportPackageJson(): string {
    if (!this.activePackage) return "{}";
    return JSON.stringify(this.activePackage, null, 2);
  }

  getActiveMetadata(): JewelryMetadata | null {
    return this.activeMetadata;
  }
}
