const fs = require('fs');
const file = 'server/src/index.js';
let content = fs.readFileSync(file, 'utf8');

const routeContent = `
// --- PYQ Admin API ---
app.delete('/api/pyq/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { fileId } = req.query;
    const currentUser = await Admin.findById(req.adminId);
    
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
      return res.status(403).json({ error: 'Only admins can delete PYQ documents.' });
    }

    if (fileId) {
      try {
        await appwriteStorage.deleteFile('alok_media', fileId);
      } catch(e) {
        console.warn("Could not delete from storage:", e.message);
      }
    }
    
    await appwriteDatabases.deleteDocument('69d60fe8000c9bd92750', '69d6126a0031232a50d0', id);
    res.json({ success: true, message: 'PYQ document deleted.' });
  } catch(err) {
    console.error("PYQ Delete Error:", err);
    res.status(500).json({ error: 'Failed to delete PYQ document from Appwrite.' });
  }
});
`;

if (!content.includes('/api/pyq')) {
  // Insert before app.delete('/api/reels/cleanup-junk'
  content = content.replace("app.delete('/api/reels/cleanup-junk'", routeContent + "\napp.delete('/api/reels/cleanup-junk'");
  fs.writeFileSync(file, content);
  console.log('Backend patched with PYQ delete route');
} else {
  console.log('Already patched');
}
