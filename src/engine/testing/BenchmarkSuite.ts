import { JewelryMetadata } from '../metadata/JewelryMetadata';
import { FaceLibrary } from './FaceLibrary';
import { TryonEngine } from '../TryonEngine';
import { TrackingReplay } from './TrackingReplay';
import { CalibrationMetrics } from './CalibrationMetrics';
import { RenderableItem } from '../render/JewelryRenderer';

export interface BenchmarkReport {
  totalFramesSimulated: number;
  averageFps: number;
  averageRenderMs: number;
  drift: {
    maxDriftPx: number;
    averageDriftPx: number;
  };
}

export class BenchmarkSuite {
  /**
   * Simulates running a set of products across diverse faces without needing the DOM.
   * Node: Requires JSDOM or browser environment for canvas APIs.
   */
  static async run(products: JewelryMetadata[]): Promise<BenchmarkReport> {
    const replay = new TrackingReplay();
    
    // Load diverse faces
    const testFaces = [
      FaceLibrary.getSmallFace(),
      FaceLibrary.getWideFace(),
      FaceLibrary.getLongFace(),
      FaceLibrary.getAverageFace(),
      FaceLibrary.getTurnedFace()
    ];
    
    // Inject all faces as a single recording loop
    replay.loadRecording(JSON.stringify(testFaces));
    replay.setLoop(true);
    
    const engine = new TryonEngine({ onError: () => {} }, replay);
    await engine.init();
    
    // Create an invisible canvas for rendering
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    
    let framesProcessed = 0;
    let renderTimes: number[] = [];
    
    // Set up tracking hook for metrics
    engine['callbacks'].onFrameProcessed = (frame) => {
      // In a real run, we'd pull profiler data here
      framesProcessed++;
    };
    
    const items: RenderableItem[] = products.map(p => ({
      metadata: p,
      userAdjust: { scale: 1, offsetX: 0, offsetY: 0 }
    }));
    
    engine.setItems(items);
    engine.start({
      videoElement: null,
      canvasElement: canvas,
      imageElement: null,
      mode: 'live'
    });

    // Simulate 100 frame loops
    for(let i=0; i<100; i++) {
       const start = performance.now();
       // Manually trigger a frame render
       engine['renderFrame'](); 
       renderTimes.push(performance.now() - start);
    }
    
    engine.stop();
    
    const avgRender = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    
    // Calculate drift on a stable sequence instead of jumping between different faces
    const stableFrames = Array(10).fill(FaceLibrary.getAverageFace());
    
    return {
      totalFramesSimulated: 100,
      averageFps: 1000 / avgRender, // simplistic, ignores inference since we replay
      averageRenderMs: avgRender,
      drift: CalibrationMetrics.getNecklaceAnchorDrift(stableFrames)
    };
  }
}
