import React, { useState, useEffect } from 'react';
import { Client, Databases, Storage, ID, Query } from 'appwrite';
import { uploadMediaToAppwrite } from '../utils/appwriteClient';

// --- Appwrite Config ---
const client = new Client();
client
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('69d60fbe002bae1e32d5');

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = '69d60fe8000c9bd92750';
const COLLECTION_ID = '69d6126a0031232a50d0';
const BUCKET_ID = 'alok_media'; 

const PYQAssistant = ({ adminData }) => {
  const [libraryItems, setLibraryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Upload States
  const [libDept, setLibDept] = useState('');
  const [libCourse, setLibCourse] = useState('');
  const [libSubject, setLibSubject] = useState('');
  const [libKeywords, setLibKeywords] = useState('');
  const [libFile, setLibFile] = useState(null);
  const [libLoading, setLibLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://alok-backend.onrender.com');
      const response = await fetch(apiUrl + '/api/pyq');
      
      // Check content-type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Server returned non-JSON response:', text);
        throw new Error('Server error: Invalid response format. Backend may have issues.');
      }
      
      const data = await response.json();
      if (data.success) {
        setLibraryItems(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch library');
      }
    } catch (err) {
      console.error("Error fetching PYQ library:", err);
      alert('Failed to load PYQ library: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteDocument = async (docId, fileId) => {
    if (!window.confirm("Are you sure you want to completely delete this PYQ document?")) return;
    try {
      const token = localStorage.getItem('adminToken') || '';
      if (!token) throw new Error('Not authenticated');

      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://alok-backend.onrender.com');
      const url = apiUrl + `/api/pyq/${docId}` + (fileId ? `?fileId=${fileId}` : '');
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed via API');
      
      setLibraryItems(prev => prev.filter(i => i.$id !== docId));
      alert("PYQ document deleted successfully.");
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to delete the document. " + err.message);
    }
  };
  const handleLibraryUpload = async (e) => {
    e.preventDefault();
    if (!libDept || !libCourse || !libSubject || !libFile) {
      alert("Please fill all fields and select a file.");
      return;
    }

    setLibLoading(true);
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const token = localStorage.getItem('adminToken') || '';
      if (!token) throw new Error('Not authenticated — please login as admin to upload.');

      const uploadResult = await uploadMediaToAppwrite(libFile, BUCKET_ID, (progressEvent) => {
        if (progressEvent && typeof progressEvent.progress === 'number') {
          setUploadProgress(Math.round(progressEvent.progress));
        }
      });

      setUploadProgress(100);

      // uploadResult may be a string (url) or an object {id, url}
      const fileIdValue = (uploadResult && typeof uploadResult === 'object') ? (uploadResult.id || uploadResult.url) : uploadResult;

      const apiUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://alok-backend.onrender.com');
      const payload = {
        dept: libDept.toUpperCase(),
        course: libCourse.toUpperCase(),
        subject: libKeywords ? `${libSubject} //SEO// ${libKeywords}` : libSubject,
        fileName: libFile.name,
        fileType: libFile.type,
        fileId: fileIdValue
      };

      const res = await fetch(apiUrl + '/api/pyq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      // Check if response is valid JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Server returned non-JSON response:', text);
        throw new Error(`Server error: ${res.status}. The backend may have crashed. Check server logs.`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to upload PYQ data');
      
      alert("PYQ Uploaded successfully!");
      setLibDept(''); setLibCourse(''); setLibSubject(''); setLibKeywords(''); setLibFile(null);
      fetchLibrary();
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed: " + err.message);
    } finally {
      setLibLoading(false);
      setTimeout(() => { setIsUploading(false); setUploadProgress(0); }, 2000);
    }
  };

  const handleViewDocument = async (fileId, fileName) => {
    let downloadUrl = fileId;
    if (!fileId.startsWith('http://') && !fileId.startsWith('https://')) {
      try {
        const result = storage.getFileDownload(BUCKET_ID, fileId);
        downloadUrl = result.href || result;
      } catch (error) {
        console.error('Failed to get download url:', error);
      }
    }
    
    // Creating an invisible anchor to force true download behavior
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName || 'pyq-document';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const filteredItems = libraryItems.filter(item => {
    if (!searchQuery.trim()) return true;
    
    // Split search query into multiple words for "kahi se bhi" flexible search
    const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
    
    // Create one massive searchable string for each document
    const itemString = `${item.course || ''} ${item.dept || ''} ${item.subject || ''} ${item.fileName || ''}`.toLowerCase();
    
    // Check if EVERY typed word exists SOMEWHERE in this massive string (order independent)
    return searchTerms.every(term => itemString.includes(term));
  });

  return (
    <div style={{ padding: '0 16px 90px 16px', color: '#ffffff', boxSizing: 'border-box', maxWidth: '1200px', margin: '0 auto', width: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Highly Visible Hero Header */}
      <div style={{ 
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
        padding: '40px 20px', background: 'linear-gradient(to bottom, #1a1a1a, #0a0a0a)',
        borderRadius: '0 0 24px 24px', marginBottom: '30px', borderBottom: '2px solid #333'
      }}>
        {/* Academic Logo / Icon */}
        <div style={{ backgroundColor: '#B4A05D', padding: '12px', borderRadius: '50%', display: 'flex', boxShadow: '0 0 20px rgba(180, 160, 93, 0.4)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>
        <div>
          <h2 style={{ fontSize: '32px', fontWeight: '900', margin: '0', letterSpacing: '-0.5px', textTransform: 'uppercase', background: 'linear-gradient(45deg, #FFF, #B4A05D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SPECIAL DU PYQ
          </h2>
          <p style={{ color: '#E0E0E0', fontSize: '15px', marginTop: '4px', fontWeight: '500' }}>Delhi University Premium Resource Archive</p>
        </div>
      </div>

      {/* Massive Search Bar */}
      <div style={{ position: 'relative', marginBottom: '30px', maxWidth: '800px', margin: '0 auto 30px auto' }}>
        <svg style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: '#B4A05D', width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        <input 
          type="text" 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Type subject, course, or filename here to search instantly..." 
          style={{
            width: '100%', padding: '18px 20px 18px 56px', borderRadius: '16px', border: '2px solid #444', 
            backgroundColor: '#161616', color: '#ffffff', outline: 'none', fontSize: '18px', fontWeight: '600',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)', transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#B4A05D'}
          onBlur={(e) => e.target.style.borderColor = '#444'}
        />
        {searchQuery && (
          <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: '#fff', fontSize: '14px', fontWeight: 'bold', background: '#333', padding: '4px 10px', borderRadius: '8px' }}>
            {filteredItems.length} Found
          </div>
        )}
      </div>

      {/* Admin Upload Section */}
      {adminData && (
        <div style={{ backgroundColor: '#111411', border: '2px solid #2a3a2a', padding: '24px', borderRadius: '16px', marginBottom: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg> 
            Admin Upload Terminal
          </h3>
          <form onSubmit={handleLibraryUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <input type="text" required placeholder="Dept (e.g. CS)" value={libDept} onChange={e=>setLibDept(e.target.value)} style={inputStyle} />
              <input type="text" required placeholder="Course (e.g. BCA)" value={libCourse} onChange={e=>setLibCourse(e.target.value)} style={inputStyle} />
              <input type="text" required placeholder="Subject (e.g. Java)" value={libSubject} onChange={e=>setLibSubject(e.target.value)} style={inputStyle} />
              <input type="text" placeholder="SEO / Rel Keywords (Comma separated)" value={libKeywords} onChange={e=>setLibKeywords(e.target.value)} style={inputStyle} />
            </div>
            
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', background: '#0a0a0a', padding: '8px 8px 8px 16px', borderRadius: '12px', border: '1px solid #333' }}>
              <input type="file" required onChange={e=>setLibFile(e.target.files[0])} style={{ flex: 1, color: '#fff', fontSize: '15px', fontWeight: 'bold' }} />
              <button type="submit" disabled={libLoading} style={{
                padding: '14px 32px', backgroundColor: '#4ade80', color: '#000', fontWeight: '900', borderRadius: '10px', border: 'none', cursor: libLoading ? 'not-allowed' : 'pointer', fontSize: '16px', flexShrink: 0, textTransform: 'uppercase'
              }}>
                {libLoading ? "UPLOADING..." : "UPLOAD NOW"}
              </button>
            </div>
            
            {isUploading && (
              <div style={{ marginTop: '8px', width: '100%', background: '#000', padding: '12px', borderRadius: '8px', border: '1px solid #222' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#4ade80', fontWeight: '900' }}>
                  <span>Uploading to Database...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', backgroundColor: '#111', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${uploadProgress}%`, backgroundColor: '#4ade80', transition: 'width 0.2s ease' }}></div>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Documents Results */}
      <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '12px', color: '#fff' }}>
        Directory Results <span style={{ color: '#B4A05D' }}>({filteredItems.length} Files)</span>
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#FFF', fontSize: '18px', fontWeight: 'bold' }}>
          <div style={{ marginBottom: '16px', fontSize: '32px', animation: 'spin 1s linear infinite' }}>⏳</div>
          Accessing Database...
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', backgroundColor: '#111', borderRadius: '24px', border: '2px dashed #444' }}>
          <div style={{ fontSize: '50px', marginBottom: '16px', color: '#B4A05D' }}>📂</div>
          <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', margin: '0 0 8px 0' }}>Nothing Found</h3>
          <p style={{ color: '#aaa', fontSize: '16px' }}>We couldn't find any resources matching your search.</p>
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ marginTop: '16px', padding: '10px 24px', background: '#333', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {filteredItems.map(item => (
            <div key={item.$id} style={{
              backgroundColor: '#131313', border: '1px solid #2a2a2a', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column',
              boxShadow: '0 4px 15px rgba(0,0,0,0.4)', transition: 'transform 0.2s, border-color 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#B4A05D'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.transform = 'none'; }}
            >
              {/* Card Meta Tags */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#B4A05D', color: '#000', borderRadius: '8px', fontWeight: '900', letterSpacing: '0.5px' }}>{item.dept}</span>
                <span style={{ fontSize: '12px', padding: '4px 10px', backgroundColor: '#333', color: '#fff', borderRadius: '8px', fontWeight: '800', letterSpacing: '0.5px' }}>{item.course}</span>
                
                {/* Dynamically show SEO Tags if user uploaded them */}
                {item.subject?.includes('//SEO//') && item.subject.split('//SEO//')[1]?.split(',').slice(0, 2).map((tag, idx) => (
                  <span key={idx} style={{ fontSize: '11px', padding: '4px 8px', backgroundColor: '#1a2e1a', color: '#4ade80', borderRadius: '8px', fontWeight: '700' }}>
                    #{tag.trim()}
                  </span>
                ))}
              </div>
              
              {/* Paper Title (Huge & visible) */}
              <h4 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 10px 0', lineHeight: '1.3', color: '#FFFFFF' }}>{item.subject?.split('//SEO//')[0].trim()}</h4>
              
              {/* File Name */}
              <p style={{ fontSize: '14px', color: '#A0A0A0', margin: '0 0 24px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }} title={item.fileName}>
                📄 {item.fileName}
              </p>
              
              {/* Footer */}
              <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #222', paddingTop: '16px' }}>
                <span style={{ fontSize: '13px', color: '#888', fontWeight: '600' }}>
                  {new Date(item.$createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {((adminData?.role === 'admin') || (adminData?.role === 'superadmin')) && (
                    <button onClick={() => handleDeleteDocument(item.$id, item.fileId)} style={{
                      padding: '10px 15px', backgroundColor: '#441111', color: '#ff6666', border: '1px solid #661111', borderRadius: '8px', fontWeight: '900', fontSize: '14px', cursor: 'pointer'
                    }}>
                      DELETE
                    </button>
                  )}
                  <button onClick={() => handleViewDocument(item.fileId, item.fileName)} style={{
                    padding: '10px 20px', backgroundColor: '#ffffff', color: '#000000', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 10px rgba(255,255,255,0.2)'
                  }}>
                    DOWNLOAD
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  flex: 1, padding: '16px', borderRadius: '12px', border: '1px solid #333', backgroundColor: '#000', color: '#fff', outline: 'none', fontSize: '16px', fontWeight: '600', boxSizing: 'border-box'
};

export default PYQAssistant;
