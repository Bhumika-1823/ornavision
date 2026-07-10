import { JewelryMetadata } from '../metadata/JewelryMetadata';
import { AssetBundle } from '../assets/AssetManager';
import { FrameState, Transform2D } from '../types';
import { computeNecklaceTransform } from './necklaceAnchor';
import { computeEarringTransforms } from './earringAnchor';
import { computeForeheadTransform } from './foreheadAnchor';
import { computeNoseRingTransform } from './noseRingAnchor';
import { computeRingTransform } from './ringAnchor';
import { computeBraceletTransform } from './braceletAnchor';
import { UserAdjust } from './UserAdjust';
import { PendantEngine } from './PendantEngine';

/**
 * AnchorEngine is the single place that turns (metadata + FrameState + asset)
 * into concrete draw transforms. It never uses fixed screen coordinates —
 * every transform is derived from live tracking data plus the metadata's
 * anatomical anchor description. Adding a new jewelry *category* means
 * adding one function here; adding a new *product* never touches this file.
 */
export class AnchorEngine {
  compute(meta: JewelryMetadata, frame: FrameState, asset: AssetBundle, userAdjust: UserAdjust): Transform2D[] {
    switch (meta.category) {
      case 'necklace': {
        const t = computeNecklaceTransform(meta, frame, asset, userAdjust);
        if (t && meta.pendant) {
          const { transform, metrics } = PendantEngine.compute(t, meta, frame);
          // Attach metrics to frame state so TryonEngine can pull it for profiling
          frame.pendantMetrics = metrics;
          return [transform];
        }
        return t ? [t] : [];
      }
      case 'earrings': {
        const { left, right, metrics } = computeEarringTransforms(meta, frame, asset, userAdjust);
        frame.earringMetrics = metrics;
        const out: Transform2D[] = [];
        if (left) out.push(left);
        if (right) out.push(right);
        return out;
      }
      case 'forehead': {
        const t = computeForeheadTransform(meta, frame, asset, userAdjust);
        return t ? [t] : [];
      }
      case 'nose_ring': {
        const t = computeNoseRingTransform(meta, frame, asset, userAdjust);
        return t ? [t] : [];
      }
      case 'ring': {
        const t = computeRingTransform(meta, frame, asset, userAdjust);
        return t ? [t] : [];
      }
      case 'bracelet':
      case 'watch': {
        const t = computeBraceletTransform(meta, frame, asset, userAdjust);
        return t ? [t] : [];
      }
      default:
        return [];
    }
  }
}

export const anchorEngine = new AnchorEngine();
