import React, { useState, useEffect, useRef } from 'react';
import './SocialApp.css';
import ReelsViewer from './ReelsViewer';
import CreateInstagramMenu from './CreateInstagramMenu';
import ProfileDashboard from './ProfileDashboard';
import SkeletonImage from './SkeletonImage';

import { uploadMediaToAppwrite } from '../utils/appwriteClient';
import { buildCreatorIdentity, getPreferredCreatorMode } from '../utils/creatorIdentity';
import PYQAssistant from './PYQAssistant';
import StorageManager from './StorageManager';

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

const getReelIdFromHash = (hash = window.location.hash) => {
  const match = hash.match(/^#viewReel=([^&]+)/i);
  if (!match) return '';
  try {
    return decodeURIComponent(match[1]);
  } catch (err) {
    return match[1];
  }
};

const getItemId = (item) => item?.id || item?._id || item?.$id || '';

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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Normalize reel IDs to ensure string format for proper matching
const normalizeReelData = (reel) => {
  if (!reel) return null;
  const reelId = String(reel.id || reel._id || reel.$id || '');
  return {
    ...reel,
    id: reelId,
    _id: reelId,
  };
};

const fetchWithTimeout = (url, options = {}, timeoutMs = 15000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

const fetchWithRetry = async (url, options = {}, retries = 1, timeoutMs = 15000) => {
  try {
    return await fetchWithTimeout(url, options, timeoutMs);
  } catch (err) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 500));
      return fetchWithRetry(url, options, retries - 1, timeoutMs);
    }
    throw err;
  }
};

