import { loadScripts } from './ScriptLoader';

export class PoseTracker {
  private model: any = null;
  private latest: any = null;
  private ready = false;

  async load(): Promise<void> {
    await loadScripts(['https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js']);
    // @ts-ignore
    const PoseCtor = (window as any).Pose;
    const smartLocateFile = (file: string) => {
      if (file.includes('face_mesh')) return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      if (file.includes('hands')) return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
    };

    const pose = new PoseCtor({
      locateFile: smartLocateFile,
    });
    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    pose.onResults((results: any) => {
      this.latest = results;
    });

    this.model = pose;
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
