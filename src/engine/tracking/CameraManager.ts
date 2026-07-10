/**
 * CameraManager
 * Owns the webcam lifecycle only. Knows nothing about rendering or jewelry.
 */
import { loadScript } from "./ScriptLoader";

export type CameraFrameCallback = () => void | Promise<void>;

export class CameraManager {
  private camera: any = null;
  private starting = false;

  constructor(
    private videoElement: HTMLVideoElement,
    private width = 1280,
    private height = 720,
  ) {}

  isActive(): boolean {
    return !!this.camera;
  }

  async start(onFrame: CameraFrameCallback): Promise<void> {
    if (this.camera || this.starting) return;
    this.starting = true;
    try {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
      );
      // @ts-ignore - global injected by MediaPipe camera_utils script
      const CameraCtor = (window as any).Camera;
      if (!CameraCtor) throw new Error("Camera utility not loaded");
      this.camera = new CameraCtor(this.videoElement, {
        onFrame,
        width: this.width,
        height: this.height,
      });
      await this.camera.start();
    } finally {
      this.starting = false;
    }
  }

  stop(): void {
    if (this.camera) {
      try {
        this.camera.stop();
      } catch {
        /* ignore */
      }
      this.camera = null;
    }
  }
}
