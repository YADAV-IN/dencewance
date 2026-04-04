import React, { useState, useEffect, useRef } from 'react';
import './SocialApp.css';
import ReelsViewer from './ReelsViewer';
import CreateInstagramMenu from './CreateInstagramMenu';
import ProfileDashboard from './ProfileDashboard';
import { demoReels } from './demoData';

// Vintage/Historical Custom SVG Icons
export const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);

export const MapIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export const QuillIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
);

export const ScrollIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

export const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

export const VideoStoriesIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="3" ry="3"></rect>
    <polygon points="10 8 15 12 10 16 10 8"></polygon>
    <line x1="8" y1="4" x2="16" y2="4"></line>
    <line x1="8" y1="20" x2="16" y2="20"></line>
  </svg>
);

export const HeartIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);

export const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
);

export const BellIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

// Animated ModeBook Logo (Scalable via props)
export const ModeBookLogo = ({ width = 60, height = 60 }) => (
  <svg className="modebook-logo-animated" viewBox="0 0 100 100" width={width} height={height} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="multiColorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0066ff" />   {/* Nila (Blue) */}
        <stop offset="33%" stopColor="#ffff00" />  {/* Peela (Yellow) */}
        <stop offset="66%" stopColor="#ff007f" />  {/* Gulabi (Pink) */}
        <stop offset="100%" stopColor="#00cc44" /> {/* Hara (Green) */}
      </linearGradient>
    </defs>
    <g transform="translate(50, 50)">
      <circle cx="0" cy="0" r="42" fill="none" stroke="url(#multiColorGrad)" strokeWidth="4" className="spin-slow" strokeDasharray="15 5" />
      <circle cx="0" cy="0" r="34" fill="none" stroke="url(#multiColorGrad)" strokeWidth="3" className="spin-reverse" strokeDasharray="4 8" />
      <polygon points="0,-22 19,11 -19,11" fill="none" stroke="url(#multiColorGrad)" strokeWidth="3" className="pulse-glow" />
      <polygon points="0,22 19,-11 -19,-11" fill="none" stroke="url(#multiColorGrad)" strokeWidth="3" className="pulse-glow" />
      <circle cx="0" cy="0" r="7" fill="url(#multiColorGrad)" className="pulse-glow" />
    </g>
  </svg>
);

