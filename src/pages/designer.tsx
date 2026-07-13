import React, { useState, useRef, useEffect } from "react";
import { Save, Trash2, LayoutGrid, Palette, Layers, Info } from "lucide-react";
import { motion } from "framer-motion";

// Mock component parts
interface ComponentTemplate {
  id: string;
  name: string;
  type: string;
  svg?: string;
  imageUrl?: string;
  width?: number;
  height?: number;
}

const CHAINS: ComponentTemplate[] = [
  {
    id: "chain-big1",
    name: "Big Chain 1",
    imageUrl: "/images/designer/bigchain1.png",
    width: 400,
    height: 400,
    type: "chain",
  },
  {
    id: "chain-new1",
    name: "New Chain 1",
    imageUrl: "/images/designer/chain1.png",
    width: 350,
    height: 400,
    type: "chain",
  },
  {
    id: "chain-simple",
    name: "Simple Chain",
    imageUrl: "/images/designer/simple_chain.png",
    width: 316,
    height: 400,
    type: "chain",
  },
  {
    id: "chain-new2",
    name: "New Chain 2",
    imageUrl: "/images/designer/chain2.png",
    width: 400,
    height: 400,
    type: "chain",
  },
  {
    id: "chain-chai1",
    name: "Chai Chain 1",
    imageUrl: "/images/designer/chai1.png",
    width: 400,
    height: 400,
    type: "chain",
  },
  {
    id: "chain-chai2",
    name: "Chai Chain 2",
    imageUrl: "/images/designer/chai2.png",
    width: 400,
    height: 400,
    type: "chain",
  },
  {
    id: "chain-chai3",
    name: "Chai Chain 3",
    imageUrl: "/images/designer/chai3.png",
    width: 400,
    height: 400,
    type: "chain",
  },
];

