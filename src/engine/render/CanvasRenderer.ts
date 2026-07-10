import { AssetBundle } from '../assets/AssetManager';
import { JewelryMetadata } from '../metadata/JewelryMetadata';
import { LightingEstimate, Transform2D } from '../types';
import { CapabilityManager } from '../core/CapabilityManager';

export interface DrawSourceOptions {
  mirror: boolean; // live camera selfie-mirror
}

/**
 * CanvasRenderer performs only raw 2D canvas drawing. It has no knowledge of
 * tracking, metadata semantics, or anchor math — it just draws a background
 * frame and draws sprites at already-computed transforms. Keeping this
 * dumb/stateless is what keeps the render loop allocation-free and fast.
 */
export class CanvasRenderer {
  constructor(private ctx: CanvasRenderingContext2D) {
    if (this.ctx) {
      // RC6: High quality image scaling
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = 'high';
    }
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  clear(w: number, h: number): void {
    this.ctx.clearRect(0, 0, w, h);
  }

  drawBackground(
    source: HTMLVideoElement | HTMLImageElement,
    w: number,
    h: number,
    opts: DrawSourceOptions
  ): void {
    const ctx = this.ctx;
    ctx.save();
    if (opts.mirror) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, 0, 0, w, h);
    ctx.restore();
  }