export const StatusRing = ({ children, hasSeen = false, isUploading = false }) => {
  const gradientId = "statusRingGrad" + (hasSeen ? "Grey" : "");
  return (
    <div style={{ position: 'relative', width: '65px', height: '65px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 100 100" width="75" height="75" style={{ position: 'absolute', top: '-5px', left: '-5px', pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={hasSeen ? "#555" : "#0066ff"} />
            <stop offset="33%" stopColor={hasSeen ? "#555" : "#ffff00"} />
            <stop offset="66%" stopColor={hasSeen ? "#555" : "#ff007f"} />
            <stop offset="100%" stopColor={hasSeen ? "#555" : "#00cc44"} />
          </linearGradient>
        </defs>
        <g transform="translate(50, 50)">
          <circle cx="0" cy="0" r="42" fill="none" stroke={`url(#${gradientId})`} strokeWidth="4" className={hasSeen ? "" : "spin-slow"} strokeDasharray="15 5" />
          <circle cx="0" cy="0" r="34" fill="none" stroke={`url(#${gradientId})`} strokeWidth="3" className={hasSeen ? "" : "spin-reverse"} strokeDasharray="4 8" />
        </g>
      </svg>
      <div style={{ position: 'relative', zIndex: 1, width: '56px', height: '56px', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://server-kappa-lac.vercel.app');

const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function SocialApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [stories, setStories] = useState([]);
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state add kiya
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], reels: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [recommendations, setRecommendations] = useState({ tags: [], reels: [] });
  const statusUploadRef = useRef(null);
  const [isStatusUploading, setIsStatusUploading] = useState(false);

  const handleStatusUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsStatusUploading(true);
    
    // Create FormData
    const formData = new FormData();
    formData.append('media', file);
    
    try {
      const res = await fetch(`${API_URL}/api/status`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setStories(prev => {
           let updated = [...prev];
           // Remove demo reels if they exist
           if (updated === demoReels) updated = [];
           updated.unshift(data.data);
           return updated;
        });
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch(err) {
      console.error('Status upload error', err);
      alert('Network error');
    } finally {
      setIsStatusUploading(false);
      if (statusUploadRef.current) statusUploadRef.current.value = '';
    }
  };

  const markStatusSeen = (statusId) => {
    if (!adminId) return;
    fetch(`${API_URL}/api/status/${statusId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: adminId })
    }).catch(e => console.error(e));
    
    setStories(prev => prev.map(s => {
       if ((s.id || s._id) === statusId) {
         return { ...s, viewers: [...(s.viewers || []), adminId] };
       }
       return s;
    }));
  };

  useEffect(() => {
    if (activeTab === 'search') {
      fetch(`${API_URL}/api/recommendations`)
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setRecommendations(data.data);
          }
        }).catch(err => console.error('Error fetching recommendations', err));
    }
  }, [activeTab]);
  
  const token = localStorage.getItem('adminToken');
  const adminId = localStorage.getItem('adminId');
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/api/admins`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          const me = data.data?.find(a => a._id === adminId || a.id === adminId) || (Array.isArray(data) ? data : []).find(a => a._id === adminId || a.id === adminId);
          if (me) setAdminData(me);
        }).catch(err => console.error(err));
    }
  }, [token, adminId]);

  useEffect(() => {
    setIsLoading(true); // Fetching chalu

    Promise.all([
      // Fetch video stories (reels) from backend Cloudflare integration
      fetch(`${API_URL}/api/status`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.data) && data.data.length > 0) {
            setStories(data.data.slice(0, 10)); // Top 10 stories
          } else {
            setStories(demoReels);
          }
        })
        .catch(err => {
          console.error('Failed to load stories', err);
          setStories(demoReels);
        }),

      // Fetch feed posts (news) from backend
      fetch(`${API_URL}/api/news`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.data)) {
            setFeed(data.data);
          }
        })
        .catch(err => console.error('Failed to load feed', err))
    ]).finally(() => {
      setIsLoading(false); // Fetching khatam
    });
  }, []);

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`${API_URL}/api/news/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setFeed(prev => prev.filter(p => (p.id || p._id) !== postId));
      } else {
        alert("Failed to delete post.");
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.success) {
        setSearchResults({
          users: data.data.users || [],
          posts: data.data.posts || [],
          reels: data.data.reels || []
        });
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDeleteReel = async (reelId) => {
    if (!window.confirm("Are you sure you want to delete this reel?")) return;
    try {
      const res = await fetch(`${API_URL}/api/reels/${reelId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStories(prev => {
          const newStories = prev.filter(p => (p.id || p._id) !== reelId);
          if (newStories.length === 0) setActiveTab('home'); // Go home if empty
          return newStories;
        });
        alert("Reel deleted.");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete reel.");
      }
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <>
      {activeTab === 'stories' ? (
        <ReelsViewer 
          key={`reels-${activeStoryIndex}`} 
          reels={stories} 
          initialIndex={activeStoryIndex} 
          onClose={() => setActiveTab('home')}
          onDelete={handleDeleteReel}
          adminData={adminData}
        />
      ) : (
        <div className="social-app-container historical-theme">
          
          {/* Universal Top Navigation Bar (One Line) */}
          <header className="top-nav-bar">
        <div className="brand-container animated-brand">
          <ModeBookLogo />
          <h1 className="logo-text vintage-shimmer">ModeBook</h1>
        </div>
        
        {/* Opposite side Notification Bell */}
        <div className="top-nav-actions">
          <button className="icon-btn notification-btn" onClick={() => setActiveTab('messages')}>
            <ScrollIcon />
            <span className="notification-badge" style={{ backgroundColor: 'blue' }}>1</span>
          </button>
          <button className="icon-btn notification-btn">
            <BellIcon />
            <span className="notification-badge">3</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="app-body">
        {/* Sidebar for Desktop */}
        <nav className="desktop-sidebar">
          <ul className="nav-links">
            <li className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>
              <HomeIcon /> <span>Sanctuary</span>
            </li>
            <li className={activeTab === 'stories' ? 'active' : ''} onClick={() => setActiveTab('stories')}>
              <VideoStoriesIcon /> <span>Stories</span>
            </li>
            <li className={activeTab === 'search' ? 'active' : ''} onClick={() => setActiveTab('search')}>
              <MapIcon /> <span>Atlas</span>
            </li>
            <li className={activeTab === 'add' ? 'active' : ''} onClick={() => setActiveTab('add')}>
              <QuillIcon /> <span>Create</span>
            </li>
            <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
              <EyeIcon /> <span>Profile</span>
            </li>
          </ul>
        </nav>

        {/* Main Content Area */}
        <main className="main-content">
          {activeTab === 'search' ? (
            <div className="search-container">
              <form onSubmit={handleSearch} className="search-form" style={{ marginTop: '20px' }}>
                <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: '18px', color: '#00FFFF', pointerEvents: 'none' }}>
                    <MapIcon />
                  </span>
                  <input 
                    type="text" 
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search Users, Video Stories, ID, Tags..."
                    style={{ paddingLeft: '50px' }}
                  />
                </div>
                <button type="submit" disabled={isSearching} className="search-btn">
                  {isSearching ? <span className="spin-slow" style={{display:'inline-block'}}>⏳</span> : 'Discover'}
                </button>
              </form>

              {/* Recommendations View - Only show if not actively searching/no results */}
              {(!searchQuery || (!isSearching && searchResults.users.length === 0 && searchResults.posts.length === 0 && searchResults.reels.length === 0)) ? (
                <div className="search-recommendations">
                  {/* Trendy Tags */}
                  {recommendations.tags && recommendations.tags.length > 0 && (
                    <div style={{ marginBottom: '40px' }}>
                      <h3 className="search-section-title">Trending Tags</h3>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {recommendations.tags.map(tag => (
                          <button 
                            key={tag} 
                            onClick={(e) => { e.preventDefault(); setSearchQuery(tag); handleSearch({ preventDefault: () => {} }); }}
                            style={{ padding: '8px 18px', background: 'rgba(0, 255, 255, 0.1)', border: '1px solid rgba(0, 255, 255, 0.3)', borderRadius: '20px', color: '#00FFFF', cursor: 'pointer', outline: 'none', transition: 'all 0.2s', fontWeight: 'bold' }}
                            onMouseOver={(e) => { e.target.style.background = 'rgba(0, 255, 255, 0.2)'; e.target.style.borderColor = '#00FFFF'; }}
                            onMouseOut={(e) => { e.target.style.background = 'rgba(0, 255, 255, 0.1)'; e.target.style.borderColor = 'rgba(0, 255, 255, 0.3)'; }}
                          >
                            #{tag.startsWith('#') ? tag.substring(1) : tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended Reels */}
                  {recommendations.reels && recommendations.reels.length > 0 && (
                    <div>
                      <h3 className="search-section-title">Recommended Stories</h3>
                      <div className="search-reels-grid">
                        {recommendations.reels.map((r, i) => (
                          <div key={`rec-${i}`} className="search-reel-card" onClick={() => { setActiveStoryIndex(i); setStories(recommendations.reels); setActiveTab('stories'); }}>
                            <span className="search-reel-tag" style={{ background: '#00FFFF', color: '#000' }}>#{r.tags?.[0] || 'Trending'}</span>
                            {r.cover_image_url ? (
                              <img src={resolveMediaUrl(r.cover_image_url)} alt="Cover" className="search-reel-cover" />
                            ) : (
                              <div style={{width:'100%', height:'100%', background:'#222', display:'flex', alignItems:'center', justifyContent:'center'}}>▶</div>
                            )}
                            <div className="search-reel-overlay">
                               <div className="search-reel-title">{r.title || 'Video Story'}</div>
                               <div className="search-reel-meta">
                                 <span>@{r.creator_name || 'ModeBook'}</span>
                               </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="search-results-list">

              {/* Show Users */}
              {searchResults.users.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <h3 className="search-section-title">
                    Users <span className="search-count">{searchResults.users.length}</span>
                  </h3>
                  <div className="search-users-grid">
                    {searchResults.users.map((u, i) => (
                      <div key={`u-${i}`} className="search-user-card">
                        <img src={resolveMediaUrl(u.avatar_url) || `https://i.pravatar.cc/150?img=${i}`} alt={u.name} className="search-user-avatar" />
                        <div className="search-user-name">{u.name}</div>
                        <div className="search-user-id">ID: {u.id.substring(0, 8)}..</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show Reels */}
              {searchResults.reels.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <h3 className="search-section-title">
                    Reels (Video Stories) <span className="search-count">{searchResults.reels.length}</span>
                  </h3>
                  <div className="search-reels-grid">
                    {searchResults.reels.map((r, i) => (
                      <div key={`r-${i}`} className="search-reel-card" onClick={() => { setActiveTab('stories'); }}>
                        <span className="search-reel-tag">Video</span>
                        {r.cover_image_url ? (
                          <img src={resolveMediaUrl(r.cover_image_url)} alt="Cover" className="search-reel-cover" />
                        ) : (
                          <div style={{width:'100%', height:'100%', background:'#222', display:'flex', alignItems:'center', justifyContent:'center'}}>▶</div>
                        )}
                        <div className="search-reel-overlay">
                           <div className="search-reel-title">{r.title || r.caption?.substring(0,40)}</div>
                           <div className="search-reel-meta">
                             <span>@{r.creator_handle || r.creator_name || 'Alok'}</span>
                             <span className="search-reel-meta-id">ID: {r.creator_id ? r.creator_id.substring(0, 6) : 'NA'}</span>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show Posts */}
              {searchResults.posts.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <h3 className="search-section-title">
                    Chronicles (Posts) <span className="search-count">{searchResults.posts.length}</span>
                  </h3>
                  <div className="search-posts-list">
                    {searchResults.posts.map((p, i) => (
                      <div key={`p-${i}`} className="search-post-row">
                        {p.cover_image_url && (
                          <img src={resolveMediaUrl(p.cover_image_url)} alt="Post" className="search-post-image" />
                        )}
                        <div className="search-post-content">
                          <h4 className="search-post-title">{p.title}</h4>
                          <p className="search-post-excerpt">{p.excerpt ? p.excerpt : 'No snippet available...'}</p>
                          <div className="search-post-meta">
                            <span className="search-post-author">✍️ {p.author_name || 'ModeBook Scribe'}</span>
                            <span className="search-post-id">ID: {p.author_id ? p.author_id.substring(0, 8) : '...'}</span>
                            <span>{new Date(p.published_at || Date.now()).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!isSearching && searchQuery && searchResults.users.length === 0 && searchResults.posts.length === 0 && searchResults.reels.length === 0 && (
                <div style={{ textAlign: 'center', marginTop: '60px', opacity: 0.5 }}>
                  <MapIcon />
                  <p style={{ marginTop: '10px' }}>No users, tags or video stories found in the Database.</p>
                </div>
              )}
                </div>
              )}
            </div>
          ) : activeTab === 'messages' ? (
            <div style={{ padding: '20px', color: '#fff', textAlign: 'center' }}><h2>Scrolls (Messages)</h2><p>No new scrolls received from the archivists...</p></div>
          ) : activeTab === 'profile' ? (
             <ProfileDashboard /> ) : activeTab === 'add' ? ( <CreateInstagramMenu />
          ) : isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#fff', flexDirection: 'column' }}>
              <ModeBookLogo width={80} height={80} />
              <h3 style={{ marginTop: '20px', letterSpacing: '1px' }}>Loading...</h3>
            </div>
          ) : (
            <>
              {/* Stories Section Dropdown top */}
              <section className="stories-container" style={{ display: 'flex', overflowX: 'auto', gap: '15px', padding: '15px 20px', alignItems: 'center' }}>
            <div className="story status-add" style={{ cursor: 'pointer', textAlign: 'center', minWidth: '70px' }} onClick={() => statusUploadRef.current && statusUploadRef.current.click()}>
              <StatusRing isUploading={isStatusUploading}>
                {isStatusUploading ? (
                  <span className="spin-slow" style={{ fontSize: '24px' }}>⏳</span>
                ) : (
                  <strong style={{ fontSize: '30px', color: '#f5d742' }}>+</strong>
                )}
              </StatusRing>
              <span style={{ fontSize: '12px', marginTop: '5px', display: 'block', color: '#fff' }}>Upload Status</span>
              <input type="file" ref={statusUploadRef} style={{ display: 'none' }} accept="image/*,video/*" onChange={handleStatusUpload} />
            </div>

            {stories.length > 0 ? (
              stories.map((story, i) => {
                const hasSeen = story.viewers && adminId && story.viewers.includes(adminId);
                return (
                 <div 
                  className="story" 
                  key={story._id || i} 
                  onClick={() => {
                    markStatusSeen(story.id || story._id);
                    setActiveStoryIndex(i);
                    setActiveTab('stories');
                  }}
                  style={{ cursor: 'pointer', textAlign: 'center', minWidth: '70px' }}
                 >
                  <StatusRing hasSeen={hasSeen}>
                    <img 
                      src={resolveMediaUrl(story.media_url || story.cover_image_url) || `https://i.pravatar.cc/150?img=${i + 20}`} 
                      alt={story.title || 'Status'} 
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  </StatusRing>
                  <span style={{ fontSize: '12px', marginTop: '5px', display: 'block', color: '#ccc' }}>
                    {story.creator_name || story.title ? (story.creator_name || story.title).substring(0, 8) : 'Status'}
                  </span>
                 </div>
                );
              })
            ) : (
              ['Loading...'].map((name, i) => (
                <div className="story" key={i} style={{ textAlign: 'center', minWidth: '70px', opacity: 0.5 }}>
                  <StatusRing hasSeen={true}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#333' }}></div>
                  </StatusRing>
                  <span style={{ fontSize: '12px', marginTop: '5px', display: 'block' }}>{name}</span>
                </div>
              ))
            )}
          </section>

          {/* Feed Section */}
          <section className="feed-container">
            {feed.length > 0 ? (
              feed.map((post, i) => (
                <div className="post" key={post._id || i}>
                  <div className="post-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <img src={post.source || `https://i.pravatar.cc/150?img=${10 + i}`} alt="Avatar" className="avatar" />
                      <div className="post-user-info">
                        <strong>{post.author_name || 'ModeBook User'}</strong>
                        <small>{new Date(post.published_at || Date.now()).toLocaleDateString()} • Recorded</small>
                      </div>
                    </div>
                    {(adminData && (adminData.role === 'admin' || post.author_id === adminId || post.author_id === adminData._id || post.author_name === adminData.name)) && (
                      <button 
                        onClick={() => handleDeletePost(post.id || post._id)}
                        style={{background:'none', border:'none', color:'red', fontWeight:'bold', cursor:'pointer', padding:'5px 10px'}}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div className="post-body">
                    {post.title && !post.title.includes('Untitled') && !post.title.includes('ModeBook') && !post.content?.startsWith(post.title?.replace(/...$/, '')) && (<h4>{post.title}</h4>)}
                    <p>{post.excerpt || post.content}</p>
                    {post.cover_image_url && (
                      <img src={resolveMediaUrl(post.cover_image_url)} alt={post.title} className="post-image" />
                    )}
                  </div>
                  <div className="post-actions">
                    <button><HeartIcon /> Honor</button>
                    <button><QuillIcon /> Inscribe</button>
                    <button><ShareIcon /> Propagate</button>
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Post Example 1 */}
            <div className="post">
              <div className="post-header">
                <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="avatar" />
                <div className="post-user-info">
                  <strong>Preetam M.</strong>
                  <small>II hours ago • Chronicled</small>
                </div>
              </div>
              <div className="post-body">
                <p>Uncovering the ancient algorithms of Rome. The past is written in the sacred nodes. We reinvent the machine not from metal, but from the lost codex. 🏛️📜 #ModeBook #HistoricalTech</p>
                <img src="https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80" alt="Historical Tech Post" className="post-image" />
              </div>
              <div className="post-actions">
                <button><HeartIcon /> Honor</button>
                <button><QuillIcon /> Inscribe</button>
                <button><ShareIcon /> Propagate</button>
              </div>
            </div>

            {/* Post Example 2 - Video format placeholder */}
            <div className="post">
               <div className="post-header">
                <img src="https://i.pravatar.cc/150?img=33" alt="Avatar" className="avatar" />
                <div className="post-user-info">
                  <strong>Alchemist Nexus</strong>
                  <small>V hours ago</small>
                </div>
              </div>
              <div className="post-body">
                <p>Transmuting base code into golden UI. Witness the spectacle in the grand theater of pixels. ✨</p>
                <div className="video-placeholder">
                  <div className="magic-play-btn">▶ Behold</div>
                </div>
              </div>
               <div className="post-actions">
                <button><HeartIcon /> Honor</button>
                <button><QuillIcon /> Inscribe</button>
                <button><ShareIcon /> Propagate</button>
              </div>
            </div>
              </>
            )}
          </section>
          </>)}
        </main>

        {/* Right Sidebar for Suggestions / Messaging (Desktop) */}
        <aside className="suggestion-sidebar">
          <h3>Fellow Scholars</h3>
          <div className="message-preview">
            <img src="https://i.pravatar.cc/150?img=52" alt="User" />
            <div className="msg-text">
              <strong>DaVinci_Core</strong>
              <p>The manuscript is perfectly aligning...</p>
            </div>
          </div>
          <div className="message-preview">
            <img src="https://i.pravatar.cc/150?img=47" alt="User" />
            <div className="msg-text">
              <strong>Arya</strong>
              <p>Decoded the latest cipher, brother.</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}><HomeIcon /></button>
        <button className={activeTab === 'stories' ? 'active' : ''} onClick={() => setActiveTab('stories')}><VideoStoriesIcon /></button>
        <button className={activeTab === 'search' ? 'active' : ''} onClick={() => setActiveTab('search')}><MapIcon /></button>
        <button className={activeTab === 'add' ? 'active' : ''} onClick={() => setActiveTab('add')}><QuillIcon /></button>
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}><EyeIcon /></button>
      </nav>
    </div>
      )}
    </>
  );
}
