const fs = require('fs');
let code = fs.readFileSync('server/src/index.js', 'utf8');

code = code.replace(
  /app\.put\('\/api\/profile', requireAuth, async \(req, res\) => \{([\s\S]*?)\/\* End of profile sync \*\//,
  `app.put('/api/profile', requireAuth, async (req, res) => {
  try {
    const { name, email, bio, avatar_url, username } = req.body || {};
    const updates = {};
    if (typeof name === 'string') updates.name = name;
    if (typeof email === 'string') updates.email = email;
    if (typeof bio === 'string') updates.bio = bio;
    if (typeof avatar_url === 'string') updates.avatar_url = avatar_url;
    if (typeof username === 'string') {
      if (/^[a-z0-9_]{3,20}$/.test(username)) updates.username = username;
    }
    
    const admin = await Admin.findByIdAndUpdate(req.adminId, updates, { new: true });
    if (!admin) {
      return res.status(500).json({ error: 'Appwrite failed to update document. Check permissions or missing attributes.' });
    }
    
    await syncProfileUpdatesToDbContent(req.adminId, updates);
    return res.json({ data: admin.toJSON() });
  } catch (err) {
    console.error('Profile Update Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error during profile update' });
  }
});
/* End of profile sync */`
);

code = code.replace(
  /app\.post\('\/api\/reels', async \(req, res\) => \{([\s\S]*?)return res\.status\(201\)\.json\(\{ success: true, data: reel \}\);\n\}\);/,
  `app.post('/api/reels', async (req, res) => {
  try {
    $1
    return res.status(201).json({ success: true, data: reel });
  } catch(err) {
    console.error('Reel create error:', err);
    return res.status(500).json({ error: err.message || 'Internal error creating reel' });
  }
});`
);

code = code.replace(
  /app\.delete\('\/api\/reels\/:id', async \(req, res\) => \{([\s\S]*?)return res\.json\(\{ message: 'Reel deleted successfully' \}\);\n\}\);/,
  `app.delete('/api/reels/:id', async (req, res) => {
  try {
    $1
    return res.json({ message: 'Reel deleted successfully' });
  } catch(err) {
    console.error('Reel delete error:', err);
    return res.status(500).json({ error: err.message || 'Internal error deleting reel' });
  }
});`
);

fs.writeFileSync('server/src/index.js', code);
console.log('Successfully wrapped routes in try/catch to prevent 500 HTML crash responses.');
