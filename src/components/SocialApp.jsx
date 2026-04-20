import React, { useState, useEffect, useRef } from 'react';
import './SocialApp.css';
import ReelsViewer from './ReelsViewer';
import CreateInstagramMenu from './CreateInstagramMenu';
import ProfileDashboard from './ProfileDashboard';

import { uploadMediaToAppwrite } from '../utils/appwriteClient';
import PYQAssistant from './PYQAssistant';

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

export const MoreVerticalIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1.5"></circle>
    <circle cx="12" cy="5" r="1.5"></circle>
    <circle cx="12" cy="19" r="1.5"></circle>
  </svg>
);

export const BellIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

// Generic Logo Placeholder expecting a file named "logo.png" in the "public" folder
export const DenceWanceLogo = ({ width = 120, height = 48, style = {} }) => {
  const [logoUrl, setLogoUrl] = useState('');
  useEffect(() => {
    // Check locally first for instant load
    try {
      const raw = localStorage.getItem('dencewance_site_settings_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.site_logo_url) setLogoUrl(parsed.site_logo_url);
      }
    } catch(e) {}
    
    // Fetch latest
    fetch(`${API_URL}/api/settings`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.data?.site_logo_url) {
          setLogoUrl(data.data.site_logo_url);
          localStorage.setItem('dencewance_site_settings_cache', JSON.stringify(data.data));
          
          try {
             const icon1 = document.getElementById('dynamic-favicon');
             const icon2 = document.getElementById('dynamic-apple-icon');
             if(icon1) icon1.href = data.data.site_logo_url;
             if(icon2) icon2.href = data.data.site_logo_url;
          } catch(e) {}
        }
      }).catch(() => {});
  }, []);

  return (
    <img 
      src={logoUrl || '/logo192.png'} 
      alt="Dence Wance Logo" 
      style={{ width: width === 'auto' ? 'auto' : `${width}px`, height: `${height}px`, objectFit: 'contain', ...style }} 
      className="shadow-sm logo-image"
      onError={(e) => {
         // Fallback if image is broken
         e.target.onerror = null;
         e.target.src = '/logo192.png';
      }}
    />
  );
};

