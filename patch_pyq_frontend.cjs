const fs = require('fs');
const file = 'src/components/PYQAssistant.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace fetchLibrary
content = content.replace(/const fetchLibrary = async \(\) => \{[\s\S]*?setLoading\(false\);\n    \}\n  \};/, `const fetchLibrary = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://alok-backend.onrender.com');
      const response = await fetch(apiUrl + '/api/pyq');
      const data = await response.json();
      if (data.success) {
        setLibraryItems(data.data);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Error fetching PYQ library:", err);
    } finally {
      setLoading(false);
    }
  };`);

// Replace handleDeleteDocument
content = content.replace(/const handleDeleteDocument = async \(docId, fileId\) => \{[\s\S]*?alert\("Failed to delete PYQ document\. Permission denied or network issue\."\);\n    \}\n  \};/, `const handleDeleteDocument = async (docId, fileId) => {
    if (!window.confirm("Are you sure you want to completely delete this PYQ document?")) return;
    try {
      const token = localStorage.getItem('adminToken') || '';
      if (!token) throw new Error('Not authenticated');

      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://alok-backend.onrender.com');
      const url = apiUrl + \`/api/pyq/\${docId}\` + (fileId ? \`?fileId=\${fileId}\` : '');
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed via API');
      
      setLibraryItems(prev => prev.filter(i => i.$id !== docId));
      alert("PYQ document deleted successfully.");
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to delete the document. " + err.message);
    }
  };`);

// Replace handleLibraryUpload Appwrite database insert
content = content.replace(/await databases\.createDocument\(DATABASE_ID,\s*COLLECTION_ID,\s*ID\.unique\(\),\s*\{[\s\S]*?fileId:\s*fileUrl\n\s*\}\);/, `const token = localStorage.getItem('adminToken') || '';
      if (!token) throw new Error('Not authenticated');
      
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://alok-backend.onrender.com');
      const payload = {
        dept: libDept.toUpperCase(),
        course: libCourse.toUpperCase(),
        subject: libKeywords ? \`\${libSubject} //SEO// \${libKeywords}\` : libSubject,
        fileName: libFile.name,
        fileType: libFile.type,
        fileId: fileUrl
      };

      const res = await fetch(apiUrl + '/api/pyq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload PYQ data');`);

fs.writeFileSync(file, content);
console.log('Frontend patched with full PYQ fetch/post/delete routes');
