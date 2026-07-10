import { TrackingManager, TrackingNeeds } from './tracking/TrackingManager';
import { CameraManager } from './tracking/CameraManager';
import { FrameScheduler } from './tracking/FrameScheduler';
import { estimateLighting } from './tracking/LightingEstimator';
import { EMPTY_LIGHTING, FrameState, Point2D } from './types';
import { CanvasRenderer } from './render/CanvasRenderer';
import { JewelryRenderer, RenderableItem } from './render/JewelryRenderer';
import { occlusionEngine } from './render/OcclusionEngine';
import { assetManager } from './assets/AssetManager';
import { PerformanceProfiler } from './debug/PerformanceProfiler';
import { drawDebugOverlay } from './debug/DebugOverlay';
import { JewelryCategory } from './metadata/JewelryMetadata';
import { analyticsManager } from './analytics/AnalyticsManager';
import { CapabilityManager } from './core/CapabilityManager';

export interface EngineStartOptions {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  imageElement: HTMLImageElement | null;
  mode: 'live' | 'photo';
}

export interface EngineCallbacks {
  onError: (message: string) => void;
  onFrameProcessed?: (frame: FrameState) => void;
}

const LIGHTING_SAMPLE_SIZE = 48;

/**
 * TryonEngine is the single top-level facade the rest of the app talks to.
 * It owns every subsystem (tracking, anchors, rendering, occlusion,
 * profiling) and exposes a small, stable public API so the React layer
 * (`useTryonEngine`) stays a thin binding rather than containing engine
 * logic itself.
 */
export class TryonEngine {
  private tracking: TrackingManager;
  private cameraManager: CameraManager | null = null;
  private scheduler = new FrameScheduler();
  private profiler = new PerformanceProfiler();
  private jewelryRenderer: JewelryRenderer | null = null;
  private canvasRenderer: CanvasRenderer | null = null;

  private items: RenderableItem[] = [];
  private brightnessOverride = 100; // legacy 0-200% manual slider, 100 = neutral

  private lightingCanvas: HTMLCanvasElement;
  private lightingCtx: CanvasRenderingContext2D | null;

  private opts: EngineStartOptions | null = null;
  private photoIntervalId: number | null = null;
  public debugMode = false;
  private lastNeckCenter: Point2D | null = null;
  private lastPendantCenter: Point2D | null = null;
  private boundContextLost = this.handleContextLost.bind(this);
  private boundContextRestored = this.handleContextRestored.bind(this);

  constructor(private callbacks: EngineCallbacks, trackingManager?: TrackingManager) {
    const caps = CapabilityManager.detect();
    this.tracking = trackingManager || new TrackingManager();
    this.lightingCanvas = document.createElement('canvas');
    this.lightingCanvas.width = LIGHTING_SAMPLE_SIZE;
    this.lightingCanvas.height = LIGHTING_SAMPLE_SIZE;
    this.lightingCtx = this.lightingCanvas.getContext('2d', { willReadFrequently: true });
    (globalThis as any)._profiler = this.profiler;
  }

  /** Loads Face + Hands models eagerly (matches prior UX: app waits on both before enabling try-on). */
  async init(): Promise<void> {
    console.log('[Ornavision] init() — loading Face + Hands models…');
    try {
      await Promise.all([this.tracking.loadFace(), this.tracking.loadHands()]);
      console.log('[Ornavision] init() — models loaded successfully ✓');
    } catch (err) {
      console.error('[Ornavision] init() — model load FAILED:', err);
      throw err;
    }
  }

  isReady(): boolean {
    return this.tracking.isFaceReady() && this.tracking.isHandsReady();
  }

  setItems(items: RenderableItem[]): void {
    // End active sessions for items no longer worn
    const newKeys = new Set(items.map(i => i.metadata.id));
    for (const oldItem of this.items) {
      if (!newKeys.has(oldItem.metadata.id)) {
        analyticsManager.endSession(oldItem.metadata.id);
      }
    }
    
    // Start sessions for newly worn items
    const oldKeys = new Set(this.items.map(i => i.metadata.id));
    for (const newItem of items) {
      if (!oldKeys.has(newItem.metadata.id)) {
        analyticsManager.startSession(newItem.metadata.id);
      }
    }
  
    this.items = items;
    // Kick off lazy loading of body/segmentation trackers the first time
    // they're actually needed, and prune cached image assets for anything
    // NOTE: The Pose/Body tracker is permanently disabled to prevent a fatal
    // MediaPipe Emscripten WASM collision. When pose.js loads while FaceMesh's
    // WASM is already running, it overwrites the shared 'Module' global and
    // crashes the face detector. Necklace/neck anchors work via face landmarks.
    //
    // if (categoriesNeedBody(categories) && !this.tracking.isBodyReady()) {
    //   this.tracking.loadBody().catch((err) => { ... });
    // }
    assetManager.evictExcept(new Set(items.map((i) => i.metadata.id)));
  }

