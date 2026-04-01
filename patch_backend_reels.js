const fs = require('fs');
let code = fs.readFileSync('server/src/index.js', 'utf8');

code = code.replace(
  "  if (!payload.title || !payload.video_url) {\n    return res.status(400).json({ error: 'Title and video_url required.' });\n  }",
  "  if (!payload.video_url) {\n    return res.status(400).json({ error: 'video_url required.' });\n  }\n  if (!payload.title || payload.title.trim() === '') {\n    payload.title = `Video Story ${new Date().toLocaleDateString('hi-IN')}`;\n  }"
);

fs.writeFileSync('server/src/index.js', code);
