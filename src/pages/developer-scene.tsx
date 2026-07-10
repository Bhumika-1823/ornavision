import React, { useState, useEffect, useRef } from 'react';
import { useTryonEngine } from '@/hooks/useTryonEngine';
import { Camera, Bug, Activity, Loader2 } from 'lucide-react';
import { PRODUCTS } from '@/data/products';

export default function DeveloperScenePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { isLoaded, error, startEngine, stopEngine, setItems, setDebugMode } = useTryonEngine();
  const [cameraStarted, setCameraStarted] = useState(false);
  const [debugEnabled, setDebugEnabled] = useState(true);

  // Load a subset of items to test different trackers
  // E.g., one necklace (body), one earring (face), one ring (hands)
  useEffect(() => {
    if (!isLoaded) return;
    
    // Enable debug mode to see performance metrics and landmarks
    setDebugMode(debugEnabled);
    
    if (cameraStarted) {
      if (canvasRef.current && videoRef.current) {
        canvasRef.current.width = 1280;
        canvasRef.current.height = 720;
        startEngine({
          videoElement: videoRef.current,
          canvasElement: canvasRef.current,
          imageElement: null,
          mode: 'live'
        });

        // Set test items to trigger trackers
        const testProducts = [
          PRODUCTS.find(p => p.tryonMetadata?.type === 'necklace'),
          PRODUCTS.find(p => p.tryonMetadata?.type === 'earrings'),
          PRODUCTS.find(p => p.tryonMetadata?.type === 'ring'),
        ].filter(Boolean);

        const items = testProducts.map(p => ({
          key: p!.id,
          metadata: p!.tryonMetadata!,
          userScale: 1,
          userOffsetX: 0,
          userOffsetY: 0
        }));

        setItems(items);
      }
    } else {
      stopEngine();
    }

    return () => stopEngine();
  }, [isLoaded, cameraStarted, debugEnabled]);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-10 flex flex-col font-mono">
      <div className="container mx-auto px-4 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-green-400">
              <Bug size={24} /> Developer Test Scene
            </h1>
            <p className="text-gray-400 text-sm mt-1">Real-time Performance & Tracking Diagnostics</p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={() => setDebugEnabled(!debugEnabled)}
              className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 border ${
                debugEnabled ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-gray-800 text-gray-400 border-gray-700'
              }`}
            >
              <Activity size={16} /> Debug Overlay {debugEnabled ? 'ON' : 'OFF'}
            </button>
            
            <button
              onClick={() => setCameraStarted(!cameraStarted)}
              className={`px-4 py-2 rounded text-sm font-bold flex items-center gap-2 ${
                cameraStarted ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-primary text-black'
              }`}
            >
              <Camera size={16} /> {cameraStarted ? 'Stop Camera' : 'Start Camera'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg relative overflow-hidden flex items-center justify-center">
          {!isLoaded && (
            <div className="flex flex-col items-center justify-center text-green-400">
              <Loader2 size={32} className="animate-spin mb-4" />
              <p className="text-sm">Initializing Tryon Engine...</p>
            </div>
          )}

          <video ref={videoRef} autoPlay playsInline muted className="hidden" />
          
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
            style={{ 
              display: (isLoaded && cameraStarted) ? 'block' : 'none',
              transform: 'scaleX(-1)'
            }}
          />

          {isLoaded && !cameraStarted && (
            <div className="text-center text-gray-500">
              <Camera size={48} className="mx-auto mb-4 opacity-50" />
              <p>Camera stopped. Click Start Camera to begin profiling.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
