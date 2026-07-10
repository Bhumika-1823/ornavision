import { FrameState, FaceState, HeadPose } from '../types';

/**
 * Generates synthetic FrameState data representing various face archetypes
 * for testing calibration accuracy and tracking consistency without a camera.
 */
export class FaceLibrary {
  
  static getSmallFace(): FrameState {
    return this.createSyntheticFace('small', 0.8);
  }
  
  static getWideFace(): FrameState {
    return this.createSyntheticFace('wide', 1.2);
  }
  
  static getLongFace(): FrameState {
    return this.createSyntheticFace('long', 1.0, 1.2);
  }
  
  static getAverageFace(): FrameState {
    return this.createSyntheticFace('average', 1.0);
  }
  
  static getTurnedFace(): FrameState {
    const frame = this.createSyntheticFace('turned', 1.0);
    if (frame.face) {
      frame.face.pose.yaw = 0.5; // turned to the side
      // Shift center appropriately
      frame.face.center.x += 100;
    }
    return frame;
  }

  private static createSyntheticFace(id: string, widthScale: number, heightScale = 1.0): FrameState {
    const width = 1280;
    const height = 720;
    const cx = width / 2;
    const cy = height / 2;
    
    // Baseline metrics
    const baseFaceWidth = 200;
    const faceWidthPx = baseFaceWidth * widthScale;
    const eyeDistancePx = 100 * widthScale;
    
    const pose: HeadPose = { pitch: 0, yaw: 0, roll: 0 };
    
    const face: FaceState = {
      present: true,
      confidence: 1.0,
      landmarks: [], // We could populate synthetic 3D landmarks if needed
      pose,
      faceWidthPx,
      eyeDistancePx,
      center: { x: cx, y: cy },
      jaw: { x: cx, y: cy + (120 * heightScale) },
      neckAnchor: { x: cx, y: cy + (180 * heightScale) },
      leftEar: { x: cx - (faceWidthPx/2), y: cy },
      rightEar: { x: cx + (faceWidthPx/2), y: cy },
      foreheadCenter: { x: cx, y: cy - (100 * heightScale) },
      noseTip: { x: cx, y: cy + 20 },
      leftNostril: { x: cx - 20, y: cy + 30 },
      rightNostril: { x: cx + 20, y: cy + 30 },
    };

    return {
      frameIndex: 1,
      timestamp: Date.now(),
      width,
      height,
      face,
      hands: [], wrists: null, body: {
        present: true,
        confidence: 1.0,
        leftShoulder: { x: cx - (faceWidthPx * 1.5), y: cy + (250 * heightScale) },
        rightShoulder: { x: cx + (faceWidthPx * 1.5), y: cy + (250 * heightScale) },
        shoulderWidthPx: faceWidthPx * 3,
        bodyRotation: 0,
        chestCenter: { x: cx, y: cy + (350 * heightScale) }
      },
      lighting: { brightness: 180, contrast: 1, warmth: 0 }
    };
  }
}
