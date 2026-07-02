import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Bell, 
  BadgeCheck, 
  Activity, 
  Users, 
  TrendingUp, 
  Play, 
  UserCog, 
  BarChart2, 
  Home, 
  Film, 
  Search, 
  PlusSquare, 
  User, 
  Music,
  MoreVertical,
  Heart,
  Share2,
  Trash2,
  AlertCircle,
  Settings,
  GitBranch
} from 'lucide-react';

import ReelsViewer from './ReelsViewer';
import LoginScreen from './LoginScreen';
import CameraUpload from './CameraUpload';
import DeveloperControlPanel from './DeveloperControlPanel';
import PYQAssistant from './PYQAssistant';
import StorageManager from './StorageManager';
import SkeletonImage from './SkeletonImage';
import { uploadMediaToAppwrite } from '../utils/appwriteClient';
import { buildCreatorIdentity, getPreferredCreatorMode } from '../utils/creatorIdentity';
import versionData from '../version.json';
import ThreadsView from './ThreadsView';
import VerifiedBadge from './VerifiedBadge';
import PostCaption from './PostCaption';
import { trimImageWhitespace } from '../utils/imageTrimmer';

// Component to handle auto-cropping images smoothly
const AutoCroppedImage = ({ src, alt, className, onError }) => {
  const [processedSrc, setProcessedSrc] = useState(null);
  
  useEffect(() => {
    let mounted = true;
    if (src) {
      trimImageWhitespace(src).then(trimmed => {
        if (mounted) setProcessedSrc(trimmed);
      });
    }
    return () => { mounted = false; };
  }, [src]);

  return (
    <img 
      src={processedSrc || src} 
      alt={alt} 
      loading="lazy"
      className={`${className} ${processedSrc ? 'opacity-100' : 'opacity-50 blur-sm'} transition-all duration-300`}
      onError={onError}
    />
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

const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string' || url === 'null' || url === 'undefined') return '';
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getSmokeGradient = (story) => {
  const title = String(story.title || '').toLowerCase();
  const caption = String(story.caption || '').toLowerCase();
  const text = title + ' ' + caption;
  
  if (text.includes('dark') || text.includes('black') || text.includes('charcoal') || text.includes('night') || text.includes('darkness')) {
    return 'radial-gradient(circle at center, rgba(30, 30, 30, 0.85) 0%, rgba(15, 15, 15, 0.95) 50%, transparent 80%)';
  }
  if (text.includes('white') || text.includes('light') || text.includes('bright') || text.includes('grey') || text.includes('gray')) {
    return 'radial-gradient(circle at center, rgba(240, 240, 240, 0.85) 0%, rgba(180, 180, 180, 0.6) 50%, transparent 80%)';
  }
  
  // Create dynamic triadic colorful smoke colors based on a hash of the title / creator
  const seed = story.title || story.creator_name || String(story.id || 'seen.ly');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue1 = Math.abs(hash) % 360;
  const hue2 = (hue1 + 120) % 360; // 120 degrees apart for high contrast colourful blend
  
  return `radial-gradient(circle at center, hsla(${hue1}, 90%, 60%, 0.75) 0%, hsla(${hue2}, 85%, 50%, 0.6) 45%, transparent 80%)`;
};

export default function PixelPerfectSocialApp({ viewMode = 'desktop', setViewMode }) {
  const getRefinedAvatar = (nameOrHandle, avatarUrl) => {
    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '' && 
        !avatarUrl.includes('ui-avatars.com') && !avatarUrl.includes('placeholder') && !avatarUrl.includes('unsplash.com')) {
      return resolveMediaUrl(avatarUrl);
    }
    let cleanName = String(nameOrHandle || '').trim();
    if (cleanName.startsWith('+')) {
      cleanName = cleanName.replace(/^\+/, '');
    }
    if (/^\d+$/.test(cleanName) || cleanName.length === 0) {
      cleanName = 'User';
    } else {
      cleanName = nameOrHandle;
    }
    const lowerName = String(cleanName || '').toLowerCase();
    if (lowerName.includes('kiran')) {
      return 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&fit=crop&q=80'; // Kiran female profile
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName || 'U')}&background=random`;
  };

  const [activeTab, setActiveTab] = useState(() => {
    if (localStorage.getItem('just_logged_in_admin') === 'true') {
      localStorage.removeItem('just_logged_in_admin');
      return 'developer';
    }
    return 'home';
  });
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [viewingMedia, setViewingMedia] = useState('reel');
  const [statuses, setStatuses] = useState([]);
  const [reelsFeed, setReelsFeed] = useState([]); // Trending-limited for main page
  const [allReelsFull, setAllReelsFull] = useState([]); // ALL reels for Clips viewer (unlimited scroll)
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], reels: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [recommendations, setRecommendations] = useState({ tags: [], reels: [] });
  const [postLikes, setPostLikes] = useState({});
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [showPyqBubble, setShowPyqBubble] = useState(localStorage.getItem('SHOW_PYQ_BUBBLE') === 'true');
  const [enableSmokeTheme, setEnableSmokeTheme] = useState(localStorage.getItem('ENABLE_SMOKE_THEME') !== 'false');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      if (/android/i.test(userAgent) || /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        setIsMobileDevice(true);
      }
    };
    checkMobile();
  }, []);

  const videoRefs = useRef({});
  const [savedPosts, setSavedPosts] = useState({});
  const [activeThreadPost, setActiveThreadPost] = useState(null);

  // Profile Specific State
  const [profileViewMode, setProfileViewMode] = useState('dashboard'); // 'dashboard' or 'content'
  const [profileActiveTab, setProfileActiveTab] = useState('grid'); // 'grid', 'list', or 'similar'
  const [adminData, setAdminData] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [showStorageManager, setShowStorageManager] = useState(false);
  const [storageUsageSummary, setStorageUsageSummary] = useState(null);
  const [openMenuFor, setOpenMenuFor] = useState(null);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  // Edit Profile Modal states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, reason: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const usernameCheckTimerRef = useRef(null);
  const editAvatarInputRef = useRef(null);

  const openEditProfileModal = () => {
    setEditName(adminData?.name || '');
    setEditBio(adminData?.bio || '');
    setEditTags(adminData?.tags?.join(', ') || '');
    setEditUsername(adminData?.username || adminData?.email?.split('@')[0] || '');
    setEditAvatar(adminData?.avatar_url || '');
    setUsernameStatus({ checking: false, available: true, reason: 'Current username' });
    setShowEditProfileModal(true);
  };

  const checkUsernameAvailability = (username) => {
    setEditUsername(username);
    
    if (usernameCheckTimerRef.current) {
      clearTimeout(usernameCheckTimerRef.current);
    }
    
    const cleanVal = username.trim();
    if (!cleanVal) {
      setUsernameStatus({ checking: false, available: null, reason: '' });
      return;
    }
    
    // Strict pattern: 3-20 characters, lowercase letters, numbers, and underscores
    const isValidFormat = /^[a-z0-9_]{3,20}$/.test(cleanVal);
    if (!isValidFormat) {
      let reason = 'Invalid format.';
      if (cleanVal.length < 3) reason = 'Too short (min 3 chars).';
      else if (cleanVal.length > 20) reason = 'Too long (max 20 chars).';
      else if (/[A-Z]/.test(cleanVal)) reason = 'Lowercase letters only.';
      else reason = 'Letters, numbers, and underscores only.';
      
      setUsernameStatus({ checking: false, available: false, reason });
      return;
    }

    if (adminData && adminData.username && adminData.username.toLowerCase() === cleanVal.toLowerCase()) {
      setUsernameStatus({ checking: false, available: true, reason: 'This is your current handle' });
      return;
    }
    
    setUsernameStatus({ checking: true, available: null, reason: 'Checking availability...' });
    
    usernameCheckTimerRef.current = setTimeout(async () => {
      try {
        const headers = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch(`${API_URL}/api/auth/check-username?username=${encodeURIComponent(cleanVal)}`, {
          headers
        });
        if (res.ok) {
          const data = await res.json();
          if (data.available) {
            setUsernameStatus({ checking: false, available: true, reason: '✓ Username is available!' });
          } else {
            setUsernameStatus({ checking: false, available: false, reason: '✗ Username is already taken.' });
          }
        } else {
          setUsernameStatus({ checking: false, available: false, reason: 'Failed to verify username.' });
        }
      } catch (err) {
        console.error('Error checking username:', err);
        setUsernameStatus({ checking: false, available: false, reason: 'Connection error checking availability.' });
      }
    }, 400);
  };

  const handleEditAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('avatar', file);
    
    setIsSavingProfile(true);
    try {
      const res = await fetch(`${API_URL}/api/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        const returnedUrl = data.url || data.data?.avatar_url;
        if (returnedUrl) {
          setEditAvatar(returnedUrl);
        }
      } else {
        alert('Failed to upload avatar.');
      }
    } catch (err) {
      console.error('Error uploading avatar:', err);
      alert('Error uploading avatar.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveEditProfile = async () => {
    if (editUsername.length >= 3 && usernameStatus.available === false) {
      return;
    }
    
    setIsSavingProfile(true);
    try {
      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          bio: editBio,
          tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
          username: editUsername.trim().toLowerCase(),
          avatar_url: editAvatar
        })
      });
      
      if (res.ok) {
        const result = await res.json();
        const updatedUser = result.data;
        if (updatedUser) {
          setAdminData(updatedUser);
          localStorage.setItem('userName', updatedUser.name || '');
          localStorage.setItem('userHandle', updatedUser.username || updatedUser.email?.split('@')[0] || '');
          localStorage.setItem('userAvatar', updatedUser.avatar_url || '');
          
          setReelsFeed(prev => (prev || []).map(reel => {
            if (reel.creator_id === adminId) {
              return {
                ...reel,
                creator_name: updatedUser.name,
                creator_handle: updatedUser.username,
                creator_avatar: updatedUser.avatar_url
              };
            }
            return reel;
          }));
          
          setFeed(prev => (prev || []).map(post => {
            if (post.author_id === adminId) {
              return {
                ...post,
                author_name: updatedUser.name,
                source: updatedUser.avatar_url
              };
            }
            return post;
          }));
          
          setShowEditProfileModal(false);
        }
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Error saving profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const [token, setToken] = useState(() => localStorage.getItem('adminToken'));
  const [adminId, setAdminId] = useState(() => localStorage.getItem('adminId'));

  // Load Initial Backend Data
  useEffect(() => {
    setIsLoading(true);
    const now = Date.now();
    const viewerId = localStorage.getItem('adminId') || '';

    const fetchAndFilterReels = () => {
      const now = Date.now();
      const reelsPromise = fetch(`${API_URL}/api/reels?limit=500&_t=${now}&viewer_id=${viewerId}`)
        .then(res => res.ok ? res.json() : { data: [] })
        .then(data => {
          if (data && Array.isArray(data.data)) {
            let allReels = data.data.map(normalizeReelData);
            const limit = Number(localStorage.getItem('TRENDING_REELS_LIMIT')) || 12;
            const hours = Number(localStorage.getItem('TRENDING_REELS_HOURS')) || 24;
            const timeThreshold = Date.now() - (hours * 60 * 60 * 1000);
            
            allReels = allReels.filter(reel => {
              const reelTime = new Date(reel.created_at || reel.timestamp || 0).getTime();
              return !reelTime || isNaN(reelTime) || reelTime >= timeThreshold;
            });
            allReels.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            setReelsFeed(allReels.slice(0, limit)); // Trending limited for main page
            
            // Store ALL reels (no limit) for the full Clips viewer
            const allNormalized = data.data.map(normalizeReelData);
            allNormalized.sort((a, b) => {
              const dateA = new Date(a.created_at || a.timestamp || 0).getTime();
              const dateB = new Date(b.created_at || b.timestamp || 0).getTime();
              return dateB - dateA; // newest first
            });
            setAllReelsFull(allNormalized);
          }
        })
        .catch(err => console.error('Failed to load reels', err));

      const statusPromise = fetch(`${API_URL}/api/global-status?_t=${now}`)
        .then(res => res.ok ? res.json() : { data: [] })
        .then(data => {
          if (data && Array.isArray(data.data)) {
            const limit = Number(localStorage.getItem('TRENDING_REELS_LIMIT')) || 12;
            setStatuses(data.data.map(normalizeReelData).slice(0, limit));
          }
        })
        .catch(err => console.error('Failed to load status', err));

      return Promise.all([reelsPromise, statusPromise]);
    };

    window.addEventListener('trendingSettingsUpdated', fetchAndFilterReels);

    Promise.all([
      // Fetch Reels & Statuses (Trending Filtering)
      fetchAndFilterReels(),

      // Fetch Posts (News feed)
      fetch(`${API_URL}/api/news`)
        .then(res => res.ok ? res.json() : { data: [] })
        .then(data => {
          if (data && Array.isArray(data.data)) {
            setFeed(data.data);
          }
        })
        .catch(err => console.error('Failed to load feed', err))
    ]).finally(() => {
      setIsLoading(false);
    });

    // Real-time silent update polling every 4 seconds
    const interval = setInterval(() => {
      fetchAndFilterReels();
      fetch(`${API_URL}/api/news`)
        .then(res => res.ok ? res.json() : { data: [] })
        .then(data => {
          if (data && Array.isArray(data.data)) {
            setFeed(data.data);
          }
        });
    }, 4000);

    const updatePyqSettings = () => {
      setShowPyqBubble(localStorage.getItem('SHOW_PYQ_BUBBLE') === 'true');
    };
    const updateSmokeTheme = () => {
      setEnableSmokeTheme(localStorage.getItem('ENABLE_SMOKE_THEME') !== 'false');
    };
    const handleOpenPyq = () => {
      setActiveTab('pyq');
    };
    window.addEventListener('pyqSettingsUpdated', updatePyqSettings);
    window.addEventListener('smokeThemeUpdated', updateSmokeTheme);
    window.addEventListener('openPyq', handleOpenPyq);

    return () => {
      clearInterval(interval);
      window.removeEventListener('trendingSettingsUpdated', fetchAndFilterReels);
      window.removeEventListener('pyqSettingsUpdated', updatePyqSettings);
      window.removeEventListener('smokeThemeUpdated', updateSmokeTheme);
      window.removeEventListener('openPyq', handleOpenPyq);
    };
  }, []);

  // Fetch admin profile data if logged in
  useEffect(() => {
    if (token && adminId) {
      fetch(`${API_URL}/api/admins`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
          setAllUsers(list);
          const me = list.find(a => a._id === adminId || a.id === adminId);
          if (me) {
            setAdminData(me);
            localStorage.setItem('userName', me.name || '');
            localStorage.setItem('userHandle', me.username || me.email?.split('@')[0] || '');
            localStorage.setItem('userAvatar', me.avatar_url || '');
          }
        }).catch(err => console.error('Admin fetch failed', err));
    } else {
      setAdminData(null);
    }
  }, [token, adminId]);

  // Sync logic removed to show actual database content

  // Fetch recommendations for search tab
  useEffect(() => {
    if (activeTab === 'search') {
      fetch(`${API_URL}/api/recommendations`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.data) {
            setRecommendations({
              tags: data.data.tags || [],
              reels: (data.data.reels || []).map(normalizeReelData)
            });
          }
        }).catch(err => console.error('Error recommendations', err));
    }
  }, [activeTab]);

  const openReelById = async (reelId) => {
    if (!reelId) return;
    const collections = [
      { type: 'reel', items: reelsFeed },
      { type: 'recommendation', items: recommendations.reels },
      { type: 'search', items: searchResults.reels },
      { type: 'status', items: statuses },
    ];

    for (const col of collections) {
      const idx = col.items.findIndex(item => String(item.id || item._id) === String(reelId));
      if (idx !== -1) {
        setViewingMedia(col.type);
        setActiveStoryIndex(idx);
        setActiveTab('stories');
        return;
      }
    }

    // Fallback: fetch directly
    try {
      const res = await fetch(`${API_URL}/api/reels/${encodeURIComponent(reelId)}`);
      if (res.ok) {
        const item = await res.json();
        if (item?.data) {
          const norm = normalizeReelData(item.data);
          setReelsFeed(prev => [norm, ...prev]);
          setAllReelsFull(prev => [norm, ...prev]);
          setViewingMedia('reel');
          setActiveStoryIndex(0);
          setActiveTab('stories');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
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

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch(`${API_URL}/api/news/${postId}`, {
         method: 'DELETE',
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setFeed(prev => prev.filter(p => (p.id || p._id) !== postId));
        alert("Post deleted successfully.");
      } else {
        alert("Failed to delete post.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReel = async (reelId) => {
    if (!window.confirm("Are you sure you want to delete this clip?")) return;
    try {
      const res = await fetch(`${API_URL}/api/reels/${reelId}`, {
         method: 'DELETE',
         headers: { 
           Authorization: `Bearer ${token}`,
           'X-Developer-Secret': 'SEEN.LY_DEV_2026'
         }
      });
      if (res.ok) {
        setStatuses(prev => prev.filter(s => (s.id || s._id) !== reelId));
        setReelsFeed(prev => prev.filter(r => (r.id || r._id) !== reelId));
        setAllReelsFull(prev => prev.filter(r => (r.id || r._id) !== reelId));
        alert("Clip deleted successfully.");
        setActiveTab('home');
      } else {
        alert("Failed to delete clip.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadPanelComplete = (savedData) => {
    if (savedData && (savedData.video_url || savedData.data?.video_url)) {
      const savedReel = savedData.data || savedData;
      const reelId = savedReel.id || savedReel._id || savedReel.$id;
      if (reelId) {
        const norm = normalizeReelData(savedReel);
        setReelsFeed(prev => [norm, ...prev]);
        setAllReelsFull(prev => [norm, ...prev]);
        
        // Directly open the reel without stale closure issues
        setViewingMedia('reel');
        setActiveStoryIndex(0);
        setActiveTab('stories');
        
        // Auto-fetch in background to sync all feeds globally
        window.dispatchEvent(new Event('trendingSettingsUpdated'));
      }
    } else {
      // Reload posts
      fetch(`${API_URL}/api/news`)
        .then(res => res.ok ? res.json() : { data: [] })
        .then(data => {
          if (data && Array.isArray(data.data)) {
            setFeed(data.data);
          }
          setActiveTab('home');
        });
    }
  };

  return (
    <div className="relative w-full md:max-w-[420px] mx-auto h-[100dvh] flex flex-col overflow-hidden bg-gray-100 font-sans shadow-2xl border-x border-gray-200 overscroll-none overscroll-y-none">
      
      {/* 1. Global Header */}
      {activeTab !== 'stories' && activeTab !== 'add' && (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center shrink-0">
          <div className="flex items-center cursor-pointer select-none" onClick={() => setActiveTab('home')}>
              <img src="/seenly-logo.png" alt="Seen.Ly Logo" className="h-[36px] object-contain drop-shadow-sm" style={{ mixBlendMode: 'multiply' }} />
            </div>

          <div className="flex items-center gap-[12px]">
            <div className="relative cursor-pointer w-9 h-9 rounded-full bg-[#FAF7EE] flex items-center justify-center border border-[#2B2315]/30 hover:bg-black/5 transition-colors shrink-0" onClick={() => setActiveTab('messages')}>
              <MessageSquare size={16} className="text-[#2B2315]" />
              <span className="absolute -top-1 -right-1 bg-[#FFD700] text-[#3A125E] text-[9px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#FAF7EE]">1</span>
            </div>
            <div className="relative cursor-pointer w-9 h-9 rounded-full bg-[#FAF7EE] flex items-center justify-center border border-[#2B2315]/30 hover:bg-black/5 transition-colors shrink-0">
              <Bell size={16} className="text-[#2B2315]" />
              <span className="absolute -top-1 -right-1 bg-[#FFD700] text-[#3A125E] text-[9px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#FAF7EE]">3</span>
            </div>

            {showPyqBubble && (
              <button 
                onClick={() => setActiveTab('pyq')}
                className="w-9 h-9 rounded-full bg-[#FAF7EE] text-[#2B2315] font-serif font-black italic text-[11px] flex items-center justify-center border border-[#2B2315]/30 hover:bg-black/5 transition-colors cursor-pointer select-none shrink-0 shadow-sm"
              >
                PYQ
              </button>
            )}

            {setViewMode && !isMobileDevice && (
              <button 
                onClick={() => setViewMode(viewMode === 'desktop' ? 'phone' : 'desktop')}
                className="text-[9px] bg-black/5 text-[#2B2315] px-2 py-1 rounded border border-black/5 ml-1 whitespace-nowrap font-bold"
              >
                {viewMode === 'desktop' ? '📱 Mobile' : '💻 PC'}
              </button>
            )}
          </div>
        </header>
      )}

      {/* 2. Main Content Area */}
      <main className="flex-1 overflow-y-auto hide-scrollbar relative overscroll-y-none">
        {activeTab === 'home' && (
          <div className="p-4 pb-24 flex flex-col gap-5">
            {/* Global Trending Status Horizontal Scroll */}
            <div className="flex flex-col py-1">
              <style>{`
                @keyframes circleGlowPulse {
                  0%, 100% {
                    box-shadow: 0 0 10px rgba(255, 255, 255, 0.8), 0 2px 6px rgba(0, 0, 0, 0.15);
                  }
                  50% {
                    box-shadow: 0 0 18px rgba(255, 255, 255, 1), 0 0 10px rgba(155, 81, 224, 0.5);
                  }
                }
                .circular-glow-pulse {
                  animation: circleGlowPulse 2.5s infinite ease-in-out;
                }
                @keyframes smokeAmbient {
                  0% { transform: scale(1) translate(0, 0) rotate(0deg); opacity: 0.3; filter: hue-rotate(0deg); }
                  50% { transform: scale(1.5) translate(-10%, -10%) rotate(180deg); opacity: 0.6; filter: hue-rotate(180deg); }
                  100% { transform: scale(1) translate(0, 0) rotate(360deg); opacity: 0.3; filter: hue-rotate(360deg); }
                }
                .smoke-layer {
                  position: absolute;
                  inset: -50%;
                  animation: smokeAmbient 10s infinite linear alternate;
                  pointer-events: none;
                  z-index: 0;
                  mix-blend-mode: normal;
                  filter: blur(12px);
                }
              `}</style>
              <h2 className="text-[#2B2315] font-sans font-bold text-base tracking-tight mb-4 flex items-center gap-1.5">
                Explore Trending Clips
              </h2>

              <div className="flex overflow-x-auto gap-4 py-2 px-1 scrollbar-hide scroll-smooth snap-x snap-mandatory transform-gpu" style={{ WebkitOverflowScrolling: 'touch' }}>

                {/* Status List */}
                {statuses.length > 0 ? (
                  statuses.map((story, i) => {
                    // Alternate themes: Silver, Gold, Gradient
                    const cardThemes = [
                      {
                        wrapperClass: "p-[2.5px] rounded-[24px] bg-[#D0D0D0] shadow-sm border border-[#EBEBEB]/80",
                        innerBg: "bg-white p-[4px] h-full relative rounded-[21.5px]",
                        innerBorder: "border border-[#EAEAEA] rounded-[18px] h-full w-full relative overflow-hidden flex flex-col items-center justify-start bg-[#F9F9F9]",
                        textColor: "text-gray-800",
                        playBtn: "bg-white/45 border border-white/60 text-gray-800"
                      },
                      {
                        wrapperClass: "p-[2.5px] rounded-[24px] bg-[#B38F24] shadow-sm border border-[#C59715]/40",
                        innerBg: "bg-[#FDF9F0] p-[4px] h-full relative rounded-[21.5px]",
                        innerBorder: "border border-[#E5C060]/40 rounded-[18px] h-full w-full relative overflow-hidden flex flex-col items-center justify-start bg-[#FAF5E6]",
                        textColor: "text-yellow-950",
                        playBtn: "bg-white/45 border border-white/60 text-yellow-800"
                      },
                      {
                        wrapperClass: "p-[2.5px] rounded-[24px] bg-gradient-to-tr from-[#9B51E0] via-[#D4AF37] to-[#00FFFF] shadow-sm",
                        innerBg: "bg-[#FAFAFA] p-[4px] h-full relative rounded-[21.5px]",
                        innerBorder: "border border-[#C5A5FA]/40 rounded-[18px] h-full w-full relative overflow-hidden flex flex-col items-center justify-start bg-[#F5F2FC]",
                        textColor: "text-purple-950",
                        playBtn: "bg-white/45 border border-white/60 text-purple-800"
                      }
                    ];
                    const theme = cardThemes[i % cardThemes.length];

                    return (
                      <div 
                        key={story.id || i}
                        onClick={() => {
                          setViewingMedia('status');
                          setActiveStoryIndex(i);
                          setActiveTab('stories');
                        }}
                        className="flex flex-col items-center shrink-0 cursor-pointer select-none group snap-center transform-gpu"
                      >
                        <div className={`w-[114px] h-[182px] ${theme.wrapperClass}`}>
                          <div className={theme.innerBg}>
                            <div className={theme.innerBorder}>
                              {enableSmokeTheme && (
                                <div 
                                  className="smoke-layer" 
                                  style={{ background: getSmokeGradient(story) }}
                                ></div>
                              )}
                              
                              {/* Refined Circular Avatar with Story-style border */}
                              <div className="absolute top-2 left-2 w-[26px] h-[26px] rounded-full p-[1.2px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] shadow-[0_2px_6px_rgba(0,0,0,0.25)] flex items-center justify-center z-20">
                                <div className="w-full h-full rounded-full border border-white overflow-hidden bg-white">
                                  <img 
                                    src={getRefinedAvatar(story.creator_handle || story.creator_name, story.creator_avatar)} 
                                    alt="Creator"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              </div>

                              {/* Center Dancer Circular Mask */}
                              <div className="w-[74px] h-[74px] rounded-full overflow-hidden border-[2.5px] border-white circular-glow-pulse relative mt-5 shrink-0 group-hover:scale-105 transition-transform duration-300 ease-out z-10">
                                {story.cover_image_url && !(story.cover_image_url.toLowerCase().endsWith('.mp4') || story.cover_image_url.toLowerCase().includes('/video')) ? (
                                  <img 
                                    src={resolveMediaUrl(story.cover_image_url)} 
                                    alt={story.title} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (story.video_url || story.media_url || (story.cover_image_url && (story.cover_image_url.toLowerCase().endsWith('.mp4') || story.cover_image_url.toLowerCase().includes('/video')))) ? (
                                  <video 
                                    src={resolveMediaUrl(story.video_url || story.media_url || story.cover_image_url)} 
                                    className="w-full h-full object-cover"
                                    preload="auto"
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                  />
                                ) : story.thumbnail ? (
                                  <img 
                                    src={resolveMediaUrl(story.thumbnail)} 
                                    alt={story.title} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-[#3A125E]/20 flex items-center justify-center">
                                    <Music size={20} className="text-[#3A125E]/40" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/5"></div>
                              </div>

                              {/* Play Button Overlay */}
                              <div className="absolute bottom-[44px] left-1/2 -translate-x-1/2 z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs hover:scale-105 transition-transform ${theme.playBtn}`}>
                                  <Play size={11} fill="currentColor" className="ml-0.5" />
                                </div>
                              </div>

                              {/* Title / User text at the bottom */}
                              <div className="absolute bottom-2.5 left-1 right-1 flex flex-col items-center justify-center leading-[1.1] text-center z-10">
                                <span className={`text-[9px] font-extrabold ${theme.textColor} tracking-wide text-center lowercase break-words max-w-full px-0.5 line-clamp-1`}>
                                  @{story.creator_handle || story.creator_name || 'admin'}
                                </span>
                              </div>

                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  Array(3).fill(0).map((_, idx) => (
                    <div key={idx} className="flex flex-col items-center shrink-0 animate-pulse snap-center transform-gpu">
                      <div className="w-[114px] h-[182px] rounded-[24px] bg-black/5"></div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* News Feed Post Cards */}
            <div className="flex flex-col gap-5">
              {feed.length > 0 ? (
                feed.map((post, i) => {
                  const authorId = post.author_id || post.creator_id || 'anonymous';
                  return (
                    <div 
                      key={post.id || post._id || i}
                      className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgba(58,18,94,0.04)] border border-gray-100 flex flex-col relative overflow-hidden group"
                    >
                      {/* Dancing silhouettes background pattern watermark at the bottom */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-[80px] opacity-[0.03] pointer-events-none z-0"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'%3E%3Cpath d='M50 20c2 0 4 2 4 4s-2 4-4 4-4-2-4-4 2-4 4-4zm-5 12h10v20H45V32zm-6 24h6v20h-6V56zm16 0h6v20h-6V56z' fill='%233A125E'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'repeat-x',
                          backgroundPosition: 'bottom'
                        }}
                      ></div>

                      {/* Header row */}
                      {/* Header row */}
                      <div className="flex justify-between items-center z-10">
                        <div className="flex items-center gap-3.5">
                          {/* Refined Post Avatar (No gradient ring) */}
                          <div 
                            className="w-[46px] h-[46px] rounded-full p-[1.5px] bg-[#2B2315]/10 cursor-pointer shrink-0 flex items-center justify-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProfileId(authorId);
                              setActiveTab('profile');
                            }}
                          >
                            <div className="w-full h-full rounded-full border border-gray-200 overflow-hidden bg-white">
                              <img 
                                src={post.author_avatar || post.avatar_url || (post.author_id === adminId ? adminData?.avatar_url : null) || getRefinedAvatar(post.author_name, post.source)} 
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <h3 
                              className="font-bold text-[15px] text-[#111] leading-tight flex items-center gap-1.5 cursor-pointer hover:underline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedProfileId(authorId);
                                setActiveTab('profile');
                              }}
                            >
                              {post.author_name || 'User'}
                              {((post.author_id === adminId && adminData?.is_verified) || post.author_is_verified || (JSON.parse(localStorage.getItem('DEV_ASSIGNED_BADGES') || '{}')[post.author_id])) && (
                                <VerifiedBadge 
                                  type={(() => {
                                    try {
                                      const assigned = JSON.parse(localStorage.getItem('DEV_ASSIGNED_BADGES') || '{}');
                                      return assigned[post.author_id] || post.badge_type || 'blue';
                                    } catch (e) { return post.badge_type || 'blue'; }
                                  })()} 
                                  size={15} 
                                />
                              )}
                            </h3>
                            <span className="text-gray-500 font-medium text-[13px] mt-0.5">
                              @{(post.author_id === adminId ? (adminData?.username || adminData?.handle) : (post.author_handle || post.author_username)) || (typeof post.author_name === 'string' ? post.author_name.trim().toLowerCase().replace(/\s+/g, '') : 'user')} • {new Date(post.published_at || post.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Post Caption (Now rendered above media) */}
                      <div className="mt-2 px-1 relative z-10">
                        <PostCaption content={post.content || post.excerpt} />
                        
                        {/* Tags */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                            {post.tags.map((tag) => (
                              <span key={tag} className="text-blue-500 font-medium cursor-pointer hover:underline text-[13px]">
                                #{tag.replace(/^#/, '')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>


                      {/* Post Image Container: Rounded corners and managed white space */}
                      {(post.cover_image_url || post.image_url) && (
                        <div className="mt-2 bg-gray-50/50 border border-gray-100 z-10 relative overflow-hidden flex justify-center items-center rounded-2xl">
                          <AutoCroppedImage 
                            src={resolveMediaUrl(post.cover_image_url || post.image_url)} 
                            alt={post.title || 'Feed Image'} 
                            className="w-full h-auto max-h-[460px] object-contain block"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Unified Post Action Bar (Below image) */}
                      <div className="mt-4 grid grid-cols-3 items-center z-10 px-0.5 w-full">
                        {/* Left Actions */}
                        <div className="flex gap-4 items-center justify-start">
                          {(() => {
                            const postId = post.id || post._id;
                            const postLikeState = postLikes[postId] || { liked: false, count: post.likes || 0 };
                            return (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPostLikes(prev => {
                                    const current = prev[postId] || { liked: false, count: post.likes || 0 };
                                    const nextLiked = !current.liked;
                                    return {
                                      ...prev,
                                      [postId]: {
                                        liked: nextLiked,
                                        count: nextLiked ? current.count + 1 : Math.max(0, current.count - 1)
                                      }
                                    };
                                  });
                                }}
                                className={`transition-colors cursor-pointer ${postLikeState.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                              >
                                <Heart size={21} strokeWidth={2} fill={postLikeState.liked ? "currentColor" : "none"} />
                              </button>
                            );
                          })()}
                          <button onClick={(e) => e.stopPropagation()} className="text-gray-500 hover:text-blue-500 transition-colors cursor-pointer">
                            <MessageSquare size={21} strokeWidth={2} />
                          </button>
                          <button onClick={(e) => e.stopPropagation()} className="text-gray-500 hover:text-[#9B51E0] transition-colors cursor-pointer -rotate-12 mt-[-2px]">
                            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="22" y1="2" x2="11" y2="13"></line>
                              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                          </button>
                        </div>
                        
                        {/* CENTER ACTION: PROFESSIONAL INBUILT PILL */}
                        <div className="flex justify-center items-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveThreadPost(post);
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 hover:text-black transition-all group"
                          >
                            <GitBranch size={16} strokeWidth={2} className="text-gray-500 group-hover:text-black transition-colors" />
                            <span className="text-[12.5px] font-bold tracking-tight">
                              {(post.threadsCount || ((post.likes || 0) % 15) + 3)} Threads
                            </span>
                          </button>
                        </div>
                        
                        {/* Right Actions */}
                        <div className="flex gap-4 items-center justify-end relative z-10">
                          {/* Save Button */}
                          {(() => {
                            const postId = post.id || post._id;
                            const isSaved = !!savedPosts[postId];
                            return (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSavedPosts(prev => ({
                                    ...prev,
                                    [postId]: !prev[postId]
                                  }));
                                }}
                                className={`transition-colors cursor-pointer ${isSaved ? 'text-yellow-600' : 'text-gray-500 hover:opacity-75'}`}
                              >
                                <svg viewBox="0 0 24 24" width="20" height="20" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                </svg>
                              </button>
                            );
                          })()}

                          {/* Post Settings Menu */}
                          {adminId && (adminData?.role === 'admin' || adminData?.role === 'superadmin' || String(post.author_id) === String(adminId)) && (
                            <>
                              <button 
                                className="text-gray-500 hover:text-[#2B2315] p-1 rounded-full hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuFor(openMenuFor === (post.id || post._id) ? null : (post.id || post._id));
                                }}
                              >
                                <MoreVertical size={18} />
                              </button>

                              {openMenuFor === (post.id || post._id) && (
                                <div className="absolute right-0 bottom-8 bg-white border border-gray-100 rounded-xl p-1.5 shadow-xl z-20 min-w-[130px] animate-in fade-in slide-in-from-bottom-1 duration-150">
                                  <button 
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1.5 cursor-pointer"
                                    onClick={() => {
                                      setOpenMenuFor(null);
                                      handleDeletePost(post.id || post._id);
                                    }}
                                  >
                                    <Trash2 size={14} /> Delete
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Likes Count (Below Action Bar) */}
                      <div className="mt-3 px-1 z-10 relative">
                        {(() => {
                          const postId = post.id || post._id;
                          const postLikeState = postLikes[postId] || { liked: false, count: post.likes || 0 };
                          return (
                            <div className="text-[13px] font-extrabold text-[#2B2315] mb-1">
                              {postLikeState.count} {postLikeState.count === 1 ? 'like' : 'likes'}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="bg-white rounded-[24px] p-8 text-center text-gray-400 font-semibold border border-dashed border-gray-200">
                  <AlertCircle className="mx-auto mb-2 text-gray-300" size={32} />
                  No chronicled feed posts found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stories Tab (Clips) */}
        {activeTab === 'stories' && (
          <ReelsViewer 
            reels={
              viewingMedia === 'search' ? searchResults.reels :
              viewingMedia === 'recommendation' ? recommendations.reels :
              viewingMedia === 'status' ? statuses :
              allReelsFull
            } 
            initialIndex={activeStoryIndex} 
            onClose={() => setActiveTab('home')}
            onDelete={handleDeleteReel}
            adminData={adminData}
            onNavigateToProfile={(userId) => {
              setSelectedProfileId(userId);
              setActiveTab('profile');
            }}
          />
        )}

        {/* Search/Discover Tab */}
        {activeTab === 'search' && (
          <div className="p-4 pb-24 flex flex-col gap-4 animate-in fade-in duration-200">
            <form onSubmit={handleSearch} className="flex gap-2 shrink-0">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search dancers, routines, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-[14px] pl-10 pr-4 py-3 text-xs font-semibold focus:outline-none focus:border-[#3A125E] text-[#3A125E] shadow-sm"
                />
              </div>
              <button 
                type="submit"
                disabled={isSearching}
                className="bg-[#3A125E] text-white font-bold text-xs px-4 rounded-[14px] hover:bg-[#2b0d47] transition-colors cursor-pointer shrink-0"
              >
                {isSearching ? '...' : 'Search'}
              </button>
            </form>

            <div className="flex-1 overflow-y-auto">
              {!searchQuery ? (
                <div className="flex flex-col gap-5">
                  {/* Recommended Reels */}
                  {recommendations.reels && recommendations.reels.length > 0 && (
                    <div>
                      <h3 className="font-extrabold text-[13px] text-[#3A125E] mb-3 uppercase tracking-wide">Recommended Clips</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {recommendations.reels.slice(0, 4).map((r, i) => (
                          <div 
                            key={`rec-${i}`} 
                            className="bg-slate-900 aspect-[9/16] rounded-xl overflow-hidden relative cursor-pointer group shadow-sm"
                            onClick={() => {
                              setViewingMedia('recommendation');
                              setActiveStoryIndex(i);
                              setActiveTab('stories');
                            }}
                          >
                            {r.cover_image_url ? (
                              <SkeletonImage 
                                src={resolveMediaUrl(r.cover_image_url)} 
                                alt="Reel Cover" 
                                className="w-full h-full object-cover opacity-85 group-hover:scale-102 transition-transform duration-300"
                                wrapperStyle={{ width: '100%', height: '100%', display: 'block' }}
                              />
                            ) : r.video_url ? (
                              <video 
                                src={resolveMediaUrl(r.video_url)} 
                                className="w-full h-full object-cover opacity-85 group-hover:scale-102 transition-transform duration-300" 
                                preload="metadata"
                                playsInline
                                muted
                              />
                            ) : (
                              <div className="w-full h-full bg-[#3A125E]/20 flex items-center justify-center">
                                <Music size={14} className="text-white/20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-2.5">
                              <span className="text-white text-[11px] font-bold truncate">{r.title || 'Routine'}</span>
                              <span className="text-[#FFD700] text-[9px] font-semibold mt-0.5">@{r.creator_name || 'Dancer'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Tags */}
                  {recommendations.tags && recommendations.tags.length > 0 && (
                    <div>
                      <h3 className="font-extrabold text-[13px] text-[#3A125E] mb-3 uppercase tracking-wide">Trending Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {recommendations.tags.map(tag => (
                          <button 
                            key={tag}
                            onClick={() => {
                              setSearchQuery(tag);
                              fetch(`${API_URL}/api/search?q=${encodeURIComponent(tag)}`)
                                .then(res => res.json())
                                .then(data => {
                                  if (data.success) {
                                    setSearchResults({
                                      users: data.data.users || [],
                                      posts: data.data.posts || [],
                                      reels: (data.data.reels || []).map(normalizeReelData)
                                    });
                                  }
                                });
                            }}
                            className="bg-[#3A125E]/5 border border-[#3A125E]/10 rounded-full px-3.5 py-1.5 text-[11px] font-bold text-[#3A125E] hover:bg-[#FFD700]/25 transition-colors cursor-pointer"
                          >
                            #{tag.startsWith('#') ? tag.substring(1) : tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Results lists */}
                  {searchResults.reels.length > 0 && (
                    <div>
                      <h3 className="font-extrabold text-[13px] text-[#3A125E] mb-3 uppercase tracking-wide">Matched Clips ({searchResults.reels.length})</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {searchResults.reels.map((r, i) => (
                          <div 
                            key={`search-reel-${i}`} 
                            className="bg-slate-900 aspect-[9/16] rounded-xl overflow-hidden relative cursor-pointer group shadow-sm"
                            onClick={() => {
                              setViewingMedia('search');
                              setActiveStoryIndex(i);
                              setActiveTab('stories');
                            }}
                          >
                            {r.cover_image_url ? (
                              <SkeletonImage 
                                src={resolveMediaUrl(r.cover_image_url)} 
                                alt="Reel Cover" 
                                className="w-full h-full object-cover opacity-85 group-hover:scale-102 transition-transform duration-300"
                                wrapperStyle={{ width: '100%', height: '100%', display: 'block' }}
                              />
                            ) : r.video_url ? (
                              <video 
                                src={resolveMediaUrl(r.video_url)} 
                                className="w-full h-full object-cover opacity-85 group-hover:scale-102 transition-transform duration-300" 
                                preload="metadata"
                                playsInline
                                muted
                              />
                            ) : (
                              <div className="w-full h-full bg-[#3A125E]/20 flex items-center justify-center">
                                <Music size={14} className="text-white/20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-2.5">
                              <span className="text-white text-[11px] font-bold truncate">{r.title}</span>
                              <span className="text-[#FFD700] text-[9px] font-semibold mt-0.5">@{r.creator_name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.users.length > 0 && (
                    <div>
                      <h3 className="font-extrabold text-[13px] text-[#3A125E] mb-3 uppercase tracking-wide">Dancers ({searchResults.users.length})</h3>
                      <div className="flex flex-col gap-2">
                        {searchResults.users.map((u, i) => (
                          <div 
                            key={`user-${i}`}
                            className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3 cursor-pointer shadow-xs"
                            onClick={() => {
                              setSelectedProfileId(u.id || u._id);
                              setActiveTab('profile');
                            }}
                          >
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 shadow-xs border border-gray-50">
                              <img src={getRefinedAvatar(u.name || u.username || 'User', u.avatar_url)} alt="Avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[#3A125E] font-bold text-xs flex items-center gap-1 uppercase">
                                {u.name} 
                                {(u.is_verified || (JSON.parse(localStorage.getItem('DEV_ASSIGNED_BADGES') || '{}')[u.id])) && (
                                  <VerifiedBadge 
                                    type={JSON.parse(localStorage.getItem('DEV_ASSIGNED_BADGES') || '{}')[u.id] || u.badge_type || 'blue'}
                                    size={14} 
                                  />
                                )}
                              </span>
                              <span className="text-gray-400 font-semibold text-[10px] mt-0.5">@{u.handle || 'dancer'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create/Add Tab (New Snapchat/Insta style camera) */}
        {activeTab === 'add' && (
          <div className="fixed inset-0 z-[100] h-[100dvh] w-[100dvw] bg-black animate-in zoom-in-95 duration-200">
            <CameraUpload token={token} onComplete={handleUploadPanelComplete} onClose={() => setActiveTab('home')} />
          </div>
        )}

        {/* Developer Control Panel */}
        {activeTab === 'developer' && (
          <div className="p-4 pb-24 h-full animate-in fade-in duration-200">
            <DeveloperControlPanel token={token} onComplete={handleUploadPanelComplete} />
          </div>
        )}

        {/* PYQ assistant */}
        {activeTab === 'pyq' && (
          <div className="p-4 pb-24 h-full animate-in fade-in duration-200">
            <PYQAssistant isPage={true} adminData={adminData} />
          </div>
        )}

        {/* Messages */}
        {activeTab === 'messages' && (
          <div className="p-5 pb-24 h-full text-center flex flex-col justify-center items-center text-gray-500 font-medium">
             <MessageSquare size={36} className="text-gray-300 mb-2" />
             <h3 className="font-bold text-[#3A125E] text-sm">Inbox Scrolls</h3>
             <p className="text-xs text-gray-400 mt-1 max-w-[200px] leading-relaxed">No new scrolls from archives. Post dance routines to gain fans.</p>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          !token || !adminId ? (
            <div className="p-4 pb-24 animate-in fade-in duration-200">
              <LoginScreen 
                onLoginSuccess={(newToken, newProfile) => {
                  localStorage.setItem('adminToken', newToken);
                  localStorage.setItem('adminId', newProfile.id || newProfile._id);
                  setToken(newToken);
                  setAdminId(newProfile.id || newProfile._id);
                  setAdminData(newProfile);
                  localStorage.setItem('just_logged_in_admin', 'true');
                  window.location.reload();
                }}
              />
            </div>
          ) : (
            <div className="p-4 pb-24 flex flex-col gap-5 animate-in fade-in duration-200">
            
            {/* Unified Creator Identity Card */}
            <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgba(58,18,94,0.02)] border border-[#3A125E]/15 overflow-hidden text-[#2B2315] relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
              
              <div className="flex gap-4 relative z-10 items-start">
                <div className="flex flex-col items-center gap-2.5 shrink-0 pt-1 w-[94px]">
                  {/* Glowing Avatar */}
                  <div className="w-[84px] h-[84px] rounded-[24px] p-[2.5px] bg-gradient-to-tr from-[#9B51E0] via-[#D4AF37] to-[#00FFFF] shadow-[0_8px_20px_rgba(58,18,94,0.12)] shrink-0 flex items-center justify-center relative overflow-hidden group">
                    <div className="w-full h-full rounded-[21px] overflow-hidden bg-white">
                      <img 
                        src={getRefinedAvatar(adminData?.name || adminData?.username || 'Admin', adminData?.avatar_url)} 
                        alt="Profile Avatar" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  </div>
                  
                  {/* Username Badge under Avatar */}
                  <div className="bg-[#3A125E]/5 px-2 py-1.5 rounded-[12px] border border-[#3A125E]/10 flex items-center justify-center shadow-sm w-full">
                    <span className="text-[#3A125E]/80 font-black text-[11px] lowercase break-all text-center leading-tight">
                      @{adminData?.username || adminData?.email?.split('@')[0] || 'username'}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col justify-start flex-1 min-w-0 pt-1">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-[17px] font-black text-black leading-tight">
                      {adminData?.name || 'Creator'}
                    </h2>
                    {(adminData?.is_verified || (JSON.parse(localStorage.getItem('DEV_ASSIGNED_BADGES') || '{}')[adminData?.id])) && (
                      <VerifiedBadge 
                        type={JSON.parse(localStorage.getItem('DEV_ASSIGNED_BADGES') || '{}')[adminData?.id] || adminData?.badge_type || 'blue'}
                        size={16} 
                        className="shrink-0" 
                      />
                    )}
                  </div>
                  
                  <p className="text-[#3A125E]/60 font-extrabold text-[10px] uppercase tracking-wider mt-1">
                    {adminData?.role ? adminData.role : ''}
                  </p>
                  
                  {/* Expandable Bio block */}
                  {adminData?.bio && (
                    <div className="mt-2.5 relative">
                      <p 
                        onClick={() => setIsBioExpanded(!isBioExpanded)}
                        className={`text-[#2B2315]/85 text-[11.5px] font-medium leading-relaxed italic cursor-pointer transition-all duration-300 ${isBioExpanded ? '' : 'line-clamp-2'}`}
                      >
                        "{adminData.bio}"
                      </p>
                      {!isBioExpanded && adminData.bio.length > 80 && (
                        <button 
                          onClick={() => setIsBioExpanded(true)}
                          className="text-[#9B51E0] text-[9.5px] font-bold hover:underline mt-0.5"
                        >
                          Show more
                        </button>
                      )}
                    </div>
                  )}

                  {/* Tags block */}
                  {adminData?.tags && adminData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {adminData.tags.map((tag, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 bg-[#3A125E]/5 text-[#3A125E] text-[8.5px] font-bold rounded uppercase tracking-wider border border-[#3A125E]/10">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Stats Row inline */}
                  <div className="flex gap-4 mt-3 pt-3 border-t border-[#3A125E]/10">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-black text-[#3A125E]">
                        {(allReelsFull.filter(r => String(r.creator_id) === String(adminId) || r.creator_name === adminData?.name)).length}
                      </span>
                      <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider">Clips</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-black text-[#3A125E]">{adminData?.followers || 0}</span>
                      <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider">Followers</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-black text-[#3A125E]">{adminData?.following || 0}</span>
                      <span className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider">Following</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status tag */}
              <div className="mt-4 pt-3 border-t border-[#3A125E]/10 flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[8.5px] font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Active Creator
                </div>
                <span className="text-[9px] font-bold text-gray-400 uppercase">📅 Joined 4/18/2026</span>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <button 
                onClick={() => setActiveTab('add')}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#3A125E] text-white text-[10px] font-black uppercase tracking-wider shadow-[0_4px_12px_rgba(58,18,94,0.15)] cursor-pointer hover:bg-[#3A125E]/90 transition-all"
              >
                <Play size={12} fill="white" />
                New Routine
              </button>
              <button 
                onClick={openEditProfileModal}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-white border border-[#3A125E]/15 text-[#3A125E] text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-all"
              >
                <UserCog size={12} />
                Edit Profile
              </button>
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-white border border-[#3A125E]/15 text-[#3A125E] text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-all"
              >
                <Settings size={12} />
                Settings
              </button>
            </div>

            {/* Content Tabs Navigation */}
            <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(58,18,94,0.02)] border border-[#3A125E]/15 flex flex-col overflow-hidden">
              <div className="flex border-b border-gray-100 shrink-0 bg-gray-50/50">
                <button 
                  onClick={() => setProfileActiveTab('grid')}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${profileActiveTab === 'grid' ? 'text-[#3A125E] border-b-3 border-[#3A125E]' : 'text-gray-400'}`}
                >
                  My Clips Grid
                </button>
                <button 
                  onClick={() => setProfileActiveTab('list')}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${profileActiveTab === 'list' ? 'text-[#3A125E] border-b-3 border-[#3A125E]' : 'text-gray-400'}`}
                >
                  Connections List
                </button>
                <button 
                  onClick={() => setProfileActiveTab('similar')}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${profileActiveTab === 'similar' ? 'text-[#3A125E] border-b-3 border-[#3A125E]' : 'text-gray-400'}`}
                >
                  Tag Connections
                </button>
              </div>

              <div className="p-3">
                {profileActiveTab === 'grid' ? (
                  /* Professional Full Width Clips Grid */
                  <div className="grid grid-cols-3 gap-2">
                    {(() => {
                      const myReels = allReelsFull.filter(r => String(r.creator_id) === String(adminId) || r.creator_name === adminData?.name);
                      return myReels.length > 0 ? (
                        myReels.map((item, idx) => (
                          <div 
                            key={item.id || idx} 
                            className="aspect-[3/4] bg-slate-900 rounded-lg overflow-hidden relative cursor-pointer group shadow-sm"
                            onClick={() => {
                              setViewingMedia('reel');
                              setActiveStoryIndex(idx);
                              setActiveTab('stories');
                            }}
                          >
                            {item.cover_image_url ? (
                              <img src={resolveMediaUrl(item.cover_image_url)} alt="Thumbnail" className="w-full h-full object-cover" />
                            ) : item.video_url ? (
                              <video 
                                src={resolveMediaUrl(item.video_url)} 
                                className="w-full h-full object-cover" 
                                preload="metadata"
                                playsInline
                                muted
                              />
                            ) : (
                              <div className="w-full h-full bg-[#3A125E]/20 flex items-center justify-center">
                                <Music size={14} className="text-white/20" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/10 z-5"></div>
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                              <div className="w-6.5 h-6.5 rounded-full bg-black/30 border border-white/40 backdrop-blur-xs flex items-center justify-center text-white/95 group-hover:scale-105 transition-transform duration-200">
                                <Play size={10} fill="white" className="ml-0.5" />
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col z-10 leading-tight">
                              <span className="text-white/70 text-[6.5px] uppercase font-semibold">Views</span>
                              <span className="text-white text-[9px] font-black">{item.views ? (item.views > 999 ? (item.views/1000).toFixed(1) + 'k' : item.views) : '0'}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-8 text-gray-400 font-bold uppercase text-[10px]">No clips uploaded yet</div>
                      );
                    })()}
                  </div>
                ) : profileActiveTab === 'list' ? (
                  /* Connections List View (Followers & Following split inside) */
                  <div className="flex gap-4">
                    {/* Followers Column */}
                    <div className="flex-1 flex flex-col gap-2">
                      <h4 className="text-[#3A125E] font-black text-[9.5px] uppercase tracking-wider pb-1 border-b border-gray-100">Followers</h4>
                      {adminData?.followers_list && adminData.followers_list.length > 0 ? (
                        adminData.followers_list.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 py-1.5">
                            <div className="w-[30px] h-[30px] rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                              <img src={getRefinedAvatar(f.name || f.handle || 'User', f.avatar_url)} alt="avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1 leading-none">
                              <span className="text-[#3A125E] font-black text-[10px] truncate">@{f.username || f.handle || 'user'}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[9px] text-gray-400 font-bold uppercase py-4 text-center">No followers</div>
                      )}
                    </div>

                    {/* Following Column */}
                    <div className="flex-1 flex flex-col gap-2 border-l border-gray-100 pl-4">
                      <h4 className="text-[#3A125E] font-black text-[9.5px] uppercase tracking-wider pb-1 border-b border-gray-100">Following</h4>
                      {adminData?.following_list && adminData.following_list.length > 0 ? (
                        adminData.following_list.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 py-1.5">
                            <div className="w-[30px] h-[30px] rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                              <img src={getRefinedAvatar(f.name || f.handle || 'User', f.avatar_url)} alt="avatar" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1 leading-none">
                              <span className="text-[#3A125E] font-black text-[10px] truncate">@{f.username || f.handle || 'user'}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-[9px] text-gray-400 font-bold uppercase py-4 text-center">Not following</div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Similar Creators Tab */
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[#3A125E] font-black text-[9.5px] uppercase tracking-wider pb-1 border-b border-gray-100">Suggested by Tags</h4>
                    {(() => {
                      if (!adminData?.tags || adminData.tags.length === 0) {
                        return <div className="text-[9px] text-gray-400 font-bold uppercase py-4 text-center">Add tags to your profile to see similar creators.</div>;
                      }
                      const similar = allUsers.filter(u => u.id !== adminId && u._id !== adminId && u.tags && u.tags.some(t => adminData.tags.includes(t)));
                      if (similar.length === 0) {
                         return <div className="text-[9px] text-gray-400 font-bold uppercase py-4 text-center">No similar creators found yet.</div>;
                      }
                      return similar.map((u, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                          <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                            <img src={getRefinedAvatar(u.name || u.username || 'User', u.avatar_url)} alt="avatar" className="w-full h-full object-cover" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1 leading-none">
                            <span className="text-[#3A125E] font-black text-[12px] truncate">{u.name || u.username || 'Creator'}</span>
                            <span className="text-gray-400 font-bold text-[9px] truncate mt-1">
                              Matches: {u.tags.filter(t => adminData.tags.includes(t)).join(', ')}
                            </span>
                          </div>
                          <button className="px-3 py-1.5 bg-[#3A125E]/5 text-[#3A125E] rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-[#3A125E]/10 transition-colors cursor-pointer">
                            Follow
                          </button>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
          )
        )}
      </main>

      {/* 3. Bottom Navigation Bar */}
      {activeTab !== 'stories' && activeTab !== 'add' && (
        <nav className="absolute bottom-0 left-0 right-0 bg-[#F4ECD8] border-t border-gray-200/50 z-50 shrink-0 flex flex-col pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around items-center h-[48px] px-1">
            
            {/* Tab 1: Home */}
            <button 
              onClick={() => {
                setSelectedProfileId(null);
                setActiveTab('home');
              }}
              className="flex flex-col items-center justify-center flex-1 h-full relative cursor-pointer gap-[2px]"
            >
              <Home 
                size={20} 
                className={`transition-colors duration-200 ${activeTab === 'home' ? 'text-[#3A125E]' : 'text-[#3A125E]/60'}`} 
                strokeWidth={activeTab === 'home' ? 2.5 : 2} 
              />
              <span className={`text-[9px] font-bold ${activeTab === 'home' ? 'text-[#3A125E]' : 'text-[#3A125E]/60'}`}>Home</span>
            </button>

            {/* Tab 2: Search (Discover) */}
            <button 
              onClick={() => setActiveTab('search')}
              className="flex flex-col items-center justify-center flex-1 h-full relative cursor-pointer gap-[2px]"
            >
              <Search 
                size={20} 
                className={`transition-colors duration-200 ${activeTab === 'search' ? 'text-[#3A125E]' : 'text-[#3A125E]/60'}`} 
                strokeWidth={activeTab === 'search' ? 2.5 : 2} 
              />
              <span className={`text-[9px] font-bold ${activeTab === 'search' ? 'text-[#3A125E]' : 'text-[#3A125E]/60'}`}>Discover</span>
            </button>

            {/* Tab 3: Add (TikTok Style) */}
            <button 
              onClick={() => setActiveTab('add')}
              className="flex flex-col items-center justify-center flex-1 h-full relative cursor-pointer"
            >
              <div className="magic-add-wrapper">
                <div className="magic-add-btn">
                  <PlusSquare size={18} strokeWidth={3} className="text-white z-20" />
                </div>
              </div>
            </button>

            {/* Tab 4: Stories (Inbox) */}
            <button 
              onClick={() => {
                setViewingMedia('reel');
                setActiveStoryIndex(0);
                setActiveTab('stories');
              }}
              className="flex flex-col items-center justify-center flex-1 h-full relative cursor-pointer gap-[2px]"
            >
              <Film 
                size={20} 
                className={`transition-colors duration-200 ${activeTab === 'stories' ? 'text-[#3A125E]' : 'text-[#3A125E]/60'}`} 
                strokeWidth={activeTab === 'stories' ? 2.5 : 2} 
              />
              <span className={`text-[9px] font-bold ${activeTab === 'stories' ? 'text-[#3A125E]' : 'text-[#3A125E]/60'}`}>Clips</span>
            </button>

            {/* Tab 5: Profile */}
            <button 
              onClick={() => {
                setSelectedProfileId(null);
                setActiveTab('profile');
              }}
              className="flex flex-col items-center justify-center flex-1 h-full relative cursor-pointer gap-[2px]"
            >
              <User 
                size={20} 
                className={`transition-colors duration-200 ${activeTab === 'profile' ? 'text-[#3A125E]' : 'text-[#3A125E]/60'}`} 
                strokeWidth={activeTab === 'profile' ? 2.5 : 2} 
              />
              <span className={`text-[9px] font-bold ${activeTab === 'profile' ? 'text-[#3A125E]' : 'text-[#3A125E]/60'}`}>Profile</span>
            </button>

          </div>
        </nav>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowEditProfileModal(false)}>
          <div 
            className="bg-[#1a1a2e] rounded-3xl w-[92%] max-w-md max-h-[85vh] overflow-y-auto shadow-2xl border border-white/10 p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-white text-xl font-bold">Edit Profile</h2>
              <button onClick={() => setShowEditProfileModal(false)} className="text-gray-400 hover:text-white text-sm font-semibold transition">Cancel</button>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-2 mb-5">
              <div 
                className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500/30 cursor-pointer hover:opacity-80 transition"
                onClick={() => editAvatarInputRef.current?.click()}
              >
                <img 
                  src={getRefinedAvatar(editName || editUsername || 'User', editAvatar)}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <button 
                className="text-blue-400 text-sm font-semibold hover:text-blue-300 transition"
                onClick={() => editAvatarInputRef.current?.click()}
              >
                Change Photo
              </button>
              <input 
                type="file" 
                ref={editAvatarInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleEditAvatarUpload}
              />
            </div>

            {/* Name */}
            <div className="mb-3">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 block">Name</label>
              <input 
                type="text" 
                placeholder="Your name" 
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white w-full focus:outline-none focus:border-purple-500/50 transition" 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
              />
            </div>

            {/* Username / Handle */}
            <div className="mb-3">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 block">Username / Handle</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">@</span>
                <input 
                  type="text"
                  placeholder="your_username"
                  className={`bg-white/5 border rounded-xl p-3 pl-7 text-sm text-white w-full focus:outline-none transition ${
                    usernameStatus.available === true ? 'border-green-500/60 focus:border-green-400' :
                    usernameStatus.available === false ? 'border-red-500/60 focus:border-red-400' :
                    'border-white/10 focus:border-purple-500/50'
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
                <p className={`text-xs mt-1 ${
                  usernameStatus.available === true ? 'text-green-400' :
                  usernameStatus.available === false ? 'text-red-400' :
                  'text-gray-500'
                }`}>{usernameStatus.reason}</p>
              )}
              <p className="text-[10px] text-gray-600 mt-0.5">3-20 chars, lowercase letters, numbers & underscores</p>
            </div>

            {/* Bio */}
            <div className="mb-5">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 block">Bio</label>
              <textarea 
                placeholder="Tell the world about you..." 
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white w-full focus:outline-none focus:border-purple-500/50 transition min-h-[80px] resize-none" 
                value={editBio} 
                onChange={e => setEditBio(e.target.value)} 
              />
            </div>

            {/* Tags */}
            <div className="mb-5">
              <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1 block">Tags (comma separated)</label>
              <input 
                type="text"
                placeholder="e.g. Dancer, HipHop, Choreographer" 
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white w-full focus:outline-none focus:border-purple-500/50 transition" 
                value={editTags} 
                onChange={e => setEditTags(e.target.value)} 
              />
            </div>

            {/* Save Button */}
            <button 
              onClick={handleSaveEditProfile} 
              disabled={isSavingProfile || (editUsername.length >= 3 && usernameStatus.available === false)}
              className={`w-full py-3 rounded-xl font-bold text-white transition text-sm ${
                isSavingProfile || (editUsername.length >= 3 && usernameStatus.available === false)
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 shadow-lg'
              }`}
            >
              {isSavingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* User Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-[#FAF7EE] w-full max-w-sm rounded-[24px] border border-gray-200 p-6 flex flex-col gap-4 shadow-2xl relative text-[#2B2315]">
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-black font-bold text-lg"
            >
              ✕
            </button>
            
            <h2 className="text-lg font-serif font-black italic tracking-wide mb-2 flex items-center gap-2">
              <Settings size={20} className="text-[#3A125E]" /> App Settings
            </h2>
            
            <div className="flex flex-col gap-2.5">
              {/* Theme Selector */}
              <div className="flex justify-between items-center bg-white/50 p-3 rounded-xl border border-black/5">
                <span className="text-xs font-bold uppercase tracking-wider">Ambient Smoke Theme</span>
                <button
                  onClick={() => {
                    const newVal = !enableSmokeTheme;
                    setEnableSmokeTheme(newVal);
                    localStorage.setItem('ENABLE_SMOKE_THEME', String(newVal));
                    window.dispatchEvent(new Event('smokeThemeUpdated'));
                  }}
                  className={`w-12 h-6 rounded-full relative transition-colors shadow-inner ${enableSmokeTheme ? 'bg-[#3A125E]' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 shadow-sm transition-transform ${enableSmokeTheme ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Cache clear option */}
              <button 
                onClick={() => {
                  if (window.confirm("Clear local cache & reset settings?")) {
                    localStorage.removeItem('seen.ly_view_mode');
                    localStorage.removeItem('ENABLE_SMOKE_THEME');
                    localStorage.removeItem('DEV_TEST_BADGE');
                    alert("Cache cleared successfully! Reloading...");
                    window.location.reload();
                  }
                }}
                className="w-full text-left bg-white/50 hover:bg-black/5 p-3 rounded-xl border border-black/5 text-xs font-extrabold uppercase tracking-wide flex items-center justify-between"
              >
                <span>Clear Cache & Data</span>
                <span>🧹</span>
              </button>

              {/* View Mode Toggle */}
              {setViewMode && !isMobileDevice && (
                <button 
                  onClick={() => {
                    setViewMode(viewMode === 'desktop' ? 'phone' : 'desktop');
                    setShowSettingsModal(false);
                  }}
                  className="w-full text-left bg-white/50 hover:bg-black/5 p-3 rounded-xl border border-black/5 text-xs font-extrabold uppercase tracking-wide flex items-center justify-between"
                >
                  <span>Toggle PC / Mobile Frame</span>
                  <span>{viewMode === 'desktop' ? '📱 Mobile' : '💻 PC'}</span>
                </button>
              )}

              {/* Admin developer dashboard route - ONLY if admin token is present */}
              {token && adminId && (
                <button 
                  onClick={() => {
                    setActiveTab('developer');
                    setShowSettingsModal(false);
                  }}
                  className="w-full text-left bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/25 hover:to-indigo-500/25 p-3 rounded-xl border border-purple-500/20 text-xs font-extrabold uppercase tracking-wide text-purple-950 flex items-center justify-between"
                >
                  <span>🔓 Developer Control Console</span>
                  <span>⚙️</span>
                </button>
              )}

              {/* Logout button */}
              {token && (
                <button 
                  onClick={() => {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('adminId');
                    localStorage.removeItem('userName');
                    localStorage.removeItem('userHandle');
                    localStorage.removeItem('userAvatar');
                    window.location.reload();
                  }}
                  className="w-full text-center bg-red-500/10 hover:bg-red-500/25 text-red-700 p-3 rounded-xl border border-red-500/20 text-xs font-extrabold uppercase tracking-wide transition mt-2"
                >
                  Log Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Render Threads View if active */}
      {activeThreadPost && (
        <ThreadsView
          post={activeThreadPost}
          onClose={() => setActiveThreadPost(null)}
          adminData={adminData}
          onLikeToggle={(postId) => {
            setPostLikes(prev => {
              const current = prev[postId] || { liked: false, count: activeThreadPost.likes || 0 };
              const nextLiked = !current.liked;
              return {
                ...prev,
                [postId]: {
                  liked: nextLiked,
                  count: nextLiked ? current.count + 1 : Math.max(0, current.count - 1)
                }
              };
            });
          }}
          isLiked={postLikes[activeThreadPost.id || activeThreadPost._id]?.liked || false}
          initialLikesCount={postLikes[activeThreadPost.id || activeThreadPost._id]?.count || activeThreadPost.likes || 0}
        />
      )}
    </div>
  );
}
