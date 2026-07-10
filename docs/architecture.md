# Architecture Guide

The Virtual Try-On Engine relies on a strictly decoupled, unidirectional data flow to achieve high performance (60 FPS desktop / 30 FPS mobile).

## The Pipeline

1. **Tracking Layer (`TrackingManager.ts`)**: Runs MediaPipe Face and Hand tracking on the camera feed. Translates raw multi-dimensional arrays into a stable `FrameState` object.
2. **Anchor Layer (`NeckEstimator.ts`, `AnchorEngine.ts`)**: Reads `FrameState` and uses anatomical heuristics (jawline, shoulders) to compute stable anchor points and physics metrics (e.g. `pendantMetrics`).
3. **Occlusion Layer (`OcclusionEngine.ts`)**: Extracts regional geometric masks (Hair, Face, Neck) using offscreen canvases.
4. **Rendering Layer (`CanvasRenderer.ts`)**: Applies perspective warping, reflections, and shadows to the jewelry `AssetBundle` based on the physics anchors.

## Capability Degradation
The `CapabilityManager` inspects hardware limits on boot. High-end features (Bloom, Occlusion) are disabled on low-tier mobile devices to preserve the `30 FPS` floor.
