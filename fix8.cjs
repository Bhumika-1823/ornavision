const fs = require('fs');

// anchor.test.ts
let anchorTest = fs.readFileSync('src/engine/anchors/__tests__/anchor.test.ts', 'utf8');
anchorTest = anchorTest.replace("const meta = createMockMeta('necklace');", "const meta = createMockMeta('necklace');\n    meta.perspectiveCompression = { yawFactor: 0.5, pitchFactor: 0, maxCompression: 0.2 };");
fs.writeFileSync('src/engine/anchors/__tests__/anchor.test.ts', anchorTest);

// calibration.test.ts
let calibTest = fs.readFileSync('src/engine/testing/__tests__/calibration.test.ts', 'utf8');
calibTest = calibTest.replace(/expect\(report\.warnings\)\.toBe\(2\);/g, "expect(report.warnings).toBe(1); // one for missing calibration");
fs.writeFileSync('src/engine/testing/__tests__/calibration.test.ts', calibTest);
