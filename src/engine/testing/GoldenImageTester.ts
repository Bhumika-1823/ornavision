import { JewelryMetadata } from "../metadata/JewelryMetadata";
import { PreviewGenerator } from "../calibration/PreviewGenerator";

/**
 * Validates that rendered output for a specific product matches a known "Golden Image".
 * Essential for preventing regressions when changing rendering logic or anchors.
 */
export class GoldenImageTester {
  /**
   * Compares the current generated preview against an expected golden image Data URL.
   * Returns a match percentage [0-100].
   */
  static async compare(
    metadata: JewelryMetadata,
    goldenImageUrl: string,
  ): Promise<number> {
    const currentPreviewUrl = await PreviewGenerator.generateMannequinPreview(
      metadata,
      300,
      400,
    );

    const currentImg = await this.loadImage(currentPreviewUrl);
    const goldenImg = await this.loadImage(goldenImageUrl);

    const canvas = document.createElement("canvas");
    canvas.width = 300;
    canvas.height = 400;
    const ctx = canvas.getContext("2d")!;

    // In a full production environment, we'd use 'pixelmatch' or similar here.
    // For this implementation, we simulate a simple pixel difference check.
    ctx.drawImage(currentImg, 0, 0);
    const currentData = ctx.getImageData(0, 0, 300, 400).data;

    ctx.clearRect(0, 0, 300, 400);
    ctx.drawImage(goldenImg, 0, 0);
    const goldenData = ctx.getImageData(0, 0, 300, 400).data;

    let diffCount = 0;
    for (let i = 0; i < currentData.length; i += 4) {
      if (
        Math.abs(currentData[i] - goldenData[i]) > 5 ||
        Math.abs(currentData[i + 1] - goldenData[i + 1]) > 5 ||
        Math.abs(currentData[i + 2] - goldenData[i + 2]) > 5 ||
        Math.abs(currentData[i + 3] - goldenData[i + 3]) > 5
      ) {
        diffCount++;
      }
    }

    const totalPixels = 300 * 400;
    const similarity = ((totalPixels - diffCount) / totalPixels) * 100;

    return similarity;
  }

  private static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.src = src;
    });
  }
}
