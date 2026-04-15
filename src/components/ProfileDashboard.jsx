import React, { useState, useEffect, useRef } from 'react';
import { uploadMediaToAppwrite } from '../utils/appwriteClient';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://alok-backend.onrender.com');

export default function ProfileDashboard() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [adminId, setAdminId] = useState(localStorage.getItem('adminId') || '');
  const [profile, setProfile] = useState(null);

  // Authentication UI
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Content
  const [activeTab, setActiveTab] = useState('reels'); // 'reels' or 'posts'
  const [myReels, setMyReels] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Upload System
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingReel, setIsUploadingReel] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');

  // Editing UI
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (token) {
      loadProfileData();
    }
  }, [token]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      // Fetch Profile
      const pRes = await fetch(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        setProfile(pData.data);
        const myId = pData.data.id || pData.data._id;
        
        // Fetch Reels
        const rRes = await fetch(`${API_URL}/api/reels?creator_id=${myId}`);
        if(rRes.ok) {
          const rData = await rRes.json();
          setMyReels(rData.data || []);
        }

        // Fetch Posts
        const nRes = await fetch(`${API_URL}/api/news?author_id=${myId}`);
        if(nRes.ok) {
          const nData = await nRes.json();
          setMyPosts(rData?.data && Array.isArray(nData.data) ? nData.data : []);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.data && data.data.token) {
        localStorage.setItem('adminToken', data.data.token);
        localStorage.setItem('adminId', data.data.profile.id || data.data.profile._id);
        setToken(data.data.token);
        setAdminId(data.data.profile.id || data.data.profile._id);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminId');
    setToken('');
    setAdminId('');
    setProfile(null);
    setMyReels([]);
    setMyPosts([]);
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: editName, bio: editBio, avatar_url: editAvatar })
      });
      if (res.ok) {
        setIsEditing(false);
        loadProfileData(); // Reload stats
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to preserve edit');
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGridReelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingReel(true);
    setUploadProgress(0);
    setUploadStatusText('Connecting to Cloudflare...');
    
    try {
      setUploadStatusText('Uploading Video directly via Appwrite...');
      const fileUrl = await uploadMediaToAppwrite(file, 'alok_media', (progress) => {
        setUploadProgress(Math.round(progress.progress));
        setUploadStatusText(`Uploading Video ${Math.round(progress.progress)}%...`);
      });

      // 3. Create Video Story with the resolved public URL
      setUploadStatusText('Finalizing inside ModeBook...');
      const reelRes = await fetch(`${API_URL}/api/reels`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ video_url: fileUrl, caption: 'My Latest Profile Story' })
      });
      
      if (!reelRes.ok) throw new Error('Failed to create video story row');
      const savedReel = await reelRes.json();
      
      setUploadStatusText('Success!');
      setIsUploadingReel(false);
      setUploadProgress(0);
      
      // Auto-Redirect to play the exact newly minted video
      if(savedReel.data && savedReel.data.id) {
         window.location.hash = '#viewReel=' + savedReel.data.id;
      }
      window.location.reload();
      
    } catch (err) {
      console.error(err);
      alert('Upload Error: ' + err.message);
      setIsUploadingReel(false);
      setUploadProgress(0);
    }
  };

  const startEditing = () => {
    setEditName(profile?.name || '');
    setEditBio(profile?.bio || '');
    setEditAvatar(profile?.avatar_url || '');
    setIsEditing(true);
  };

  if (!token) {
    return (
    <>
      {isUploadingReel && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
           <div className="w-20 h-20 mb-4 animate-bounce">
              <svg viewBox="0 0 24 24" fill="none" className="text-pink-500 w-full h-full" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="4"></rect><path d="M10 8v8l6-4-6-4z"></path></svg>
           </div>
           <h2 className="text-xl font-bold text-white mb-2">{uploadStatusText}</h2>
           <div className="w-full max-w-sm bg-gray-800 rounded-full h-4 overflow-hidden outline outline-1 outline-gray-600 mb-2">
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 h-full transition-all duration-300 ease-out" style={{width: `${uploadProgress}%`}}></div>
           </div>
           <p className="text-gray-400 font-semibold">{uploadProgress}%</p>
        </div>
      )}
      <div className="flex items-center justify-center min-h-[80vh] bg-black text-white p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-gray-900 border border-gray-800 p-8 rounded-xl flex flex-col gap-4 shadow-2xl">
          <div className="flex justify-center mb-4">
            <h1 className="text-3xl font-serif tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">ModeBook</h1>
          </div>
          <input type="email" placeholder="Phone number, username, or email" required className="bg-black/50 border border-gray-700 rounded p-3 text-sm focus:outline-none focus:border-gray-500" value={email} onChange={e=>setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required className="bg-black/50 border border-gray-700 rounded p-3 text-sm focus:outline-none focus:border-gray-500" value={password} onChange={e=>setPassword(e.target.value)} />
          <button type="submit" disabled={isLoggingIn} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded p-3 mt-2 transition">
            {isLoggingIn ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
      </>
    );
  }

  if (isLoading && !profile) {
    return <div className="flex justify-center items-center h-full text-white"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div></div>;
  }

  return (
    <div className="bg-black min-h-[100vh] text-white w-full max-w-2xl mx-auto overflow-y-auto pb-20">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-800 sticky top-0 bg-black z-10">
        <div className="font-bold text-lg flex items-center gap-1">
          {profile?.name || 'modebook_user'} <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
        </div>
        <div className="flex gap-4">
          <button onClick={handleLogout} className="text-red-500 text-sm font-semibold p-1">Log out</button>
        </div>
      </div>

      {isEditing ? (
        <div className="p-6 flex flex-col gap-4 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold">Edit profile</h2>
             <button onClick={()=>setIsEditing(false)} className="text-gray-400">Cancel</button>
          </div>
          <div className="flex flex-col items-center gap-2 mb-4">
            <img src={editAvatar || 'https://ui-avatars.com/api/?name='+(editName||'User')+'&background=random'} className="w-24 h-24 rounded-full border-2 border-gray-700 object-cover" />
            <input type="text" placeholder="Avatar URL (Optional)" className="bg-gray-900 border border-gray-800 w-full rounded p-2 text-sm text-center" value={editAvatar} onChange={e=>setEditAvatar(e.target.value)} />
          </div>
          <input type="text" placeholder="Name" className="bg-gray-900 border border-gray-800 rounded p-3 text-sm focus:border-gray-500" value={editName} onChange={e=>setEditName(e.target.value)} />
          <textarea placeholder="Bio" className="bg-gray-900 border border-gray-800 rounded p-3 text-sm focus:border-gray-500 min-h-[100px]" value={editBio} onChange={e=>setEditBio(e.target.value)} />
          <button onClick={handleSaveProfile} disabled={isSaving} className="bg-blue-500 text-white rounded p-3 font-semibold mt-2">
             {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      ) : (
        <>
          {/* Profile Header */}
          <div className="p-4 flex items-center justify-between">
            <img src={profile?.avatar_url || 'https://ui-avatars.com/api/?name='+(profile?.name||'User')+'&background=random'} className="w-20 h-20 md:w-28 md:h-28 rounded-full border border-gray-700 object-cover p-1" alt="Profile" />
            <div className="flex gap-4 md:gap-8 flex-1 justify-center">
              <div className="flex flex-col items-center"><span className="font-bold text-lg">∞</span><span className="text-sm text-gray-400">posts</span></div>
              <div className="flex flex-col items-center"><span className="font-bold text-lg">10.2K</span><span className="text-sm text-gray-400">followers</span></div>
              <div className="flex flex-col items-center"><span className="font-bold text-lg">42</span><span className="text-sm text-gray-400">following</span></div>
            </div>
          </div>

          <div className="px-4 pb-4">
            <h2 className="font-semibold text-sm">{profile?.name}</h2>
            <p className="text-sm border-gray-700 pt-1 text-gray-200" dangerouslySetInnerHTML={{ __html: profile?.bio ? profile.bio.replace(/\n/g, '<br/>') : 'Add a bio from Edit Profile' }} />
          </div>

          <div className="px-4 pb-4 flex gap-2">
            <button onClick={startEditing} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg py-1.5 transition">Edit profile</button>
            <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg py-1.5 transition">Share profile</button>
          </div>

          {/* Highlights/Status Archieves Simulation */}
          <div className="px-4 pb-4 flex gap-4 overflow-x-auto no-scrollbar">
             <div className="flex flex-col items-center gap-1 min-w-max">
               <div className="w-16 h-16 rounded-full border border-gray-600 p-[2px]">
                 <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-2xl font-bold">+</div>
               </div>
               <span className="text-xs">New</span>
             </div>
          </div>

          {/* Grid Tabs */}
          <div className="flex border-t border-gray-800">
            <button onClick={()=>setActiveTab('reels')} className={`flex-1 flex justify-center items-center py-3 border-b-2 gap-2 ${activeTab==='reels'?'border-white text-white':'border-transparent text-gray-500'}`}>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
               <span className="text-xs uppercase tracking-widest font-semibold hidden md:block">VIDEO STORIES</span>
            </button>
            <button onClick={()=>setActiveTab('posts')} className={`flex-1 flex justify-center items-center py-3 border-b-2 gap-2 ${activeTab==='posts'?'border-white text-white':'border-transparent text-gray-500'}`}>
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
               <span className="text-xs uppercase tracking-widest font-semibold hidden md:block">POSTS</span>
            </button>
          </div>

          {/* Grids */}
          {activeTab === 'reels' && (
            <div className="grid grid-cols-3 gap-0.5 mt-0.5">
              
              {/* Naya Add Video Story button list format mein beautifully stylized */}
              <div 
                className="relative aspect-[9/16] bg-gradient-to-br from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 transition border border-gray-700 border-dashed group cursor-pointer flex flex-col items-center justify-center overflow-hidden"
                onClick={() => fileInputRef.current.click()}
              >
                  <svg className="w-12 h-12 text-pink-500 mb-3 ml-1 group-hover:scale-110 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="4" /><path d="M10 8v8l6-4-6-4z" /></svg>
                  <span className="text-xs font-bold text-gray-300 uppercase tracking-widest text-center px-1 leading-tight shrink-0">Upload <br/>Story</span>
                  <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleGridReelUpload} />
              </div>
              {myReels.length === 0 && <div className="col-span-2 text-center py-10 flex items-center justify-center text-gray-500 text-sm px-2">No videos yet. Tap to add!</div>}
              {myReels.map(reel => (
                <div key={reel.id} className="relative aspect-[9/16] bg-gray-900 group cursor-pointer">
                  <video src={reel.video_url} className="w-full h-full object-cover" muted playsInline />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition opacity-0 group-hover:opacity-100 flex items-center justify-center">
                     <div className="flex gap-2 font-bold"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M10 8v8l6-4-6-4z"/></svg> {reel.views||0}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'posts' && (
             <div className="grid grid-cols-3 gap-0.5 mt-0.5">
              {myPosts.length === 0 && <div className="col-span-3 text-center py-10 text-gray-500 text-sm">No posts uploaded yet.</div>}
              {myPosts.map(post => (
                <div key={post.id} className="relative aspect-square bg-gray-900 group cursor-pointer">
                  <img src={post.image_url} className="w-full h-full object-cover" alt="Post" />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
