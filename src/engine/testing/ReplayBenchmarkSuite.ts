import { TryonEngine } from "../TryonEngine";
import { FrameState } from "../types";

export interface BenchmarkReport {
  totalFrames: number;
  durationMs: number;
  averageFps: number;
  memoryLeakDetected: boolean;
  startMemoryMB: number;
  endMemoryMB: number;
}

/**
 * Automates long-duration rendering stability tests by consuming
 * an array of recorded FrameState objects as fast as possible, bypassing camera limits.
 */
export class ReplayBenchmarkSuite {
  static async runReplay(
    engine: TryonEngine,
    frames: FrameState[],
    iterations = 10,
  ): Promise<BenchmarkReport> {
    let startMem = 0;
    if (typeof performance !== "undefined" && (performance as any).memory) {
      startMem = (performance as any).memory.usedJSHeapSize / 1048576;
    }

    const start = performance.now();
    let totalFramesProcessed = 0;

    for (let i = 0; i < iterations; i++) {
      for (const frame of frames) {
        // We simulate the private engine loop injecting frames
        // In a real harness, we would override the camera manager.
        // For SDK benchmarking, we just invoke the private `processFrame` or `renderFrame`
        // if exposed, or we can just mock a video element dispatching 'play'.

        // As a prototype, assume we have a hook into the engine or we just pass the frame to Renderer directly.
        (engine as any).jewelryRenderer?.render(
          (engine as any).canvasRenderer?.getContext(),
          (engine as any).items,
          frame,
        );
        totalFramesProcessed++;
      }

      // Yield to event loop to allow GC
      await new Promise((r) => setTimeout(r, 0));
    }

    const duration = performance.now() - start;

    let endMem = 0;
    if (typeof performance !== "undefined" && (performance as any).memory) {
      endMem = (performance as any).memory.usedJSHeapSize / 1048576;
    }

    const leakThresholdMB = 50; // If memory grows by 50MB across the test, it's a leak
    const isLeak = endMem - startMem > leakThresholdMB;

    return {
      totalFrames: totalFramesProcessed,
      durationMs: duration,
      averageFps: (totalFramesProcessed / duration) * 1000,
      memoryLeakDetected: isLeak,
      startMemoryMB: startMem,
      endMemoryMB: endMem,
    };
  }
}
