const fs = require('fs');
let code = fs.readFileSync('server/src/index.js', 'utf8');

// Add developer to creation arrays
code = code.replace(/!\['superadmin', 'superadmin', 'admin', 'editor', 'author'\]\.includes\(currentUser\.role\)/g, 
  "!['superadmin', 'admin', 'editor', 'author', 'developer'].includes(currentUser.role)");

code = code.replace(/!\['superadmin', 'admin', 'editor', 'author'\]\.includes\(currentUser\.role\)/g, 
  "!['superadmin', 'admin', 'editor', 'author', 'developer'].includes(currentUser.role)");

// Allow developer to delete reels
code = code.replace(/if \(currentUser\.role !== 'admin' && currentUser\.role !== 'superadmin' && !ownsReel && !matchesLegacyIdentity\)/g, 
  "if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin' && currentUser.role !== 'developer' && !ownsReel && !matchesLegacyIdentity)");

fs.writeFileSync('server/src/index.js', code);
console.log('Roles updated.');
