import React, { useState, useEffect, useRef } from "react";
import { useTryonEngine } from "@/hooks/useTryonEngine";
import { TrackingReplay } from "@/engine/testing/TrackingReplay";
import { FaceLibrary } from "@/engine/testing/FaceLibrary";
import {
  JewelryMetadata,
  DEFAULT_ANCHORS,
  DEFAULT_CALIBRATION,
  DEFAULT_PERSPECTIVE,
  DEFAULT_LIGHTING,
  DEFAULT_TRACKING_REQUIREMENTS,
  JewelryCategory,
} from "@/engine/metadata/JewelryMetadata";
import { ProductValidator } from "@/engine/calibration/ProductValidator";
import { PreviewGenerator } from "@/engine/calibration/PreviewGenerator";
import {
  Save,
  AlertTriangle,
  CheckCircle,
  Image as ImageIcon,
  Play,
  Pause,
} from "lucide-react";

// Start with a generic empty product shell
const BLANK_PRODUCT: JewelryMetadata = {
  id: "new-product-01",
  category: "necklace",
  subcategory: "generic",
  image: "",
  anchors: JSON.parse(JSON.stringify(DEFAULT_ANCHORS.necklace)),
  defaultScale: 1.0,
  minScale: 0.5,
  maxScale: 2.0,
  rotationOffset: 0,
  perspectiveCompression: JSON.parse(JSON.stringify(DEFAULT_PERSPECTIVE)),
  lighting: JSON.parse(JSON.stringify(DEFAULT_LIGHTING)),
  reflection: false,
  renderOrder: 1,
  qualityLevel: "standard",
  trackingRequirements: JSON.parse(
    JSON.stringify(DEFAULT_TRACKING_REQUIREMENTS.necklace),
  ),
  calibration: JSON.parse(JSON.stringify(DEFAULT_CALIBRATION)),
};

