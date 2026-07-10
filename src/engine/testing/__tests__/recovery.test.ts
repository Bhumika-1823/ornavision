import { describe, it, expect, vi } from 'vitest';
import { TryonEngine } from '../../TryonEngine';
import { ReplayBenchmarkSuite } from '../ReplayBenchmarkSuite';

describe('Production Readiness RC8 (Error Recovery)', () => {
  it('fires onError callback when WebGL context is lost', () => {
    const onError = vi.fn();
    const engine = new TryonEngine({ onError });
    
    // Simulate DOM elements
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    
    // Mock isReady so start doesn't return early
    vi.spyOn(engine, 'isReady').mockReturnValue(true);
    vi.spyOn(canvas, 'getContext').mockReturnValue({} as any);

    engine.start({ videoElement: video, canvasElement: canvas, mode: 'live', imageElement: null });
    
    // Dispatch webglcontextlost
    const event = new Event('webglcontextlost');
    canvas.dispatchEvent(event);
    
    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toContain('WebGL context lost');
  });

  it('runs ReplayBenchmarkSuite without memory leaks over iterations', async () => {
    const onError = vi.fn();
    const engine = new TryonEngine({ onError });
    
    // Generate mock frames
    const frames = Array.from({ length: 10 }, (_, i) => ({
      frameIndex: i,
      timestamp: Date.now(),
      width: 640,
      height: 480,
      face: null,
      hands: [], wrists: null,
      body: null,
      lighting: { brightness: 180, contrast: 1, warmth: 0 }
    }));
    
    const report = await ReplayBenchmarkSuite.runReplay(engine, frames, 2);
    
    expect(report.totalFrames).toBe(20); // 10 frames * 2 iterations
    expect(report.memoryLeakDetected).toBe(false);
    expect(report.averageFps).toBeGreaterThan(0);
  });
});
