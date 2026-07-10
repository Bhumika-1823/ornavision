import { CapabilityManager, HardwareTier } from '../core/CapabilityManager';

export interface CompatibilityReport {
  timestamp: number;
  userAgent: string;
  hardware: {
    tier: HardwareTier;
    memoryGiB: number;
    concurrency: number;
  };
  apis: {
    webgl: boolean;
    webglMaxTextureSize: number;
    getUserMedia: boolean;
    canvas2D: boolean;
  };
  features: {
    bloom: boolean;
    segmentation: boolean;
    highResShadows: boolean;
    reflections: boolean;
  };
}

export class DeviceCompatibilityLab {
  static run(): CompatibilityReport {
    const caps = CapabilityManager.get();
    
    let hasWebgl = false;
    let maxTexture = 0;
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      if (gl) {
        hasWebgl = true;
        maxTexture = (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).MAX_TEXTURE_SIZE);
      }
    } catch {}

    let hasMediaDevices = false;
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      hasMediaDevices = true;
    }

    let hasCanvas2D = false;
    try {
      const c = document.createElement('canvas');
      hasCanvas2D = !!c.getContext('2d');
    } catch {}

    return {
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      hardware: {
        tier: caps.tier,
        memoryGiB: caps.deviceMemory,
        concurrency: typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4,
      },
      apis: {
        webgl: hasWebgl,
        webglMaxTextureSize: maxTexture,
        getUserMedia: hasMediaDevices,
        canvas2D: hasCanvas2D
      },
      features: {
        bloom: caps.canUseBloom,
        segmentation: caps.canUseSegmentation,
        highResShadows: caps.canUseHighResShadows,
        reflections: caps.canUseReflections
      }
    };
  }
}
