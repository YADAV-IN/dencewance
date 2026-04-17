const fs = require('fs');
const file = 'server/src/index.js';
let content = fs.readFileSync(file, 'utf8');

const routeContent = `
// --- PYQ Data API ---
app.get('/api/pyq', async (req, res) => {
  try {
    const { Query } = require('node-appwrite');
    const result = await appwriteDatabases.listDocuments('69d60fe8000c9bd92750', '69d6126a0031232a50d0', [
      Query.orderDesc('$createdAt'),
      Query.limit(100)
    ]);
    res.json({ success: true, data: result.documents });
  } catch (err) {
    console.error("PYQ List Error:", err);
    res.status(500).json({ error: 'Failed to fetch PYQ documents.' });
  }
});

app.post('/api/pyq', requireAuth, async (req, res) => {
  try {
    const currentUser = await Admin.findById(req.adminId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'superadmin')) {
      return res.status(403).json({ error: 'Only admins can insert PYQ documents.' });
    }
    const { ID } = require('node-appwrite');
    const result = await appwriteDatabases.createDocument('69d60fe8000c9bd92750', '69d6126a0031232a50d0', ID.unique(), req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("PYQ Insert Error:", err);
    res.status(500).json({ error: 'Failed to insert PYQ document.' });
  }
});
`;

if (!content.includes('app.get(\'/api/pyq\'')) {
  // Insert before app.delete('/api/pyq/:id'
  content = content.replace("app.delete('/api/pyq/:id'", routeContent + "\napp.delete('/api/pyq/:id'");
  fs.writeFileSync(file, content);
  console.log('Backend patched with full PYQ API routes');
} else {
  console.log('Already patched with full PYQ routes');
}
