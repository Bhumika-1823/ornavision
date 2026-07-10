import { loadScripts } from './ScriptLoader';

export class HandTracker {
  private model: any = null;
  private latest: any = null;
  private ready = false;

  async load(): Promise<void> {
    await loadScripts(['https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js']);
    // @ts-ignore
    const HandsCtor = (window as any).Hands;
    const smartLocateFile = (file: string) => {
      if (file.includes('pose')) return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      if (file.includes('face_mesh')) return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    };

    const hnd = new HandsCtor({
      locateFile: smartLocateFile,
    });
    hnd.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    hnd.onResults((results: any) => {
      this.latest = results;
    });

    this.model = hnd;
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
