/**
 * FrameScheduler owns the requestAnimationFrame loop only. Inference
 * (FaceMesh/Hands/Pose/Segmentation `.send()`) runs on its own cadence,
 * driven by the camera's `onFrame` callback or a photo-mode interval —
 * never inside this loop. This is what lets rendering stay at a smooth
 * 60fps even if a particular inference pass takes a few extra
 * milliseconds on a slower device: the render loop always draws whatever
 * the latest available FrameState is, rather than waiting on inference.
 */
export class FrameScheduler {
  private rafId: number | null = null;
  private running = false;

  start(callback: () => void): void {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      callback();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  isRunning(): boolean {
    return this.running;
  }
}
