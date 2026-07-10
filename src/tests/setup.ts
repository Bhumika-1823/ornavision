import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Automatically cleanup React Testing Library after each test
afterEach(() => {
  cleanup();
});

// Mock WebGL and related APIs for JSDOM
HTMLCanvasElement.prototype.getContext = () => null;
