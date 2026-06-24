const fs = require('fs');

const p = JSON.parse(fs.readFileSync('package.json'));
p.version = '1.0.217';
// remove version-generator from build scripts
if (p.scripts && p.scripts.build) {
  p.scripts.build = p.scripts.build.replace('node scripts/version-generator.cjs && ', '');
}
if (p.scripts && p.scripts.dev) {
  p.scripts.dev = p.scripts.dev.replace('node scripts/version-generator.cjs && ', '');
}
fs.writeFileSync('package.json', JSON.stringify(p, null, 2));

try {
  const vp = JSON.parse(fs.readFileSync('src/version.json'));
  vp.version = '1.0.217';
  fs.writeFileSync('src/version.json', JSON.stringify(vp, null, 2));
} catch(e) {}

console.log('Versions updated to 1.0.217');
