const fs = require('fs');
const file = 'src/components/PYQAssistant.jsx';
let content = fs.readFileSync(file, 'utf8');

const replaceStr = `  const handleDeleteDocument = async (docId, fileId) => {
    if (!window.confirm("Are you sure you want to completely delete this PYQ document?")) return;
    try {
      const token = localStorage.getItem('adminToken') || '';
      if (!token) throw new Error('Not authenticated');

      const url = \`\${import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://alok-backend.onrender.com')}/api/pyq/\${docId}\` + (fileId ? \`?fileId=\${fileId}\` : '');
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      if (!res.ok) throw new Error('Delete failed via API');
      
      setLibraryItems(prev => prev.filter(i => i.$id !== docId));
      alert("PYQ document deleted successfully.");
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to delete the document. You may not have permission.");
    }
  };`;

// Find and replace the old function completely
content = content.replace(/const handleDeleteDocument = async \(docId, fileId\) => \{[\s\S]*?alert\("Failed to delete the document\."\);\s*\}\s*\};/, replaceStr);
fs.writeFileSync(file, content);
console.log('Frontend patched PYQ delete');