  setBrightness(val: number): void {
    this.brightnessOverride = val;
  }

  setDebugMode(on: boolean): void {
    this.debugMode = on;
  }

  private currentNeeds(): TrackingNeeds {
    const categories = new Set(this.items.map((i) => i.metadata.category));
    return {
      face: categoriesNeedFace(categories),
      hands: categoriesNeedHands(categories),
      body: categoriesNeedBody(categories) && this.tracking.isBodyReady(),
    };
  }

  start(opts: EngineStartOptions): void {
    console.log('[Ornavision] start() called —', { mode: opts.mode, isReady: this.isReady(), hasCanvas: !!opts.canvasElement, hasVideo: !!opts.videoElement, hasImage: !!opts.imageElement });
    if (!this.isReady() || !opts.canvasElement) {
      console.warn('[Ornavision] start() ABORTED — isReady:', this.isReady(), 'hasCanvas:', !!opts.canvasElement);
      return;
    }
    this.opts = opts;

    const ctx = opts.canvasElement.getContext('2d');
    if (!ctx) return;
    this.canvasRenderer = new CanvasRenderer(ctx);
    this.jewelryRenderer = new JewelryRenderer(this.canvasRenderer);

    if (opts.mode === 'live' && opts.videoElement) {
      this.cameraManager = new CameraManager(opts.videoElement);
      this.cameraManager
        .start(async () => {
          const needs = this.currentNeeds();
          await this.tracking.process(opts.videoElement!, needs);
          if (occlusionEngine.enabled) await occlusionEngine.send(opts.videoElement!);
        })
        .catch((err: any) => {
          this.cameraManager = null;
          this.callbacks.onError(
            err?.name === 'NotFoundError' || String(err?.message ?? '').toLowerCase().includes('not found')
              ? 'No camera detected. Please connect a webcam or switch to Photo Upload mode.'
              : `Camera error: ${err?.message ?? 'Unknown error'}`
          );
        });
    }

    if (opts.mode === 'photo' && opts.imageElement) {
      this.cameraManager?.stop();
      this.cameraManager = null;
      const processPhoto = async () => {
        const needs = this.currentNeeds();
        await this.tracking.process(opts.imageElement!, needs);
        if (occlusionEngine.enabled) await occlusionEngine.send(opts.imageElement!);
      };
      this.photoIntervalId = window.setInterval(processPhoto, 300);
      processPhoto();
    }

    opts.canvasElement.addEventListener('webglcontextlost', this.boundContextLost);
    opts.canvasElement.addEventListener('webglcontextrestored', this.boundContextRestored);

    this.scheduler.start(() => this.renderFrame());
  }

  stop(): void {
    this.scheduler.stop();
    if (this.photoIntervalId !== null) {
      clearInterval(this.photoIntervalId);
      this.photoIntervalId = null;
    }
    this.cameraManager?.stop();
    this.cameraManager = null;
    if (this.opts?.canvasElement) {
      this.opts.canvasElement.removeEventListener('webglcontextlost', this.boundContextLost);
      this.opts.canvasElement.removeEventListener('webglcontextrestored', this.boundContextRestored);
    }
    this.opts = null;
    this.jewelryRenderer = null;
    this.canvasRenderer = null;
  }

