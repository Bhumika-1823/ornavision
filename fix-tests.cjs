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

function fixFiles() {
    const files = walk('src');
    for (const file of files) {
        let content = fs.readFileSync(file, 'utf8');
        let changed = false;

        // Fix missing mask, shadow in AssetBundle mocks
        if (content.includes('image: ') && file.includes('.test.ts')) {
            let replaced = content.replace(/{ image: ([^,]+) }/g, '{ image: $1, mask: null, shadow: null }');
            if (replaced !== content) {
                content = replaced;
                changed = true;
            }
        }

        // Fix missing wrists in FrameState mocks
        if (content.includes('hands:') && file.includes('.test.ts') && !file.includes('bracelet.test.ts')) {
             if (!content.includes('wrists:')) {
                content = content.replace(/hands: \[([^\]]*)\],/g, 'hands: [$1],\n      wrists: null,');
                content = content.replace(/hands: \[\]/g, 'hands: [], wrists: null');
                content = content.replace(/hands: \[\]\n/g, 'hands: [], wrists: null,\n');
                changed = true;
             }
        }

        if (changed) {
            fs.writeFileSync(file, content);
            console.log('Fixed', file);
        }
    }
}
fixFiles();
