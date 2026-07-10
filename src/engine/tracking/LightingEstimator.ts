import { LightingEstimate } from "../types";

/**
 * Samples a coarse grid of pixels from an offscreen canvas already holding
 * the current video/photo frame, producing a cheap ambient lighting
 * estimate. Also computes directional light vector by comparing left/right quadrants.
 */
export function estimateLighting(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): LightingEstimate {
  const sampleStep = Math.max(8, Math.floor(Math.min(width, height) / 32));
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let lumaSum = 0;
  let lumaSumSq = 0;
  let n = 0;

  // Directional tracking
  let leftLumaSum = 0;
  let leftCount = 0;
  let rightLumaSum = 0;
  let rightCount = 0;

  try {
    for (let y = 0; y < height; y += sampleStep) {
      const row = ctx.getImageData(0, y, width, 1).data;
      for (let x = 0; x < width; x += sampleStep) {
        const i = x * 4;
        const r = row[i];
        const g = row[i + 1];
        const b = row[i + 2];
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;

        rSum += r;
        gSum += g;
        bSum += b;
        lumaSum += luma;
        lumaSumSq += luma * luma;
        n += 1;

        if (x < width / 2) {
          leftLumaSum += luma;
          leftCount++;
        } else {
          rightLumaSum += luma;
          rightCount++;
        }
      }
    }
  } catch {
    return {
      brightness: 180,
      contrast: 1,
      warmth: 0,
      lightDirection: { x: 0, y: 1 },
    };
  }

  if (n === 0)
    return {
      brightness: 180,
      contrast: 1,
      warmth: 0,
      lightDirection: { x: 0, y: 1 },
    };

  const meanLuma = lumaSum / n;
  const variance = Math.max(0, lumaSumSq / n - meanLuma * meanLuma);
  const stdDev = Math.sqrt(variance);
  const contrast = clamp(stdDev / 48, 0.6, 1.4);
  const rMean = rSum / n;
  const bMean = bSum / n;
  const warmth = clamp((rMean - bMean) / 128, -1, 1);

  // Directional Light
  const leftMean = leftLumaSum / Math.max(1, leftCount);
  const rightMean = rightLumaSum / Math.max(1, rightCount);

  // If left is brighter, light is coming from the left (negative x)
  const dx = (rightMean - leftMean) / 255;

  // Normalize direction vector (assume overhead y by default)
  const dy = -0.5; // Always somewhat top-down
  const len = Math.sqrt(dx * dx + dy * dy);

  return {
    brightness: meanLuma,
    contrast,
    warmth,
    lightDirection: { x: dx / len, y: dy / len },
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
