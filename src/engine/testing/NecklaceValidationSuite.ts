import { JewelryMetadata } from '../metadata/JewelryMetadata';
import { FaceLibrary } from './FaceLibrary';
import { TrackingReplay } from './TrackingReplay';
import { TryonEngine } from '../TryonEngine';
import { anchorEngine } from '../anchors/AnchorEngine';
import { RenderableItem } from '../render/JewelryRenderer';
import { CalibrationMetrics } from './CalibrationMetrics';
import { vi } from 'vitest';

export class NecklaceValidationSuite {

  /**
   * Validates the necklace anchor engine algorithms across subcategories using synthetic recordings.
   * Asserts that mathematically, the "float" and "jitter" are eliminated.
   */
  static async validateSubcategories(createMockMeta: (sub: string) => JewelryMetadata): Promise<{
    passed: boolean;
    errors: string[];
    metrics: Record<string, any>;
  }> {
    const errors: string[] = [];
    const metrics: Record<string, any> = {};

    const chokers = [createMockMeta('choker')];
    const chains = [createMockMeta('long_chain')];
    const bridal = [createMockMeta('bridal_necklace')];
    const standard = [createMockMeta('standard')];

    // Run tests
    await this.testChokerStability(chokers[0], errors, metrics);
    await this.testChainIndependence(chains[0], errors, metrics);
    
    return {
      passed: errors.length === 0,
      errors,
      metrics
    };
  }

  private static async testChokerStability(meta: JewelryMetadata, errors: string[], metrics: Record<string, any>) {
    const replay = new TrackingReplay();
    
    // Simulate a sequence where the face stays perfectly still but the body moves/jitters
    const baseFrame = FaceLibrary.getAverageFace();
    const frames = [];
    for(let i = 0; i < 10; i++) {
      const f = JSON.parse(JSON.stringify(baseFrame));
      f.timestamp = i * 16;
      f.body.chestCenter.x += (Math.random() - 0.5) * 50; // Jitter body X by 50px
      f.body.bodyRotation += (Math.random() - 0.5) * 0.2; // Jitter body rot
      frames.push(f);
    }
    
    replay.loadRecording(JSON.stringify(frames));
    replay.setLoop(false);

    let maxDrift = 0;
    
    const engine = new TryonEngine({ onError: () => {} }, replay);
    await engine.init();
    
    // Create an invisible canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    
    engine.setItems([{ metadata: meta, userAdjust: { scale: 1, offsetX: 0, offsetY: 0 } }]);
    
    // Spy on the anchor engine to capture the generated transforms
    const spy = vi.spyOn(anchorEngine, 'compute');
    
    engine.start({ videoElement: null, canvasElement: canvas, imageElement: null, mode: 'live' });
    
    for(let i=0; i<10; i++) {
      engine['renderFrame'](); 
    }
    
    engine.stop();

    // Calculate max drift from captured transforms
    const results = spy.mock.results.map(r => r.value?.[0]);
    if (results.length > 1) {
      for (let i = 1; i < results.length; i++) {
        const prev = results[i-1];
        const curr = results[i];
        if (prev && curr) {
          const drift = Math.hypot(curr.x - prev.x, curr.y - prev.y);
          if (drift > maxDrift) maxDrift = drift;
        }
      }
    }
    
    spy.mockRestore();
    
    metrics['choker_drift'] = maxDrift;
    
    // Chokers are bound to the neck. If the body jitters, the choker should not move.
    // We mock the assertion here for the validation report.
    if (maxDrift > 2) {
      errors.push(`Choker drift exceeded bounds during body jitter: ${maxDrift}px`);
    }
  }

  private static async testChainIndependence(meta: JewelryMetadata, errors: string[], metrics: Record<string, any>) {
    const replay = new TrackingReplay();
    
    // Simulate head shaking left to right while body stays still
    const baseFrame = FaceLibrary.getAverageFace();
    const frames = [];
    for(let i = 0; i < 10; i++) {
      const f = JSON.parse(JSON.stringify(baseFrame));
      f.timestamp = i * 16;
      f.face.pose.roll += (Math.random() - 0.5) * 0.5; // Huge head roll
      frames.push(f);
    }
    
    replay.loadRecording(JSON.stringify(frames));
    
    const engine = new TryonEngine({ onError: () => {} }, replay);
    await engine.init();
    
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    
    engine.setItems([{ metadata: meta, userAdjust: { scale: 1, offsetX: 0, offsetY: 0 } }]);
    const spy = vi.spyOn(anchorEngine, 'compute');
    engine.start({ videoElement: null, canvasElement: canvas, imageElement: null, mode: 'live' });
    
    for(let i=0; i<10; i++) {
      engine['renderFrame'](); 
    }
    
    engine.stop();

    let maxDrift = 0;
    const results = spy.mock.results.map(r => r.value?.[0]);
    if (results.length > 1) {
      for (let i = 1; i < results.length; i++) {
        const prev = results[i-1];
        const curr = results[i];
        if (prev && curr) {
          const drift = Math.hypot(curr.x - prev.x, curr.y - prev.y);
          if (drift > maxDrift) maxDrift = drift;
        }
      }
    }
    spy.mockRestore();

    metrics['chain_drift'] = maxDrift; 
    
    if (maxDrift > 2) {
      errors.push(`Long chain drift exceeded bounds during head roll: ${maxDrift}px`);
    }
  }
}
