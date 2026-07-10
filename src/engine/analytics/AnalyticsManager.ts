import { FrameState } from "../types";
import { CalibrationMetrics } from "../testing/CalibrationMetrics";

export interface TryonSessionMetrics {
  productId: string;
  sessionStartTime: number;
  totalTimeMs: number;
  captureCount: number;
  failureCount: number; // instances where confidence dropped below threshold
  averageFaceConfidence: number;
  driftMaxPx: number;
}

/**
 * Hook into engine lifecycle to collect real-world usage and tracker stability
 * data for Analytics.
 */
export class AnalyticsManager {
  private activeSessions = new Map<string, Partial<TryonSessionMetrics>>();
  private frameHistory = new Map<string, FrameState[]>();

  startSession(productId: string) {
    this.activeSessions.set(productId, {
      productId,
      sessionStartTime: Date.now(),
      captureCount: 0,
      failureCount: 0,
      averageFaceConfidence: 1.0,
      totalTimeMs: 0,
    });
    this.frameHistory.set(productId, []);
  }

  recordFrame(productId: string, frame: FrameState) {
    const session = this.activeSessions.get(productId);
    if (!session) return;

    const history = this.frameHistory.get(productId)!;

    // Maintain a rolling window of recent frames to calculate drift
    if (history.length > 30) history.shift();
    // We deep clone essential data to prevent reference issues
    history.push(JSON.parse(JSON.stringify(frame)));

    // Track failures (confidence drop)
    if (frame.face) {
      if (frame.face.confidence < 0.5) session.failureCount!++;
      // Running average
      session.averageFaceConfidence =
        (session.averageFaceConfidence! + frame.face.confidence) / 2;
    } else {
      session.failureCount!++;
    }
  }

  recordCapture(productId: string) {
    const session = this.activeSessions.get(productId);
    if (session) session.captureCount!++;
  }

  endSession(productId: string): TryonSessionMetrics | null {
    const session = this.activeSessions.get(productId);
    if (!session || !session.sessionStartTime) return null;

    const history = this.frameHistory.get(productId) || [];
    const drift = CalibrationMetrics.getNecklaceAnchorDrift(history);

    session.totalTimeMs = Date.now() - session.sessionStartTime;
    session.driftMaxPx = drift.maxDriftPx;

    // In production, this would `fetch` to a real analytics backend.
    console.log(`[AnalyticsManager] Session Ended for ${productId}:`, session);

    this.activeSessions.delete(productId);
    this.frameHistory.delete(productId);

    return session as TryonSessionMetrics;
  }
}

export const analyticsManager = new AnalyticsManager();
