import { JewelryMetadata } from "../metadata/JewelryMetadata";
import { CanvasRenderer } from "../render/CanvasRenderer";
import { JewelryRenderer } from "../render/JewelryRenderer";
import { assetManager } from "../assets/AssetManager";
import { FaceLibrary } from "../testing/FaceLibrary";

export class PreviewGenerator {
  /**
   * Generates a square webp thumbnail for catalog lists.
   */
  static async generateThumbnail(
    metadata: JewelryMetadata,
    size = 256,
  ): Promise<string> {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Ensure asset is loaded
    const bundle = assetManager.ensure(
      metadata.id,
      metadata.image,
      metadata.mask,
      metadata.shadow,
    );
    await this.waitForImage(bundle.image);

    // Draw the raw image centered
    const imgAspect = bundle.image.naturalWidth / bundle.image.naturalHeight;
    let drawW = size;
    let drawH = size;
    if (imgAspect > 1) {
      drawH = size / imgAspect;
    } else {
      drawW = size * imgAspect;
    }

    const x = (size - drawW) / 2;
    const y = (size - drawH) / 2;

    ctx.drawImage(bundle.image, x, y, drawW, drawH);

    return canvas.toDataURL("image/webp", 0.8);
  }

  /**
   * Generates a preview of the product worn by a synthetic "Average Face" mannequin.
   */
  static async generateMannequinPreview(
    metadata: JewelryMetadata,
    width = 600,
    height = 800,
  ): Promise<string> {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;

    // Solid background for mannequin preview
    ctx.fillStyle = "#f0f0f0";
    ctx.fillRect(0, 0, width, height);

    const renderer = new CanvasRenderer(ctx);
    const jewelryRenderer = new JewelryRenderer(renderer);

    // Ensure asset loaded
    const bundle = assetManager.ensure(
      metadata.id,
      metadata.image,
      metadata.mask,
      metadata.shadow,
    );
    await this.waitForImage(bundle.image);

    const syntheticFrame = FaceLibrary.getAverageFace();

    // Adjust synthetic frame canvas dimensions
    syntheticFrame.width = width;
    syntheticFrame.height = height;

    const item = {
      metadata,
      userAdjust: { scale: 1, offsetX: 0, offsetY: 0 },
    };

    jewelryRenderer.renderAll([item], syntheticFrame, false);

    return canvas.toDataURL("image/webp", 0.9);
  }

  private static waitForImage(img: HTMLImageElement): Promise<void> {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    return new Promise((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Ignore errors here, validator catches them
    });
  }
}
