const fs = require('fs');

function fix(file, search, replace) {
    let text = fs.readFileSync(file, 'utf8');
    text = text.split(search).join(replace);
    fs.writeFileSync(file, text);
}

fix('src/engine/testing/__tests__/bracelet.test.ts', "subcategory: 'other'", "subcategory: 'generic'");
fix('src/engine/testing/__tests__/ring.test.ts', "subcategory: 'other'", "subcategory: 'generic'");

