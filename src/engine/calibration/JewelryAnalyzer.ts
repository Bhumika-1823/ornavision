export interface AnalysisResult {
  boundingBox: { x: number; y: number; width: number; height: number };
  center: { x: number; y: number }; // normalized [0,1]
  topMost: number; // normalized y [0,1]
  bottomMost: number; // normalized y [0,1]
  isSymmetric: boolean;
  suggestedPivot: { x: number; y: number };
}

/**
 * Provides offline/studio AI heuristics for new product images.
 * Scans image pixels to auto-detect anchors, saving manual calibration time.
 */
export class JewelryAnalyzer {
  static analyzeImage(img: HTMLImageElement, category: string): AnalysisResult {
    const canvas = document.createElement("canvas");
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, w, h).data;

    let minX = w,
      maxX = 0;
    let minY = h,
      maxY = 0;

    let leftWeight = 0;
    let rightWeight = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = data[(y * w + x) * 4 + 3];
        if (alpha > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          if (x < w / 2) leftWeight++;
          else rightWeight++;
        }
      }
    }

    if (minX > maxX) {
      // Empty image fallback
      return {
        boundingBox: { x: 0, y: 0, width: w, height: h },
        center: { x: 0.5, y: 0.5 },
        topMost: 0,
        bottomMost: 1,
        isSymmetric: true,
        suggestedPivot: { x: 0.5, y: 0 },
      };
    }

    const bbW = maxX - minX;
    const bbH = maxY - minY;

    const cx = (minX + bbW / 2) / w;
    const cy = (minY + bbH / 2) / h;

    const topMost = minY / h;
    const bottomMost = maxY / h;

    // Symmetry check: if left pixels and right pixels are roughly equal count (within 10%)
    const totalPixels = leftWeight + rightWeight;
    const diff = Math.abs(leftWeight - rightWeight);
    const isSymmetric = diff / Math.max(1, totalPixels) < 0.1;

    let suggestedPivot = { x: 0.5, y: 0 }; // Default top-center

    if (category === "ring" || category === "bracelet") {
      suggestedPivot = { x: cx, y: cy };
    } else if (category === "necklace") {
      suggestedPivot = { x: cx, y: topMost };
    } else if (category === "earrings") {
      suggestedPivot = { x: cx, y: topMost };
    }

    return {
      boundingBox: { x: minX, y: minY, width: bbW, height: bbH },
      center: { x: cx, y: cy },
      topMost,
      bottomMost,
      isSymmetric,
      suggestedPivot,
    };
  }
}
