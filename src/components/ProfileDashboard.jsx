import React, { useState, useEffect, useRef } from 'react';
import { uploadMediaToAppwrite } from '../utils/appwriteClient';
import { buildCreatorIdentity, getPreferredCreatorMode } from '../utils/creatorIdentity';
import SkeletonImage from './SkeletonImage';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function ProfileDashboard({ targetUserId, onBack }) {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [adminId, setAdminId] = useState(localStorage.getItem('adminId') || '');
  const [profile, setProfile] = useState(null);
  const isPublicView = targetUserId && targetUserId !== adminId;

  // Authentication UI
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Content
  const [activeTab, setActiveTab] = useState('reels'); // 'reels' or 'posts'
  const [myReels, setMyReels] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);

  // Upload System
  const fileInputRef = useRef(null); // for videos
  const avatarInputRef = useRef(null); // for admin logo/avatar
  const logoInputRef = useRef(null); // for site logo
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingReel, setIsUploadingReel] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('');

  // Editing UI
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, reason: '' });
  const [isSaving, setIsSaving] = useState(false);
  const usernameCheckTimer = useRef(null);

  // Developer Dashboard UI
  const [showDeveloperDashboard, setShowDeveloperDashboard] = useState(false);
  const [developerVersions, setDeveloperVersions] = useState([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  useEffect(() => {
    loadProfileData();
    // Silent real-time update polling (every 4 seconds)
    const interval = setInterval(() => {
      loadProfileData();
    }, 4000);
    return () => clearInterval(interval);
  }, [token, targetUserId]);

  const loadProfileData = async () => {
    if (!profile) setIsLoading(true);
    try {
      let targetId = targetUserId || adminId;
      if (!targetId) {
        setIsLoading(false);
        return;
      }

      if (isPublicView) {
         // Fetch public profile info
         const uRes = await fetch(`${API_URL}/api/users/${targetId}`);
         if (uRes.ok) {
           const userData = await uRes.json();
           setProfile(userData);
         } else {
           // Fallback if user profile doesn't exist yet as Admin document
           setProfile({
             name: 'User ' + targetId.substring(0, 8),
             id: targetId,
             bio: 'Creator on DenceWance'
           });
         }

         // Fetch Content (Reels and Posts)
         const cRes = await fetch(`${API_URL}/api/users/${targetId}/content`);
         if (cRes.ok) {
           const cData = await cRes.json();
           setMyReels(cData.reels || []);
           setMyPosts(cData.posts || []);
         } else {
           // Naive fallback
           const rRes = await fetch(`${API_URL}/api/reels?creator_id=${targetId}`);
           if (rRes.ok) {
             const rData = await rRes.json();
             setMyReels(rData.data || []);
           }
           const nRes = await fetch(`${API_URL}/api/news?author_id=${targetId}`);
           if (nRes.ok) {
             const nData = await nRes.json();
             setMyPosts(Array.isArray(nData.data) ? nData.data : []);
           }
         }
      } else if (token) {
        // Fetch Private Profile (Current User)
        const pRes = await fetch(`${API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (pRes.ok) {
          const pData = await pRes.json();
          setProfile(pData.data);
          const currentId = pData.data.id || pData.data._id;
          
          // Fetch Content
          const cRes = await fetch(`${API_URL}/api/users/${currentId}/content`);
          if (cRes.ok) {
            const cData = await cRes.json();
            setMyReels(cData.reels || []);
            setMyPosts(cData.posts || []);
          } else {
            // Fallback
            const rRes = await fetch(`${API_URL}/api/reels?creator_id=${currentId}`);
            if (rRes.ok) {
              const rData = await rRes.json();
              setMyReels(rData.data || []);
            }
            const nRes = await fetch(`${API_URL}/api/news?author_id=${currentId}`);
            if (nRes.ok) {
              const nData = await nRes.json();
              setMyPosts(Array.isArray(nData.data) ? nData.data : []);
            }
          }
        }
      }

      // Fetch Site Settings
      if (!isPublicView) {
        const sRes = await fetch(`${API_URL}/api/settings`);
        if (sRes.ok) {
          const sData = await sRes.json();
          setSiteSettings(sData?.data || {});
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVersions = async () => {
    setIsLoadingVersions(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/versions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDeveloperVersions(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch versions', err);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  useEffect(() => {
    if (showDeveloperDashboard && developerVersions.length === 0) {
      fetchVersions();
    }
  }, [showDeveloperDashboard]);

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
        localStorage.setItem('userName', data.data.profile.name || '');
        localStorage.setItem('userHandle', data.data.profile.email?.split('@')[0] || '');
        localStorage.setItem('userAvatar', data.data.profile.avatar_url || '');
        // Flag to redirect admin users to the developer tab on load
        localStorage.setItem('just_logged_in_admin', 'true');
        setToken(data.data.token);
        setAdminId(data.data.profile.id || data.data.profile._id);
        window.location.reload();
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
    localStorage.removeItem('userName');
    localStorage.removeItem('userHandle');
    localStorage.removeItem('userAvatar');
    setToken('');
    setAdminId('');
    setProfile(null);
    setMyReels([]);
    setMyPosts([]);
    window.location.reload();
  };

  const handleDeleteReel = async (id) => {
    if (!window.confirm('Delete this reel permanently?')) return;
    try {
      const res = await fetch(`${API_URL}/api/reels/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Developer-Secret': 'DENCEWANCE_DEV_2026'
        }
      });
      if (res.ok) {
        setMyReels(myReels.filter(r => (r.id || r._id) !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert('Network error deleting reel');
    }
  };

  const handlePurgeReel = async (reel) => {
    const reelId = reel.id || reel._id;
    if (!window.confirm('Permanently purge this reel from DB, storage, and tombstones?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/reels/permanent-cleanup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reelId, videoUrl: reel.video_url })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Permanent cleanup failed');
      setMyReels(prev => prev.filter(r => (r.id || r._id) !== reelId));
      alert('Reel purged permanently.');
    } catch (err) {
      alert('Permanent cleanup failed: ' + err.message);
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      const res = await fetch(`${API_URL}/api/news/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setMyPosts(myPosts.filter(p => (p.id || p._id) !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      alert('Network error deleting post');
    }
  };

  const checkUsernameAvailability = (val) => {
    if (usernameCheckTimer.current) clearTimeout(usernameCheckTimer.current);
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setEditUsername(cleaned);

    if (!cleaned || cleaned.length < 3) {
      setUsernameStatus({ checking: false, available: null, reason: cleaned.length > 0 ? 'Username must be at least 3 characters' : '' });
      return;
    }
    if (cleaned.length > 20) {
      setUsernameStatus({ checking: false, available: false, reason: 'Username must be 20 characters or less' });
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(cleaned)) {
      setUsernameStatus({ checking: false, available: false, reason: 'Only lowercase letters, numbers and underscores' });
      return;
    }
    // If unchanged from current, skip check
    const currentHandle = (profile?.username || profile?.email?.split('@')[0] || '').toLowerCase();
    if (cleaned === currentHandle) {
      setUsernameStatus({ checking: false, available: true, reason: 'Your current username' });
      return;
    }

    setUsernameStatus({ checking: true, available: null, reason: 'Checking...' });
    usernameCheckTimer.current = setTimeout(async () => {
      try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/api/auth/check-username?username=${encodeURIComponent(cleaned)}`, { headers });
        const data = await res.json();
        if (data.available) {
          setUsernameStatus({ checking: false, available: true, reason: '✓ Username is available!' });
        } else {
          setUsernameStatus({ checking: false, available: false, reason: data.reason === 'invalid_format' ? 'Invalid format' : '✗ Username is already taken' });
        }
      } catch {
        setUsernameStatus({ checking: false, available: null, reason: 'Could not check availability' });
      }
    }, 400);
  };

  const handleSaveProfile = async () => {
    // Validate username before saving
    if (editUsername && editUsername.length >= 3 && usernameStatus.available === false) {
      alert('Please choose an available username before saving.');
      return;
    }
    setIsSaving(true);
    try {
      const body = { name: editName, bio: editBio, avatar_url: editAvatar };
      if (editUsername && /^[a-z0-9_]{3,20}$/.test(editUsername)) {
        body.username = editUsername;
      }
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.username) {
          localStorage.setItem('userHandle', data.data.username);
        }
        if (data.data?.name) {
          localStorage.setItem('userName', data.data.name);
        }
        if (data.data?.avatar_url) {
          localStorage.setItem('userAvatar', data.data.avatar_url);
        }
        setIsEditing(false);
        loadProfileData(); // Reload stats
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to preserve edit');
      }
    } catch(e) {
      console.error(e);
      alert('Save Error: ' + (e.message || 'Network error connecting to the server.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingReel(true);
    setUploadStatusText('Uploading Site Logo...');
    try {
      const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID || 'media';
      const fileUrl = await uploadMediaToAppwrite(file, bucketId, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      // Save logo to SiteSettings
      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ site_logo_url: fileUrl })
      });
      if (res.ok) {
        setUploadStatusText('Logo saved!');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (err) {
      alert('Upload Error: ' + err.message);
    } finally {
      setIsUploadingReel(false);
      setUploadProgress(0);
    }
  };

  const handleAdminAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingReel(true);
    setUploadStatusText('Uploading Admin Avatar (also used as Logo)...');
    try {
      const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID || 'media';
      const fileUrl = await uploadMediaToAppwrite(file, bucketId, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      // Update Admin avatar_url
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ avatar_url: fileUrl })
      });
      if (res.ok) {
        setUploadStatusText('Avatar saved!');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error('Failed to save profile');
      }
    } catch (err) {
      alert('Upload Error: ' + err.message);
    } finally {
      setIsUploadingReel(false);
      setUploadProgress(0);
    }
  };

  const handleGridReelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingReel(true);
    setUploadProgress(0);
    setUploadStatusText('Connecting to Cloudflare...');
    const creatorIdentity = buildCreatorIdentity({
      mode: getPreferredCreatorMode(),
      seed: file.name || `profile-reel-${Date.now()}`,
      name: profile?.name || 'You',
    });
    
    try {
      setUploadStatusText('Uploading Video directly via Appwrite...');
      const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID || 'media';
      const fileUrl = await uploadMediaToAppwrite(file, bucketId, (progress) => {
        setUploadProgress(Math.round(progress.progress));
        setUploadStatusText(`Uploading Video ${Math.round(progress.progress)}%...`);
      });

      const authToken = localStorage.getItem('adminToken') || '';

      // 3. Create Video Story with the resolved public URL
      setUploadStatusText('Finalizing inside DenceWance...');
      const reelRes = await fetch(`${API_URL}/api/reels`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({ video_url: fileUrl, caption: 'My Latest Profile Story', ...creatorIdentity })
      });
      
      if (!reelRes.ok) {
        const errData = await reelRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create video story row');
      }
      const savedReel = await reelRes.json();
      const reelId = String(savedReel.data?.id || savedReel.data?._id || savedReel.id || savedReel._id || '');
      if (reelId) {
        const hydratedRes = await fetch(`${API_URL}/api/reels/${encodeURIComponent(reelId)}?_t=${Date.now()}`, {
          headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
        });
        if (hydratedRes.ok) {
          const hydrated = await hydratedRes.json();
          const hydratedReel = hydrated?.data || savedReel.data || {};
          setMyReels(prev => {
            const normalized = { ...hydratedReel, id: reelId, _id: reelId };
            const filtered = prev.filter(r => String(r.id || r._id || '') !== reelId);
            return [normalized, ...filtered];
          });
        }
        window.location.hash = '#viewReel=' + reelId;
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
      
      setUploadStatusText('Success!');
      setIsUploadingReel(false);
      setUploadProgress(0);

      loadProfileData();
      
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
    const currentHandle = (profile?.username || profile?.email?.split('@')[0] || '').toLowerCase();
    setEditUsername(currentHandle);
    setUsernameStatus({ checking: false, available: null, reason: '' });
    setIsEditing(true);
  };

  if (!token && !isPublicView) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-black text-white historical-theme p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-gray-900 border border-gray-800 p-8 rounded-xl flex flex-col gap-4 shadow-2xl">
          <div className="flex justify-center mb-4">
            <h1 className="text-3xl font-serif tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">DenceWance</h1>
          </div>
          <input type="email" placeholder="Phone number, username, or email" required className="bg-black/50 border border-gray-700 rounded p-3 text-sm focus:outline-none focus:border-gray-500" value={email} onChange={e=>setEmail(e.target.value)} />
          <input type="password" placeholder="Password" required className="bg-black/50 border border-gray-700 rounded p-3 text-sm focus:outline-none focus:border-gray-500" value={password} onChange={e=>setPassword(e.target.value)} />
          <button type="submit" disabled={isLoggingIn} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded p-3 mt-2 transition">
            {isLoggingIn ? 'Logging in...' : 'Log in'}
          </button>
        </form>
      </div>
    );
  }

  if (isLoading && !profile) {
    return <div className="flex justify-center items-center h-full text-white"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div></div>;
  }

  return (
    <div className="bg-black min-h-[100vh] text-white w-full max-w-2xl mx-auto overflow-y-auto pb-20">
      
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur border-b border-gray-800 flex justify-between items-center p-3">
        <div className="flex items-center gap-3">
          {onBack && (
             <button onClick={onBack} className="text-white hover:text-gray-300 font-bold p-1">← Back</button>
          )}
          <h1 className="text-lg font-bold">{profile?.name || 'Profile'}</h1>
        </div>
        <div className="flex gap-4">
          {!isPublicView && <button onClick={handleLogout} className="text-red-500 text-sm font-semibold p-1">Log out</button>}
        </div>
      </div>

      {isEditing ? (
        <div className="p-6 flex flex-col gap-4 animate-fade-in">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold">Edit profile</h2>
             <button onClick={()=>setIsEditing(false)} className="text-gray-400">Cancel</button>
          </div>
          <div className="flex flex-col items-center gap-2 mb-4">
            <SkeletonImage
              src={editAvatar || 'https://ui-avatars.com/api/?name='+(editName||'User')+'&background=random'}
              alt="Admin avatar"
              className="w-24 h-24 rounded-full border-2 border-gray-700 object-cover cursor-pointer hover:opacity-80"
              wrapperStyle={{ width: '6rem', height: '6rem', borderRadius: '9999px', display: 'block' }}
              circle={true}
              onClick={() => avatarInputRef.current && avatarInputRef.current.click()}
            />
            <input type="hidden" placeholder="Avatar URL (Optional)" className="bg-gray-900 border border-gray-800 w-full rounded p-2 text-sm text-center" value={editAvatar} onChange={e=>setEditAvatar(e.target.value)} />
            <button className="text-blue-500 text-sm font-semibold" onClick={() => avatarInputRef.current && avatarInputRef.current.click()}>Change Profile DP / Photo</button>
          </div>
          <input type="text" placeholder="Name" className="bg-gray-900 border border-gray-800 rounded p-3 text-sm focus:border-gray-500" value={editName} onChange={e=>setEditName(e.target.value)} />
          
          {/* Username / Handle with live availability */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Username / Handle</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
              <input
                type="text"
                placeholder="your_username"
                className={`bg-gray-900 border rounded p-3 pl-7 text-sm w-full focus:outline-none ${
                  usernameStatus.available === true ? 'border-green-500 focus:border-green-400' :
                  usernameStatus.available === false ? 'border-red-500 focus:border-red-400' :
                  'border-gray-800 focus:border-gray-500'
                }`}
                value={editUsername}
                onChange={e => checkUsernameAvailability(e.target.value)}
                maxLength={20}
              />
              {usernameStatus.checking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-400"></div>
                </div>
              )}
              {!usernameStatus.checking && usernameStatus.available === true && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-lg">✓</span>
              )}
              {!usernameStatus.checking && usernameStatus.available === false && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-lg">✗</span>
              )}
            </div>
            {usernameStatus.reason && (
              <p className={`text-xs mt-0.5 ${
                usernameStatus.available === true ? 'text-green-400' :
                usernameStatus.available === false ? 'text-red-400' :
                'text-gray-500'
              }`}>{usernameStatus.reason}</p>
            )}
            <p className="text-[10px] text-gray-600">3-20 characters, lowercase letters, numbers, underscores only</p>
          </div>
          
          <textarea placeholder="Bio" className="bg-gray-900 border border-gray-800 rounded p-3 text-sm focus:border-gray-500 min-h-[100px]" value={editBio} onChange={e=>setEditBio(e.target.value)} />
          
          {/* Website Settings Logo */}
          <div className="border-t border-gray-800 mt-4 pt-4 flex flex-col gap-2">
            <h3 className="text-sm font-bold text-gray-300">Website Global Logo</h3>
            <div className="flex items-center gap-4">
              <SkeletonImage
                src={siteSettings?.site_logo_url || editAvatar || 'https://ui-avatars.com/api/?name=Website'}
                alt="Website logo"
                className="w-16 h-16 rounded shadow object-cover"
                wrapperStyle={{ width: '4rem', height: '4rem', borderRadius: '0.25rem', display: 'block' }}
              />
              <button className="bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg py-2 px-4 transition" onClick={() => logoInputRef.current.click()}>Upload Website Logo</button>
            </div>
            <p className="text-xs text-gray-500">This logo will appear everywhere on the site.</p>
          </div>

          <button onClick={handleSaveProfile} disabled={isSaving || (editUsername.length >= 3 && usernameStatus.available === false)} className={`text-white rounded p-3 font-semibold mt-4 transition ${isSaving || (editUsername.length >= 3 && usernameStatus.available === false) ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}>
             {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      ) : (
            {/* Profile Header */}
          <div className="p-6 bg-[#1A1625]/85 border border-white/5 backdrop-blur-md rounded-[32px] shadow-2xl mt-4 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
              {/* Dynamic Avatar with neon active ring */}
              <div className="w-24 h-24 rounded-[26px] p-[2.5px] bg-gradient-to-tr from-[#9B51E0] via-[#00FFFF] to-[#FFD700] shadow-[0_4px_20px_rgba(155,81,224,0.3)] shrink-0 flex items-center justify-center">
                <div className="w-full h-full rounded-[23px] overflow-hidden bg-[#121214] border border-[#121214]">
                  <SkeletonImage
                    src={profile?.avatar_url || 'https://ui-avatars.com/api/?name='+(profile?.name||'User')+'&background=random'}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    wrapperStyle={{ width: '100%', height: '100%', display: 'block' }}
                    circle={false}
                  />
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                  <h2 className="font-sans font-black text-xl text-white tracking-wide uppercase">{profile?.name || 'PREETAM SINGH YADAV'}</h2>
                  <svg viewBox="0 0 24 24" fill="#FFD700" className="w-5 h-5 shrink-0">
                    <path d="M12 2l2.4 2.8 3.7-.5.9 3.6 3.4 1.5-1.5 3.4.9 3.6-3.7-.5-2.4 2.8L12 18l-3.7.8-2.4-2.8-3.7.5.9-3.6-3.4-1.5 1.5-3.4-.9-3.6 3.7.5 2.4-2.8L12 2z"/>
                    <path d="M9 12l2 2 4-4" stroke="#3A125E" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                
                {/* Custom Status Label */}
                <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Creator
                </div>

                <div className="text-gray-400 font-bold text-xs mt-3 flex items-center gap-1.5">
                  <span>📅 Joined 4/18/2026</span>
                  <span>•</span>
                  <span className="text-[#00FFFF]">Verified</span>
                </div>
                <div className="text-gray-300 font-semibold text-sm mt-2 max-w-md" dangerouslySetInnerHTML={{ __html: profile?.bio ? profile.bio.replace(/\n/g, '<br/>') : 'Ramlal Anand college' }} />
              </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-3 gap-3 mt-6 relative z-10">
              <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 flex flex-col relative overflow-hidden hover:bg-white/10 transition-all duration-300 group shadow-lg">
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider mb-1">Posts</span>
                <span className="text-white text-2xl font-black">{myReels.length + myPosts.length}</span>
                <div className="absolute right-2.5 bottom-2.5 text-gray-500/30 group-hover:scale-110 transition-transform">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="10" width="20" height="10" rx="2" ry="2"/><path d="M7 10v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"/></svg>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 flex flex-col relative overflow-hidden hover:bg-white/10 transition-all duration-300 group shadow-lg">
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider mb-1">Followers</span>
                <span className="text-white text-2xl font-black">{adminData?.followers_count || 148}</span>
                <div className="absolute right-2.5 bottom-2.5 text-gray-500/30 group-hover:scale-110 transition-transform">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5 flex flex-col relative overflow-hidden hover:bg-white/10 transition-all duration-300 group shadow-lg">
                <span className="text-gray-400 text-[10px] font-black uppercase tracking-wider mb-1">Following</span>
                <span className="text-white text-2xl font-black">{adminData?.following_count || 96}</span>
                <div className="absolute right-2.5 bottom-2.5 text-gray-500/30 group-hover:scale-110 transition-transform">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6 pt-2 flex flex-col gap-3 bg-transparent relative z-10">
            {!isPublicView ? (
              <div className="flex gap-3">
                <button onClick={startEditing} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl py-3 transition shadow-md">Edit profile</button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert("Profile Link Copied!"); }} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider rounded-xl py-3 transition shadow-md">Share profile</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl py-3.5 transition shadow-lg shadow-purple-600/20" onClick={() => alert('Follow feature coming soon!')}>Follow</button>
              </div>
            )}
          </div>
          
          {/* Grid Tabs */}
          <div className="flex bg-[#121214] p-1.5 rounded-2xl mx-6 mb-4 border border-white/5">
            <button onClick={()=>setActiveTab('reels')} className={`flex-1 flex justify-center items-center py-2.5 rounded-xl transition-all uppercase tracking-wider font-extrabold text-[10px] cursor-pointer ${activeTab==='reels'?'bg-[#3A125E] text-white shadow-md':'text-gray-400 hover:text-white'}`}>
               RECENT POSTS (GRID)
            </button>
            <button onClick={()=>setActiveTab('posts')} className={`flex-1 flex justify-center items-center py-2.5 rounded-xl transition-all uppercase tracking-wider font-extrabold text-[10px] cursor-pointer ${activeTab==='posts'?'bg-[#3A125E] text-white shadow-md':'text-gray-400 hover:text-white'}`}>
               CONNECTIONS (LIST)
            </button>
          </div>

        {/* Content Area */}
        <div className="flex-1 px-6 bg-transparent">
          {activeTab === 'reels' && (
            <div className="grid grid-cols-3 gap-2">
              {!isPublicView && (
                <div 
                  className="aspect-[9/16] bg-white/5 border border-dashed border-white/10 hover:border-[#3A125E] hover:bg-purple-500/5 flex flex-col items-center justify-center cursor-pointer transition rounded-2xl overflow-hidden relative group"
                  onClick={() => fileInputRef.current.click()}
                >
                  <svg className="w-8 h-8 text-purple-400 mb-2 group-hover:scale-110 transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="4" /><path d="M10 8v8l6-4-6-4z" /></svg>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center px-1 leading-tight shrink-0">Upload Routine</span>
                  <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={handleGridReelUpload} />
                </div>
              )}
              {myReels.length === 0 && isPublicView && <div className="col-span-3 text-center py-12 flex items-center justify-center text-gray-500 text-xs px-2 font-bold uppercase tracking-wider">No clips found for this user.</div>}
              {myReels.length === 0 && !isPublicView && <div className="col-span-2 text-center py-12 flex items-center justify-center text-gray-500 text-xs px-2 font-bold uppercase tracking-wider">No clips yet. Tap to add!</div>}
              {myReels.map((reel) => {
                return (
                  <div key={reel.id || reel._id} className="aspect-[9/16] bg-[#121214] border border-white/5 relative group cursor-pointer rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-350" onClick={() => window.location.hash = `#viewReel=${reel.id || reel._id}`}>
                    <video src={reel.video_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" muted playsInline />
                    
                    {(!isPublicView || localStorage.getItem('adminToken')) && (
                      <div className="absolute top-2 right-2 flex gap-1 z-10">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDeleteReel(reel.id || reel._id); }}
                          className="bg-red-600/90 hover:bg-red-700 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Reel"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handlePurgeReel(reel); }}
                          className="bg-orange-600/90 hover:bg-orange-700 text-white rounded-lg px-2 py-1 text-[8px] font-black shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Permanent Purge"
                        >
                          PURGE
                        </button>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                       <div className="flex items-center gap-1.5 text-[10px] font-black text-white uppercase tracking-wider">
                         <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M10 8v8l6-4-6-4z"/></svg> 
                         {reel.views||0} Views
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'posts' && (
             <div className="flex flex-col gap-3 pb-8">
              {myPosts.length === 0 && (
                <div className="text-center py-12 text-gray-500 font-bold uppercase tracking-wider text-xs">
                  No post uploads found.
                </div>
              )}
              {myPosts.map(post => (
                <div 
                  key={post.id || post._id} 
                  className="bg-[#1A1625]/60 rounded-2xl p-4 shadow-lg border border-white/5 flex gap-4 items-center group relative hover:bg-[#1A1625]/90 transition-all duration-200"
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-900 shrink-0 border border-white/5 relative">
                    <SkeletonImage
                      src={post.image_url}
                      className="w-full h-full object-cover"
                      alt="Post cover"
                      wrapperStyle={{ width: '100%', height: '100%', display: 'block' }}
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[9px] font-black uppercase text-[#00FFFF] tracking-wider mb-0.5">
                      {post.category || 'Updates'}
                    </span>
                    <h4 className="font-extrabold text-sm text-white truncate leading-tight uppercase">
                      {post.title || 'Routine Update'}
                    </h4>
                    <p className="text-xs text-gray-400 line-clamp-1 mt-0.5 font-medium">
                      {post.caption || 'No caption description.'}
                    </p>
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1 block">
                      {new Date(post.published_at || post.created_at || Date.now()).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {(!isPublicView || localStorage.getItem('adminToken')) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id || post._id); }}
                        className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all shadow-xs"
                        title="Delete Post"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </>
      )}

      {/* Hidden file inputs for uploads */}
      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAdminAvatarUpload} />
      {showDeveloperDashboard && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-[#121212] text-white animate-in slide-in-from-bottom duration-300 font-sans">
          <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-[#1A1A1A]">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 9.36l-7.1 7.1a1 1 0 0 1-1.4 0l-2.8-2.8a1 1 0 0 1 0-1.4l7.1-7.1a6 6 0 0 1 9.36-7.94l-3.77 3.77z"/></svg>
              Developer Dashboard
            </h2>
            <button onClick={() => setShowDeveloperDashboard(false)} className="p-2 rounded-full hover:bg-gray-800">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
            <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Version History (Git Log)</h3>
            
            {isLoadingVersions ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : developerVersions.length > 0 ? (
              <div className="flex flex-col gap-4 relative">
                {/* Timeline Line */}
                <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-gray-800"></div>
                
                {developerVersions.map((v, i) => (
                  <div key={v.hash + i} className="relative pl-8 flex flex-col gap-1 group">
                    <div className={`absolute left-[9px] top-1.5 w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-purple-500 ring-4 ring-purple-500/20' : 'bg-gray-600'}`}></div>
                    
                    <div className="bg-[#1E1E1E] border border-gray-800 p-3 rounded-lg shadow-sm group-hover:border-gray-700 transition">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">v_{v.hash}</span>
                        <span className="text-xs text-gray-500">{v.date}</span>
                      </div>
                      <p className="text-sm text-gray-300 leading-snug">{v.message}</p>
                      
                      {i !== 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-800/50 flex justify-end">
                          <button 
                            onClick={() => alert(`To activate this version (Rollback to ${v.hash}), run this command locally in your terminal and push:\n\n1. git reset --hard ${v.hash}\n2. git push -f origin main\n\n(Render will automatically deploy it)`)} 
                            className="text-xs font-semibold px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 transition"
                          >
                            Activate Version
                          </button>
                        </div>
                      )}
                      {i === 0 && (
                         <div className="mt-2 text-xs text-green-400 font-bold flex items-center gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                           Current Live Version
                         </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">No version history available.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
