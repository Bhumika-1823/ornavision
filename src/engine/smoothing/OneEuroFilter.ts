/**
 * One Euro Filter
 * https://gery.casiez.net/1euro/
 *
 * A speed-adaptive low-pass filter: aggressive smoothing when the signal is
 * nearly static (kills jitter) and lower latency when the signal moves fast
 * (avoids the "laggy/rubber-band" feel of a plain EMA under fast motion).
 *
 * Used for landmark positions, rotation, and scale wherever raw tracking
 * data would otherwise visibly shake frame-to-frame.
 */

function smoothingFactor(te: number, cutoff: number): number {
  const r = 2 * Math.PI * cutoff * te;
  return r / (r + 1);
}

function exponentialSmoothing(a: number, x: number, xPrev: number): number {
  return a * x + (1 - a) * xPrev;
}

export interface OneEuroOptions {
  /** Minimum cutoff frequency (Hz). Lower = smoother but more lag at low speed. */
  minCutoff?: number;
  /** Speed coefficient. Higher = filter reacts faster to quick movements. */
  beta?: number;
  /** Cutoff frequency for the derivative. */
  dCutoff?: number;
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;

  private xPrev: number | null = null;
  private dxPrev = 0;
  private tPrev: number | null = null;

  constructor(opts: OneEuroOptions = {}) {
    this.minCutoff = opts.minCutoff ?? 1.0;
    this.beta = opts.beta ?? 0.007;
    this.dCutoff = opts.dCutoff ?? 1.0;
  }

  updateParams(opts: OneEuroOptions): void {
    if (opts.minCutoff !== undefined) this.minCutoff = opts.minCutoff;
    if (opts.beta !== undefined) this.beta = opts.beta;
    if (opts.dCutoff !== undefined) this.dCutoff = opts.dCutoff;
  }

  reset(): void {
    this.xPrev = null;
    this.dxPrev = 0;
    this.tPrev = null;
  }

  /** Filter a new sample. `t` is seconds (e.g. performance.now() / 1000). */
  filter(x: number, t: number): number {
    if (this.xPrev === null || this.tPrev === null) {
      this.xPrev = x;
      this.tPrev = t;
      return x;
    }

    const te = Math.max(t - this.tPrev, 1 / 240); // guard against 0 / negative dt
    const aD = smoothingFactor(te, this.dCutoff);
    const dx = (x - this.xPrev) / te;
    const dxHat = exponentialSmoothing(aD, dx, this.dxPrev);

    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
    const a = smoothingFactor(te, cutoff);
    const xHat = exponentialSmoothing(a, x, this.xPrev);

    this.xPrev = xHat;
    this.dxPrev = dxHat;
    this.tPrev = t;

    return xHat;
  }
}

/** Convenience wrapper that filters an (x, y[, z]) point with independent filters per axis. */
export class OneEuroPointFilter {
  private fx: OneEuroFilter;
  private fy: OneEuroFilter;
  private fz: OneEuroFilter;

  constructor(opts: OneEuroOptions = {}) {
    this.fx = new OneEuroFilter(opts);
    this.fy = new OneEuroFilter(opts);
    this.fz = new OneEuroFilter(opts);
  }

  updateParams(opts: OneEuroOptions): void {
    this.fx.updateParams(opts);
    this.fy.updateParams(opts);
    this.fz.updateParams(opts);
  }

  reset(): void {
    this.fx.reset();
    this.fy.reset();
    this.fz.reset();
  }

  filter(x: number, y: number, z: number, t: number): { x: number; y: number; z: number } {
    return {
      x: this.fx.filter(x, t),
      y: this.fy.filter(y, t),
      z: this.fz.filter(z, t),
    };
  }
}