export const StatusRing = ({ children, hasSeen = false, isUploading = false }) => {
  return (
    <div style={{ position: 'relative', width: '65px', height: '65px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox="0 0 100 100" width="75" height="75" style={{ position: 'absolute', top: '-5px', left: '-5px', pointerEvents: 'none' }} xmlns="http://www.w3.org/2000/svg">
        <circle 
          cx="50" cy="50" r="42" 
          fill="none" 
          stroke={hasSeen ? "#4B5563" : "#10B981"} 
          strokeWidth="3" 
          strokeLinecap="round"
          strokeDasharray={hasSeen ? "none" : "20 5"}
          className={hasSeen ? "" : "animate-[spin_4s_linear_infinite]"} 
        />
      </svg>
      <div style={{ position: 'relative', zIndex: 1, width: '56px', height: '56px', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://alok-backend.onrender.com');

const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string' || url === 'null' || url === 'undefined') return '';
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function SocialApp() {
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get('tab') || 'home');
  
  useEffect(() => {
    const url = new URL(window.location);
    if (activeTab === 'home') {
      url.searchParams.delete('tab');
    } else {
      url.searchParams.set('tab', activeTab);
    }
    window.history.pushState({}, '', url);
  }, [activeTab]);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [statuses, setStatuses] = useState([]);
  const [reelsFeed, setReelsFeed] = useState([]);
  const [viewingMedia, setViewingMedia] = useState('reel');
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Loading state add kiya
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], reels: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showFeatureMenu, setShowFeatureMenu] = useState(false);
  const [showPYQAssistant, setShowPYQAssistant] = useState(false);
  const [recommendations, setRecommendations] = useState({ tags: [], reels: [] });
  const statusUploadRef = useRef(null);
  const [isStatusUploading, setIsStatusUploading] = useState(false);
  const [statusUploadProgress, setStatusUploadProgress] = useState(0);

  const handleUploadPanelComplete = async (savedData) => {
    // If it's a Reel, refresh statuses and open it
    if (savedData && savedData.data && savedData.data.video_url) {
      try {
        const latestRes = await fetch(`${API_URL}/api/global-status`);
        if (latestRes.ok) {
          const latestData = await latestRes.json();
          setStatuses(latestData.data || []);
          
          const newReelId = savedData.data._id || savedData.data.id;
          if (newReelId && latestData.data) {
            const newIndex = latestData.data.findIndex(s => (s._id === newReelId || s.id === newReelId));
            if (newIndex !== -1) {
              setActiveStoryIndex(newIndex);
              setViewingMedia('status');
              setActiveTab('stories');
              return;
            }
          }
        }
      } catch (err) {
        console.error('Error refreshing statuses after upload', err);
      }
      setActiveTab('stories');
      return;
    }
    // If it's a Post, just go to home and maybe refresh feed, but a reload is safer if feed refresh isn't robust
    window.location.reload();
  };

  const handleStatusUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsStatusUploading(true);
    setStatusUploadProgress(0);
    
    try {
      // 1. Upload Video directly via Appwrite SDK
      let videoUrl = await uploadMediaToAppwrite(file, 'alok_media', (progressData) => {
        setStatusUploadProgress(Math.round(progressData.progress));
      });

      // 2. Post the Reel (Video Story)
      const reelRes = await fetch(`${API_URL}/api/reels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: 'My Video Story',
          caption: 'Uploaded from Video Stories Bar',
          video_url: videoUrl,
          status: 'published'
        })
      });
      
      const reelData = await reelRes.json();
      if (!reelRes.ok) throw new Error(reelData.error || 'Failed to create Video Story');

      // Refresh Global Statuses immediately & Open the reel
      const latestRes = await fetch(`${API_URL}/api/global-status`);
      if (latestRes.ok) {
        const latestData = await latestRes.json();
        setStatuses(latestData.data || []);
        
        // Find our newly uploaded reel
        const newReelId = reelData.data?._id || reelData.data?.id;
        if (newReelId && latestData.data) {
          const newIndex = latestData.data.findIndex(s => (s._id === newReelId || s.id === newReelId));
          if (newIndex !== -1) {
            setActiveStoryIndex(newIndex);
            setViewingMedia('status');
            setActiveTab('stories');
          }
        }
      }
    } catch(err) {
      console.error('Status upload error', err);
      alert('Upload Error: ' + err.message);
    } finally {
      setIsStatusUploading(false);
      setStatusUploadProgress(0);
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
    
    setStatuses(prev => prev.map(s => {
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
    
    // Timeout safety: If loading takes more than 10 seconds, force stop
    const loadingTimeout = setTimeout(() => {
      console.warn('API loading timeout - using defaults');
      setIsLoading(false);
    }, 10000);

    // Helper: Fetch with timeout (5 seconds per request)
    const fetchWithTimeout = (url, options = {}, timeoutMs = 5000) => {
      return Promise.race([
        fetch(url, options),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
        )
      ]);
    };

    Promise.all([
      // Fetch Statuses
      fetchWithTimeout(`${API_URL}/api/global-status`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.data)) {
            setStatuses(data.data.slice(0, 15));
          }
        })
        .catch(err => {
          console.error('Failed to load status', err);
          setStatuses([]);
        }),

      // Fetch Reels (Video Stories)
      fetchWithTimeout(`${API_URL}/api/reels?t="${Date.now()}"`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.data) && data.data.length > 0) {
            setReelsFeed(data.data);
          } else {
            setReelsFeed([]);
          }
        })
        .catch(err => {
          console.error('Failed to load reels', err);
          setReelsFeed([]);
        }),

      // Fetch News
      fetchWithTimeout(`${API_URL}/api/news`)
        .then(res => res.json())
        .then(data => {
          if (data && Array.isArray(data.data)) {
            setFeed(data.data);
          } else {
            setFeed([]);
          }
        })
        .catch(err => {
          console.error('Failed to load feed', err);
          setFeed([]);
        })
    ]).catch(err => {
      console.error('Error loading data:', err);
    }).finally(() => {
      clearTimeout(loadingTimeout);
      setIsLoading(false); // Fetching khatam
    });

    // Cleanup timeout on unmount
    return () => clearTimeout(loadingTimeout);
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

    const removeLocally = () => {
      setStatuses(prev => {
        const newStatuses = prev.filter(p => (p.id || p._id) !== reelId);
        if (viewingMedia === 'status' && newStatuses.length === 0) setActiveTab('home');
        return newStatuses;
      });
      setReelsFeed(prev => {
        const newFeed = prev.filter(p => (p.id || p._id) !== reelId);
        if (viewingMedia === 'reel' && newFeed.length === 0) setActiveTab('home');
        return newFeed;
      });
      setRecommendations(prev => {
        const newReels = prev.reels.filter(p => (p.id || p._id) !== reelId);
        if (viewingMedia === 'recommendation' && newReels.length === 0) setActiveTab('home');
        return { ...prev, reels: newReels };
      });
      setSearchResults(prev => {
        const newReels = prev.reels.filter(p => (p.id || p._id) !== reelId);
        if (viewingMedia === 'search' && newReels.length === 0) setActiveTab('home');
        return { ...prev, reels: newReels };
      });
    };

    if (String(reelId).startsWith('demo-reel')) {
      removeLocally();
      alert("Demo Reel removed locally.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/reels/${reelId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        removeLocally();
        alert("Reel deleted.");
      } else {
        let data = {};
        try { data = await res.json(); } catch(e) {}
        alert((data.error ? `Delete failed: ${data.error}` : "Failed to delete reel.") + (data.detail ? `\nDetail: ${data.detail}` : ''));
      }
    } catch(err) {
      console.error(err);
      alert("Delete request failed: " + (err?.message || err));
    }
  };

  return (
    <>
      {activeTab === 'stories' ? (
        <ReelsViewer 
          key={`reels-${activeStoryIndex}`} 
          reels={
            viewingMedia === 'status' ? statuses :
            viewingMedia === 'search' ? searchResults.reels :
            viewingMedia === 'recommendation' ? recommendations.reels :
            reelsFeed
          } 
          initialIndex={activeStoryIndex} 
          onClose={() => setActiveTab('home')}
          onDelete={handleDeleteReel}
          adminData={adminData}
        />
      ) : (
        <div className="social-app-container historical-theme">
          
          {/* Universal Top Navigation Bar (One Line) */}
          <header className="top-nav-bar">
        <div className="brand-container animated-brand" style={{ paddingLeft: '8px' }}>
          <DenceWanceLogo width="auto" height={48} style={{ maxWidth: '200px' }} />
        </div>
        
        {/* Opposite side Notification Bell */}
        <div className="top-nav-actions" style={{ position: 'relative' }}>
          <button className="icon-btn notification-btn" onClick={() => setActiveTab('messages')}>
            <ScrollIcon />
            <span className="notification-badge" style={{ backgroundColor: 'blue' }}>1</span>
          </button>
          <button className="icon-btn notification-btn">
            <BellIcon />
            <span className="notification-badge">3</span>
          </button>
          
          <button onClick={() => setActiveTab('pyq')} style={{ background: 'linear-gradient(45deg, #B4A05D, #D4AF37)', color: 'black', fontWeight: 'bold', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 10px rgba(180, 160, 93, 0.3)' }}>🎓 PYQ</button>

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
            <li className={activeTab === 'stories' ? 'active' : ''} onClick={() => { setActiveStoryIndex(0); setViewingMedia('reel'); setActiveTab('stories'); }}>
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
        {/* GLOBAL UPLOAD STATUS BAR */}
        {isStatusUploading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%',
            background: 'rgba(20,20,20,0.95)', borderBottom: '1px solid #333',
            zIndex: 9999, padding: '10px 20px', display: 'flex', flexDirection: 'column',
            backdropFilter: 'blur(10px)', color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
               <span style={{ fontWeight: 'bold' }}>Uploading Video Story...</span>
               <span style={{ fontWeight: 'bold', color: '#00FF00' }}>{Math.round(statusUploadProgress)}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
               <div style={{ width: `${Math.round(statusUploadProgress)}%`, height: '100%', background: 'linear-gradient(90deg, #00FF00, #00ffcc)', transition: 'width 0.2s linear' }}></div>
            </div>
          </div>
        )}
        {/* GLOBAL UPLOAD STATUS BAR */}
        {isStatusUploading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%',
            background: 'rgba(20,20,20,0.95)', borderBottom: '1px solid #333',
            zIndex: 9999, padding: '10px 20px', display: 'flex', flexDirection: 'column',
            backdropFilter: 'blur(10px)', color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
               <span style={{ fontWeight: 'bold' }}>Uploading Video Story...</span>
               <span style={{ fontWeight: 'bold', color: '#00FF00' }}>{Math.round(statusUploadProgress)}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
               <div style={{ width: `${Math.round(statusUploadProgress)}%`, height: '100%', background: 'linear-gradient(90deg, #00FF00, #00ffcc)', transition: 'width 0.2s linear' }}></div>
            </div>
          </div>
        )}
        <main className="main-content">
          {activeTab === 'pyq' ? (
            <PYQAssistant isPage={true} adminData={adminData} />
          ) : activeTab === 'search' ? (
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
                          <div key={`rec-${i}`} className="search-reel-card" onClick={() => { setActiveStoryIndex(i); setViewingMedia('recommendation'); setActiveTab('stories'); }}>
                            <span className="search-reel-tag" style={{ background: '#00FFFF', color: '#000' }}>#{r.tags?.[0] || 'Trending'}</span>
                            {r.cover_image_url ? (
                              <img loading="lazy" src={resolveMediaUrl(r.cover_image_url)} alt="Cover" className="search-reel-cover" />
                            ) : (
                              <div style={{width:'100%', height:'100%', background:'#222', display:'flex', alignItems:'center', justifyContent:'center'}}>▶</div>
                            )}
                            <div className="search-reel-overlay">
                               <div className="search-reel-title">{r.title || 'Video Story'}</div>
                               <div className="search-reel-meta">
                                 <span>@{r.creator_name || 'DenceWance'}</span>
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
                        <img loading="lazy" src={resolveMediaUrl(u.avatar_url) || `https://i.pravatar.cc/150?img=${i}`} alt={u.name} className="search-user-avatar" />
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
                      <div key={`r-${i}`} className="search-reel-card" onClick={() => { setActiveStoryIndex(i); setViewingMedia('search'); setActiveTab('stories'); }}>
                        <span className="search-reel-tag">Video</span>
                        {r.cover_image_url ? (
                          <img loading="lazy" src={resolveMediaUrl(r.cover_image_url)} alt="Cover" className="search-reel-cover" />
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
                          <img loading="lazy" src={resolveMediaUrl(p.cover_image_url)} alt="Post" className="search-post-image" />
                        )}
                        <div className="search-post-content">
                          <h4 className="search-post-title">{p.title}</h4>
                          <p className="search-post-excerpt">{p.excerpt ? p.excerpt : 'No snippet available...'}</p>
                          <div className="search-post-meta">
                            <span className="search-post-author">✍️ {p.author_name || 'DenceWance Scribe'}</span>
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
             <ProfileDashboard /> ) : activeTab === 'add' ? ( <CreateInstagramMenu onComplete={handleUploadPanelComplete} />
          ) : isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#fff', flexDirection: 'column' }}>
              <DenceWanceLogo width={80} height={80} />
              <h3 style={{ marginTop: '20px', letterSpacing: '1px' }}>Loading...</h3>
            </div>
          ) : (
            <>
              {/* Stories Section Dropdown top */}
              <section className="stories-container" style={{ display: 'flex', overflowX: 'auto', gap: '15px', padding: '15px 20px', alignItems: 'center' }}>
            <div className="story status-add" style={{ cursor: 'pointer', textAlign: 'center', minWidth: '70px' }} onClick={() => statusUploadRef.current && statusUploadRef.current.click()}>
              <StatusRing isUploading={isStatusUploading}>
                {isStatusUploading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', borderRadius: '50%' }}>
                     <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff' }}>{Math.round(statusUploadProgress)}%</span>
                     <div style={{ width: '70%', height: '3px', background: '#333', marginTop: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#00cc44', width: `${Math.round(statusUploadProgress)}%`, transition: 'width 0.2s' }}></div>
                     </div>
                  </div>
                ) : (
                  <strong style={{ fontSize: '30px', color: '#f5d742' }}>+</strong>
                )}
              </StatusRing>
              <span style={{ fontSize: '12px', marginTop: '5px', display: 'block', color: '#fff' }}>{isStatusUploading ? 'Uploading...' : 'New Reel'}</span>
              <input type="file" ref={statusUploadRef} style={{ display: 'none' }} accept="video/*" onChange={handleStatusUpload} />
            </div>

            {statuses.length > 0 ? (
              statuses.map((story, i) => {
                const hasSeen = story.viewers && adminId && story.viewers.includes(adminId);
                return (
                 <div 
                  className="story" 
                  key={story._id || i} 
                  onClick={() => {
                    markStatusSeen(story.id || story._id);
                    setActiveStoryIndex(i);
                    setViewingMedia('status');
                    setActiveTab('stories');
                  }}
                  style={{ cursor: 'pointer', textAlign: 'center', minWidth: '70px' }}
                 >
                  <StatusRing hasSeen={hasSeen}>
                    <img loading="lazy" 
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
            ) : null}
          </section>

          {/* Feed Section */}
          <section className="feed-container">
            {feed.length > 0 ? (
              feed.map((post, i) => (
                <div className="post" key={post._id || i}>
                  <div className="post-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <div style={{display: 'flex', alignItems: 'center'}}>
                      <img loading="lazy" src={post.source || `https://i.pravatar.cc/150?img=${10 + i}`} alt="Avatar" className="avatar" />
                      <div className="post-user-info">
                        <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {post.author_name || 'DenceWance User'}
                          {(post.author_id && post.author_id.includes('69d6')) && (
                            <svg viewBox="0 0 24 24" fill="#00FFFF" width="16" height="16" style={{ filter: 'drop-shadow(0 0 2px rgba(0, 255, 255, 0.4))' }}>
                              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.8 14.8L6.4 13l1.4-1.4 2.4 2.4 6-6L17.6 9l-7.4 7.8z"/>
                            </svg>
                          )}
                        </strong>
                        <small>{new Date(post.published_at || Date.now()).toLocaleDateString()} • Recorded</small>
                      </div>
                    </div>
                    {((adminData?.role === 'admin') || (adminData?.role === 'superadmin') || (post.author_id === adminId) || (adminData && (post.author_id === adminData._id || post.author_name === adminData.name)) || adminId) && (
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeletePost(post.id || post._id); }}
                        style={{background:'none', border:'none', color:'red', fontWeight:'bold', cursor:'pointer', padding:'5px 10px', zIndex: 99, position: 'relative'}}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div className="post-body">
                    {post.title && !post.title.includes('Untitled') && !post.title.includes('DenceWance') && !post.content?.startsWith(post.title?.replace(/...$/, '')) && (<h4>{post.title}</h4>)}
                    <p>{post.excerpt || post.content}</p>
                    {((post.cover_image_url && post.cover_image_url.trim() !== "") || (post.image_url && post.image_url.trim() !== "")) && (
                      <img loading="lazy" src={resolveMediaUrl(post.cover_image_url || post.image_url)} alt={post.title} className="post-image" />
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
                <img loading="lazy" src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="avatar" />
                <div className="post-user-info">
                  <strong>Preetam M.</strong>
                  <small>II hours ago • Chronicled</small>
                </div>
              </div>
              <div className="post-body">
                <p>Uncovering the ancient algorithms of Rome. The past is written in the sacred nodes. We reinvent the machine not from metal, but from the lost codex. 🏛️📜 #DenceWance #HistoricalTech</p>
                <img loading="lazy" src="https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80" alt="Historical Tech Post" className="post-image" />
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
                <img loading="lazy" src="https://i.pravatar.cc/150?img=33" alt="Avatar" className="avatar" />
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
            <img loading="lazy" src="https://i.pravatar.cc/150?img=52" alt="User" />
            <div className="msg-text">
              <strong>DaVinci_Core</strong>
              <p>The manuscript is perfectly aligning...</p>
            </div>
          </div>
          <div className="message-preview">
            <img loading="lazy" src="https://i.pravatar.cc/150?img=47" alt="User" />
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
        <button className={activeTab === 'stories' ? 'active' : ''} onClick={() => { setActiveStoryIndex(0); setViewingMedia('reel'); setActiveTab('stories'); }}><VideoStoriesIcon /></button>
        <button className={activeTab === 'search' ? 'active' : ''} onClick={() => setActiveTab('search')}><MapIcon /></button>
        <button className={activeTab === 'add' ? 'active' : ''} onClick={() => setActiveTab('add')}><QuillIcon /></button>
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}><EyeIcon /></button>
      </nav>

      
    </div>
      )}
    </>
  );
}
