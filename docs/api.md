# TryonEngine API Reference

The `TryonEngine` is the single facade for the Virtual Try-On SDK. It manages all underlying subsystems (tracking, occlusion, rendering).

## Initialization
```typescript
import { TryonEngine } from 'virtual-tryon-engine';

const engine = new TryonEngine({
  onError: (msg) => console.error(msg),
  onFrameProcessed: (frameState) => {
    // Optional telemetry callback
  }
});
```

## Lifecycle

### `engine.init()`
Pre-loads tracking models (Face & Hands) to ensure instant startup when the user enters the camera scene.

### `engine.start(opts: EngineStartOptions)`
Begins tracking and rendering.
```typescript
engine.start({
  videoElement: document.getElementById('camera-feed'),
  canvasElement: document.getElementById('render-layer'),
  mode: 'live' // or 'photo'
});
```

### `engine.stop()`
Pauses the frame scheduler and releases camera locks.

## Item Management

### `engine.setItems(items: ProductPackage[])`
Loads an array of jewelry packages onto the user.
```typescript
engine.setItems([
  await PackageLoader.load(myNecklaceJson),
  await PackageLoader.load(myEarringsJson)
]);
```
