import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, ShieldBan, Trash2, ShieldAlert,
  ArrowUpCircle, Activity, Verified, RefreshCw, MoreVertical,
  CheckCircle2, Flame, User
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function DeveloperUserManagement({ token }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState(null); // Which user's dropdown is open

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdateUser = async (id, updates, confirmMessage = null) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      loadUsers();
      setActionUserId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("WARNING: Are you sure you want to permanently delete this user account?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      loadUsers();
      setActionUserId(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUserAction = async (id, action, payload = {}) => {
    if (action === 'warn' && !payload.message) {
      const msg = window.prompt("Enter warning message:");
      if (!msg) return;
      payload.message = msg;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, payload })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      loadUsers();
      setActionUserId(null);
      alert(data.message || 'Action successful');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-20">
        <div>
          <h2 className="text-2xl font-black text-[#3A125E] tracking-tight flex items-center gap-2">
            User Management <span className="px-2 py-1 bg-[#00FFFF]/20 text-[#3A125E] text-[11px] rounded-full uppercase">Professional</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage all IDs, assign categories, and control platform access.</p>
        </div>
        <button 
          onClick={loadUsers} 
          className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
        >
          <RefreshCw size={18} className={isLoading ? "animate-spin text-gray-500" : "text-gray-700"} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <RefreshCw className="animate-spin mb-3" size={24} />
            <span className="font-bold uppercase tracking-wider text-xs">Loading Users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center p-8 text-gray-500 font-bold">No users found.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {users.map(u => (
              <div key={u.id || u._id} className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative">
                
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-100 relative bg-gray-50 flex items-center justify-center">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="text-gray-300" size={24} />
                    )}
                    {u.status === 'banned' && (
                      <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center">
                        <ShieldBan size={16} className="text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-gray-800 truncate">{u.name || 'Unnamed User'}</h3>
                      {u.is_verified && <Verified size={14} className="text-blue-500 shrink-0" fill="currentColor" />}
                      {u.role === 'superadmin' && <ShieldCheck size={14} className="text-[#00FFFF] shrink-0" />}
                    </div>
                    <p className="text-xs font-bold text-gray-500 truncate lowercase">@{u.username || u.email?.split('@')[0] || 'unknown'}</p>
                    
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        u.status === 'banned' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                      }`}>
                        {u.status || 'Active'}
                      </span>
                      {u.category && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-purple-100 text-purple-700">
                          {u.category}
                        </span>
                      )}
                      {(u.warnings?.length > 0) && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-orange-100 text-orange-700 flex items-center gap-1">
                          <AlertTriangle size={10} /> {u.warnings.length}
                        </span>
                      )}
                      {(u.boost_score > 0) && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-100 text-blue-700 flex items-center gap-1">
                          <Flame size={10} /> {u.boost_score} Boost
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions Toggle */}
                  <button 
                    onClick={() => setActionUserId(actionUserId === u.id ? null : (u.id || u._id))}
                    className={`p-2 rounded-xl transition-colors ${actionUserId === (u.id || u._id) ? 'bg-[#3A125E] text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>

                {/* Expanded Actions Panel */}
                {actionUserId === (u.id || u._id) && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    
                    {u.status === 'banned' ? (
                      <button onClick={() => handleUpdateUser(u.id || u._id, { status: 'active' })} className="flex items-center gap-2 p-2 rounded-lg bg-green-50 text-green-700 text-xs font-bold hover:bg-green-100 transition-colors justify-center">
                        <CheckCircle2 size={14} /> Unban ID
                      </button>
                    ) : (
                      <button onClick={() => handleUpdateUser(u.id || u._id, { status: 'banned' }, "Ban this user?")} className="flex items-center gap-2 p-2 rounded-lg bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors justify-center">
                        <ShieldBan size={14} /> Ban ID
                      </button>
                    )}

                    <button onClick={() => handleUpdateUser(u.id || u._id, { is_verified: !u.is_verified })} className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold transition-colors justify-center ${u.is_verified ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                      <Verified size={14} /> {u.is_verified ? 'Remove Badge' : 'Add Blue Tick'}
                    </button>

                    <button onClick={() => handleUserAction(u.id || u._id, 'warn')} className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 text-orange-700 text-xs font-bold hover:bg-orange-100 transition-colors justify-center">
                      <ShieldAlert size={14} /> Send Warning
                    </button>

                    <button onClick={() => handleUserAction(u.id || u._id, 'boost')} className="flex items-center gap-2 p-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors justify-center">
                      <ArrowUpCircle size={14} /> Growth Boost
                    </button>

                    <button onClick={() => {
                        const cat = window.prompt("Enter category (e.g. Creator, Brand, VIP):", u.category || '');
                        if (cat !== null) handleUpdateUser(u.id || u._id, { category: cat });
                      }} 
                      className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-colors justify-center"
                    >
                      <Activity size={14} /> Categorize
                    </button>

                    <button onClick={() => handleUpdateUser(u.id || u._id, { role: u.role === 'superadmin' ? 'user' : 'superadmin' }, `Change role to ${u.role === 'superadmin' ? 'user' : 'superadmin'}?`)} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors justify-center">
                      <ShieldCheck size={14} /> {u.role === 'superadmin' ? 'Demote' : 'Promote'}
                    </button>

                    <button onClick={() => handleDeleteUser(u.id || u._id)} className="col-span-2 sm:col-span-2 flex items-center gap-2 p-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors justify-center shadow-sm">
                      <Trash2 size={14} /> Delete Account
                    </button>

                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
