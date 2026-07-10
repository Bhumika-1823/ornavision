const fs = require('fs');

function fix(file, from, to) {
    let text = fs.readFileSync(file, 'utf8');
    text = text.split(from).join(to);
    fs.writeFileSync(file, text);
}

// bracelet and ring:
fix('src/engine/testing/__tests__/bracelet.test.ts', ', reflection: false }', '}');
fix('src/engine/testing/__tests__/bracelet.test.ts', '  reflection: false', '');

fix('src/engine/testing/__tests__/ring.test.ts', ', reflection: false }', '}');
fix('src/engine/testing/__tests__/ring.test.ts', '  reflection: false', '');

// calibration:
fix('src/engine/testing/__tests__/calibration.test.ts', 'reflection: false,', '');

// earring:
let earring = fs.readFileSync('src/engine/testing/__tests__/earring.test.ts', 'utf8');
earring = earring.replace(/\{ image: (img|\{\}) as any \}/g, '{ image: $1 as any, mask: null, shadow: null }');
fs.writeFileSync('src/engine/testing/__tests__/earring.test.ts', earring);

// recovery:
let recovery = fs.readFileSync('src/engine/testing/__tests__/recovery.test.ts', 'utf8');
recovery = recovery.replace(/\{ videoElement: mockVideo, canvasElement: mockCanvas, mode: ['"]live['"] \}/g, "{ videoElement: mockVideo, canvasElement: mockCanvas, mode: 'live', imageElement: undefined as any }");
fs.writeFileSync('src/engine/testing/__tests__/recovery.test.ts', recovery);

// render:
let render = fs.readFileSync('src/engine/testing/__tests__/render.test.ts', 'utf8');
render = render.replace(/\{ image: img as any \}/g, '{ image: img as any, mask: null, shadow: null }');
render = render.replace(/\{ image: \{\} as any \}/g, '{ image: {} as any, mask: null, shadow: null }');
if (!render.includes(', vi }')) {
    render = render.replace(/import \{ describe, it, expect, beforeEach, afterEach \} from 'vitest';/, "import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';");
}
fs.writeFileSync('src/engine/testing/__tests__/render.test.ts', render);