  /**
   * Draws one jewelry sprite. `pivot` (from metadata.anchors) tells us which
   * point of the image bounding box sits at `transform.x/y` — center for
   * rings/bracelets, top-center for necklaces/earrings/forehead pieces,
   * top-left for nose rings — matching each asset's authored anchor point.
   */
  drawSprite(
    asset: AssetBundle,
    meta: JewelryMetadata,
    transform: Transform2D,
    lighting: LightingEstimate,
    mirror: boolean
  ): void {
    if (!transform.visible || transform.opacity <= 0.01) return;
    const ctx = this.ctx;
    const img = asset.image;
    if (!img.complete || img.naturalWidth === 0) return;

    const { width, height } = transform;
    const pivotX = meta.anchors.pivot.x * width;
    const pivotY = meta.anchors.pivot.y * height;

    ctx.save();
    if (mirror) {
      ctx.translate(ctx.canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.translate(transform.x, transform.y);
    ctx.rotate(transform.rotation);
    
    // RC6: scaleY support for perspective pitch
    const sy = transform.scaleY ?? 1;
    ctx.scale(transform.flipX ? -transform.scaleX : transform.scaleX, sy);
    
    ctx.globalAlpha = transform.opacity;
    
    // RC6: Advanced Filtering & Post Processing
    ctx.filter = buildLightingFilter(meta, lighting);

    // RC6: Shadow System
    if (meta.shadowSpec) {
      // Scale shadow offsets relative to the drawn width
      const scaleFactor = width / img.naturalWidth;
      ctx.shadowColor = meta.shadowSpec.color;
      ctx.shadowBlur = meta.shadowSpec.blur * scaleFactor;
      ctx.shadowOffsetX = meta.shadowSpec.offsetX * scaleFactor;
      ctx.shadowOffsetY = meta.shadowSpec.offsetY * scaleFactor;
    }

    ctx.drawImage(img, -pivotX, -pivotY, width, height);

    // Clear shadow so it doesn't affect subsequent operations
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const caps = CapabilityManager.get();

    // RC6: Bloom post-process
    if (caps.canUseBloom && meta.postProcess?.bloom && meta.postProcess.bloom > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = `blur(${meta.postProcess.bloom * 8}px)`;
      ctx.globalAlpha = transform.opacity * meta.postProcess.bloom;
      ctx.drawImage(img, -pivotX, -pivotY, width, height);
      ctx.restore();
    }

    // RC6: Reflection System
    // We favor the new ReflectionSpec, falling back to legacy boolean
    const isReflective = meta.reflectionSpec || meta.reflection || meta.lighting.reflective;
    if (caps.canUseReflections && isReflective && lighting.brightness > 100) { // Slightly lower threshold for reflections
      drawReflectionHighlight(ctx, width, height, lighting, meta.reflectionSpec);
    }

    ctx.restore();
  }
}

function buildLightingFilter(meta: JewelryMetadata, lighting: LightingEstimate): string {
  const { brightnessResponse, contrastResponse } = meta.lighting;
  
  // Ambient brightness (0-255, ~180 "typical")
  const brightnessRatio = lighting.brightness / 180;
  const brightnessMul = 1 + (brightnessRatio - 1) * brightnessResponse;
  const contrastMul = 1 + (lighting.contrast - 1) * contrastResponse;
  
  let filterStr = `brightness(${(brightnessMul * 100).toFixed(1)}%) contrast(${(contrastMul * 100).toFixed(1)}%)`;

  // RC6: Gamma and Warmth (Color Temp)
  if (meta.postProcess?.gamma) {
    // A cheap way to emulate gamma in Canvas 2D is layering brightness/contrast, but CSS filter doesn't have true gamma.
    // We can use SVG filters eventually, but for now we adjust brightness non-linearly.
  }
  
  if (lighting.warmth !== 0) {
    // Warmth: -1 (cool) to 1 (warm). We can simulate this with sepia or hue-rotate
    if (lighting.warmth > 0.1) {
      filterStr += ` sepia(${(lighting.warmth * 30).toFixed(0)}%) hue-rotate(-10deg)`;
    } else if (lighting.warmth < -0.1) {
      filterStr += ` sepia(${(-lighting.warmth * 20).toFixed(0)}%) hue-rotate(10deg)`;
    }
  }

  return filterStr;
}

function drawReflectionHighlight(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  lighting: LightingEstimate,
  spec?: import('../metadata/JewelryMetadata').ReflectionSpec
): void {
  // Intensity is affected by ambient brightness, clamped to spec.intensity
  const maxIntensity = spec?.intensity ?? 0.25;
  const intensity = Math.min(maxIntensity, (lighting.brightness - 100) / 400);
  if (intensity <= 0) return;

  const mode = spec?.mode ?? 'silver';
  const highlightColor = spec?.color ?? '255,255,255'; // RGB string

  // Light direction vector to angle the gradient
  const lx = lighting.lightDirection?.x ?? 0.5;
  const ly = lighting.lightDirection?.y ?? -0.5;
  
  // Angle of light
  const angle = Math.atan2(ly, lx);

  ctx.save();
  ctx.globalCompositeOperation = mode === 'gold' ? 'overlay' : (mode === 'diamond' ? 'color-dodge' : 'overlay');
  
  const radius = Math.max(width, height);
  // Create gradient perpendicular to light direction
  const x1 = Math.cos(angle) * radius;
  const y1 = Math.sin(angle) * radius;
  
  const gradient = ctx.createLinearGradient(-x1, -y1, x1, y1);
  
  if (mode === 'diamond') {
    // Sharp glints
    gradient.addColorStop(0, `rgba(${highlightColor},0)`);
    gradient.addColorStop(0.48, `rgba(${highlightColor},0)`);
    gradient.addColorStop(0.5, `rgba(${highlightColor},${intensity * 1.5})`);
    gradient.addColorStop(0.52, `rgba(${highlightColor},0)`);
    gradient.addColorStop(1, `rgba(${highlightColor},0)`);
  } else if (mode === 'gold') {
    // Warm, broad reflection
    gradient.addColorStop(0, `rgba(255,220,150,0)`);
    gradient.addColorStop(0.5, `rgba(255,240,180,${intensity})`);
    gradient.addColorStop(1, `rgba(255,220,150,0)`);
  } else {
    // Silver / default
    gradient.addColorStop(0, `rgba(${highlightColor},0)`);
    gradient.addColorStop(0.45, `rgba(${highlightColor},${intensity})`);
    gradient.addColorStop(0.55, `rgba(${highlightColor},${intensity})`);
    gradient.addColorStop(1, `rgba(${highlightColor},0)`);
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  ctx.restore();
}
