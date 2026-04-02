import React, { useState, useEffect } from 'react';
import './ProfileDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3004' : '');

export default function ProfileDashboard() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [adminId, setAdminId] = useState(localStorage.getItem('adminId') || '');
  const [user, setUser] = useState(null);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [activeMenu, setActiveMenu] = useState('feed'); // 'feed', 'reels', 'settings'
  
  // Settings State
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  // Post State
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postExcerpt, setPostExcerpt] = useState('');
  const [postCover, setPostCover] = useState(null);
  
  // Reel State
  const [reelTitle, setReelTitle] = useState('');
  const [reelCaption, setReelCaption] = useState('');
  const [reelVideoUrl, setReelVideoUrl] = useState('');

  useEffect(() => {
    if (token) {
      fetchUser();
    }
  }, [token]);

  const fetchUser = async () => {
    if (!adminId) return;
    try {
      const res = await fetch(`${API_URL}/api/admins/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        setToken('');
        localStorage.removeItem('adminToken');
        return;
      }
      const data = await res.json();
      const userData = data.data || data;
      setUser(userData);
      setName(userData.name || '');
      setBio(userData.bio || '');
      setAvatarUrl(userData.avatar_url || '');
    } catch(err) {
      console.error(err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setAdminId(data.data.id || data.data._id);
        setUser(data.data);
        setName(data.data.name);
        setBio(data.data.bio || '');
        setAvatarUrl(data.data.avatar_url || '');
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminId', data.data.id || data.data._id);
      } else {
        alert(data.error || 'Login failed');
      }
    } catch(err) {
      console.error(err);
      alert('Error connecting to backend');
    }
  };
  
  const [avatarFile, setAvatarFile] = useState(null);
  
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      let currentAvatarUrl = avatarUrl;
      
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const uploadRes = await fetch(`${API_URL}/api/profile/avatar`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          currentAvatarUrl = uploadData.data.avatar_url;
        }
      }

      const res = await fetch(`${API_URL}/api/admins/${adminId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, bio, avatar_url: currentAvatarUrl })
      });
      if (res.ok) {
        alert("Profile Updated Successfully!");
        const updated = await res.json();
        setUser(updated.data);
        setAvatarUrl(updated.data.avatar_url || '');
        setAvatarFile(null);
      } else {
        alert("Failed to update profile");
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    try {
      let currentCoverUrl = '';

      if (postCover) {
        const formData = new FormData();
        formData.append('cover', postCover);
        const uploadRes = await fetch(`${API_URL}/api/uploads/cover`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          currentCoverUrl = uploadData.data.url;
        }
      }

      const payload = {
        title: postTitle,
        content: postContent,
        excerpt: postExcerpt,
        status: 'published',
        creator_mode: 'official',
        cover_image_url: currentCoverUrl
      };

      const res = await fetch(`${API_URL}/api/news`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert('Feed post uploaded successfully!');
        setPostTitle(''); setPostContent(''); setPostExcerpt(''); setPostCover(null);
      } else {
        alert('Failed to upload post');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating post');
    }
  };

  const handleCreateReel = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/reels`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title: reelTitle, 
          caption: reelCaption, 
          video_url: reelVideoUrl,
          creator_mode: 'official' // This ties it to the admin profile DP and name
        })
      });
      if (res.ok) {
        alert('Reel uploaded successfully!');
        setReelTitle(''); setReelCaption(''); setReelVideoUrl('');
      } else {
        alert('Failed to upload Reel');
      }
    } catch(e) {
      console.error(e);
      alert('Error creating reel');
    }
  };

  const handleLogout = () => {
    setToken('');
    setAdminId('');
    setUser(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminId');
  };

  if (!token || !user) {
    return (
      <div className="profile-dashboard login-mode">
        <h2>Observer Login</h2>
        <form onSubmit={handleLogin} className="fb-form">
          <input 
            type="email" 
            placeholder="Official Email" 
            value={loginEmail} 
            onChange={(e)=>setLoginEmail(e.target.value)} required 
          />
          <input 
            type="password" 
            placeholder="Passcode" 
            value={loginPassword} 
            onChange={(e)=>setLoginPassword(e.target.value)} required 
          />
          <button type="submit" className="fb-btn">Enter Dashboard</button>
        </form>
      </div>
    );
  }

  return (
    <div className="profile-dashboard fb-style">
      <div className="fb-header">
        <div className="fb-cover">
          <img src="https://images.unsplash.com/photo-1557683316-973673baf926?w=800" alt="Cover" />
        </div>
        <div className="fb-profile-info">
          <div className="fb-avatar">
            <img src={user.avatar_url || 'https://i.pravatar.cc/150'} alt="Avatar" />
          </div>
          <div className="fb-user-details">
            <h1>{user.name}</h1>
            <p>{user.bio || 'Add a bio to let people know more about you.'}</p>
          </div>
          <button onClick={handleLogout} className="fb-logout-btn">Log Out</button>
        </div>
      </div>

      <div className="fb-nav-tabs">
        <button className={activeMenu === 'feed' ? 'active' : ''} onClick={()=>setActiveMenu('feed')}>📝 Create Post</button>
        <button className={activeMenu === 'reels' ? 'active' : ''} onClick={()=>setActiveMenu('reels')}>🎥 Upload Reel</button>
        <button className={activeMenu === 'settings' ? 'active' : ''} onClick={()=>setActiveMenu('settings')}>⚙️ Settings</button>
      </div>

      <div className="fb-content">
        {activeMenu === 'settings' && (
          <div className="fb-card">
            <h3>Profile Settings</h3>
            <form onSubmit={handleUpdateProfile} className="fb-form">
              <label>Name</label>
              <input type="text" value={name} onChange={(e)=>setName(e.target.value)} required />
              
              <label>Bio</label>
              <textarea value={bio} onChange={(e)=>setBio(e.target.value)} rows="3" />

              <label>Avatar / Profile Picture</label>
              <input type="file" accept="image/*" onChange={(e)=>setAvatarFile(e.target.files[0])} />
              
              <label>Avatar URL (Alternate direct connection)</label>
              <input type="url" value={avatarUrl} onChange={(e)=>setAvatarUrl(e.target.value)} placeholder="https://..." />
              
              <button type="submit" className="fb-btn primary">Save Changes</button>
            </form>
          </div>
        )}

        {activeMenu === 'feed' && (
          <div className="fb-card">
            <h3>Create a Feed Post</h3>
            <form onSubmit={handleCreatePost} className="fb-form">
              <input type="text" placeholder="Post Title" value={postTitle} onChange={e=>setPostTitle(e.target.value)} required />
              <input type="text" placeholder="Short Excerpt" value={postExcerpt} onChange={e=>setPostExcerpt(e.target.value)} required />
              <textarea placeholder="What's on your mind?" value={postContent} onChange={e=>setPostContent(e.target.value)} required rows="5" />
              <label>Cover Image (Required)</label>
              <input type="file" accept="image/*" onChange={e=>setPostCover(e.target.files[0])} required />
              <button type="submit" className="fb-btn primary">Post to Timeline</button>
            </form>
          </div>
        )}

        {activeMenu === 'reels' && (
          <div className="fb-card">
            <h3>Upload a Reel</h3>
            <p className="hint">Since Creator Mode is Official, your Profile DP and Name will be synced automatically!</p>
            <form onSubmit={handleCreateReel} className="fb-form">
              <input type="text" placeholder="Reel Title" value={reelTitle} onChange={e=>setReelTitle(e.target.value)} required />
              <textarea placeholder="Add a caption..." value={reelCaption} onChange={e=>setReelCaption(e.target.value)} rows="3" />
              <input type="url" placeholder="Video URL (mp4 or Youtube)" value={reelVideoUrl} onChange={e=>setReelVideoUrl(e.target.value)} required />
              <button type="submit" className="fb-btn primary">Publish Reel</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
