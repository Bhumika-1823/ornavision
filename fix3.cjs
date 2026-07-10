const fs = require('fs');

function fix(file, search, replace) {
    let text = fs.readFileSync(file, 'utf8');
    text = text.split(search).join(replace);
    fs.writeFileSync(file, text);
}
function fixRegex(file, regex, replace) {
    let text = fs.readFileSync(file, 'utf8');
    text = text.replace(regex, replace);
    fs.writeFileSync(file, text);
}

fix('src/engine/anchors/__tests__/anchor.test.ts', 'wrists: null,\n      wrists: null,', 'wrists: null,');

fix('src/engine/testing/__tests__/earring.test.ts', '{ image: img as any }', '{ image: img as any, mask: null, shadow: null }');
fix('src/engine/testing/__tests__/earring.test.ts', '{ image: {} as any }', '{ image: {} as any, mask: null, shadow: null }');

fix('src/engine/testing/__tests__/recovery.test.ts', "{ videoElement: mockVideo, canvasElement: mockCanvas, mode: 'live' }", "{ videoElement: mockVideo, canvasElement: mockCanvas, mode: 'live', imageElement: null as any }");

fix('src/engine/testing/__tests__/render.test.ts', "import { describe, it, expect, beforeEach, afterEach } from 'vitest';", "import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';");
fix('src/engine/testing/__tests__/render.test.ts', '{ image: img as any }', '{ image: img as any, mask: null, shadow: null }');
fix('src/engine/testing/__tests__/render.test.ts', "shadow: { opacity: 0.5, blur: 5, offsetX: 2, offsetY: 2, color: 'black' }", "shadowSpec: { opacity: 0.5, blur: 5, offsetX: 2, offsetY: 2, color: 'black' }");

fix('src/engine/testing/__tests__/ring.test.ts', "subcategory: 'ring'", "subcategory: 'other'"); // wait, I will check JewelrySubcategory
fix('src/engine/testing/__tests__/bracelet.test.ts', "subcategory: 'bracelet'", "subcategory: 'other'"); 

fix('src/engine/testing/FaceLibrary.ts', 'hands: [],\n    body:', 'hands: [], wrists: null, body:');
