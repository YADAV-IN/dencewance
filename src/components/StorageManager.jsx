import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://alok-backend.onrender.com');

export default function StorageManager({ open, onClose, adminToken }) {
  // Only admins can view storage manager
  if (!adminToken) return null;

  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preferred, setPreferred] = useState(() => localStorage.getItem('preferredStorage') || 'auto');
  const [admins, setAdmins] = useState([]);
  const [activeUploader, setActiveUploader] = useState(() => localStorage.getItem('activeUploader') || '');
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!open) return;
    fetchUsage();
    fetchAdmins();
  }, [open]);

  const fetchAdmins = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch(`${API_URL}/api/admins`, { headers: { Authorization: `Bearer ${adminToken}` } });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.data) setAdmins(data.data);
    } catch (e) { console.warn('Failed to fetch admins', e); }
  };

  const fetchUsage = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await fetch(`${API_URL}/api/storage/usage`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.status === 401 || res.status === 403) {
        setAuthError('Admin access required');
        setUsage(null);
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch usage');
      const data = await res.json();
      if (data && data.success) setUsage(data.data);
    } catch (err) {
      console.error(err);
      setUsage(null);
    } finally { setLoading(false); }
  };

  const savePreferred = async () => {
    localStorage.setItem('preferredStorage', preferred);
    localStorage.setItem('activeUploader', activeUploader || '');
    // Try to save to backend settings if adminToken available
    if (adminToken) {
      try {
        await fetch(`${API_URL}/api/settings`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
          body: JSON.stringify({ preferred_storage: preferred, active_uploader: activeUploader || null })
        });
      } catch (e) { console.warn('Failed to save setting to backend', e); }
    }
    alert('Preferred storage saved: ' + preferred + (activeUploader ? '\nActive uploader set.' : ''));
    if (onClose) onClose();
  };

  if (!open) return null;

  if (authError) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 500, maxWidth: '95%', background: '#0b0b0b', padding: 20, borderRadius: 12, color: '#fff' }}>
          <h3 style={{ margin: 0, marginBottom: 12, color: '#ff6666' }}>Access Denied</h3>
          <p style={{ color: '#ccc', marginBottom: 16 }}>{authError}</p>
          <button onClick={onClose} style={{ padding: '8px 12px', background: '#ff6666', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700 }}>Close</button>
        </div>
      </div>
    );
  }

  if (!open) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 720, maxWidth: '95%', background: '#0b0b0b', padding: 20, borderRadius: 12, color: '#fff' }}>
        <h3 style={{ margin: 0, marginBottom: 12 }}>Storage Manager</h3>
        <p style={{ color: '#bbb' }}>Choose default storage for uploads and view current usage.</p>

        {loading ? <div>Loading usage…</div> : (
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '6px 0' }}>Appwrite</h4>
              {usage?.appwrite ? (
                usage.appwrite.available ? (
                  <div>
                    <div style={{ fontSize: 13, color: '#ddd' }}>Files: {usage.appwrite.totalFiles}</div>
                    <div style={{ fontSize: 13, color: '#ddd' }}>Bytes: {usage.appwrite.totalBytes}</div>
                  </div>
                ) : <div style={{ color: '#ff9999' }}>{usage.appwrite.reason}</div>
              ) : <div style={{ color: '#999' }}>N/A</div>}
            </div>

            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '6px 0' }}>R2</h4>
              {usage?.r2 ? (
                usage.r2.available ? (
                  <div>
                    <div style={{ fontSize: 13, color: '#ddd' }}>Files: {usage.r2.totalFiles}</div>
                    <div style={{ fontSize: 13, color: '#ddd' }}>Bytes: {usage.r2.totalBytes}</div>
                  </div>
                ) : <div style={{ color: '#ff9999' }}>{usage.r2.reason}</div>
              ) : <div style={{ color: '#999' }}>N/A</div>}
            </div>

            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '6px 0' }}>DB (samples)</h4>
              {usage?.dbCounts ? (
                <div>
                  <div style={{ fontSize: 13, color: '#ddd' }}>News sample: {usage.dbCounts.newsSample}</div>
                  <div style={{ fontSize: 13, color: '#ddd' }}>Reels sample: {usage.dbCounts.reelsSample}</div>
                  <div style={{ fontSize: 13, color: '#ddd' }}>PYQ sample: {usage.dbCounts.pyqSample}</div>
                </div>
              ) : <div style={{ color: '#999' }}>N/A</div>}
            </div>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          {admins && admins.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display:'block', marginBottom:8, color:'#ccc' }}>Active Uploader (developer/admin):</label>
              <select value={activeUploader} onChange={(e) => setActiveUploader(e.target.value)} style={{ padding: '8px', borderRadius: 8, background: '#0a0a0a', color: '#fff', border: '1px solid #333', width: '100%' }}>
                <option value="">-- Use current token --</option>
                {admins.map(a => (<option key={a._id} value={a._id}>{a.name || a.email || a._id}</option>))}
              </select>
              <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>Selecting an uploader sets active uploader locally and attempts to persist to backend settings.</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="radio" name="pref" value="auto" checked={preferred === 'auto'} onChange={() => setPreferred('auto')} /> Auto (try R2 → Appwrite → Backend)</label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="radio" name="pref" value="r2" checked={preferred === 'r2'} onChange={() => setPreferred('r2')} /> R2 (Cloudflare)</label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="radio" name="pref" value="appwrite" checked={preferred === 'appwrite'} onChange={() => setPreferred('appwrite')} /> Appwrite</label>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="radio" name="pref" value="backend" checked={preferred === 'backend'} onChange={() => setPreferred('backend')} /> Backend (HTTP)</label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button onClick={onClose} style={{ padding: '8px 12px', background: 'transparent', color: '#ccc', border: '1px solid #333', borderRadius: 8 }}>Cancel</button>
          <button onClick={savePreferred} style={{ padding: '8px 12px', background: '#4ade80', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700 }}>Save</button>
        </div>
      </div>
    </div>
  );
}
