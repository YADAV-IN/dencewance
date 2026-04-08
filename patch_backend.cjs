const fs = require('fs');

const idxPath = './server/src/index.js';
let content = fs.readFileSync(idxPath, 'utf-8');

// 1. Move `import { UserProfile, ReelComment, SavedReel } from './db.js';` to the top.
content = content.replace("import { UserProfile, ReelComment, SavedReel } from './db.js';", "");
content = content.replace(
  "import { initDb, Admin, News, Reel, SiteSettings, Status } from './db.js';",
  "import { initDb, Admin, News, Reel, SiteSettings, Status, UserProfile, ReelComment, SavedReel } from './db.js';"
);

// 2. Extract the startup and export block.
const blockMatch = content.match(/if \(!IS_VERCEL\) \{[\s\S]*?export default app;/);
if (blockMatch) {
  const block = blockMatch[0];
  content = content.replace(block, "");
  content = content + "\n\n" + block + "\n";
  fs.writeFileSync(idxPath, content);
  console.log("Patched server/src/index.js successfully.");
} else {
  console.log("Could not find block in index.js");
}
