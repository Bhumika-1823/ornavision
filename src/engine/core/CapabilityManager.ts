export type HardwareTier = 'low' | 'mid' | 'high';

export interface EngineCapabilities {
  tier: HardwareTier;
  canUseBloom: boolean;
  canUseSegmentation: boolean;
  canUseHighResShadows: boolean;
  canUseReflections: boolean;
  maxTextureSize: number;
  deviceMemory: number;
}

/**
 * Detects device hardware limitations at runtime (memory, concurrency, WebGL capabilities)
 * to assign a HardwareTier. This allows the engine to gracefully degrade heavy rendering
 * features (like bloom or occlusion) on weak mobile devices to maintain stable FPS.
 */
export class CapabilityManager {
  private static capabilities: EngineCapabilities | null = null;

  static detect(): EngineCapabilities {
    if (this.capabilities) return this.capabilities;

    let deviceMemory = 4;
    let concurrency = 4;
    let maxTextureSize = 2048;

    // Detect browser hardware APIs
    if (typeof navigator !== 'undefined') {
      deviceMemory = (navigator as any).deviceMemory || 4;
      concurrency = navigator.hardwareConcurrency || 4;
    }

    // Detect WebGL capabilities
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          maxTextureSize = (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).MAX_TEXTURE_SIZE);
        }
      } catch (e) {
        // Ignore
      }
    }

    let tier: HardwareTier = 'mid';
    
    // Simple heuristic for tier assignment
    if (deviceMemory <= 4 || concurrency <= 4 || maxTextureSize <= 2048) {
      tier = 'low';
    } else if (deviceMemory >= 8 && concurrency >= 8 && maxTextureSize >= 4096) {
      tier = 'high';
    }

    // Force override for testing if global flag is set
    if (typeof globalThis !== 'undefined' && (globalThis as any).__FORCE_TIER__) {
      tier = (globalThis as any).__FORCE_TIER__;
    }

    this.capabilities = {
      tier,
      canUseBloom: tier === 'high',
      canUseSegmentation: tier !== 'low', // Mid can use segmentation, but maybe at lower res
      canUseHighResShadows: tier !== 'low',
      canUseReflections: tier !== 'low', // Reflections use expensive gradient overlays
      maxTextureSize,
      deviceMemory
    };

    return this.capabilities;
  }

  static get(): EngineCapabilities {
    return this.detect();
  }
}
