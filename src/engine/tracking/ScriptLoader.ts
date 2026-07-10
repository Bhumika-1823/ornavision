const loaded = new Set<string>();
let loadLock = Promise.resolve();

export function loadScript(src: string): Promise<void> {
  if (loaded.has(src) || document.querySelector(`script[src="${src}"]`)) {
    loaded.add(src);
    return Promise.resolve();
  }

  // Chain script loads sequentially to prevent MediaPipe Emscripten WASM
  // global Module collisions.
  loadLock = loadLock.then(() => {
    return new Promise<void>((resolve, reject) => {
      if (loaded.has(src)) return resolve();

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onload = () => {
        loaded.add(src);
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.body.appendChild(script);
    });
  });

  return loadLock;
}

export function loadScripts(sources: string[]): Promise<void[]> {
  return Promise.all(sources.map(loadScript));
}
