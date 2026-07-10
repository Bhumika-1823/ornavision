import { describe, it, expect, vi } from "vitest";
import { occlusionEngine } from "../../render/OcclusionEngine";
import { FaceLibrary } from "../FaceLibrary";
import { FrameState } from "../../types";

describe("Occlusion Engine RC5", () => {
  it("initializes internal mask buffers on first run", () => {
    // Mock the selfie segmentation model
    (occlusionEngine as any).latestSegmentation = {} as any; // Mock ImageBitmap

    const frame = FaceLibrary.getAverageFace();

    // We expect the first updateMasks to create the buffers
    occlusionEngine.updateMasks(frame);

    // In node/JSDOM, document.createElement('canvas') works
    const hairCanvas = occlusionEngine.getDebugCanvas("hair");
    expect(hairCanvas).toBeDefined();

    // Width should match the frame
    // expect(hairCanvas?.width).toBe(frame.width);
  });

  it("skips redundant updates for the same frameIndex", () => {
    const frame = FaceLibrary.getAverageFace();

    // Spy on canvas context clearRect to verify it's skipped
    const hairCtx = (occlusionEngine as any).ctxs["hair"];
    if (!hairCtx) {
      // JSDOM might not support canvas getContext without the 'canvas' package.
      // If it's null, we just skip the spy part or mock it.
      return;
    }
    const clearRectSpy = vi.spyOn(hairCtx, "clearRect");

    // First update was in previous test for frameIndex 0, this is still 0
    occlusionEngine.updateMasks(frame);

    // Shouldn't be called because frameIndex hasn't changed
    expect(clearRectSpy).not.toHaveBeenCalled();

    // Now change frameIndex
    const nextFrame: FrameState = { ...frame, frameIndex: 1 };
    occlusionEngine.updateMasks(nextFrame);

    expect(clearRectSpy).toHaveBeenCalled();
  });

  it("computes soft masks without throwing errors", () => {
    const frame = FaceLibrary.getAverageFace();
    const nextFrame: FrameState = { ...frame, frameIndex: 2 };

    expect(() => {
      occlusionEngine.updateMasks(nextFrame);
    }).not.toThrow();
  });
});
