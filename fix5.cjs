const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts')) results.push(file);
    }
  });
  return results;
}

function fix() {
    const files = walk('src/engine/testing');
    for (const file of files) {
        let text = fs.readFileSync(file, 'utf8');
        let original = text;
        
        // FaceLibrary
        text = text.replace(/hands: \[([^\]]*)\],\s*body:/g, 'hands: [$1], wrists: null, body:');
        
        // bracelet / ring metadata
        text = text.replace(/trackingRequirements: \{[^\}]+\},\s*calibration: \{[^\}]+\}\s*\}/g, match => {
            return match.replace(/\}\s*$/, ' reflection: false }');
        });
        text = text.replace(/calibration: \{[^\}]+\}\s*\};\s*$/gm, match => {
            return match.replace(/\};\s*$/, ', reflection: false };');
        });

        // earring / render image AssetBundle
        text = text.replace(/\{ image: (mockImage|img|[^,}]+) \}/g, '{ image: $1, mask: undefined, shadow: undefined }');
        text = text.replace(/\{ image: (mockImage|img|[^,}]+),\s*\}/g, '{ image: $1, mask: undefined, shadow: undefined }');

        // recovery
        text = text.replace(/\{ videoElement: mockVideo, canvasElement: mockCanvas, mode: 'live' \}/g, "{ videoElement: mockVideo, canvasElement: mockCanvas, mode: 'live', imageElement: undefined as any }");
        text = text.replace(/\{ videoElement: mockVideo, canvasElement: mockCanvas, mode: "live" \}/g, '{ videoElement: mockVideo, canvasElement: mockCanvas, mode: "live", imageElement: undefined as any }');

        // render
        text = text.replace(/import \{ describe, it, expect, beforeEach, afterEach \} from 'vitest';/g, "import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';");
        text = text.replace(/shadow: \{ opacity: 0.5/g, 'shadowSpec: { opacity: 0.5');

        if (text !== original) {
            fs.writeFileSync(file, text);
            console.log('Fixed', file);
        }
    }
}

fix();
