import React, { useState, useEffect, useRef, useMemo } from "react";
import { PRODUCTS, Product, JewelleryType } from "@/data/products";
import { useAppContext } from "@/context/AppContext";
import { useTryonEngine, EquippedItem } from "@/hooks/useTryonEngine";
import {
  Camera,
  Image as ImageIcon,
  Download,
  Sparkles,
  ShoppingBag,
  Loader2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  Check,
  ArrowRight,
} from "lucide-react";

const SLOT_LABELS: Record<JewelleryType, string> = {
  necklace: "Necklace",
  earrings: "Earrings",
  forehead: "Mangtika",
  nose_ring: "Nose Ring",
  ring: "Ring",
};

const SLOT_ORDER: JewelleryType[] = [
  "necklace",
  "earrings",
  "forehead",
  "nose_ring",
  "ring",
];

interface SlotAdjust {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const DEFAULT_ADJUST: SlotAdjust = { scale: 1, offsetX: 0, offsetY: 0 };

const TUTORIAL_KEY = "ornavision_tryon_tutorial_seen";
const SPLASH_KEY = "ornavision_tryon_splash_seen";

const TUTORIAL_STEPS = [
  {
    title: "Browse & Wear",
    body: "Use the tabs above the stage to switch between Necklace, Earrings, Mangtika and more. Tap a thumbnail to try it on — one piece at a time.",
  },
  {
    title: "Reposition",
    body: "Use the arrow pad to nudge the piece up, down, left or right until it sits perfectly.",
  },
  {
    title: "Resize",
    body: "Tap the resize icon to open the scale slider and adjust the size of the piece.",
  },
  {
    title: "Capture",
    body: "When it looks perfect, tap the capture button to save a photo of your look.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Pixrity-style animated splash — 100 % inline styles, zero Tailwind classes.
   This ensures it renders correctly regardless of build/purge state.
───────────────────────────────────────────────────────────────────────────── */
function TryonSplash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 400);
    const t2 = setTimeout(() => setPhase("exit"), 2200);
    const t3 = setTimeout(() => onDone(), 2700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onDone]);

