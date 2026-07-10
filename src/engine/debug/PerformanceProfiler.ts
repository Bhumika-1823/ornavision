/**
 * PerformanceProfiler tracks rolling FPS and named stage timings (tracking
 * inference vs. render) using fixed-size ring buffers — no per-frame
 * allocations, so profiling itself never becomes the bottleneck it's
 * measuring.
 */
const WINDOW = 60;

export class PerformanceProfiler {
  private frameTimes: number[] = new Array(WINDOW).fill(0);
  private frameCursor = 0;
  private lastFrameAt = performance.now();

  private stageTimes = new Map<string, number[]>();
  private stageCursor = new Map<string, number>();

  // Real-time quality metrics for Developer Scene
  private driftBuffer: number[] = new Array(WINDOW).fill(0);
  private driftCursor = 0;
  private qualityBuffer: number[] = new Array(WINDOW).fill(0);
  private qualityCursor = 0;

  private pendantSwingBuffer: number[] = new Array(WINDOW).fill(0);
  private pendantSwingCursor = 0;
  private pendantDriftBuffer: number[] = new Array(WINDOW).fill(0);
  private pendantDriftCursor = 0;

  private earringSwingBuffer: number[] = new Array(WINDOW).fill(0);
  private earringSwingCursor = 0;
  private earringDriftBuffer: number[] = new Array(WINDOW).fill(0);
  private earringDriftCursor = 0;
  private earringVisBuffer: number[] = new Array(WINDOW).fill(0);
  private earringVisCursor = 0;

  private maskFpsBuffer: number[] = new Array(WINDOW).fill(0);
  private maskFpsCursor = 0;
  private lastMaskTime = performance.now();

  tickFrame(): void {
    const now = performance.now();
    const dt = now - this.lastFrameAt;
    this.lastFrameAt = now;
    this.frameTimes[this.frameCursor] = dt;
    this.frameCursor = (this.frameCursor + 1) % WINDOW;
  }

  getFps(): number {
    const validTimes = this.frameTimes.filter((t) => t > 0);
    if (validTimes.length === 0) return 0;
    const avgDt = validTimes.reduce((a, b) => a + b, 0) / validTimes.length;
    return avgDt > 0 ? 1000 / avgDt : 0;
  }

  beginStage(name: string): number {
    return performance.now();
  }

  endStage(name: string, startedAt: number): void {
    const elapsed = performance.now() - startedAt;
    if (!this.stageTimes.has(name)) {
      this.stageTimes.set(name, new Array(WINDOW).fill(0));
      this.stageCursor.set(name, 0);
    }
    const buf = this.stageTimes.get(name)!;
    const cursor = this.stageCursor.get(name)!;
    buf[cursor] = elapsed;
    this.stageCursor.set(name, (cursor + 1) % WINDOW);
  }