const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string' || url === 'null' || url === 'undefined') return '';
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const readJsonSafely = async (response) => {
  if (!response || !response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const fetchReelById = async (reelId) => {
  if (!reelId) return null;
  const res = await fetch(`${API_URL}/api/reels/${encodeURIComponent(reelId)}?_t=${Date.now()}`, {
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
  });
  return readJsonSafely(res);
};

export default function SocialApp({ viewMode = 'desktop', setViewMode }) {
  const [activeTab, setActiveTab] = useState(() => new URLSearchParams(window.location.search).get('tab') || 'home');
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
  const [showStorageManager, setShowStorageManager] = useState(false);
  const [recommendations, setRecommendations] = useState({ tags: [], reels: [] });
  const statusUploadRef = useRef(null);
  const [isStatusUploading, setIsStatusUploading] = useState(false);
  const [statusUploadProgress, setStatusUploadProgress] = useState(0);
  const [trendingNotification, setTrendingNotification] = useState(null);
  const trendingTimeoutRef = useRef(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  const navigateToProfile = (userId) => {
    if (userId) {
      setSelectedProfileId(userId);
      setActiveTab('profile');
    }
  };

  const openReelById = async (reelId) => {
    if (!reelId) return false;

    const collections = [
      { type: 'reel', items: reelsFeed },
      { type: 'recommendation', items: recommendations.reels },
      { type: 'search', items: searchResults.reels },
      { type: 'status', items: statuses },
    ];

    for (const collection of collections) {
      const index = Array.isArray(collection.items)
        ? collection.items.findIndex((item) => getItemId(item) === reelId)
        : -1;

      if (index !== -1) {
        setViewingMedia(collection.type);
        setActiveStoryIndex(index);
        setActiveTab('stories');
        return true;
      }
    }

    const hydrated = await fetchReelById(reelId);
    const reel = hydrated?.data;
    if (!reel) return false;

    const normalized = normalizeReelData({
      ...reel,
      id: reelId,
      _id: reelId,
    });

    setReelsFeed(prev => {
      const filtered = prev.filter((item) => getItemId(item) !== reelId);
      return [normalized, ...filtered].slice(0, 200);
    });
    setStatuses(prev => {
      const filtered = prev.filter((item) => getItemId(item) !== reelId);
      return [normalized, ...filtered].slice(0, 50);
    });
    setViewingMedia('reel');
    setActiveStoryIndex(0);
    setActiveTab('stories');
    return true;
  };

  useEffect(() => {
    const syncFromHash = () => {
      const reelId = getReelIdFromHash();
      if (!reelId) return;
      openReelById(reelId).catch((err) => console.warn('Hash reel sync failed', err));
    };

    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, [reelsFeed, recommendations.reels, searchResults.reels, statuses]);

  const handleUploadPanelComplete = async (savedData) => {
    // If it's a Reel, optimistically insert and navigate, then refresh in background
    if (savedData && (savedData.data?.video_url || savedData.video_url)) {
      try {
        const savedReel = savedData.data || savedData;
        
        // Ensure ID is always a string for proper matching
        const reelId = String(savedReel.id || savedReel._id || savedReel.$id || Date.now());
        console.log('📤 Upload Complete - Received Reel:', { savedData, savedReel, reelId });

        const hydratedData = await fetchReelById(reelId);
        const hydratedReel = hydratedData?.data || null;
        
        const normalized = {
          _id: reelId,
          id: reelId,
          video_url: hydratedReel?.video_url || savedReel.video_url || savedReel.videoUrl || savedReel.url || '',
          cover_image_url: hydratedReel?.cover_image_url || savedReel.cover_image_url || savedReel.coverUrl || savedReel.cover || '',
          title: hydratedReel?.title || savedReel.title || savedReel.caption || '',
          creator_id: hydratedReel?.creator_id || savedReel.creator_id || savedReel.creatorId || '',
          creator_name: hydratedReel?.creator_name || savedReel.creator_name || savedReel.creatorName || 'You',
          is_active: typeof (hydratedReel?.is_active ?? savedReel.is_active) !== 'undefined' ? (hydratedReel?.is_active ?? savedReel.is_active) : true,
          created_at: hydratedReel?.created_at || savedReel.created_at || new Date().toISOString(),
          ...hydratedReel,
        };

        // Merge all fields from server response to ensure nothing is lost
        const mergedReel = {
          ...savedReel,
          ...normalized,
        };
        
        console.log('✅ Merged reel data:', mergedReel);

        // Optimistic update: add reel to feeds immediately
        setReelsFeed(prev => {
          const filtered = prev.filter(r => (r.id || r._id) !== reelId);
          return [mergedReel, ...filtered].slice(0, 200);
        });

        setStatuses(prev => {
          if (prev.some(s => (s.id || s._id) === reelId)) return prev;
          const newStatus = { ...mergedReel };
          return [newStatus, ...prev].slice(0, 50);
        });

        // Navigate to uploaded reel immediately for good UX
        window.location.hash = '#viewReel=' + reelId;
        setViewingMedia('reel');
        setActiveStoryIndex(0);
        openReelById(reelId);
        setActiveTab('stories');

        // Fire-and-forget: refresh full lists in background to reconcile with server
        (async () => {
          try {
            const [statusRes, reelsRes] = await Promise.all([
              fetchWithRetry(`${API_URL}/api/global-status?_t=${Date.now()}`),
              fetchWithRetry(`${API_URL}/api/reels?limit=100&_t=${Date.now()}`)
            ]);
            if (statusRes.ok) {
              const latestData = await statusRes.json();
              const normalizedStatuses = (latestData.data || []).map(normalizeReelData);
              setStatuses(normalizedStatuses);
            }
            if (reelsRes.ok) {
              const reelsData = await reelsRes.json();
              const normalizedReels = (reelsData.data || []).map(normalizeReelData);
              setReelsFeed(normalizedReels);
            }
          } catch (e) {
            console.warn('Background refresh failed', e);
          }
        })();

        return;
      } catch (err) {
        console.error('Error refreshing after upload:', err);
        window.location.hash = '#viewReel=' + (savedData?.data?.id || savedData?.data?._id || savedData?.id || savedData?._id || '');
        return;
      }
    }
    // If it's a Post, reload page
    setTimeout(() => window.location.reload(), 800);
  };

  const handleStatusUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsStatusUploading(true);
    setStatusUploadProgress(0);
    const creatorIdentity = buildCreatorIdentity({
      mode: getPreferredCreatorMode(),
      seed: file.name || `status-${Date.now()}`,
      name: adminData?.name || 'You',
    });
    
    try {
      // 1. Upload Video directly via Appwrite SDK (or R2/backend)
      const videoUploadResult = await uploadMediaToAppwrite(file, 'alok_media', (progressData) => {
        setStatusUploadProgress(Math.round(progressData.progress));
      });

      const videoUrlValue = (videoUploadResult && typeof videoUploadResult === 'object') ? (videoUploadResult.url || videoUploadResult) : videoUploadResult;
      const coverUrl = (videoUploadResult && typeof videoUploadResult === 'object') ? (videoUploadResult.cover_url || videoUploadResult.coverUrl || null) : null;
      const uploaderId = localStorage.getItem('activeUploader') || null;
      const authToken = localStorage.getItem('adminToken') || '';

      // 2. Post the Reel (Video Story)
      const reelBody = {
        title: 'My Video Story',
        caption: 'Uploaded from Video Stories Bar',
        video_url: videoUrlValue,
        status: 'published',
        ...creatorIdentity,
      };
      if (coverUrl) reelBody.cover_image_url = coverUrl;
      if (uploaderId) reelBody.uploaderId = uploaderId;

      const reelRes = await fetch(`${API_URL}/api/reels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
        body: JSON.stringify(reelBody)
      });
      
      const reelData = await reelRes.json();
      if (!reelRes.ok) throw new Error(reelData.error || 'Failed to create Video Story');

      // Refresh Global Statuses immediately & Open the reel
      const latestRes = await fetch(`${API_URL}/api/global-status?_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      });
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
            
            // Show trending notification
            setTrendingNotification({
              reelId: newReelId,
              reelTitle: reelData.data?.title || 'Your Video'
            });
            
            // Auto-hide trending notification after 5 seconds
            if (trendingTimeoutRef.current) clearTimeout(trendingTimeoutRef.current);
            trendingTimeoutRef.current = setTimeout(() => {
              setTrendingNotification(null);
            }, 5000);
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
            const normalizedData = {
              tags: data.data.tags || [],
              reels: (data.data.reels || []).map(normalizeReelData)
            };
            setRecommendations(normalizedData);
          }
        }).catch(err => console.error('Error fetching recommendations', err));
    }
  }, [activeTab]);
  
  const token = localStorage.getItem('adminToken');
  const adminId = localStorage.getItem('adminId');
  const [adminData, setAdminData] = useState(null);
  const [openMenuFor, setOpenMenuFor] = useState(null);
  const [storageUsageSummary, setStorageUsageSummary] = useState(null);

  useEffect(() => {
    const fetchUsage = async () => {
      if (!adminData || (adminData.role !== 'admin' && adminData.role !== 'superadmin')) return;
      if (!token) return;
      try {
        const res = await fetch(`${API_URL}/api/storage/usage`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.success) setStorageUsageSummary(data.data);
      } catch (e) {
        // ignore
      }
    };
    fetchUsage();
  }, [adminData, token]);

  // Sync URL path to internal tab state and keep the URL tidy/simple
  useEffect(() => {
    const tabFromPath = (pathname = '/') => {
      const path = String(pathname || '/').replace(/^\/+/, '').toLowerCase();
      const map = {
        '': 'home',
        'home': 'home',
        'stories': 'stories',
        'videos': 'stories',
        'clips': 'stories',
        'search': 'search',
        'create': 'add',
        'add': 'add',
        'profile': 'profile',
        'pyq': 'pyq',
        'messages': 'messages'
      };
      return map[path] || 'home';
    };

    const syncTabFromLocation = () => {
      const target = tabFromPath(window.location.pathname);
      setActiveTab((current) => (current === target ? current : target));
    };

    syncTabFromLocation();
    window.addEventListener('popstate', syncTabFromLocation);
    return () => window.removeEventListener('popstate', syncTabFromLocation);
  }, []);

  useEffect(() => {
    try {
      const path = activeTab === 'home' ? '/' : `/${activeTab === 'stories' ? 'clips' : activeTab}`;
      if (window.location.pathname !== path) {
        window.history.pushState(null, '', path);
      }
    } catch (e) {}
  }, [activeTab]);

  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/api/admins`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          const me = data.data?.find(a => a._id === adminId || a.id === adminId) || (Array.isArray(data) ? data : []).find(a => a._id === adminId || a.id === adminId);
          if (me) {
            setAdminData(me);
            localStorage.setItem('userName', me.name || '');
            localStorage.setItem('userHandle', me.email?.split('@')[0] || '');
            localStorage.setItem('userAvatar', me.avatar_url || '');
          }
        }).catch(err => console.error(err));
    }
  }, [token, adminId]);

  useEffect(() => {
    setIsLoading(true); // Fetching chalu
    
    // Timeout safety: If loading takes more than 20 seconds, force stop
    const loadingTimeout = setTimeout(() => {
      console.warn('API loading timeout - using defaults');
      setIsLoading(false);
    }, 20000);

    Promise.all([
      // Fetch Statuses
      fetchWithRetry(`${API_URL}/api/global-status?_t=${Date.now()}`)
        .then(readJsonSafely)
        .then(data => {
          if (data && Array.isArray(data.data)) {
            const normalizedStatuses = data.data.slice(0, 30).map(normalizeReelData);
            setStatuses(normalizedStatuses);
          }
        })
        .catch(err => {
          console.error('Failed to load status', err);
          setStatuses([]);
        }),

      // Fetch Reels (Video Stories)
      fetchWithRetry(`${API_URL}/api/reels?limit=100&_t=${Date.now()}`)
        .then(readJsonSafely)
        .then(data => {
          if (data && Array.isArray(data.data) && data.data.length > 0) {
            const normalizedReels = data.data.map(normalizeReelData);
            setReelsFeed(normalizedReels);
          } else {
            setReelsFeed([]);
          }
        })
        .catch(err => {
          console.error('Failed to load reels', err);
          // Show fallback message when backend is unavailable
          setReelsFeed([{
            _id: 'loading-error',
            title: 'Backend Setup Pending',
            description: 'Video stories will load when the backend service is ready. Please refresh in a moment.',
            is_active: false,
            created_at: new Date().toISOString()
          }]);
        }),

      // Fetch posts feed
      fetchWithRetry(`${API_URL}/api/news`)
        .then(readJsonSafely)
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
          reels: (data.data.reels || []).map(normalizeReelData)
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

    try {
      const res = await fetch(`${API_URL}/api/reels/${reelId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        removeLocally();
        alert("Reel deleted.");
        
        // Force refresh with cache buster to ensure deleted reel doesn't come back
        await new Promise(r => setTimeout(r, 500));
        const now = Date.now();
        
        // Refresh all reel sources with forced cache bust
        Promise.all([
          fetchWithRetry(`${API_URL}/api/global-status?_t=${now}`),
          fetchWithRetry(`${API_URL}/api/reels?limit=100&_t=${now}`),
        ]).then(async ([statusRes, reelsRes]) => {
          try {
            if (statusRes.ok) {
              const latestData = await statusRes.json();
              const normalizedStatuses = (latestData.data || []).map(normalizeReelData);
              setStatuses(normalizedStatuses);
            }
            if (reelsRes.ok) {
              const reelsData = await reelsRes.json();
              const normalizedReels = (reelsData.data || []).map(normalizeReelData);
              setReelsFeed(normalizedReels);
            }
          } catch (e) {
            console.warn('Background refresh after delete failed', e);
          }
        });
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
          onNavigateToProfile={navigateToProfile}
        />
      ) : (
        <div className={`social-app-container historical-theme ${viewMode === 'desktop' ? 'mode-desktop' : 'mode-phone'}`}>
          
          {/* Universal Top Navigation Bar (One Line) */}
          <header className="top-nav-bar">
        <div className="brand-container animated-brand" style={{ paddingLeft: '8px' }}>
          <DenceWanceLogo width="auto" height={48} style={{ maxWidth: '200px' }} />
        </div>
        
        {/* Opposite side Notification Bell */}
        <div className="top-nav-actions" style={{ position: 'relative' }}>
          {setViewMode && (
            <button 
              onClick={() => setViewMode(viewMode === 'desktop' ? 'phone' : 'desktop')} 
              className="view-mode-toggle-btn"
            >
              {viewMode === 'desktop' ? '📱 Phone view' : '💻 PC view'}
            </button>
          )}

          <button className="icon-btn notification-btn" onClick={() => setActiveTab('messages')}>
            <ScrollIcon />
            <span className="notification-badge" style={{ backgroundColor: 'blue' }}>1</span>
          </button>
          <button className="icon-btn notification-btn">
            <BellIcon />
            <span className="notification-badge">3</span>
          </button>
          
          <button onClick={() => setActiveTab('pyq')} style={{ background: 'linear-gradient(45deg, #B4A05D, #D4AF37)', color: 'black', fontWeight: 'bold', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', boxShadow: '0 2px 10px rgba(180, 160, 93, 0.3)' }}>🎓 PYQ</button>
          
          {/* Storage Manager & Admin Settings - ADMIN ONLY */}
          {adminData && (adminData.role === 'admin' || adminData.role === 'superadmin') && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setShowStorageManager(true)} title="Manage storage" style={{ marginLeft: 8, padding: '6px 10px', borderRadius: 10, background: '#111', color: '#fff', border: '1px solid #333' }}>Storage</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {storageUsageSummary ? (
                  <div style={{ fontSize: 12, color: '#ddd', background: '#0b0b0b', padding: '6px 8px', borderRadius: 8, border: '1px solid #222' }}>
                    R2: {storageUsageSummary.r2?.totalBytes ? Math.round(storageUsageSummary.r2.totalBytes / 1024 / 1024) + 'MB' : 'N/A'} • AW: {storageUsageSummary.appwrite?.totalBytes ? Math.round(storageUsageSummary.appwrite.totalBytes / 1024 / 1024) + 'MB' : 'N/A'}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#777' }}>Usage</div>
                )}

                {localStorage.getItem('activeUploader') && (
                  <div style={{ fontSize: 12, color: '#fff', background: '#222', padding: '6px 8px', borderRadius: 8, border: '1px solid #333' }} title="Active uploader id">
                    {localStorage.getItem('activeUploader').slice(0, 8)}...
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </header>

      {/* Main Split Layout */}
      <div className="app-body">
        {/* Sidebar for Desktop */}
        <nav className="desktop-sidebar">
          <ul className="nav-links">
            <li className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>
              <HomeIcon /> <span>Home</span>
            </li>
            <li className={activeTab === 'stories' ? 'active' : ''} onClick={() => { setActiveStoryIndex(0); setViewingMedia('reel'); setActiveTab('stories'); }}>
              <VideoStoriesIcon /> <span>Clips</span>
            </li>
            <li className={activeTab === 'search' ? 'active' : ''} onClick={() => setActiveTab('search')}>
              <MapIcon /> <span>Search</span>
            </li>
            <li className={activeTab === 'add' ? 'active' : ''} onClick={() => setActiveTab('add')}>
              <QuillIcon /> <span>Create</span>
            </li>
            <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => { setSelectedProfileId(null); setActiveTab('profile'); }}>
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
               <span style={{ fontWeight: 'bold' }}>Uploading Clip...</span>
               <span style={{ fontWeight: 'bold', color: '#00FF00' }}>{Math.round(statusUploadProgress)}%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
               <div style={{ width: `${Math.round(statusUploadProgress)}%`, height: '100%', background: 'linear-gradient(90deg, #00FF00, #00ffcc)', transition: 'width 0.2s linear' }}></div>
            </div>
          </div>
        )}
        
        {/* GLOBAL TRENDING STATUS BAR */}
        {trendingNotification && (
          <div style={{
            position: 'absolute', top: isStatusUploading ? '60px' : '0px', left: 0, width: '100%',
            background: 'rgba(20,20,40,0.98)', borderBottom: '2px solid #00ff99',
            zIndex: 9998, padding: '12px 20px', display: 'flex', flexDirection: 'column',
            backdropFilter: 'blur(10px)', color: '#fff', animation: 'slideDown 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ fontWeight: 'bold', fontSize: '15px' }}>
                🔥 <span style={{ color: '#00ff99', marginLeft: '8px' }}>{trendingNotification.reelTitle} is NOW TRENDING!</span>
              </span>
              <button 
                onClick={() => setTrendingNotification(null)}
                style={{
                  background: 'transparent', border: 'none', color: '#999', cursor: 'pointer',
                  fontSize: '18px', padding: '0 4px', lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ 
              marginTop: '8px', display: 'flex', gap: '4px', alignItems: 'center', 
              fontSize: '12px', color: '#00ffcc' 
            }}>
              {[0, 1, 2].map((i) => (
                <div 
                  key={i}
                  style={{
                    width: '8px', height: '8px', borderRadius: '50%', 
                    background: '#00ff99',
                    animation: `pulse 1.5s ease-in-out ${i * 0.3}s infinite`
                  }}
                />
              ))}
              <span style={{ marginLeft: '8px' }}>Gaining engagement...</span>
            </div>
          </div>
        )}
        {/* GLOBAL UPLOAD STATUS BAR - Old Duplicate (keeping for backwards compatibility) */}
        {isStatusUploading && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%',
            background: 'rgba(20,20,20,0.95)', borderBottom: '1px solid #333',
            zIndex: 9999, padding: '10px 20px', display: 'flex', flexDirection: 'column',
            backdropFilter: 'blur(10px)', color: '#fff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
               <span style={{ fontWeight: 'bold' }}>Uploading Clip...</span>
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
                    placeholder="Search Users, Clips, ID, Tags..."
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
                      <h3 className="search-section-title">Recommended Clips</h3>
                      <div className="search-reels-grid">
                        {recommendations.reels.map((r, i) => (
                          <div key={`rec-${i}`} className="search-reel-card" onClick={() => { setActiveStoryIndex(i); setViewingMedia('recommendation'); setActiveTab('stories'); }}>
                            <span className="search-reel-tag" style={{ background: '#00FFFF', color: '#000' }}>#{r.tags?.[0] || 'Trending'}</span>
                            {r.cover_image_url ? (
                              <SkeletonImage
                                src={resolveMediaUrl(r.cover_image_url)}
                                alt="Cover"
                                className="search-reel-cover"
                                wrapperClassName="search-reel-cover"
                                wrapperStyle={{ width: '100%', height: '100%' }}
                              />
                            ) : (
                              <div style={{width:'100%', height:'100%', background:'#222', display:'flex', alignItems:'center', justifyContent:'center'}}>▶</div>
                            )}
                            <div className="search-reel-overlay">
                               <div className="search-reel-title">{r.title || 'Clip'}</div>
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
                      <div 
                        key={`u-${i}`} 
                        className="search-user-card" 
                        onClick={() => navigateToProfile(u.id || u._id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <SkeletonImage
                          src={resolveMediaUrl(u.avatar_url)}
                          fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'User')}&background=random`}
                          alt={u.name}
                          className="search-user-avatar"
                          wrapperStyle={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 12px auto', display: 'block' }}
                          circle={true}
                        />
                        <div className="search-user-name">{u.name}</div>
                        <div className="search-user-id">ID: {(u.id || u._id || '').substring(0, 8)}..</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show Reels */}
              {searchResults.reels.length > 0 && (
                <div style={{ marginBottom: '40px' }}>
                  <h3 className="search-section-title">
                    Clips <span className="search-count">{searchResults.reels.length}</span>
                  </h3>
                  <div className="search-reels-grid">
                    {searchResults.reels.map((r, i) => (
                      <div key={`r-${i}`} className="search-reel-card" onClick={() => { setActiveStoryIndex(i); setViewingMedia('search'); setActiveTab('stories'); }}>
                        <span className="search-reel-tag">Video</span>
                        {r.cover_image_url ? (
                          <SkeletonImage
                            src={resolveMediaUrl(r.cover_image_url)}
                            alt="Cover"
                            className="search-reel-cover"
                            wrapperClassName="search-reel-cover"
                            wrapperStyle={{ width: '100%', height: '100%' }}
                          />
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
                          <SkeletonImage
                            src={resolveMediaUrl(p.cover_image_url)}
                            alt="Post"
                            className="search-post-image"
                            wrapperStyle={{ width: 250, height: 180, display: 'block' }}
                            skeletonHeight={180}
                          />
                        )}
                        <div className="search-post-content">
                          <h4 className="search-post-title">{p.title}</h4>
                          <p className="search-post-excerpt">{p.excerpt ? p.excerpt : 'No snippet available...'}</p>
                          <div className="search-post-meta">
                            <span 
                              className="search-post-author"
                              onClick={() => navigateToProfile(p.author_id || p.creator_id || 'anonymous')}
                              style={{ cursor: 'pointer', color: '#00FFFF' }}
                            >
                              ✍️ {p.author_name || 'DenceWance Scribe'}
                            </span>
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
                  <p style={{ marginTop: '10px' }}>No users, tags or clips found in the Database.</p>
                </div>
              )}
                </div>
              )}
            </div>
          ) : activeTab === 'messages' ? (
            <div style={{ padding: '20px', color: '#fff', textAlign: 'center' }}><h2>Scrolls (Messages)</h2><p>No new scrolls received from the archivists...</p></div>
          ) : activeTab === 'profile' ? (
             <ProfileDashboard targetUserId={selectedProfileId} onBack={() => { setSelectedProfileId(null); setActiveTab('home'); }} /> ) : activeTab === 'add' ? ( <CreateInstagramMenu onComplete={handleUploadPanelComplete} />
          ) : isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#fff', flexDirection: 'column' }}>
              <DenceWanceLogo width={80} height={80} />
              <h3 style={{ marginTop: '20px', letterSpacing: '1px' }}>Loading...</h3>
            </div>
          ) : (
            <>
              {/* Stories Section Wrapper */}
              <div style={{ position: 'relative', width: '100%', marginTop: '22px' }}>
                {/* Left Corner branding (Message Bubble Style) */}
                <div className="stories-branding" style={{ 
                  position: 'absolute', left: '8px', top: '-22px', 
                  background: 'linear-gradient(180deg, #4a4a4a 0%, #1a1a1a 40%, #000000 100%)', 
                  color: '#ffffff', 
                  borderTop: '1px solid rgba(255,255,255,0.3)',
                  boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.2)',
                  fontFamily: "'Cinzel', Georgia, serif", fontWeight: 800, fontSize: '11px', 
                  padding: '6px 14px', borderRadius: '10px 10px 10px 0', 
                  zIndex: 30, filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.7))', 
                  letterSpacing: '0.5px', whiteSpace: 'nowrap' 
                }}>
                  GLOBAL TRENDING CLIPS
                  {/* Pointer / Tail of the message bubble */}
                  <div style={{
                    position: 'absolute', bottom: '-7px', left: '0',
                    width: 0, height: 0,
                    borderTop: '8px solid #000000',
                    borderRight: '10px solid transparent'
                  }} />
                </div>
                
                {/* Stories Section Dropdown top */}
                <section className="stories-container" style={{ position: 'relative', display: 'flex', overflowX: 'auto', gap: '12px', padding: '12px 18px', alignItems: 'center', alignSelf: 'flex-start' }}>

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
              <span style={{ fontSize: '12px', marginTop: '5px', display: 'block', color: '#fff' }}>{isStatusUploading ? 'Uploading...' : 'New Clip'}</span>
              <input type="file" ref={statusUploadRef} style={{ display: 'none' }} accept="video/*" onChange={handleStatusUpload} />
            </div>
                {statuses.length > 0 ? (
                  statuses.map((story, i) => {
                    const thumb = story.cover_image_url || story.media_url || story.thumbnail || '';
                    return (
                      <div key={story._id || i} onClick={() => { markStatusSeen(story.id || story._id); setActiveStoryIndex(i); setViewingMedia('status'); setActiveTab('stories'); }} style={{ cursor: 'pointer', minWidth: 84, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ width: 84, height: 150, borderRadius: 12, overflow: 'hidden', position: 'relative', boxShadow: '0 6px 18px rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)' }}>
                          {thumb ? (
                            (/(\.mp4|\.mov|\.webm|\.m3u8)(\?|$)/i.test(thumb) || (story.video_url && !story.cover_image_url)) ? (
                              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                <video src={resolveMediaUrl(story.video_url || thumb)} muted loop playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '20px' }}>▶</div>
                                </div>
                              </div>
                            ) : (
                              <SkeletonImage src={resolveMediaUrl(thumb)} alt={story.title || 'Preview'} wrapperStyle={{ width: '100%', height: '100%', display: 'block' }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            )
                          ) : (
                            story.video_url ? (
                              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                <video src={resolveMediaUrl(story.video_url)} muted loop playsInline autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '20px' }}>▶</div>
                                </div>
                              </div>
                            ) : (
                              <div style={{ width: '100%', height: '100%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶</div>
                            )
                          )}
                          {/* small profile overlay */}
                          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <SkeletonImage src={resolveMediaUrl(story.creator_avatar || story.avatar_url)} fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(story.creator_name || 'User')}&background=random`} alt={story.creator_name || 'Creator'} wrapperStyle={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} circle={true} />
                          </div>
                        </div>
                        <div style={{ color: '#cbd5e1', fontSize: 11, textAlign: 'center', maxWidth: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '500' }}>{(story.creator_name || story.title || 'Anon').substring(0, 12)}</div>
                      </div>
                    );
                  })
                ) : null}
              </section>
            </div>

          {/* Feed Section */}
          <section className="feed-container">
            {feed.length > 0 ? (
              feed.map((post, i) => {
                const postAuthorId = post.author_id || post.creator_id || 'anonymous';
                return (
                  <div className="post" key={post._id || i}>
                    <div className="post-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div style={{display: 'flex', alignItems: 'center'}}>
                        <button
                          onClick={() => navigateToProfile(postAuthorId)}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'block', outline: 'none' }}
                          title="View Profile"
                        >
                          <SkeletonImage
                            src={post.source}
                            fallbackSrc={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.author_name || 'User')}&background=random`}
                            alt="Avatar"
                            className="avatar"
                            wrapperStyle={{ width: 48, height: 48, borderRadius: '50%', display: 'block' }}
                            circle={true}
                          />
                        </button>
                        <div className="post-user-info">
                          <button
                            onClick={() => navigateToProfile(postAuthorId)}
                            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', color: 'inherit', font: 'inherit', outline: 'none' }}
                            title="View Profile"
                          >
                            <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {post.author_name || 'DenceWance User'}
                              {(postAuthorId && postAuthorId.includes('69d6')) && (
                                <svg viewBox="0 0 24 24" fill="#00FFFF" width="16" height="16" style={{ filter: 'drop-shadow(0 0 2px rgba(0, 255, 255, 0.4))' }}>
                                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.8 14.8L6.4 13l1.4-1.4 2.4 2.4 6-6L17.6 9l-7.4 7.8z"/>
                                </svg>
                              )}
                            </strong>
                          </button>
                        <small>{new Date(post.published_at || Date.now()).toLocaleDateString()} • Recorded</small>
                      </div>
                    </div>
                    {/* More menu (three-dot) - shows Delete only to admins/owners */}
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenuFor(openMenuFor === (post._id || post.id) ? null : (post._id || post.id)); }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px' }}
                        aria-label="More"
                      >
                        <MoreVerticalIcon />
                      </button>

                      {openMenuFor === (post._id || post.id) && (
                        <div className="more-menu" style={{ position: 'absolute', right: 0, top: '32px', background: '#111', border: '1px solid #333', borderRadius: '8px', padding: '6px', zIndex: 9999, minWidth: 140 }} onClick={(e)=>e.stopPropagation()}>
                          <button className="more-menu-item" onClick={(e) => { e.stopPropagation(); try { if (navigator.share) { navigator.share({ title: post.title || 'DenceWance', text: post.excerpt || '', url: window.location.href }); } else { alert('Share not supported'); } } catch(_){} setOpenMenuFor(null); }} style={{ display: 'block', width: '100%', padding: '6px 8px', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>Share</button>
                          {((adminData?.role === 'admin') || (adminData?.role === 'superadmin') || (post.author_id === adminId) || (adminData && (post.author_id === adminData._id || post.author_name === adminData.name)) || adminId) ? (
                            <button className="more-menu-item" onClick={(e) => { e.stopPropagation(); setOpenMenuFor(null); handleDeletePost(post.id || post._id); }} style={{ display: 'block', width: '100%', padding: '6px 8px', textAlign: 'left', background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}>{'Delete'}</button>
                          ) : null}
                          <button className="more-menu-item" onClick={(e) => { e.stopPropagation(); alert('Reported.'); setOpenMenuFor(null); }} style={{ display: 'block', width: '100%', padding: '6px 8px', textAlign: 'left', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>Report</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="post-body">
                    {post.title && !post.title.includes('Untitled') && !post.title.includes('DenceWance') && !post.content?.startsWith(post.title?.replace(/...$/, '')) && (<h4>{post.title}</h4>)}
                    <p>{post.excerpt || post.content}</p>
                    {((post.cover_image_url && post.cover_image_url.trim() !== "") || (post.image_url && post.image_url.trim() !== "")) && (
                      <SkeletonImage
                        src={resolveMediaUrl(post.cover_image_url || post.image_url)}
                        alt={post.title}
                        className="post-image"
                        wrapperStyle={{ width: '100%', display: 'block', minHeight: 280 }}
                        skeletonHeight={280}
                      />
                    )}
                  </div>
                  <div className="post-actions">
                    <button><HeartIcon /> Honor</button>
                    <button><QuillIcon /> Inscribe</button>
                    <button><ShareIcon /> Propagate</button>
                  </div>
                  {/* Admin visible delete icon below actions */}
                  {((adminData?.role === 'admin') || (adminData?.role === 'superadmin') || (post.author_id === adminId) || (adminData && (post.author_id === adminData._id || post.author_name === adminData.name)) || adminId) && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                      <button className="delete-icon-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeletePost(post.id || post._id); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#ff6b6b', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer' }}>🗑️ Delete</button>
                    </div>
                  )}
                </div>
              )})
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#cbd5e1', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: '18px', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ marginBottom: '8px', color: '#fff' }}>No posts yet</h3>
                <p style={{ margin: 0 }}>Live posts will appear here once content is published.</p>
              </div>
            )}
          </section>
          </>)}
        </main>
        {showStorageManager && (
          <StorageManager open={showStorageManager} onClose={() => setShowStorageManager(false)} adminToken={token} />
        )}

        {/* Right Sidebar for Suggestions / Messaging (Desktop) */}
        <aside className="suggestion-sidebar">
          <div className="sidebar-section-title">
            <span className="pulsing-neon-dot"></span>
            <h3>Fellow Scholars</h3>
          </div>
          
          <div className="cyber-suggestions-list">
            {[
              { name: 'Dr. Preetam Alok', role: 'Chief Archivist', avatar: 'https://ui-avatars.com/api/?name=Dr.+Preetam+Alok&background=random', status: 'Active' },
              { name: 'Scribe Yadav', role: 'DenceWance Scriptor', avatar: 'https://ui-avatars.com/api/?name=Scribe+Yadav&background=random', status: 'Syncing' }
            ].map((scholar, idx) => (
              <div key={idx} className="cyber-profile-card">
                <img src={scholar.avatar} alt={scholar.name} className="cyber-avatar" />
                <div className="cyber-profile-info">
                  <strong>{scholar.name}</strong>
                  <span className="cyber-role">{scholar.role}</span>
                </div>
                <span className={`cyber-status-badge ${scholar.status.toLowerCase()}`}>{scholar.status}</span>
              </div>
            ))}
          </div>

          <div className="sidebar-section-divider"></div>

          <div className="cyber-metrics-widget">
            <div className="sidebar-section-title">
              <span className="pulsing-neon-dot" style={{ backgroundColor: '#f59e0b', boxShadow: '0 0 10px #f59e0b' }}></span>
              <h3>System Metrics</h3>
            </div>
            
            <div className="metric-item">
              <div className="metric-label">
                <span>Archival Integrity</span>
                <span style={{ color: '#00f0ff' }}>98.4%</span>
              </div>
              <div className="cyber-progress-bar">
                <div className="cyber-progress-fill cyan-glow" style={{ width: '98.4%' }}></div>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-label">
                <span>R2 Cloud Sync</span>
                <span style={{ color: '#f59e0b' }}>74.2%</span>
              </div>
              <div className="cyber-progress-bar">
                <div className="cyber-progress-fill gold-glow" style={{ width: '74.2%' }}></div>
              </div>
            </div>

            <div className="cyber-status-uplink">
              <span className="pulsing-green-dot"></span>
              <span className="uplink-text">UPLINK SECURED // PROTOCOL 6.4.2</span>
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
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => { setSelectedProfileId(null); setActiveTab('profile'); }}><EyeIcon /></button>
      </nav>

      
    </div>
      )}
    </>
  );
}
