import React, { useState, useEffect } from 'react';
import { Database, Copy, RefreshCw, Check } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function DeveloperIDList({ token }) {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState('');

  const fetchIDs = async () => {
    setLoading(true);
    try {
      // Fetch Users
      const usersRes = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.data || data || []);
      }

      // Fetch Posts
      const postsRes = await fetch(`${API_URL}/api/news`);
      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data.data || data || []);
      }

      // Fetch Reels
      const reelsRes = await fetch(`${API_URL}/api/reels`);
      if (reelsRes.ok) {
        const data = await reelsRes.json();
        setReels(data.data || data || []);
      }
    } catch (err) {
      console.error('Failed to fetch IDs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIDs();
  }, []);

  const userIds = users.map(u => u._id || u.id).filter(Boolean).join(', ');
  const postIds = posts.map(p => p._id || p.id).filter(Boolean).join(', ');
  const reelIds = reels.map(r => r._id || r.id).filter(Boolean).join(', ');

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Database size={24} className="text-[#9B51E0]" /> Database IDs List
        </h2>
        <button 
          onClick={fetchIDs} 
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-bold text-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="space-y-6">
        <IdSection title={`User IDs (${users.length})`} ids={userIds} type="users" copied={copied} onCopy={handleCopy} />
        <IdSection title={`Post IDs (${posts.length})`} ids={postIds} type="posts" copied={copied} onCopy={handleCopy} />
        <IdSection title={`Reel IDs (${reels.length})`} ids={reelIds} type="reels" copied={copied} onCopy={handleCopy} />
      </div>
    </div>
  );
}

function IdSection({ title, ids, type, copied, onCopy }) {
  return (
    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm text-gray-700 uppercase tracking-widest">{title}</h3>
        <button 
          onClick={() => onCopy(ids, type)}
          className="text-xs font-bold text-[#3A125E] hover:text-[#9B51E0] flex items-center gap-1"
        >
          {copied === type ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy All</>}
        </button>
      </div>
      <div className="text-xs font-mono text-gray-500 break-all bg-white p-3 rounded-lg border border-gray-200 h-24 overflow-y-auto">
        {ids || 'No IDs found...'}
      </div>
    </div>
  );
}
