import { FrameState } from '../types';

export class TrackingRecorder {
  private frames: FrameState[] = [];
  private isRecording = false;

  start() {
    this.frames = [];
    this.isRecording = true;
  }

  recordFrame(frame: FrameState) {
    if (!this.isRecording) return;
    // Deep clone the frame state to avoid reference mutations
    this.frames.push(JSON.parse(JSON.stringify(frame)));
  }

  stop() {
    this.isRecording = false;
  }

  exportData(): string {
    return JSON.stringify(this.frames);
  }

  download(filename = 'tracking-data.json') {
    if (this.frames.length === 0) return;
    const blob = new Blob([this.exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

export const trackingRecorder = new TrackingRecorder();