  const entering = phase === "enter";
  const exiting = phase === "exit";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background:
          "radial-gradient(ellipse at 60% 40%, #3b1c00 0%, #1a0d00 45%, #0a0600 100%)",
        opacity: exiting ? 0 : 1,
        transition: "opacity 0.55s ease",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
          animation: "orna-pulse 3s ease-in-out infinite",
        }}
      />

      {/* Card */}
      <div
        style={{
          textAlign: "center",
          padding: "2.5rem 3rem",
          background: "rgba(15,8,0,0.6)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(212,175,55,0.22)",
          borderRadius: "1.25rem",
          boxShadow:
            "0 0 80px rgba(212,175,55,0.10), 0 32px 80px rgba(0,0,0,0.6)",
          minWidth: 320,
          transform: entering
            ? "scale(0.88) translateY(16px)"
            : exiting
              ? "scale(1.06) translateY(-8px)"
              : "scale(1) translateY(0)",
          opacity: entering || exiting ? 0 : 1,
          transition:
            "transform 0.55s cubic-bezier(0.16,1,0.3,1), opacity 0.55s ease",
        }}
      >
        {/* Powered-by label */}
        <p
          style={{
            color: "rgba(212,175,55,0.65)",
            fontSize: "0.65rem",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: "1rem",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Powered by
        </p>

        {/* Brand wordmark row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.6rem",
            marginBottom: "0.6rem",
          }}
        >
          {/* O-ring icon */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="16" cy="16" r="13" stroke="#d4af37" strokeWidth="2.5" />
            <circle cx="16" cy="16" r="7" stroke="#d4af37" strokeWidth="1.5" />
            <line
              x1="16"
              y1="3"
              x2="16"
              y2="9"
              stroke="#d4af37"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="16"
              y1="23"
              x2="16"
              y2="29"
              stroke="#d4af37"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="3"
              y1="16"
              x2="9"
              y2="16"
              stroke="#d4af37"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="23"
              y1="16"
              x2="29"
              y2="16"
              stroke="#d4af37"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span
            style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "1.75rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              background:
                "linear-gradient(135deg, #aa771c 0%, #d4af37 50%, #f3e5ab 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Ornavision
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            color: "rgba(245,246,248,0.55)",
            fontSize: "0.78rem",
            fontStyle: "italic",
            letterSpacing: "0.04em",
            marginBottom: "1.8rem",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Transforming imagination into experience
        </p>

        {/* Spinner */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: 36,
              height: 36,
              border: "2.5px solid rgba(212,175,55,0.2)",
              borderTopColor: "#d4af37",
              borderRadius: "50%",
              animation: "orna-spin 0.9s linear infinite",
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes orna-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes orna-pulse {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          50%       { opacity: 1;   transform: translate(-50%, -50%) scale(1.08); }
        }
      `}</style>
    </div>
  );
}

export default function TryonPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialProductSlug = searchParams.get("product");
  const customDesignId = searchParams.get("custom");

  const tryonProducts = useMemo(() => {
    const base = PRODUCTS.filter((p) => p.tryonMetadata !== null);
    if (customDesignId) {
      const customDataUrl = localStorage.getItem("ornavision_custom_tryon");
      if (customDataUrl) {
        return [
          {
            id: `custom-${customDesignId}`,
            name: "My Custom Design",
            slug: `custom-${customDesignId}`,
            description: "Your unique masterpiece crafted in The Atelier.",
            price: 999,
            category: "Necklaces",
            categorySlug: "necklaces",
            stock: 1,
            images: [customDataUrl],
            tryonMetadata: {
              type: "necklace",
              overlayImage: customDataUrl,
              scale: 2.5,
              offsetX: 0,
              offsetY: -150,
            },
            ratingsAvg: 5,
            ratingsCount: 1,
            isFeatured: false,
            material: "Custom Blend",
            weight: "Custom",
            gemstone: "Mixed",
          } as Product,
          ...base,
        ];
      }
    }
    return base;
  }, [customDesignId]);

  const availableSlots = useMemo(
    () =>
      SLOT_ORDER.filter((slot) =>
        tryonProducts.some((p) => p.tryonMetadata?.type === slot),
      ),
    [tryonProducts],
  );

  const productsBySlot = useMemo(() => {
    const map: Partial<Record<JewelleryType, Product[]>> = {};
    availableSlots.forEach((slot) => {
      map[slot] = tryonProducts.filter((p) => p.tryonMetadata?.type === slot);
    });
    return map;
  }, [availableSlots, tryonProducts]);

  const initialProduct =
    tryonProducts.find(
      (p) =>
        p.slug === initialProductSlug || p.slug === `custom-${customDesignId}`,
    ) ||
    productsBySlot[availableSlots[0]]?.[0] ||
    null;

  const [wornProduct, setWornProduct] = useState<Product | null>(
    initialProduct,
  );

  const [adjustments, setAdjustments] = useState<
    Partial<Record<JewelleryType, SlotAdjust>>
  >(() => {
    const initial: Partial<Record<JewelleryType, SlotAdjust>> = {};
    availableSlots.forEach((slot) => {
      initial[slot] = { ...DEFAULT_ADJUST };
    });
    return initial;
  });

  const [activeSlot, setActiveSlot] = useState<JewelleryType>(
    initialProduct?.tryonMetadata?.type || availableSlots[0],
  );

  const [showScaleSlider, setShowScaleSlider] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [flash, setFlash] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  const [mode, setMode] = useState<"live" | "photo">("live");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cameraStarted, setCameraStarted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const { isLoaded, error, startEngine, stopEngine, setItems } =
    useTryonEngine();
  const { addToCart } = useAppContext();

  // Show splash once per session, then tutorial once ever
  useEffect(() => {
    try {
      const splashSeen = sessionStorage.getItem(SPLASH_KEY);
      if (!splashSeen) {
        setShowSplash(true);
        sessionStorage.setItem(SPLASH_KEY, "1");
      } else {
        const tutorialSeen = localStorage.getItem(TUTORIAL_KEY);
        if (!tutorialSeen) setShowTutorial(true);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const onSplashDone = () => {
    setShowSplash(false);
    try {
      const seen = localStorage.getItem(TUTORIAL_KEY);
      if (!seen) setShowTutorial(true);
    } catch {
      /* ignore */
    }
  };

  const dismissTutorial = () => {
    setShowTutorial(false);
    try {
      localStorage.setItem(TUTORIAL_KEY, "1");
    } catch {
      // ignore storage errors
    }
  };

  // Start / restart the engine only when camera/photo readiness or mode changes
  useEffect(() => {
    if (!isLoaded || !canvasRef.current) return;
    if (mode === "live" && !cameraStarted) return;
    if (mode === "photo" && !photoUrl) return;

    canvasRef.current.width = 1280;
    canvasRef.current.height = 720;

    startEngine({
      videoElement: videoRef.current,
      canvasElement: canvasRef.current,
      imageElement: photoRef.current,
      mode,
    });

    return () => stopEngine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, mode, photoUrl, cameraStarted]);

  // Push the currently worn item + its adjustment to the engine whenever it changes,
  // without restarting the camera.
  useEffect(() => {
    const items: EquippedItem[] = [];
    if (wornProduct && wornProduct.tryonMetadata) {
      const slotType = wornProduct.tryonMetadata.type;
      const adjust = adjustments[slotType] || DEFAULT_ADJUST;
      items.push({
        key: slotType,
        metadata: wornProduct.tryonMetadata,
        userScale: adjust.scale,
        userOffsetX: adjust.offsetX,
        userOffsetY: adjust.offsetY,
      });
    }
    setItems(items);
  }, [wornProduct, adjustments, setItems]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoUrl(URL.createObjectURL(file));
      setMode("photo");
      setCameraStarted(false);
    }
  };

  const handleModeSwitch = (newMode: "live" | "photo") => {
    if (newMode === "live") setCameraStarted(false);
    setMode(newMode);
  };

  const downloadSnapshot = () => {
    if (canvasRef.current) {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
      const a = document.createElement("a");
      a.href = canvasRef.current.toDataURL("image/png");
      a.download = `ornavision-tryon-${new Date().getTime()}.png`;
      a.click();
    }
  };

  const wornSlot = wornProduct?.tryonMetadata?.type;

  const nudge = (dx: number, dy: number) => {
    if (!wornSlot) return;
    setAdjustments((prev) => {
      const current = prev[wornSlot] || DEFAULT_ADJUST;
      return {
        ...prev,
        [wornSlot]: {
          ...current,
          offsetX: current.offsetX + dx,
          offsetY: current.offsetY + dy,
        },
      };
    });
  };

  const setScale = (scale: number) => {
    if (!wornSlot) return;
    setAdjustments((prev) => {
      const current = prev[wornSlot] || DEFAULT_ADJUST;
      return { ...prev, [wornSlot]: { ...current, scale } };
    });
  };

  const resetWornSlot = () => {
    if (!wornSlot) return;
    setAdjustments((prev) => ({ ...prev, [wornSlot]: { ...DEFAULT_ADJUST } }));
  };

  const selectProduct = (product: Product) => {
    setWornProduct((prev) => (prev?.id === product.id ? null : product));
  };

  const activeAdjust = (wornSlot && adjustments[wornSlot]) || DEFAULT_ADJUST;

  // In live mode the engine draws the video mirrored (like a selfie mirror) inside
  // the canvas coordinate space. The CSS scaleX(-1) on the <canvas> element then
  // flips the display back to the natural (non-mirrored) orientation so that text
  // and jewellery appear in the correct left-right orientation on screen.
  // Photo mode: neither the engine nor CSS applies mirroring.
  const canvasCssTransform = mode === "live" ? "scaleX(-1)" : "none";

  return (
    <>
      {showSplash && <TryonSplash onDone={onSplashDone} />}

      <div className="min-h-screen bg-background pt-24 pb-10 flex flex-col">
        <div className="container mx-auto px-4 flex-1 flex flex-col">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="brand-font text-3xl md:text-4xl text-foreground mb-2 flex items-center justify-center gap-3">
              <Sparkles className="text-primary" /> Virtual Studio
            </h1>
            <p className="text-muted-foreground text-sm uppercase tracking-widest">
              Experience perfection
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded mb-6 text-center text-sm">
              {error}
            </div>
          )}

          <div className="flex-1 flex flex-col lg:flex-row gap-6">
            {/* Canvas Area */}
            <div className="flex-1 flex flex-col">
              {/* Mode Tabs */}
              <div className="flex bg-secondary/50 rounded-t-lg border-x border-t border-border/50 p-2 gap-2">
                <button
                  onClick={() => handleModeSwitch("live")}
                  className={`flex-1 py-2 rounded text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-colors ${mode === "live" ? "bg-primary text-black" : "bg-transparent text-muted-foreground hover:bg-white/5"}`}
                >
                  <Camera size={14} /> Live Camera
                </button>
                <button
                  onClick={() => handleModeSwitch("photo")}
                  className={`flex-1 py-2 rounded text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-colors ${mode === "photo" ? "bg-primary text-black" : "bg-transparent text-muted-foreground hover:bg-white/5"}`}
                >
                  <ImageIcon size={14} /> Photo Upload
                </button>
              </div>

              {/* Category Tabs */}
              <div className="flex bg-secondary/30 border-x border-border/50 px-2 py-2 gap-2 overflow-x-auto">
                {availableSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => {
                      setActiveSlot(slot);
                      setShowScaleSlider(false);
                    }}
                    className={`shrink-0 px-4 py-1.5 rounded-full text-[11px] uppercase tracking-widest font-semibold border transition-colors ${
                      activeSlot === slot
                        ? "bg-primary text-black border-primary"
                        : "bg-transparent text-muted-foreground border-border/60 hover:border-primary/50"
                    }`}
                  >
                    {SLOT_LABELS[slot]}
                    {wornSlot === slot && (
                      <span
                        className={`ml-1.5 inline-block w-1.5 h-1.5 rounded-full ${activeSlot === slot ? "bg-black" : "bg-primary"}`}
                      />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex-1 bg-black border border-border/50 relative overflow-hidden min-h-[50vh] lg:min-h-[600px] flex items-center justify-center">
                {/* Initializing overlay */}
                {!isLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-primary z-20 bg-black">
                    <Loader2 size={40} className="animate-spin mb-4" />
                    <p className="brand-font text-xl uppercase tracking-widest">
                      Initializing AI Engine...
                    </p>
                    <p className="text-muted-foreground text-xs mt-2">
                      Loading MediaPipe models
                    </p>
                  </div>
                )}

                {/* Hidden processing elements */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="hidden"
                />
                {photoUrl && (
                  <img
                    ref={photoRef}
                    src={photoUrl}
                    className="hidden"
                    alt=""
                  />
                )}

                {/* Live camera start prompt */}
                {isLoaded && mode === "live" && !cameraStarted && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/90">
                    <div
                      className="w-20 h-20 rounded-full border-2 border-primary/40 flex items-center justify-center mb-6"
                      style={{ boxShadow: "0 0 40px rgba(212,175,55,0.15)" }}
                    >
                      <Camera size={36} className="text-primary" />
                    </div>
                    <p className="brand-font text-2xl text-foreground mb-2 uppercase tracking-widest">
                      Live Try-On
                    </p>
                    <p className="text-muted-foreground text-sm mb-8 max-w-xs text-center font-light">
                      Your camera will be used to overlay jewellery in
                      real-time. No photos are stored.
                    </p>
                    <button
                      onClick={() => setCameraStarted(true)}
                      className="btn-gold px-10 py-3 rounded-sm flex items-center gap-2 uppercase tracking-widest text-sm font-bold"
                    >
                      <Camera size={16} /> Activate Camera
                    </button>
                  </div>
                )}

                {/* Photo upload prompt */}
                {isLoaded && mode === "photo" && !photoUrl && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed border-border/50 m-8 rounded-xl bg-secondary/20 z-10">
                    <ImageIcon
                      size={48}
                      className="text-muted-foreground mb-4 opacity-50"
                    />
                    <p className="text-foreground brand-font text-xl mb-2">
                      Upload a Portrait
                    </p>
                    <p className="text-muted-foreground text-sm mb-6 max-w-xs text-center font-light">
                      For best results, use a clear, well-lit photo facing
                      directly at the camera.
                    </p>
                    <label className="btn-gold px-8 py-3 rounded-sm cursor-pointer flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
                      <ImageIcon size={14} /> Select Photo
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </label>
                  </div>
                )}

                {/* Canvas — see comment above canvasCssTransform for mirroring explanation */}
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain"
                  style={{
                    display:
                      (mode === "live" && !cameraStarted) ||
                      (mode === "photo" && !photoUrl)
                        ? "none"
                        : "block",
                    transform: canvasCssTransform,
                  }}
                />

                {/* Capture flash */}
                {flash && (
                  <div
                    className="absolute inset-0 bg-white z-30 pointer-events-none"
                    style={{ opacity: 0.7 }}
                  />
                )}

                {/* On-stage controls (only once a stream is showing) */}
                {isLoaded &&
                  ((mode === "live" && cameraStarted) ||
                    (mode === "photo" && photoUrl)) && (
                    <>
                      {/* Reposition d-pad */}
                      <div
                        className={`absolute bottom-5 left-5 z-20 select-none ${!wornProduct ? "opacity-40 pointer-events-none" : ""}`}
                      >
                        <div className="grid grid-cols-3 grid-rows-3 gap-1 w-[132px]">
                          <div />
                          <button
                            onClick={() => nudge(0, -8)}
                            className="bg-black/60 hover:bg-primary hover:text-black text-primary border border-primary/40 rounded-md flex items-center justify-center h-10 backdrop-blur-sm transition-colors"
                            aria-label="Move up"
                          >
                            <ChevronUp size={18} />
                          </button>
                          <div />
                          <button
                            onClick={() => nudge(-8, 0)}
                            className="bg-black/60 hover:bg-primary hover:text-black text-primary border border-primary/40 rounded-md flex items-center justify-center h-10 backdrop-blur-sm transition-colors"
                            aria-label="Move left"
                          >
                            <ChevronLeft size={18} />
                          </button>
                          <button
                            onClick={resetWornSlot}
                            className="bg-black/60 hover:bg-primary hover:text-black text-primary border border-primary/40 rounded-md flex items-center justify-center h-10 backdrop-blur-sm transition-colors"
                            aria-label="Reset position"
                            title="Reset"
                          >
                            <RotateCcw size={14} />
                          </button>
                          <button
                            onClick={() => nudge(8, 0)}
                            className="bg-black/60 hover:bg-primary hover:text-black text-primary border border-primary/40 rounded-md flex items-center justify-center h-10 backdrop-blur-sm transition-colors"
                            aria-label="Move right"
                          >
                            <ChevronRight size={18} />
                          </button>
                          <div />
                          <button
                            onClick={() => nudge(0, 8)}
                            className="bg-black/60 hover:bg-primary hover:text-black text-primary border border-primary/40 rounded-md flex items-center justify-center h-10 backdrop-blur-sm transition-colors"
                            aria-label="Move down"
                          >
                            <ChevronDown size={18} />
                          </button>
                          <div />
                        </div>
                        <p className="text-[10px] text-center text-primary/80 uppercase tracking-widest mt-2 bg-black/50 rounded px-2 py-1">
                          {wornProduct
                            ? `Adjusting: ${SLOT_LABELS[wornSlot!]}`
                            : "Nothing worn yet"}
                        </p>
                      </div>

                      {/* Scale toggle + slider */}
                      <div
                        className={`absolute bottom-5 right-5 z-20 flex flex-col items-end gap-2 ${!wornProduct ? "opacity-40 pointer-events-none" : ""}`}
                      >
                        {showScaleSlider && (
                          <div className="bg-black/70 backdrop-blur-sm border border-primary/40 rounded-lg p-3 w-[180px]">
                            <p className="text-[10px] text-primary uppercase tracking-widest mb-2">
                              Scale
                            </p>
                            <input
                              type="range"
                              min={0.5}
                              max={1.8}
                              step={0.02}
                              value={activeAdjust.scale}
                              onChange={(e) =>
                                setScale(parseFloat(e.target.value))
                              }
                              className="w-full accent-primary"
                            />
                          </div>
                        )}
                        <button
                          onClick={() => setShowScaleSlider((s) => !s)}
                          className="w-12 h-12 rounded-full bg-black/60 hover:bg-primary hover:text-black text-primary border border-primary/40 flex items-center justify-center backdrop-blur-sm transition-colors"
                          aria-label="Toggle scale slider"
                          title="Resize"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path
                              d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Capture button */}
                      <button
                        onClick={downloadSnapshot}
                        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 w-16 h-16 rounded-full bg-white border-4 border-primary/60 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
                        aria-label="Capture photo"
                        title="Capture"
                      >
                        <span className="w-12 h-12 rounded-full bg-white border-2 border-black/20" />
                      </button>
                    </>
                  )}

                {/* Tutorial overlay */}
                {showTutorial && (
                  <div className="absolute inset-0 bg-black/85 z-40 flex items-center justify-center p-6">
                    <div className="max-w-sm w-full bg-secondary border border-primary/30 rounded-xl p-6 relative">
                      <button
                        onClick={dismissTutorial}
                        className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                        aria-label="Close tutorial"
                      >
                        <X size={18} />
                      </button>
                      <p className="text-primary text-xs uppercase tracking-widest mb-2">
                        Step {tutorialStep + 1} of {TUTORIAL_STEPS.length}
                      </p>
                      <h3 className="brand-font text-xl text-foreground mb-3">
                        {TUTORIAL_STEPS[tutorialStep].title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                        {TUTORIAL_STEPS[tutorialStep].body}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                          {TUTORIAL_STEPS.map((_, i) => (
                            <span
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${i === tutorialStep ? "bg-primary" : "bg-border"}`}
                            />
                          ))}
                        </div>
                        {tutorialStep < TUTORIAL_STEPS.length - 1 ? (
                          <button
                            onClick={() => setTutorialStep((s) => s + 1)}
                            className="btn-gold px-5 py-2 rounded-sm text-xs uppercase tracking-widest font-bold flex items-center gap-2"
                          >
                            Next <ArrowRight size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={dismissTutorial}
                            className="btn-gold px-5 py-2 rounded-sm text-xs uppercase tracking-widest font-bold"
                          >
                            Got it
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              <div className="bg-secondary/30 border-x border-b border-border/50 rounded-b-lg p-3">
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {(productsBySlot[activeSlot] || []).map((p) => {
                    const isWorn = wornProduct?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => selectProduct(p)}
                        className={`shrink-0 w-16 h-16 rounded-md border-2 overflow-hidden relative bg-black p-1 transition-colors ${
                          isWorn
                            ? "border-primary"
                            : "border-border/50 hover:border-primary/50"
                        }`}
                        title={p.name}
                      >
                        <img
                          src={p.images[0]}
                          className="w-full h-full object-contain"
                          alt={p.name}
                        />
                        {isWorn && (
                          <span className="absolute top-0.5 right-0.5 bg-primary text-black rounded-full p-0.5">
                            <Check size={10} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="w-full lg:w-[340px] flex flex-col gap-6 shrink-0">
              {/* Currently worn piece */}
              <div className="glass-card p-5 rounded-xl">
                <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3">
                  Selected Piece
                </h3>
                {!wornProduct && (
                  <p className="text-muted-foreground text-xs">
                    No piece selected yet — tap a thumbnail below the stage to
                    try one on.
                  </p>
                )}
                {wornProduct && (
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-black rounded shrink-0 overflow-hidden p-1 border border-border">
                      <img
                        src={wornProduct.images[0]}
                        className="w-full h-full object-contain"
                        alt={wornProduct.name}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-muted-foreground text-[10px] uppercase tracking-widest">
                        {wornProduct.category}
                      </p>
                      <p className="brand-font text-sm text-foreground truncate">
                        {wornProduct.name}
                      </p>
                      <p className="text-primary text-xs font-bold">
                        ₹{wornProduct.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {wornProduct?.description && (
                  <p className="text-muted-foreground text-xs leading-relaxed mt-3 line-clamp-3">
                    {wornProduct.description}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={downloadSnapshot}
                  className="w-full py-3 border border-primary text-primary hover:bg-primary/10 rounded-sm flex items-center justify-center gap-2 uppercase tracking-widest text-xs font-bold transition-colors"
                >
                  <Download size={14} /> Save Snapshot
                </button>
                <button
                  onClick={() => wornProduct && addToCart(wornProduct.id)}
                  disabled={!wornProduct}
                  className="w-full btn-gold py-3 rounded-sm flex items-center justify-center gap-2 uppercase tracking-widest text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShoppingBag size={14} /> Add to Cart
                </button>
                <button
                  onClick={() => {
                    setTutorialStep(0);
                    setShowTutorial(true);
                  }}
                  className="w-full py-2 text-muted-foreground hover:text-primary text-[11px] uppercase tracking-widest transition-colors"
                >
                  Replay Tutorial
                </button>
              </div>

              {/* AR tips */}
              <div className="glass-card p-4 rounded-xl">
                <h3 className="text-xs text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Sparkles size={12} className="text-primary" /> AR Tips
                </h3>
                <ul className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span> Face the
                    camera straight-on for best accuracy
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span> Good lighting
                    improves landmark detection
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span> Use the d-pad
                    to fine-tune placement
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span> Show your
                    palm clearly for ring &amp; bracelet try-on
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