  private _logCount = 0;
  private renderFrame(): void {
    const opts = this.opts;
    if (!opts || !opts.canvasElement || !this.jewelryRenderer || !this.canvasRenderer) return;

    this.profiler.tickFrame();
    const renderStart = this.profiler.beginStage('render');

    const canvas = opts.canvasElement;
    const w = canvas.width;
    const h = canvas.height;
    const ctx = this.canvasRenderer.getContext();

    const source = opts.mode === 'live' ? opts.videoElement : opts.imageElement;
    if (!source) return;

    // Diagnostic: log every 120 frames (~2s at 60fps) AND draw on-canvas overlay
    this._logCount++;
    if (this._logCount % 120 === 0) {
      const diagFrame = this.tracking.buildFrameState(w, h);
      console.log('[Ornavision] renderFrame #' + this._logCount, {
        hasFace: !!diagFrame.face,
        hasNeckMetrics: !!diagFrame.neckMetrics,
        itemCount: this.items.length,
        items: this.items.map(i => i.metadata.id + ' (' + i.metadata.category + ')'),
      });
    }

    const mirror = opts.mode === 'live';

    this.canvasRenderer.clear(w, h);
    this.canvasRenderer.drawBackground(source, w, h, { mirror });

    // Sample lighting from a small offscreen copy of the *source only*
    // (never the composited canvas), so ambient estimates aren't skewed by
    // already-drawn jewelry and stay cheap regardless of main canvas size.
    if (this.lightingCtx) {
      this.lightingCtx.drawImage(source, 0, 0, LIGHTING_SAMPLE_SIZE, LIGHTING_SAMPLE_SIZE);
    }

    const frame = this.tracking.buildFrameState(w, h);

    // Sample ambient lighting from the small offscreen copy (its own
    // LIGHTING_SAMPLE_SIZE x LIGHTING_SAMPLE_SIZE resolution, not the main
    // canvas), then compose the legacy manual brightness slider on top
    // multiplicatively so existing calibration/UI hooks keep working.
    const sampledLighting = this.lightingCtx
      ? estimateLighting(this.lightingCtx, LIGHTING_SAMPLE_SIZE, LIGHTING_SAMPLE_SIZE)
      : EMPTY_LIGHTING;
    const lighting = {
      ...sampledLighting,
      brightness: sampledLighting.brightness * (this.brightnessOverride / 100),
    };

    this.jewelryRenderer.renderAll(this.items, { ...frame, lighting }, mirror);

    // Always draw a small diagnostic overlay in the top-left corner
    ctx.save();
    ctx.font = '13px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 360, 100);
    ctx.fillStyle = '#0f0';
    ctx.fillText(`Face: ${frame.face ? 'DETECTED ✓' : 'NOT DETECTED ✗'}`, 8, 18);
    ctx.fillText(`NeckMetrics: ${frame.neckMetrics ? 'OK ✓' : 'NONE ✗'}`, 8, 34);
    ctx.fillText(`Items: ${this.items.length} [${this.items.map(i => i.metadata.category).join(', ')}]`, 8, 50);
    if (frame.face) {
      ctx.fillText(`Face pos: (${frame.face.center.x.toFixed(0)}, ${frame.face.center.y.toFixed(0)}) w=${frame.face.faceWidthPx.toFixed(0)}`, 8, 66);
    }
    ctx.fillText(`Frame #${this._logCount}`, 8, 82);
    ctx.restore();

    if (this.debugMode) {
      drawDebugOverlay(ctx, frame, this.profiler);
    }
    
    if (frame.neckMetrics) {
      this.profiler.recordQuality(frame.neckMetrics.trackingQuality);
      if (this.lastNeckCenter) {
        const drift = Math.hypot(
          frame.neckMetrics.neckCenter.x - this.lastNeckCenter.x, 
          frame.neckMetrics.neckCenter.y - this.lastNeckCenter.y
        );
        this.profiler.recordDrift(drift);
      }
      this.lastNeckCenter = frame.neckMetrics.neckCenter;
    }
    
    if (frame.pendantMetrics) {
      this.profiler.recordPendantSwing(frame.pendantMetrics.swingAngle);
      // We don't have the pendant's final center in the frame metrics, 
      // but we could track drift of the neck center since pendant attaches to it.
      // Wait, PendantEngine outputs attachmentError, we can record that.
      this.profiler.recordPendantDrift(frame.pendantMetrics.attachmentError);
    }
    
    if (frame.earringMetrics) {
      let swingSum = 0;
      let driftSum = 0;
      let visSum = 0;
      let count = 0;

      if (frame.earringMetrics.left) {
        swingSum += Math.abs(frame.earringMetrics.left.swingAngle);
        driftSum += frame.earringMetrics.left.attachmentError;
        visSum += frame.earringMetrics.left.visibility;
        count++;
      }
      if (frame.earringMetrics.right) {
        swingSum += Math.abs(frame.earringMetrics.right.swingAngle);
        driftSum += frame.earringMetrics.right.attachmentError;
        visSum += frame.earringMetrics.right.visibility;
        count++;
      }

      if (count > 0) {
        this.profiler.recordEarringSwing(swingSum / count);
        this.profiler.recordEarringDrift(driftSum / count);
        this.profiler.recordEarringVisibility(visSum / count);
      }
    }

    // Record analytics for each currently worn item
    for (const item of this.items) {
      analyticsManager.recordFrame(item.metadata.id, frame);
    }
    
    if (this.callbacks.onFrameProcessed) {
      this.callbacks.onFrameProcessed(frame);
    }

    this.profiler.endStage('render', renderStart);
  }

  private handleContextLost(e: Event) {
    e.preventDefault();
    this.callbacks.onError('WebGL context lost. Rendering paused.');
    this.scheduler.stop();
  }

  private handleContextRestored(e: Event) {
    // Re-init renderers if needed, then resume
    if (this.opts) {
      try {
        this.start(this.opts);
      } catch (err: any) {
        this.callbacks.onError(err.message);
      }
    }
  }
}

function categoriesNeedFace(categories: Set<JewelryCategory>): boolean {
  return ['necklace', 'earrings', 'forehead', 'nose_ring'].some((c) => categories.has(c as JewelryCategory));
}
function categoriesNeedHands(categories: Set<JewelryCategory>): boolean {
  return ['ring', 'bracelet'].some((c) => categories.has(c as JewelryCategory));
}
function categoriesNeedBody(categories: Set<JewelryCategory>): boolean {
  return categories.has('necklace');
}
