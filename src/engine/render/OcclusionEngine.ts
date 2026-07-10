import { loadScripts } from '../tracking/ScriptLoader';
import { FrameState, Point2D } from '../types';
import { CapabilityManager } from '../core/CapabilityManager';

export type OcclusionRegion = 'hair' | 'face' | 'neck' | 'hands' | 'body' | 'clothes';

export class OcclusionEngine {
  enabled = true; // Enabled for RC5

  private model: any = null;
  private ready = false;
  private latestSegmentation: ImageBitmap | HTMLCanvasElement | null = null;
  
  // Mask Buffers
  private canvases: Record<OcclusionRegion, HTMLCanvasElement | null> = {
    hair: null,
    face: null,
    neck: null,
    hands: null,
    body: null,
    clothes: null
  };
  
  private ctxs: Record<OcclusionRegion, CanvasRenderingContext2D | null> = {
    hair: null,
    face: null,
    neck: null,
    hands: null,
    body: null,
    clothes: null
  };

  private lastFrameIndex = -1;
  private width = 0;
  private height = 0;

  async load(): Promise<void> {
    if (this.ready) return;
    await loadScripts(['https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js']);
    // @ts-ignore
    const Ctor = (window as any).SelfieSegmentation;
    const model = new Ctor({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
    });
    model.setOptions({ modelSelection: 1 });
    model.onResults((results: any) => {
      this.latestSegmentation = results.segmentationMask ?? null;
    });
    this.model = model;
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  async send(image: HTMLVideoElement | HTMLImageElement): Promise<void> {
    if (!this.enabled || !this.model) return;
    await this.model.send({ image });
  }

  private initBuffers(w: number, h: number) {
    if (this.width === w && this.height === h) return;
    this.width = w;
    this.height = h;

    const regions: OcclusionRegion[] = ['hair', 'face', 'neck', 'hands', 'body'];
    for (const r of regions) {
      if (typeof document !== 'undefined') {
        const c = document.createElement('canvas');
        c.width = w;
        c.height = h;
        this.canvases[r] = c;
        this.ctxs[r] = c.getContext('2d', { willReadFrequently: true });
      }
    }
  }

  private drawPolygon(ctx: CanvasRenderingContext2D, points: Point2D[], blur = 4) {
    if (points.length < 3) return;
    ctx.filter = `blur(${blur}px)`;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.filter = 'none';
  }

  /**
   * Generates regional alpha masks using geometry subtraction.
   * Call this once per frame before applying occlusion.
   */
  public updateMasks(frame: FrameState): void {
    if (!CapabilityManager.get().canUseSegmentation) return;
    if (!this.enabled || !this.latestSegmentation) return;
    
    // Only update if it's a new frame
    if (this.lastFrameIndex === frame.frameIndex) return; // already computed
    this.lastFrameIndex = frame.frameIndex;
    
    this.initBuffers(frame.width, frame.height);
    this.lastFrameIndex = frame.frameIndex;

    const bodyCtx = this.ctxs['body'];
    const faceCtx = this.ctxs['face'];
    const neckCtx = this.ctxs['neck'];
    const hairCtx = this.ctxs['hair'];
    const handCtx = this.ctxs['hands'];
    const clothesCtx = this.ctxs['clothes'];

    if (!bodyCtx || !faceCtx || !neckCtx || !hairCtx || !handCtx || !clothesCtx) return;

    // Clear all
    bodyCtx.clearRect(0, 0, this.width, this.height);
    faceCtx.clearRect(0, 0, this.width, this.height);
    neckCtx.clearRect(0, 0, this.width, this.height);
    hairCtx.clearRect(0, 0, this.width, this.height);
    handCtx.clearRect(0, 0, this.width, this.height);
    clothesCtx.clearRect(0, 0, this.width, this.height);

    // 1. Body Mask & Clothes Mask
    bodyCtx.drawImage(this.latestSegmentation as any, 0, 0, this.width, this.height);
    clothesCtx.drawImage(this.latestSegmentation as any, 0, 0, this.width, this.height);

    // 2. Face Mask
    if (frame.face) {
      faceCtx.fillStyle = '#ffffff';
      // Approximate face polygon
      const w = frame.face.faceWidthPx;
      const pts = [
        frame.face.foreheadCenter,
        { x: frame.face.leftEar.x, y: frame.face.leftEar.y - w * 0.2 },
        frame.face.leftEar,
        frame.face.jaw,
        frame.face.rightEar,
        { x: frame.face.rightEar.x, y: frame.face.rightEar.y - w * 0.2 }
      ];
      this.drawPolygon(faceCtx, pts, 8);
    }

    // 3. Neck Mask
    if (frame.neckMetrics) {
      neckCtx.fillStyle = '#ffffff';
      const nm = frame.neckMetrics;
      const w = nm.neckWidthPx;
      const pts = [
        { x: nm.neckCenter.x - w * 0.6, y: nm.neckCenter.y - w * 0.5 },
        { x: nm.neckCenter.x + w * 0.6, y: nm.neckCenter.y - w * 0.5 }
      ];
      if (frame.body) {
        pts.push(frame.body.rightShoulder, frame.body.chestCenter, frame.body.leftShoulder);
      } else {
        pts.push({ x: nm.neckCenter.x + w * 1.5, y: nm.neckCenter.y + w * 2 });
        pts.push({ x: nm.neckCenter.x - w * 1.5, y: nm.neckCenter.y + w * 2 });
      }
      this.drawPolygon(neckCtx, pts, 12);
    }

    // 4. Hand Mask
    if (frame.hands && frame.hands.length > 0) {
      const handsCtx = this.ctxs['hands']!;
      handsCtx.fillStyle = '#ffffff';
      
      for (const hand of frame.hands) {
        // Draw Palm
        this.drawPolygon(handsCtx, [
          hand.fingers.index.mcp,
          hand.fingers.pinky.mcp,
          hand.wrist,
          hand.fingers.thumb.mcp
        ], 2);

        // Draw Distal Phalanges
        for (const fingerName of Object.keys(hand.fingers) as Array<keyof typeof hand.fingers>) {
          const finger = hand.fingers[fingerName];
          
          const widthHalf = finger.widthPx / 2;
          const dx = Math.cos(finger.angle) * widthHalf;
          const dy = Math.sin(finger.angle) * widthHalf;
          
          this.drawPolygon(handsCtx, [
            { x: finger.pip.x - dy, y: finger.pip.y + dx },
            { x: finger.pip.x + dy, y: finger.pip.y - dx },
            { x: finger.tip.x + dy, y: finger.tip.y - dx },
            { x: finger.tip.x - dy, y: finger.tip.y + dx }
          ], 2);
        }
      }
    }

    // 5. Hair Mask (Body - Face - Neck)
    hairCtx.drawImage(this.canvases['body']!, 0, 0);
    hairCtx.globalCompositeOperation = 'destination-out';
    hairCtx.drawImage(this.canvases['face']!, 0, 0);
    hairCtx.drawImage(this.canvases['neck']!, 0, 0);
    hairCtx.globalCompositeOperation = 'source-over'; // reset

    // Tick mask performance
    const profiler = (globalThis as any)._profiler;
    if (profiler) {
      profiler.tickMask();
    }
  }

  /**
   * Returns the debug canvas for a region if requested.
   */
  public getDebugCanvas(region: OcclusionRegion): HTMLCanvasElement | null {
    return this.canvases[region];
  }

  /**
   * Composites the regional masks onto an already-drawn sprite.
   */
  applyOcclusion(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    regions: OcclusionRegion[]
  ): void {
    if (!this.enabled || !this.latestSegmentation) return;
    
    ctx.save();
    ctx.globalCompositeOperation = 'destination-in';
    
    // Create a temporary mask to combine the requested regions
    // We assume the caller wants to be occluded BY these regions.
    // Wait, destination-in means "keep what overlaps".
    // If we want jewelry to be occluded BY hair, it means we KEEP what DOES NOT overlap hair.
    // So we should do destination-out with the regions!
    ctx.globalCompositeOperation = 'destination-out';
    
    for (const region of regions) {
      const c = this.canvases[region];
      if (c) {
        ctx.drawImage(c, x, y, w, h, x, y, w, h); // Draw only the bounding box to save fill rate
      }
    }
    
    ctx.restore();
  }
}

export const occlusionEngine = new OcclusionEngine();
