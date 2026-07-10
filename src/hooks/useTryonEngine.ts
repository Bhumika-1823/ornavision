import { useEffect, useRef, useState } from 'react';
import { TryonEngine, EngineStartOptions } from '@/engine/TryonEngine';
import { loadMetadataForProduct } from '@/engine/metadata/MetadataLoader';
import { LegacyTryonMetadata } from '@/engine/metadata/legacyAdapter';
import { RenderableItem } from '@/engine/render/JewelryRenderer';
import { DEFAULT_USER_ADJUST } from '@/engine/anchors/UserAdjust';

/**
 * Public shape kept identical to the pre-refactor hook so pages built
 * against it (tryon.tsx) did not need to change. Internally, `metadata` is
 * now converted through the full MetadataLoader -> JewelryMetadata pipeline
 * instead of being consumed as raw hardcoded values by the renderer.
 */
export interface TryonMetadata extends LegacyTryonMetadata {}

export interface EquippedItem {
  key: string; // stable key, e.g. slot type, used for image/metadata caching
  metadata: TryonMetadata;
  userScale: number;
  userOffsetX: number;
  userOffsetY: number;
}

interface StartOptions {
  videoElement: HTMLVideoElement | null;
  canvasElement: HTMLCanvasElement | null;
  imageElement: HTMLImageElement | null;
  mode: 'live' | 'photo';
}

import { FrameState } from '@/engine/types';
import { TrackingManager } from '@/engine/tracking/TrackingManager';

export interface UseTryonEngineOptions {
  onFrameProcessed?: (frame: FrameState) => void;
  trackingManager?: TrackingManager;
}

export function useTryonEngine(opts?: UseTryonEngineOptions) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<TryonEngine | null>(null);

  useEffect(() => {
    const engine = new TryonEngine({
      onError: (message) => setError(message),
      onFrameProcessed: opts?.onFrameProcessed,
    }, opts?.trackingManager);
    engineRef.current = engine;

    engine
      .init()
      .then(() => setIsLoaded(true))
      .catch(() => setError('Failed to load AR engine dependencies. Please check connection.'));

    return () => {
      engine.stop();
    };
  }, []);

  const setItems = (items: EquippedItem[]) => {
    const renderable: RenderableItem[] = [];
    for (const item of items) {
      const metadata = loadMetadataForProduct({ id: item.key, tryonMetadata: item.metadata });
      if (!metadata) continue;
      renderable.push({
        metadata,
        userAdjust: {
          scale: item.userScale,
          offsetX: item.userOffsetX,
          offsetY: item.userOffsetY,
        },
      });
    }
    engineRef.current?.setItems(renderable);
  };

  const setBrightness = (val: number) => {
    engineRef.current?.setBrightness(val);
  };

  const setDebugMode = (on: boolean) => {
    engineRef.current?.setDebugMode(on);
  };

  const startEngine = (opts: StartOptions) => {
    engineRef.current?.start(opts as EngineStartOptions);
  };

  const stopEngine = () => {
    engineRef.current?.stop();
  };

  return { isLoaded, error, startEngine, stopEngine, setItems, setBrightness, setDebugMode, engine: engineRef.current };
}

export { DEFAULT_USER_ADJUST };
