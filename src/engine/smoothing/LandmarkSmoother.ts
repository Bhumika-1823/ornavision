import { OneEuroPointFilter, OneEuroOptions } from "./OneEuroFilter";
import { Point3D } from "../types";

/** Simple configurable exponential moving average for scalars (rotation, scale, distance). */
export class EMAScalar {
  private value: number | null = null;
  constructor(private alpha: number = 0.35) {}

  reset(): void {
    this.value = null;
  }

  update(x: number): number {
    if (this.value === null) {
      this.value = x;
    } else {
      this.value = this.alpha * x + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  get(): number | null {
    return this.value;
  }
}

/**
 * Smooths an entire landmark array (e.g. 468 face points or 21 hand points)
 * using a One Euro Filter per-index. Handles arrays changing length (e.g.
 * hand disappearing/reappearing) by lazily allocating filters and resetting
 * them when tracking is lost for more than a couple of frames.
 */
export class LandmarkSmoother {
  private filters: OneEuroPointFilter[] = [];
  private missedFrames = 0;
  private readonly resetAfterMissedFrames = 5;

  constructor(
    private opts: OneEuroOptions = { minCutoff: 1.2, beta: 0.02, dCutoff: 1.0 },
  ) {}

  /** Call once per frame with null when tracking is lost, to allow the filter to reset gracefully. */
  notifyMissing(): void {
    this.missedFrames += 1;
    if (this.missedFrames > this.resetAfterMissedFrames) {
      this.filters.forEach((f) => f.reset());
    }
  }

  smooth(landmarks: Point3D[], t: number): Point3D[] {
    this.missedFrames = 0;
    if (this.filters.length !== landmarks.length) {
      this.filters = landmarks.map(() => new OneEuroPointFilter(this.opts));
    }
    return landmarks.map((p, i) => this.filters[i].filter(p.x, p.y, p.z, t));
  }
}

/** Bundle of scalar smoothers commonly needed for head pose / scale. */
export class ScalarSmootherBundle {
  roll = new EMAScalar(0.4);
  yaw = new EMAScalar(0.3);
  pitch = new EMAScalar(0.3);
  scale = new EMAScalar(0.25);
  distance = new EMAScalar(0.25);

  reset(): void {
    this.roll.reset();
    this.yaw.reset();
    this.pitch.reset();
    this.scale.reset();
    this.distance.reset();
  }
}
