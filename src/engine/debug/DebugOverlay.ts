import { FrameState } from '../types';
import { PerformanceProfiler } from './PerformanceProfiler';

/**
 * DebugOverlay draws developer-mode diagnostics directly onto the canvas:
 * FPS, per-stage timing, tracking confidence, and raw landmark/anchor
 * points. Purely additive — disabled by default and never touched by the
 * production render path unless explicitly enabled.
 */
export function drawDebugOverlay(
  ctx: CanvasRenderingContext2D,
  frame: FrameState,
  profiler: PerformanceProfiler
): void {
  ctx.save();
  ctx.font = '12px monospace';
  ctx.fillStyle = '#00ff88';
  ctx.textBaseline = 'top';

  const { fps, stages, memoryMB, averageDrift, averageQuality, averagePendantSwing, averagePendantDrift, averageEarringSwing, averageEarringDrift, averageEarringVis } = profiler.snapshot();
  const lines = [
    `FPS: ${fps.toFixed(1)}`,
    ...(memoryMB ? [`MEM: ${memoryMB} MB`] : []),
    ...(averageDrift !== undefined ? [`DRIFT: ${averageDrift.toFixed(2)}px`] : []),
    ...(averageQuality !== undefined ? [`QUALITY: ${(averageQuality * 100).toFixed(0)}%`] : []),
    ...(averagePendantSwing !== undefined ? [`PENDANT SWING: ${(averagePendantSwing * (180 / Math.PI)).toFixed(1)}°`] : []),
    ...(averagePendantDrift !== undefined ? [`PENDANT ERR: ${averagePendantDrift.toFixed(2)}px`] : []),
    ...(averageEarringSwing !== undefined ? [`EARRING SWING: ${(averageEarringSwing * (180 / Math.PI)).toFixed(1)}°`] : []),
    ...(averageEarringDrift !== undefined ? [`EARRING ERR: ${averageEarringDrift.toFixed(2)}px`] : []),
    ...(averageEarringVis !== undefined ? [`EARRING VIS: ${(averageEarringVis * 100).toFixed(0)}%`] : []),
    `frame: ${frame.frameIndex}`,
    `face: ${frame.face ? 'tracked' : 'none'}`,
    `hands: ${frame.hands.length}`,
    `body: ${frame.body ? 'tracked' : 'none'}`,
    ...Object.entries(stages).map(([k, v]) => `${k}: ${v.toFixed(2)}ms`),
  ];
  lines.forEach((line, i) => {
    ctx.fillText(line, 8, 8 + i * 14);
  });

  // Face mesh points
  if (frame.face) {
    ctx.fillStyle = 'rgba(0,255,136,0.6)';
    for (const p of frame.face.landmarks) {
      ctx.beginPath();
      ctx.arc(p.x * frame.width, p.y * frame.height, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    drawMarker(ctx, frame.face.neckAnchor.x, frame.face.neckAnchor.y, '#ffcc00');
    drawMarker(ctx, frame.face.foreheadCenter.x, frame.face.foreheadCenter.y, '#ffcc00');
  }

  // Hand landmarks
  if (frame.hands) {
    for (const hand of frame.hands) {
      if (!hand.present) continue;
      
      // Draw Wrist
      ctx.fillStyle = '#ff00ff';
      ctx.beginPath();
      ctx.arc(hand.wrist.x, hand.wrist.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw Palm Normal
      const px = hand.fingers.middle.mcp.x;
      const py = hand.fingers.middle.mcp.y;
      ctx.strokeStyle = '#ffff00';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + hand.palmNormal.x * 50, py + hand.palmNormal.y * 50);
      ctx.stroke();

      // Draw Fingers
      for (const fingerName in hand.fingers) {
        const finger = hand.fingers[fingerName as keyof typeof hand.fingers];
        
        ctx.strokeStyle = finger.isVisible ? '#00ff00' : '#ff0000';
        ctx.lineWidth = finger.widthPx;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(finger.mcp.x, finger.mcp.y);
        ctx.lineTo(finger.pip.x, finger.pip.y);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(finger.tip.x, finger.tip.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Show Curl/Visibility
        ctx.fillStyle = finger.isVisible ? '#00ff00' : '#ff0000';
        ctx.font = '10px monospace';
        ctx.fillText(`curl:${finger.curlAngle.toFixed(1)}`, finger.pip.x + 10, finger.pip.y);
      }
    }
  }

  // Wrist landmarks
  if (frame.wrists) {
    for (const wrist of frame.wrists) {
      if (!wrist.present || !wrist.isVisible) continue;

      // Draw Wrist Center
      ctx.fillStyle = '#00ffff';
      ctx.beginPath();
      ctx.arc(wrist.center.x, wrist.center.y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw Forearm Axis
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(wrist.center.x, wrist.center.y);
      // Forearm direction points towards elbow, so we draw it back up the arm
      ctx.lineTo(
        wrist.center.x - Math.cos(wrist.forearmRotation) * 60,
        wrist.center.y - Math.sin(wrist.forearmRotation) * 60
      );
      ctx.stroke();
    }
  }

  // Body/shoulders
  if (frame.body) {
    ctx.strokeStyle = '#00ccff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(frame.body.leftShoulder.x, frame.body.leftShoulder.y);
    ctx.lineTo(frame.body.rightShoulder.x, frame.body.rightShoulder.y);
    ctx.stroke();
  }

  // Neck Metrics
  if (frame.neckMetrics) {
    const metrics = frame.neckMetrics;
    
    // Chest and Neck Center
    drawMarker(ctx, metrics.neckCenter.x, metrics.neckCenter.y, '#ffff00');
    drawMarker(ctx, metrics.chestCenter.x, metrics.chestCenter.y, '#ffaa00');

    // Shoulder Line
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(metrics.shoulderLine.left.x, metrics.shoulderLine.left.y);
    ctx.lineTo(metrics.shoulderLine.right.x, metrics.shoulderLine.right.y);
    ctx.stroke();

    // Neck Width visualizer
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.beginPath();
    ctx.moveTo(metrics.neckCenter.x - metrics.neckWidthPx / 2, metrics.neckCenter.y + 10);
    ctx.lineTo(metrics.neckCenter.x + metrics.neckWidthPx / 2, metrics.neckCenter.y + 10);
    ctx.stroke();
  }

  // Pendant Metrics
  if (frame.pendantMetrics && frame.neckMetrics) {
    const swingAngle = frame.pendantMetrics.swingAngle;
    
    // Draw gravity vector (straight down from neck center)
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(frame.neckMetrics.neckCenter.x, frame.neckMetrics.neckCenter.y);
    ctx.lineTo(frame.neckMetrics.neckCenter.x, frame.neckMetrics.neckCenter.y + 100);
    ctx.stroke();

    // Draw swing angle vector
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(frame.neckMetrics.neckCenter.x, frame.neckMetrics.neckCenter.y);
    const swingLength = 100;
    // Angle is relative to downward gravity
    const endX = frame.neckMetrics.neckCenter.x + Math.sin(swingAngle) * swingLength;
    const endY = frame.neckMetrics.neckCenter.y + Math.cos(swingAngle) * swingLength;
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw attachment point (mocked as neck center here for visualization)
    drawMarker(ctx, frame.neckMetrics.neckCenter.x, frame.neckMetrics.neckCenter.y, '#ffffff');
  }

  // Earring Metrics
  if (frame.earringMetrics) {
    const renderEar = (metrics: import('../anchors/earringAnchor').EarringMetrics | null, earPt: {x: number, y: number}, label: string) => {
      if (metrics) {
        // Opacity reflects visibility
        ctx.globalAlpha = metrics.visibility;
        drawMarker(ctx, earPt.x, earPt.y, '#ff00ff');
        
        ctx.fillStyle = '#ff00ff';
        ctx.fillText(`${label} VIS: ${(metrics.visibility * 100).toFixed(0)}%`, earPt.x + 10, earPt.y - 10);
        
        if (metrics.swingAngle !== 0) {
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(earPt.x, earPt.y);
          const swingLength = 50;
          // Note: drawing straight down plus swing angle
          const endX = earPt.x + Math.sin(metrics.swingAngle) * swingLength;
          const endY = earPt.y + Math.cos(metrics.swingAngle) * swingLength;
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
      }
    };

    if (frame.face) {
      renderEar(frame.earringMetrics.left, frame.face.leftEar, 'L');
      renderEar(frame.earringMetrics.right, frame.face.rightEar, 'R');
    }
  }

  // Occlusion Masks
  if (frame.frameIndex % 30 === 0 || true) { // We can always render it if in debug mode
    const engine = (globalThis as any)._occlusionEngineForDebug || require('../render/OcclusionEngine').occlusionEngine;
    if (engine && engine.enabled) {
      const regions: import('../render/OcclusionEngine').OcclusionRegion[] = ['hair', 'face', 'neck', 'hands'];
      const colors = ['rgba(255, 0, 0, 0.3)', 'rgba(0, 255, 0, 0.3)', 'rgba(0, 0, 255, 0.3)', 'rgba(255, 255, 0, 0.3)'];
      
      regions.forEach((region, idx) => {
        const c = engine.getDebugCanvas(region);
        if (c) {
          ctx.save();
          // Draw colored overlay for the mask
          ctx.globalCompositeOperation = 'source-over';
          // A bit hacky: we just draw the mask to see its boundaries
          // Realistically, to color tint an alpha mask on canvas:
          ctx.drawImage(c, 0, 0, 160, 90); // Draw small debug thumbnails top right
          ctx.fillStyle = colors[idx];
          ctx.fillText(region.toUpperCase(), 0, 90 + idx * 10);
          ctx.translate(170, 0); // Shift next thumbnail
          ctx.restore();
        }
      });
    }
  }

  // Draw Light Direction if available
  if (frame.lighting.lightDirection && frame.face) {
    const lx = frame.lighting.lightDirection.x;
    const ly = frame.lighting.lightDirection.y;
    const cx = frame.face.foreheadCenter.x;
    const cy = frame.face.foreheadCenter.y - 50;

    ctx.save();
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    // Draw line pointing TOWARDS the light source
    ctx.lineTo(cx + lx * 40, cy + ly * 40);
    ctx.stroke();
    
    // Draw sun icon/marker
    drawMarker(ctx, cx + lx * 40, cy + ly * 40, '#ffff00');
    ctx.fillStyle = '#ffff00';
    ctx.fillText('LIGHT', cx + lx * 40 + 10, cy + ly * 40 - 10);
    ctx.restore();
  }

  ctx.restore();
}

function drawMarker(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
