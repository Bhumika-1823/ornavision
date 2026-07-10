import { FrameState } from '../types';
import { TrackingManager, TrackingNeeds } from '../tracking/TrackingManager';

/**
 * A mock TrackingManager that replays recorded FrameStates instead of running MediaPipe.
 */
export class TrackingReplay extends TrackingManager {
  private recordedFrames: FrameState[] = [];
  private currentFrameIndex = 0;
  private loop = true;

  loadRecording(jsonString: string) {
    this.recordedFrames = JSON.parse(jsonString);
    this.currentFrameIndex = 0;
  }

  setLoop(loop: boolean) {
    this.loop = loop;
  }

  // Override process to do absolutely nothing since we aren't using real tracking
  async process(source: TexImageSource, needs: TrackingNeeds): Promise<void> {
    // Increment frame counter
    if (this.recordedFrames.length > 0) {
      this.currentFrameIndex++;
      if (this.currentFrameIndex >= this.recordedFrames.length) {
        this.currentFrameIndex = this.loop ? 0 : this.recordedFrames.length - 1;
      }
    }
    return Promise.resolve();
  }

  // Override buildFrameState to return the exact recorded frame (re-scaled if needed)
  buildFrameState(width: number, height: number): FrameState {
    if (this.recordedFrames.length === 0) {
       // Return empty fallback
       return super.buildFrameState(width, height);
    }
    
    const frame = this.recordedFrames[this.currentFrameIndex];
    
    // Ideally, we scale the pixel-space attributes if `width` and `height` differ
    // from the recorded frame.width/frame.height. For now we assume the Replay 
    // canvas matches the recorded canvas aspect ratio.
    const scaleX = width / frame.width;
    const scaleY = height / frame.height;
    
    // We deep clone to allow modifications if necessary
    const clone: FrameState = JSON.parse(JSON.stringify(frame));
    
    // Overwrite canvas dimensions to match current request
    clone.width = width;
    clone.height = height;
    
    return clone;
  }
  
  isFaceReady() { return true; }
  isHandsReady() { return true; }
  isBodyReady() { return true; }

  async loadFace() { return Promise.resolve(); }
  async loadHands() { return Promise.resolve(); }
  async loadBody() { return Promise.resolve(); }
}
