import { assetManager } from '../assets/AssetManager';
import { anchorEngine } from '../anchors/AnchorEngine';
import { UserAdjust } from '../anchors/UserAdjust';
import { CapabilityManager } from '../core/CapabilityManager';
import { JewelryMetadata } from '../metadata/JewelryMetadata';
import { FrameState } from '../types';
import { CanvasRenderer } from './CanvasRenderer';
import { occlusionEngine } from './OcclusionEngine';

export interface RenderableItem {
  metadata: JewelryMetadata;
  userAdjust: UserAdjust;
}

/**
 * JewelryRenderer is the per-frame orchestrator: for every currently worn
 * item it resolves cached assets, asks AnchorEngine for the transform(s),
 * and hands them to CanvasRenderer to draw — always in renderOrder so
 * layered pieces (e.g. a choker + a long chain) composite correctly.
 */
export class JewelryRenderer {
  constructor(private canvasRenderer: CanvasRenderer) {}

  renderAll(items: RenderableItem[], frame: FrameState, mirror: boolean): void {
    const drawJobs: { transform: ReturnType<typeof anchorEngine.compute>[number]; item: RenderableItem }[] = [];

    for (const item of items) {
      const asset = assetManager.ensure(
        item.metadata.id,
        item.metadata.image,
        item.metadata.mask,
        item.metadata.shadow
      );
      const transforms = anchorEngine.compute(item.metadata, frame, asset, item.userAdjust);
      for (const transform of transforms) {
        drawJobs.push({ transform, item });
      }
    }

    drawJobs.sort((a, b) => a.transform.renderOrder - b.transform.renderOrder);

    for (const job of drawJobs) {
      const asset = assetManager.get(job.item.metadata.id);
      if (!asset) continue;
      this.canvasRenderer.drawSprite(asset, job.item.metadata, job.transform, frame.lighting, mirror);
      if (occlusionEngine.enabled) {
        // Determine regions based on category
        let regions: import('./OcclusionEngine').OcclusionRegion[] = [];
        if (job.item.metadata.category === 'earrings') {
          regions = ['hair', 'face']; // Hair and face can occlude earrings
        } else if (job.item.metadata.category === 'necklace') {
          regions = ['hair', 'hands', 'body']; // Hair, hands, and lower body (clothing) occludes necklaces
        } else if (job.item.metadata.category === 'ring') {
          regions = ['hands', 'body'];
        } else if (job.item.metadata.category === 'bracelet' || job.item.metadata.category === 'watch') {
          regions = ['hands', 'body', 'clothes'];
        }

        // Must update masks first
        occlusionEngine.updateMasks(frame);

        occlusionEngine.applyOcclusion(
          this.canvasRenderer.getContext(),
          job.transform.x - job.transform.width / 2,
          job.transform.y - job.transform.height / 2,
          job.transform.width,
          job.transform.height,
          regions
        );
      }
    }
  }
}