export default function CalibrationStudioPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // We explicitly create a Replay instance to bypass the camera.
  const [replayManager] = useState(() => new TrackingReplay());

  const { isLoaded, startEngine, stopEngine, engine } = useTryonEngine({
    trackingManager: replayManager,
  });

  const [metadata, setMetadata] = useState<JewelryMetadata>(BLANK_PRODUCT);
  const [isPlaying, setIsPlaying] = useState(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Load standard FaceLibrary data into replay on mount
  useEffect(() => {
    // Just inject the synthetic Average Face frame (1 frame looped)
    replayManager.loadRecording(JSON.stringify([FaceLibrary.getAverageFace()]));
  }, [replayManager]);

  // Start engine when ready
  useEffect(() => {
    if (!isLoaded || !canvasRef.current) return;

    // We don't need a video/image element since Replay bypasses inference.
    startEngine({
      videoElement: null,
      canvasElement: canvasRef.current,
      imageElement: null,
      mode: "live",
    });

    return () => stopEngine();
  }, [isLoaded, startEngine, stopEngine]);

  // Push metadata changes to engine
  useEffect(() => {
    if (!isLoaded || !metadata.image) return;
    engine?.setItems([
      {
        metadata,
        userAdjust: { scale: 1, offsetX: 0, offsetY: 0 },
      },
    ]);
  }, [isLoaded, metadata, engine]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setMetadata((prev) => ({ ...prev, image: url }));
    }
  };

  const validateProduct = async () => {
    const report = await ProductValidator.validate(metadata);
    setValidationErrors(report.errors);
    return report.valid;
  };

  const generatePreview = async () => {
    const valid = await validateProduct();
    if (valid) {
      const preview = await PreviewGenerator.generateMannequinPreview(
        metadata,
        300,
        400,
      );
      setPreviewUrl(preview);
    }
  };

  const exportJson = async () => {
    const valid = await validateProduct();
    if (!valid) return;

    const blob = new Blob([JSON.stringify(metadata, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `product-${metadata.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCalibrationChange = (
    field: keyof typeof DEFAULT_CALIBRATION,
    value: number,
  ) => {
    setMetadata((prev) => ({
      ...prev,
      calibration: { ...prev.calibration, [field]: value },
    }));
  };

  const handleAnchorChange = (
    field: "pivot" | "offsetUnits",
    sub: "x" | "y",
    value: number,
  ) => {
    setMetadata((prev) => ({
      ...prev,
      anchors: {
        ...prev.anchors,
        [field]: { ...prev.anchors[field], [sub]: value },
      },
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">
      <header className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2 text-primary">
          Calibration Studio{" "}
          <span className="text-xs bg-primary/20 px-2 py-0.5 rounded">
            v1.5
          </span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={validateProduct}
            className="btn-secondary px-3 py-1.5 rounded text-sm flex items-center gap-1"
          >
            <CheckCircle size={14} /> Validate
          </button>
          <button
            onClick={generatePreview}
            className="btn-secondary px-3 py-1.5 rounded text-sm flex items-center gap-1"
          >
            <ImageIcon size={14} /> Preview
          </button>
          <button
            onClick={exportJson}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-sm font-bold flex items-center gap-1 transition"
          >
            <Save size={14} /> Export JSON
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Controls */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col p-4 overflow-y-auto">
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-4 font-bold">
            1. Asset
          </h2>

          <div className="mb-6">
            <label className="block text-xs mb-1">Base Image (PNG)</label>
            <input
              type="file"
              accept="image/png"
              onChange={handleImageUpload}
              className="text-sm w-full bg-gray-900 p-2 rounded border border-gray-700"
            />
          </div>

          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-4 font-bold">
            2. Calibration (Fine-tune)
          </h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="flex justify-between text-xs mb-1">
                <span>Scale Multiplier</span>
                <span className="text-primary">
                  {metadata.calibration.scaleCorrection.toFixed(2)}x
                </span>
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.05"
                value={metadata.calibration.scaleCorrection}
                onChange={(e) =>
                  handleCalibrationChange(
                    "scaleCorrection",
                    parseFloat(e.target.value),
                  )
                }
                className="w-full accent-primary"
              />
            </div>

            <div>
              <label className="flex justify-between text-xs mb-1">
                <span>Rotation (Rad)</span>
                <span className="text-primary">
                  {metadata.calibration.rotationCorrectionRad.toFixed(2)}
                </span>
              </label>
              <input
                type="range"
                min="-3.14"
                max="3.14"
                step="0.01"
                value={metadata.calibration.rotationCorrectionRad}
                onChange={(e) =>
                  handleCalibrationChange(
                    "rotationCorrectionRad",
                    parseFloat(e.target.value),
                  )
                }
                className="w-full accent-primary"
              />
            </div>
          </div>

          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-4 font-bold">
            3. Anchor Def
          </h2>

          <div className="space-y-4 mb-6">
            <div>
              <label className="flex justify-between text-xs mb-1">
                <span>Pivot X (0-1)</span>
                <span className="text-primary">
                  {metadata.anchors.pivot.x.toFixed(2)}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={metadata.anchors.pivot.x}
                onChange={(e) =>
                  handleAnchorChange("pivot", "x", parseFloat(e.target.value))
                }
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className="flex justify-between text-xs mb-1">
                <span>Pivot Y (0-1)</span>
                <span className="text-primary">
                  {metadata.anchors.pivot.y.toFixed(2)}
                </span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={metadata.anchors.pivot.y}
                onChange={(e) =>
                  handleAnchorChange("pivot", "y", parseFloat(e.target.value))
                }
                className="w-full accent-primary"
              />
            </div>

            <div className="pt-2 border-t border-gray-700">
              <label className="flex justify-between text-xs mb-1">
                <span>Offset Y (Units)</span>
                <span className="text-primary">
                  {metadata.anchors.offsetUnits.y.toFixed(2)}
                </span>
              </label>
              <input
                type="range"
                min="-1"
                max="2"
                step="0.05"
                value={metadata.anchors.offsetUnits.y}
                onChange={(e) =>
                  handleAnchorChange(
                    "offsetUnits",
                    "y",
                    parseFloat(e.target.value),
                  )
                }
                className="w-full accent-primary"
              />
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="mt-auto bg-red-900/30 border border-red-500/50 p-3 rounded text-red-300 text-xs">
              <div className="flex items-center gap-1 font-bold mb-2">
                <AlertTriangle size={14} /> Validation Failed
              </div>
              <ul className="list-disc pl-4 space-y-1">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {validationErrors.length === 0 && metadata.image && (
            <div className="mt-auto bg-green-900/30 border border-green-500/50 p-3 rounded text-green-300 text-xs flex items-center gap-1 font-bold">
              <CheckCircle size={14} /> Product Validated
            </div>
          )}
        </div>

        {/* Center: Stage */}
        <div className="flex-1 bg-black flex flex-col p-4 relative">
          <div className="absolute top-6 right-6 z-10 flex gap-2">
            <button
              onClick={() => {
                replayManager.setLoop(!isPlaying);
                setIsPlaying(!isPlaying);
              }}
              className="bg-gray-800/80 hover:bg-gray-700 p-2 rounded-full backdrop-blur transition"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>

          <div className="flex-1 border border-gray-800 rounded-lg overflow-hidden bg-gray-900 relative">
            <canvas ref={canvasRef} className="w-full h-full object-contain" />
            {!metadata.image && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 pointer-events-none">
                <ImageIcon size={48} className="mb-2 opacity-30" />
                <p>Upload a Base Image to begin calibration</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Previews */}
        <div className="w-64 bg-gray-800 border-l border-gray-700 p-4 flex flex-col">
          <h2 className="text-sm uppercase tracking-wider text-gray-400 mb-4 font-bold">
            Generated Assets
          </h2>

          {previewUrl ? (
            <div className="bg-gray-900 rounded border border-gray-700 p-2 text-center">
              <img
                src={previewUrl}
                alt="Preview"
                className="mx-auto rounded w-[150px] bg-[#f0f0f0]"
              />
              <p className="text-[10px] text-gray-500 mt-2">
                preview.webp (300x400)
              </p>
            </div>
          ) : (
            <div className="bg-gray-900/50 rounded border border-gray-700 border-dashed h-48 flex items-center justify-center text-gray-500 text-xs text-center p-4">
              Click Preview to generate mannequin webp
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
