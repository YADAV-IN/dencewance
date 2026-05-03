const fs = require('fs');
let code = fs.readFileSync('server/src/db.js', 'utf8');

code = code.replace(
/} catch\(e\) { console\.error\("Delete error in Appwrite:", e\); return false; }\n\s*return null;\n\s*}/g,
'} catch (e) { return null; }'
);

code = code.replace(
/} catch\(e\) { console\.error\("Delete error in Appwrite:", e\); return false; }\n\s*return false;\n\s*}/g,
'} catch (e) { console.error("Delete error in Appwrite:", e); return false; }'
);

fs.writeFileSync('server/src/db.js', code);
