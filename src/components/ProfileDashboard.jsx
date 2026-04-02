import React, { useState, useEffect } from 'react';
import './ProfileDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://server-kappa-lac.vercel.app');

export default function ProfileDashboard() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [adminId, setAdminId] = useState(localStorage.getItem('adminId') || '');
  const [adminData, setAdminData] = useState(null);

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBio, setNewBio] = useState('');
  
  const [myPosts, setMyPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  useEffect(() => {
    if (token) {
      fetchAdminData();
    }
  }, [token]);

  const fetchUserPosts = async (meData) => {
    if (!meData) return;
    setIsLoadingPosts(true);
    try {
      // Fetch all posts and filter locally to cover old posts without author_id
      const res = await fetch(`${API_URL}/api/news?limit=200`);
      if (res.ok) {
        const data = await res.json();
        const posts = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        const filtered = posts.filter(p => 
          p.author_id === meData.id || 
          p.author_id === meData._id || 
          p.author_name === meData.name ||
          p.creator_id === meData.id ||
          p.creator_id === meData._id
        );
        setMyPosts(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const fetchAdminData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const me = data.data?.find(a => a._id === adminId || a.id === adminId) || (Array.isArray(data) ? data : []).find(a => a._id === adminId || a.id === adminId);
        if (me) {
          setAdminData(me);
          setNewName(me.name || '');
          setNewBio(me.bio || '');
          fetchUserPosts(me);
        }
      }
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
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (data.data?.token) {
        let t = data.data.token;
        let id = data.data.profile?.id || data.data.profile?._id;
        localStorage.setItem('adminToken', t);
        localStorage.setItem('adminId', id);
        setToken(t);
        setAdminId(id);
      } else {
        alert(data.error || data.message || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      alert('Login error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminId');
    setToken('');
    setAdminId('');
    setAdminData(null);
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('id', adminId);

    try {
      const res = await fetch(`${API_URL}/api/profile/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        fetchAdminData(); // refresh
      } else {
        alert('Failed to update avatar');
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const payload = {
        name: newName,
        bio: newBio
      };
      const res = await fetch(`${API_URL}/api/admins/${adminId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsEditing(false);
        fetchAdminData();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`${API_URL}/api/news/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMyPosts(prev => prev.filter(p => p.id !== postId && p._id !== postId));
        alert("Post deleted.");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete post.");
      }
    } catch(err) {
      console.error(err);
    }
  };

  if (!token) {
    return (
      <div className="ig-profile-container">
        <div className="ig-login-box">
          <h2>ModeBook</h2>
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Phone number, username, or email" value={email} onChange={e=>setEmail(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
            <button type="submit">Log In</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="ig-profile-container">
      {adminData && (
        <>
        <div className="ig-profile-header">
          <div className="ig-profile-avatar-sec">
            <label>
              <img src={adminData.avatar_url || 'https://via.placeholder.com/150'} alt="Profile" className="ig-avatar" />
              <input type="file" accept="image/*" onChange={handleProfilePicChange} hidden />
            </label>
          </div>
          
          <div className="ig-profile-info">
            <div className="ig-profile-top">
              <span className="ig-username">{adminData.name || 'username'}</span>
              <button className="ig-edit-btn" onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? 'Cancel' : 'Edit profile'}
              </button>
              <button className="ig-logout-btn" onClick={handleLogout}>Log out</button>
            </div>
            
            <div className="ig-profile-stats">
              <span><strong>{myPosts.length}</strong> posts</span>
              <span><strong>0</strong> followers</span>
              <span><strong>0</strong> following</span>
            </div>

            <div className="ig-profile-bio">
              <div className="ig-fullname">{adminData.name || 'Full Name'}</div>
              <span>{adminData.bio || 'Bio goes here'}</span>
            </div>
            
            {isEditing && (
              <div style={{marginTop: '15px'}}>
                 <input type="text" value={newName} onChange={e=>setNewName(e.target.value)} style={{marginRight: '10px'}} />
                 <input type="text" value={newBio} onChange={e=>setNewBio(e.target.value)} style={{marginRight: '10px'}} />
                 <button className="ig-edit-btn" onClick={handleSaveProfile}>Save</button>
              </div>
            )}
          </div>
        </div>

        <div className="ig-profile-grid-tabs">
          <div className="ig-tab active">
            <span>POSTS</span>
          </div>
        </div>

        <div className="ig-profile-grid">
          {isLoadingPosts ? (
            <div style={{padding: '20px', textAlign: 'center'}}>Loading posts...</div>
          ) : myPosts.length > 0 ? (
            myPosts.map(post => (
              <div className="ig-grid-item" key={post.id || post._id}>
                {post.cover_image_url && <img src={post.cover_image_url} alt="" />}
                <div className="ig-grid-item-overlay">
                  <div className="ig-grid-item-stats">
                    <button className="ig-delete-btn-overlay" onClick={() => handleDeletePost(post.id || post._id)}>
                       🗑️
                    </button>
                    {(post.title || post.content) && (
                      <span className="ig-grid-caption" style={{marginLeft: '10px', fontSize: '12px'}}>
                        {(post.content || post.title || '').substring(0, 20)}...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{padding: '40px', width: '100%', textAlign: 'center', color: '#8e8e8e', gridColumn: '1 / -1'}}>
              <h2>No posts yet</h2>
            </div>
          )}
        </div>
      </>
      )}
    </div>
  );
}
