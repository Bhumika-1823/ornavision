const fs = require('fs');

function fixRegex(file, regex, replace) {
    let text = fs.readFileSync(file, 'utf8');
    text = text.replace(regex, replace);
    fs.writeFileSync(file, text);
}

// 1. Remove reflection from CalibrationSpec in bracelet and ring test
fixRegex('src/engine/testing/__tests__/bracelet.test.ts', /, reflection: false }/g, '}');
fixRegex('src/engine/testing/__tests__/bracelet.test.ts', /,\s*reflection: false/g, '');
fixRegex('src/engine/testing/__tests__/bracelet.test.ts', /calibration: \{[^\}]+\}/g, match => {
  return match + ', reflection: false';
});

fixRegex('src/engine/testing/__tests__/ring.test.ts', /, reflection: false }/g, '}');
fixRegex('src/engine/testing/__tests__/ring.test.ts', /,\s*reflection: false/g, '');
fixRegex('src/engine/testing/__tests__/ring.test.ts', /calibration: \{[^\}]+\}/g, match => {
  return match + ', reflection: false';
});

// 2. Remove reflection from ProductPackage in calibration test
fixRegex('src/engine/testing/__tests__/calibration.test.ts', /reflection: false,\s*/g, '');

// 3. Fix earring AssetBundle
fixRegex('src/engine/testing/__tests__/earring.test.ts', /\{ image: img \}/g, '{ image: img as any, mask: undefined, shadow: undefined }');
fixRegex('src/engine/testing/__tests__/earring.test.ts', /\{ image: \{\} as any \}/g, '{ image: {} as any, mask: undefined, shadow: undefined }');

// 4. Fix recovery EngineStartOptions
fixRegex('src/engine/testing/__tests__/recovery.test.ts', /\{ videoElement: mockVideo, canvasElement: mockCanvas, mode: 'live' \}/g, "{ videoElement: mockVideo, canvasElement: mockCanvas, mode: 'live', imageElement: undefined as any }");
fixRegex('src/engine/testing/__tests__/recovery.test.ts', /\{ videoElement: mockVideo, canvasElement: mockCanvas, mode: "live" \}/g, '{ videoElement: mockVideo, canvasElement: mockCanvas, mode: "live", imageElement: undefined as any }');

// 5. Fix render test vi and AssetBundle
let renderTest = fs.readFileSync('src/engine/testing/__tests__/render.test.ts', 'utf8');
if (!renderTest.includes(', vi }')) {
    renderTest = renderTest.replace(/import \{ describe, it, expect, beforeEach, afterEach \} from 'vitest';/g, "import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';");
}
renderTest = renderTest.replace(/\{ image: img \}/g, '{ image: img as any, mask: undefined, shadow: undefined }');
renderTest = renderTest.replace(/\{ image: \{\} as any \}/g, '{ image: {} as any, mask: undefined, shadow: undefined }');
fs.writeFileSync('src/engine/testing/__tests__/render.test.ts', renderTest);

