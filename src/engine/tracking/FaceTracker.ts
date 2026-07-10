import { loadScripts } from "./ScriptLoader";

/**
 * FaceTracker owns the MediaPipe FaceMesh instance. Raw results are stored
 * internally and never exposed outside the tracking layer — TrackingManager
 * reads them through `getLatest()` and immediately converts them into
 * FrameState via FacePoseEstimator.
 */
export class FaceTracker {
  private model: any = null;
  private latest: any = null;
  private ready = false;

  async load(): Promise<void> {
    await loadScripts([
      "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js",
    ]);
    // @ts-ignore
    const FaceMeshCtor = (window as any).FaceMesh;
    // MediaPipe overwrites the global Module.locateFile, causing cross-wiring
    // when multiple models are loaded. A smart resolver fixes this entirely.
    const smartLocateFile = (file: string) => {
      if (file.includes("pose"))
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      if (file.includes("hands"))
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    };

    const fm = new FaceMeshCtor({
      locateFile: smartLocateFile,
    });
    fm.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.2, // Lowered for low-light environments
      minTrackingConfidence: 0.2,
    });
    fm.onResults((results: any) => {
      this.latest = results;
    });

    this.model = fm;
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  async send(image: HTMLVideoElement | HTMLImageElement): Promise<void> {
    if (!this.model) return;
    await this.model.send({ image });
  }

  getLatest(): any {
    return this.latest;
  }
}