  getStageAvgMs(name: string): number {
    const buf = this.stageTimes.get(name);
    if (!buf) return 0;
    const valid = buf.filter((t) => t > 0);
    if (valid.length === 0) return 0;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  snapshot(): {
    fps: number;
    stages: Record<string, number>;
    memoryMB?: number;
    averageDrift?: number;
    averageQuality?: number;
    averagePendantSwing?: number;
    averagePendantDrift?: number;
    averageEarringSwing?: number;
    averageEarringDrift?: number;
    averageEarringVis?: number;
    maskFps?: number;
  } {
    const stages: Record<string, number> = {};
    for (const name of this.stageTimes.keys()) {
      stages[name] = this.getStageAvgMs(name);
    }
    const mem = (performance as any).memory;
    const memoryMB = mem
      ? Math.round(mem.usedJSHeapSize / (1024 * 1024))
      : undefined;

    const validDrift = this.driftBuffer.filter((v) => v > 0);
    const averageDrift =
      validDrift.length > 0
        ? validDrift.reduce((a, b) => a + b, 0) / validDrift.length
        : undefined;

    const validQuality = this.qualityBuffer.filter((v) => v > 0);
    const averageQuality =
      validQuality.length > 0
        ? validQuality.reduce((a, b) => a + b, 0) / validQuality.length
        : undefined;

    const validPendantSwing = this.pendantSwingBuffer.filter((v) => v !== 0);
    const averagePendantSwing =
      validPendantSwing.length > 0
        ? validPendantSwing.reduce((a, b) => a + Math.abs(b), 0) /
          validPendantSwing.length
        : undefined;

    const validPendantDrift = this.pendantDriftBuffer.filter((v) => v > 0);
    const averagePendantDrift =
      validPendantDrift.length > 0
        ? validPendantDrift.reduce((a, b) => a + b, 0) /
          validPendantDrift.length
        : undefined;

    const validEarringSwing = this.earringSwingBuffer.filter((v) => v !== 0);
    const averageEarringSwing =
      validEarringSwing.length > 0
        ? validEarringSwing.reduce((a, b) => a + Math.abs(b), 0) /
          validEarringSwing.length
        : undefined;

    const validEarringDrift = this.earringDriftBuffer.filter((v) => v > 0);
    const averageEarringDrift =
      validEarringDrift.length > 0
        ? validEarringDrift.reduce((a, b) => a + b, 0) /
          validEarringDrift.length
        : undefined;

    const validEarringVis = this.earringVisBuffer.filter((v) => v > 0);
    const averageEarringVis =
      validEarringVis.length > 0
        ? validEarringVis.reduce((a, b) => a + b, 0) / validEarringVis.length
        : undefined;

    const validMaskFps = this.maskFpsBuffer.filter((v) => v > 0);
    const maskFps =
      validMaskFps.length > 0
        ? validMaskFps.reduce((a, b) => a + b, 0) / validMaskFps.length
        : undefined;

    return {
      fps: this.getFps(),
      stages,
      memoryMB,
      averageDrift,
      averageQuality,
      averagePendantSwing,
      averagePendantDrift,
      averageEarringSwing,
      averageEarringDrift,
      averageEarringVis,
      maskFps,
    };
  }

  recordDrift(driftPx: number): void {
    this.driftBuffer[this.driftCursor] = driftPx;
    this.driftCursor = (this.driftCursor + 1) % WINDOW;
  }

  recordQuality(quality: number): void {
    this.qualityBuffer[this.qualityCursor] = quality;
    this.qualityCursor = (this.qualityCursor + 1) % WINDOW;
  }

  recordPendantSwing(angle: number): void {
    this.pendantSwingBuffer[this.pendantSwingCursor] = angle;
    this.pendantSwingCursor = (this.pendantSwingCursor + 1) % WINDOW;
  }

  recordPendantDrift(driftPx: number): void {
    this.pendantDriftBuffer[this.pendantDriftCursor] = driftPx;
    this.pendantDriftCursor = (this.pendantDriftCursor + 1) % WINDOW;
  }

  recordEarringSwing(angle: number): void {
    this.earringSwingBuffer[this.earringSwingCursor] = angle;
    this.earringSwingCursor = (this.earringSwingCursor + 1) % WINDOW;
  }

  recordEarringDrift(driftPx: number): void {
    this.earringDriftBuffer[this.earringDriftCursor] = driftPx;
    this.earringDriftCursor = (this.earringDriftCursor + 1) % WINDOW;
  }

  recordEarringVisibility(vis: number): void {
    this.earringVisBuffer[this.earringVisCursor] = vis;
    this.earringVisCursor = (this.earringVisCursor + 1) % WINDOW;
  }

  tickMask(): void {
    const now = performance.now();
    const dt = now - this.lastMaskTime;
    if (dt > 0) {
      this.maskFpsBuffer[this.maskFpsCursor] = 1000 / dt;
      this.maskFpsCursor = (this.maskFpsCursor + 1) % WINDOW;
    }
    this.lastMaskTime = now;
  }
}
