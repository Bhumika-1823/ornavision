import { FrameState, Point2D } from "../types";

export interface DriftReport {
  maxDriftPx: number;
  averageDriftPx: number;
}

/**
 * Calculates tracking stability and absolute pixel drift across recorded frames.
 */
export class CalibrationMetrics {
  static calculatePointDrift(
    frames: FrameState[],
    getPoint: (f: FrameState) => Point2D | null,
  ): DriftReport {
    if (frames.length < 2) return { maxDriftPx: 0, averageDriftPx: 0 };

    let maxDriftPx = 0;
    let totalDrift = 0;
    let validTransitions = 0;

    for (let i = 1; i < frames.length; i++) {
      const prev = getPoint(frames[i - 1]);
      const curr = getPoint(frames[i]);

      if (prev && curr) {
        const drift = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        if (drift > maxDriftPx) maxDriftPx = drift;
        totalDrift += drift;
        validTransitions++;
      }
    }

    return {
      maxDriftPx,
      averageDriftPx: validTransitions > 0 ? totalDrift / validTransitions : 0,
    };
  }

  // Example predefined metrics
  static getNecklaceAnchorDrift(frames: FrameState[]): DriftReport {
    return this.calculatePointDrift(frames, (f) => f.face?.neckAnchor || null);
  }

  static getEarringAnchorDrift(
    frames: FrameState[],
    side: "left" | "right",
  ): DriftReport {
    return this.calculatePointDrift(frames, (f) =>
      f.face ? (side === "left" ? f.face.leftEar : f.face.rightEar) : null,
    );
  }

  static calculateValueStability(
    frames: FrameState[],
    getValue: (f: FrameState) => number | null,
  ): { maxDelta: number; averageDelta: number } {
    if (frames.length < 2) return { maxDelta: 0, averageDelta: 0 };

    let maxDelta = 0;
    let totalDelta = 0;
    let validTransitions = 0;

    for (let i = 1; i < frames.length; i++) {
      const prev = getValue(frames[i - 1]);
      const curr = getValue(frames[i]);

      if (prev !== null && curr !== null) {
        const delta = Math.abs(curr - prev);
        if (delta > maxDelta) maxDelta = delta;
        totalDelta += delta;
        validTransitions++;
      }
    }

    return {
      maxDelta,
      averageDelta: validTransitions > 0 ? totalDelta / validTransitions : 0,
    };
  }
}