const PENDANTS: ComponentTemplate[] = [
  {
    id: "pend-in4",
    name: "Design 4",
    imageUrl: "/images/designer/in4.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-in5",
    name: "Design 5",
    imageUrl: "/images/designer/in5.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-in6",
    name: "Design 6",
    imageUrl: "/images/designer/in6.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-in7",
    name: "Design 7",
    imageUrl: "/images/designer/in7.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-in8",
    name: "Design 8",
    imageUrl: "/images/designer/in8.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-in15",
    name: "Design 15",
    imageUrl: "/images/designer/in15.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-i15",
    name: "Design 15b",
    imageUrl: "/images/designer/pend-i15.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-i19",
    name: "Design 19",
    imageUrl: "/images/designer/pend-i19.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-i20",
    name: "Design 20",
    imageUrl: "/images/designer/pend-i20.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-i21",
    name: "Design 21",
    imageUrl: "/images/designer/pend-i21.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-i22",
    name: "Design 22",
    imageUrl: "/images/designer/pend-i22.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-i23",
    name: "Design 23",
    imageUrl: "/images/designer/pend-i23.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-i24",
    name: "Design 24",
    imageUrl: "/images/designer/pend-i24.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-i25",
    name: "Design 25",
    imageUrl: "/images/designer/pend-i25.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-i26",
    name: "Design 26",
    imageUrl: "/images/designer/pend-i26.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-i27",
    name: "Design 27",
    imageUrl: "/images/designer/pend-i27.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
  {
    id: "pend-i28",
    name: "Design 28",
    imageUrl: "/images/designer/pend-i28.png",
    width: 150,
    height: 150,
    type: "pendant",
  },
];

const GEMSTONES: ComponentTemplate[] = [
  {
    id: "gem-1",
    name: "Round Diamond",
    svg: '<circle cx="0" cy="0" r="20" fill="var(--gem-color)" />',
    type: "gemstone",
  },
  {
    id: "gem-2",
    name: "Emerald Cut",
    svg: '<rect x="-20" y="-30" width="40" height="60" fill="var(--gem-color)" />',
    type: "gemstone",
  },
  {
    id: "gem-3",
    name: "Oval Gem",
    svg: '<ellipse cx="0" cy="0" rx="25" ry="35" fill="var(--gem-color)" />',
    type: "gemstone",
  },
  {
    id: "gem-i3",
    name: "Diamond 3",
    imageUrl: "/images/designer/gem-i3.png",
    width: 50,
    height: 50,
    type: "gemstone",
  },
  {
    id: "gem-i4",
    name: "Diamond 4",
    imageUrl: "/images/designer/gem-i4.png",
    width: 50,
    height: 50,
    type: "gemstone",
  },
  {
    id: "gem-i5",
    name: "Diamond 5",
    imageUrl: "/images/designer/gem-i5.png",
    width: 50,
    height: 50,
    type: "gemstone",
  },
  {
    id: "gem-i7",
    name: "Diamond 7",
    imageUrl: "/images/designer/gem-i7.png",
    width: 50,
    height: 50,
    type: "gemstone",
  },
  {
    id: "gem-i9",
    name: "Diamond 9",
    imageUrl: "/images/designer/gem-i9.png",
    width: 50,
    height: 50,
    type: "gemstone",
  },
  {
    id: "gem-i10",
    name: "Diamond 10",
    imageUrl: "/images/designer/gem-i10.png",
    width: 50,
    height: 50,
    type: "gemstone",
  },
  {
    id: "gem-i11",
    name: "Diamond 11",
    imageUrl: "/images/designer/gem-i11.png",
    width: 50,
    height: 50,
    type: "gemstone",
  },
  {
    id: "gem-i12",
    name: "Diamond 12",
    imageUrl: "/images/designer/gem-i12.png",
    width: 50,
    height: 50,
    type: "gemstone",
  },
  {
    id: "gem-i13",
    name: "Diamond 13",
    imageUrl: "/images/designer/gem-i13.png",
    width: 50,
    height: 50,
    type: "gemstone",
  },
  {
    id: "gem-i14",
    name: "Diamond 14",
    imageUrl: "/images/designer/gem-i14.png",
    width: 50,
    height: 50,
    type: "gemstone",
  },
];

interface PlacedComponent {
  id: string; // unique instance ID
  baseId: string; // reference to template
  type: string;
  svg?: string;
  imageUrl?: string;
  width?: number;
  height?: number;
  metalColor?: string;
  gemColor?: string;
  x: number;
  y: number;
  scale: number;
}

const METAL_COLORS = [
  { name: "Yellow Gold", value: "#d4af37" },
  { name: "White Gold", value: "#e5e7eb" },
  { name: "Rose Gold", value: "#b76e79" },
  { name: "Silver", value: "#c0c0c0" },
];

const GEM_COLORS = [
  { name: "Diamond (White)", value: "#ffffff" },
  { name: "Ruby (Red)", value: "#e0115f" },
  { name: "Emerald (Green)", value: "#50c878" },
  { name: "Sapphire (Blue)", value: "#0f52ba" },
];

export default function DesignerPage() {
  const [components, setComponents] = useState<PlacedComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "chains" | "pendants" | "gemstones"
  >("chains");
  const [activeTool, setActiveTool] = useState<any>(null); // holds template to be placed
  const svgRef = useRef<SVGSVGElement>(null);

  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [designName, setDesignName] = useState("My Custom Design");
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("ornavision_designs");
    if (saved) {
      try {
        setSavedDesigns(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const getMousePos = (
    e: React.MouseEvent | React.PointerEvent,
    svgElem: SVGSVGElement,
  ) => {
    const CTM = svgElem.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d,
    };
  };

  const handlePointerDown = (
    e: React.PointerEvent<SVGGElement>,
    compId: string,
  ) => {
    e.stopPropagation();
    if (activeTool) return; // In placement mode
    setSelectedId(compId);
    const svgElem = e.currentTarget.ownerSVGElement;
    if (svgElem) {
      const pos = getMousePos(e, svgElem);
      const comp = components.find((c) => c.id === compId);
      if (comp) {
        setDraggingId(compId);
        setDragOffset({
          x: pos.x - comp.x,
          y: pos.y - comp.y,
        });
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGGElement>) => {
    if (draggingId === e.currentTarget.dataset.id) {
      const svgElem = e.currentTarget.ownerSVGElement;
      if (svgElem) {
        const pos = getMousePos(e, svgElem);
        setComponents((comps) =>
          comps.map((c) =>
            c.id === draggingId
              ? { ...c, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
              : c,
          ),
        );
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGGElement>) => {
    if (draggingId === e.currentTarget.dataset.id) {
      setDraggingId(null);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool) {
      const svgElem = e.currentTarget;
      const pos = getMousePos(e, svgElem);

      // Add component
      const newComp: PlacedComponent = {
        id: `comp-${Date.now()}`,
        baseId: activeTool.id,
        type: activeTool.type,
        svg: activeTool.svg,
        imageUrl: activeTool.imageUrl,
        width: activeTool.width,
        height: activeTool.height,
        x: pos.x,
        y: pos.y,
        scale: 1,
        metalColor: METAL_COLORS[0].value,
        gemColor: GEM_COLORS[0].value,
      };
      setComponents([...components, newComp]);
      setSelectedId(newComp.id);
      setActiveTool(null); // Reset tool after placement
    } else {
      // Deselect if clicking empty space (assuming background click)
      if (e.target === e.currentTarget) {
        setSelectedId(null);
      }
    }
  };

  const updateSelected = (updates: Partial<PlacedComponent>) => {
    if (!selectedId) return;
    setComponents(
      components.map((c) => (c.id === selectedId ? { ...c, ...updates } : c)),
    );
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setComponents(components.filter((c) => c.id !== selectedId));
    setSelectedId(null);
  };

  const saveDesign = () => {
    const design = {
      id: Date.now().toString(),
      name: designName,
      data: components,
    };
    const newSaved = [...savedDesigns, design];
    setSavedDesigns(newSaved);
    localStorage.setItem("ornavision_designs", JSON.stringify(newSaved));
    return design.id;
  };

  const handleSaveClick = () => {
    saveDesign();
    alert("Design saved!");
  };

  const tryOnDesign = async () => {
    if (!svgRef.current || components.length === 0) return;
    const designId = saveDesign();

    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw components one by one
    for (const comp of components) {
      await new Promise<void>((resolve) => {
        if (comp.imageUrl) {
          const img = new Image();
          img.onload = () => {
            ctx.save();
            ctx.translate(comp.x, comp.y);
            ctx.scale(comp.scale, comp.scale);
            const w = comp.width || 100;
            const h = comp.height || 100;
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
            ctx.restore();
            resolve();
          };
          img.onerror = () => resolve();
          img.src = comp.imageUrl;
        } else if (comp.svg) {
          const viewBox =
            comp.type === "chain" ? "-220 -20 440 40" : "-60 -60 120 120";
          const svgWrapper = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" style="color: ${comp.metalColor || "#fff"}; --gem-color: ${comp.gemColor || "#fff"};"><g fill="currentColor">${comp.svg}</g></svg>`;
          const svgBlob = new Blob([svgWrapper], {
            type: "image/svg+xml;charset=utf-8",
          });
          const url = URL.createObjectURL(svgBlob);
          const img = new Image();
          img.onload = () => {
            ctx.save();
            ctx.translate(comp.x, comp.y);
            ctx.scale(comp.scale, comp.scale);
            if (comp.type === "chain") {
              ctx.drawImage(img, -220, -20, 440, 40);
            } else {
              ctx.drawImage(img, -60, -60, 120, 120);
            }
            ctx.restore();
            URL.revokeObjectURL(url);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve();
          };
          img.src = url;
        } else {
          resolve();
        }
      });
    }

    const dataUrl = canvas.toDataURL("image/png");
    localStorage.setItem("ornavision_custom_tryon", dataUrl);
    window.location.href = `/tryon?custom=${designId}`;
  };

  const loadDesign = (design: any) => {
    setComponents(design.data);
    setDesignName(design.name);
    setSelectedId(null);
  };

  const selectedComp = components.find((c) => c.id === selectedId);

  return (
    <div className="min-h-screen bg-background pt-24 pb-10 flex flex-col">
      <div className="container mx-auto px-4 flex-1 flex flex-col">
        <div className="text-center mb-8">
          <h1 className="brand-font text-4xl text-foreground mb-2">
            The Atelier
          </h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            Compose your unique masterpiece
          </p>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 border border-border/50 rounded-xl overflow-hidden bg-card/20">
          {/* Left Toolbar */}
          <div className="w-full lg:w-64 bg-secondary/30 border-r border-border/50 flex flex-col">
            <div className="flex border-b border-border/50">
              <button
                className={`flex-1 py-3 text-xs uppercase tracking-widest font-semibold transition-colors ${activeTab === "chains" ? "bg-primary/10 text-primary border-b border-primary" : "text-muted-foreground"}`}
                onClick={() => setActiveTab("chains")}
              >
                Chains
              </button>
              <button
                className={`flex-1 py-3 text-xs uppercase tracking-widest font-semibold transition-colors ${activeTab === "pendants" ? "bg-primary/10 text-primary border-b border-primary" : "text-muted-foreground"}`}
                onClick={() => setActiveTab("pendants")}
              >
                Settings
              </button>
              <button
                className={`flex-1 py-3 text-xs uppercase tracking-widest font-semibold transition-colors ${activeTab === "gemstones" ? "bg-primary/10 text-primary border-b border-primary" : "text-muted-foreground"}`}
                onClick={() => setActiveTab("gemstones")}
              >
                Gems
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              <p className="text-xs text-muted-foreground mb-4">
                <Info size={12} className="inline mr-1" /> Select an item, then
                click canvas to place.
              </p>

              {(activeTab === "chains"
                ? CHAINS
                : activeTab === "pendants"
                  ? PENDANTS
                  : GEMSTONES
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTool(item)}
                  className={`w-full p-4 rounded border text-left flex flex-col items-center justify-center gap-3 transition-colors ${activeTool?.id === item.id ? "border-primary bg-primary/10" : "border-border/50 bg-card hover:border-primary/50"}`}
                >
                  {/* Miniature preview */}
                  <svg
                    width="60"
                    height="40"
                    viewBox={
                      item.type === "chain"
                        ? "-220 -20 440 40"
                        : "-60 -60 120 120"
                    }
                    className="text-foreground"
                  >
                    {item.imageUrl ? (
                      <image
                        href={item.imageUrl}
                        x={item.type === "chain" ? -200 : -50}
                        y={item.type === "chain" ? -100 : -50}
                        width={item.type === "chain" ? 400 : 100}
                        height={item.type === "chain" ? 200 : 100}
                        preserveAspectRatio="xMidYMid meet"
                      />
                    ) : (
                      <g
                        dangerouslySetInnerHTML={{ __html: item.svg || "" }}
                        fill="currentColor"
                        style={{ "--gem-color": "#fff" } as any}
                      />
                    )}
                  </svg>
                  <span className="text-xs uppercase tracking-widest text-foreground">
                    {item.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Center Canvas */}
          <div className="flex-1 flex flex-col bg-black relative min-h-[500px] overflow-hidden group cursor-crosshair">
            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            ></div>

            <svg
              ref={svgRef}
              className="w-full h-full"
              viewBox="0 0 600 600"
              onClick={handleCanvasClick}
            >
              {/* Center crosshair */}
              <line
                className="canvas-helper"
                x1="300"
                y1="280"
                x2="300"
                y2="320"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />
              <line
                className="canvas-helper"
                x1="280"
                y1="300"
                x2="320"
                y2="300"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />

              {/* Render Components */}
              {components.map((comp) => (
                <g
                  key={comp.id}
                  data-id={comp.id}
                  transform={`translate(${comp.x}, ${comp.y}) scale(${comp.scale})`}
                  onPointerDown={(e) => handlePointerDown(e, comp.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  style={
                    {
                      color:
                        comp.type !== "gemstone"
                          ? comp.metalColor
                          : "transparent",
                      "--gem-color": comp.gemColor || "#fff",
                      cursor: activeTool
                        ? "crosshair"
                        : draggingId === comp.id
                          ? "grabbing"
                          : "grab",
                    } as React.CSSProperties
                  }
                  className={`transition-opacity ${selectedId === comp.id ? "opacity-100 drop-shadow-[0_0_8px_rgba(212,175,55,0.8)]" : "opacity-90 hover:opacity-100"}`}
                >
                  {comp.imageUrl ? (
                    <image
                      href={comp.imageUrl}
                      x={-(comp.width || 100) / 2}
                      y={-(comp.height || 100) / 2}
                      width={comp.width || 100}
                      height={comp.height || 100}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  ) : (
                    <g dangerouslySetInnerHTML={{ __html: comp.svg || "" }} />
                  )}
                  {/* Selection Highlight Box */}
                  {selectedId === comp.id && (
                    <rect
                      className="selection-highlight"
                      x={comp.type === "chain" ? -210 : -50}
                      y={comp.type === "chain" ? -50 : -50}
                      width={comp.type === "chain" ? 420 : 100}
                      height={comp.type === "chain" ? 100 : 100}
                      fill="none"
                      stroke="#d4af37"
                      strokeWidth={2 / comp.scale}
                      strokeDasharray={`${4 / comp.scale} ${4 / comp.scale}`}
                    />
                  )}
                </g>
              ))}
            </svg>

            {components.length === 0 && !activeTool && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-muted-foreground text-sm uppercase tracking-widest font-light">
                  Select a component to begin
                </span>
              </div>
            )}
          </div>

          {/* Right Properties Panel */}
          <div className="w-full lg:w-72 bg-secondary/30 border-l border-border/50 flex flex-col">
            <div className="p-6 border-b border-border/50">
              <h3 className="brand-font text-lg text-foreground mb-4">
                Properties
              </h3>

              {selectedComp ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">
                      {selectedComp.type}
                    </span>
                    <button
                      onClick={deleteSelected}
                      className="text-destructive hover:text-red-400 text-xs flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </div>

                  {selectedComp.type !== "gemstone" && (
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                        Metal
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {METAL_COLORS.map((c) => (
                          <button
                            key={c.name}
                            title={c.name}
                            onClick={() =>
                              updateSelected({ metalColor: c.value })
                            }
                            className={`w-full aspect-square rounded-full border-2 ${selectedComp.metalColor === c.value ? "border-primary scale-110" : "border-transparent"}`}
                            style={{ backgroundColor: c.value }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedComp.type === "gemstone" && (
                    <div>
                      <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                        Stone
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {GEM_COLORS.map((c) => (
                          <button
                            key={c.name}
                            title={c.name}
                            onClick={() =>
                              updateSelected({ gemColor: c.value })
                            }
                            className={`w-full aspect-square rounded-full border-2 ${selectedComp.gemColor === c.value ? "border-primary scale-110" : "border-transparent"}`}
                            style={{ backgroundColor: c.value }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-2">
                      Scale
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={selectedComp.scale}
                      onChange={(e) =>
                        updateSelected({ scale: parseFloat(e.target.value) })
                      }
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm font-light">
                  Select an item on the canvas to edit its properties.
                </div>
              )}
            </div>

            <div className="p-6 mt-auto bg-card/50">
              <input
                type="text"
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                className="w-full bg-secondary border border-border rounded-sm py-2 px-3 text-sm text-foreground focus:border-primary focus:outline-none mb-3"
                placeholder="Design Name"
              />
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={handleSaveClick}
                  disabled={components.length === 0}
                  className="w-full btn-gold-outline py-2 rounded-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={16} /> Save
                </button>
                <button
                  onClick={tryOnDesign}
                  disabled={components.length === 0}
                  className="w-full btn-gold py-2 rounded-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Try On
                </button>
              </div>

              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                Saved Designs
              </h4>
              {savedDesigns.length === 0 ? (
                <p className="text-xs text-muted-foreground/50">
                  No saved designs yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {savedDesigns.map((d) => (
                    <div
                      key={d.id}
                      className="flex justify-between items-center bg-secondary/50 p-2 rounded text-sm"
                    >
                      <span className="truncate flex-1 text-foreground mr-2">
                        {d.name}
                      </span>
                      <button
                        onClick={() => loadDesign(d)}
                        className="text-primary hover:underline text-xs tracking-wider uppercase"
                      >
                        Load
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
