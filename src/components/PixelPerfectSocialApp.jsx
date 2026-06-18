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
  AlertCircle
} from 'lucide-react';

import ReelsViewer from './ReelsViewer';
import LoginScreen from './LoginScreen';
import CreateInstagramMenu from './CreateInstagramMenu';
import PYQAssistant from './PYQAssistant';
import StorageManager from './StorageManager';
import SkeletonImage from './SkeletonImage';
import { uploadMediaToAppwrite } from '../utils/appwriteClient';
import { buildCreatorIdentity, getPreferredCreatorMode } from '../utils/creatorIdentity';
import versionData from '../version.json';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

// Custom SVG verified badge for exact matching
const GoldVerifiedBadge = ({ size = 20, className = "" }) => (
  <div className={`relative inline-flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
    <svg viewBox="0 0 24 24" width={size} height={size} fill="#FFD700" stroke="#3A125E" strokeWidth="1.5">
      <path d="M12 2l2.4 2.8 3.7-.5.9 3.6 3.4 1.5-1.5 3.4.9 3.6-3.7-.5-2.4 2.8L12 18l-3.7.8-2.4-2.8-3.7.5.9-3.6-3.4-1.5 1.5-3.4-.9-3.6 3.7.5 2.4-2.8L12 2z" />
      <path d="M9 12l2 2 4-4" stroke="#3A125E" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

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

  const [activeTab, setActiveTab] = useState('home');
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [viewingMedia, setViewingMedia] = useState('reel');
  const [statuses, setStatuses] = useState([]);
  const [reelsFeed, setReelsFeed] = useState([]);
  const [feed, setFeed] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ users: [], posts: [], reels: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [recommendations, setRecommendations] = useState({ tags: [], reels: [] });
  const [postLikes, setPostLikes] = useState({});
  const [isMobileDevice, setIsMobileDevice] = useState(false);

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

  // Profile Specific State
  const [profileViewMode, setProfileViewMode] = useState('dashboard'); // 'dashboard' or 'content'
  const [profileActiveTab, setProfileActiveTab] = useState('grid'); // 'grid' or 'list'
  const [adminData, setAdminData] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [showStorageManager, setShowStorageManager] = useState(false);
  const [storageUsageSummary, setStorageUsageSummary] = useState(null);
  const [openMenuFor, setOpenMenuFor] = useState(null);

  // Edit Profile Modal states
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [usernameStatus, setUsernameStatus] = useState({ checking: false, available: null, reason: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const usernameCheckTimerRef = useRef(null);
  const editAvatarInputRef = useRef(null);

  const openEditProfileModal = () => {
    setEditName(adminData?.name || '');
    setEditBio(adminData?.bio || '');
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
          username: editUsername,
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
          
          setReelsFeed(prev => prev.map(reel => {
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
          
          setFeed(prev => prev.map(post => {
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

    Promise.all([
      // Fetch Statuses
      fetch(`${API_URL}/api/global-status?_t=${now}`)
        .then(res => res.ok ? res.json() : { data: [] })
        .then(data => {
          if (data && Array.isArray(data.data)) {
            setStatuses(data.data.map(normalizeReelData));
          }
        })
        .catch(err => console.error('Failed to load status', err)),

      // Fetch Reels
      fetch(`${API_URL}/api/reels?limit=100&_t=${now}&viewer_id=${viewerId}`)
        .then(res => res.ok ? res.json() : { data: [] })
        .then(data => {
          if (data && Array.isArray(data.data)) {
            setReelsFeed(data.data.map(normalizeReelData));
          }
        })
        .catch(err => console.error('Failed to load reels', err)),

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
  }, []);

  // Fetch admin profile data if logged in
  useEffect(() => {
    if (token && adminId) {
      fetch(`${API_URL}/api/admins`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          const list = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
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
         headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStatuses(prev => prev.filter(s => (s.id || s._id) !== reelId));
        setReelsFeed(prev => prev.filter(r => (r.id || r._id) !== reelId));
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
        setReelsFeed(prev => [normalizeReelData(savedReel), ...prev]);
        openReelById(reelId);
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
    <div className="relative max-w-[420px] mx-auto h-[100dvh] flex flex-col overflow-hidden bg-[#FAF7EE] font-sans shadow-2xl border-x border-gray-200 overscroll-none overscroll-y-none">
      
      {/* 1. Global Header */}
      {activeTab !== 'stories' && (
        <header className="sticky top-0 z-50 bg-[#FAF7EE] border-b border-gray-200/60 px-4 py-3 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-1.5 cursor-pointer select-none" onClick={() => setActiveTab('home')}>
            <span className="font-serif font-black text-[22px] italic tracking-wide text-[#2B2315] leading-none">
              Dence Wance
            </span>
          </div>

          <div className="flex items-center gap-[12px]">
            <div className="relative cursor-pointer w-9 h-9 rounded-full bg-black/5 border border-black/5 flex items-center justify-center hover:bg-black/10 transition-colors" onClick={() => setActiveTab('messages')}>
              <MessageSquare size={18} className="text-[#2B2315]" />
              <span className="absolute -top-1 -right-1 bg-[#FFD700] text-[#3A125E] text-[9px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">1</span>
            </div>
            <div className="relative cursor-pointer w-9 h-9 rounded-full bg-black/5 border border-black/5 flex items-center justify-center hover:bg-black/10 transition-colors">
              <Bell size={18} className="text-[#2B2315]" />
              <span className="absolute -top-1 -right-1 bg-[#FFD700] text-[#3A125E] text-[9px] font-extrabold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white">3</span>
            </div>

            <button 
              onClick={() => setActiveTab('pyq')}
              className="w-9 h-9 rounded-full bg-[#FAF7EE] text-[#2B2315] font-serif font-black italic text-[11px] flex items-center justify-center border border-[#2B2315]/30 hover:bg-black/5 transition-colors cursor-pointer select-none shrink-0"
            >
              PYQ
            </button>

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
              `}</style>
              <h2 className="text-[#2B2315] font-sans font-bold text-base tracking-tight mb-4 flex items-center gap-1.5">
                Explore the Latest Clips
              </h2>

              <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">

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
                        className="flex flex-col items-center shrink-0 cursor-pointer select-none group"
                      >
                        <div className={`w-[114px] h-[182px] ${theme.wrapperClass}`}>
                          <div className={theme.innerBg}>
                            <div className={theme.innerBorder}>
                              
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
                    <div key={idx} className="flex flex-col items-center shrink-0 animate-pulse">
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
                            onClick={() => {
                              setSelectedProfileId(authorId);
                              setActiveTab('profile');
                            }}
                          >
                            <div className="w-full h-full rounded-full border-[1.5px] border-white overflow-hidden bg-white">
                              <img 
                                src={getRefinedAvatar(post.author_name, post.source)} 
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <h3 
                              className="font-extrabold text-[14px] text-[#2B2315] leading-tight flex items-center gap-1.5 cursor-pointer tracking-wide hover:underline uppercase"
                              onClick={() => {
                                setSelectedProfileId(authorId);
                                setActiveTab('profile');
                              }}
                            >
                              {post.author_name || 'PREETAM SINGH YADAV'}
                              <GoldVerifiedBadge size={16} />
                            </h3>
                            <span className="text-gray-400 font-semibold text-[11px] mt-0.5">
                              {new Date(post.published_at || post.created_at || Date.now()).toLocaleDateString()} • Pre-recorded
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Text details (Likes & Caption) */}
                      <div className="mt-4.5 z-10 flex flex-col gap-2">
                        <span className="text-[12.5px] font-extrabold text-[#2B2315] leading-normal tracking-wide">
                          {post.author_name || 'PREETAM SINGH YADAV'} • {post.title || 'Ramlal Anand College'} 
                          <span className="text-gray-400 font-semibold text-[11px] ml-1.5">
                            (Pre-recorded • {new Date(post.published_at || post.created_at || Date.now()).toLocaleDateString()})
                          </span>
                        </span>
                        
                        {/* Liked count */}
                        {(() => {
                          const postId = post.id || post._id;
                          const postLikeState = postLikes[postId] || { liked: false, count: post.likes || 0 };
                          return (
                            <div className="text-[12px] font-extrabold text-[#2B2315] mt-0.5 leading-none">
                              {postLikeState.count} {postLikeState.count === 1 ? 'like' : 'likes'}
                            </div>
                          );
                        })()}

                        {/* Caption */}
                        <div className="text-[#2B2315] text-[13px] leading-relaxed font-medium mt-1">
                          <span className="font-extrabold mr-1.5">
                            {typeof post.author_name === 'string' ? post.author_name.trim().toLowerCase().replace(/\s+/g, '') : 'preetam_yadav'}
                          </span>
                          <span className="whitespace-pre-wrap">
                            {post.content || post.excerpt}
                          </span>
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {(post.tags && post.tags.length > 0 ? post.tags : ['DenceWance', 'CollegeLife']).map((tag) => (
                            <span 
                              key={tag} 
                              className="text-blue-600 font-semibold cursor-pointer hover:underline text-[13px]"
                            >
                              #{tag.replace(/^#/, '')}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Post Image Container: Full length width, adaptive auto height */}
                      {(post.cover_image_url || post.image_url) && (
                        <div className="mt-4 -mx-5 bg-black border-y border-gray-100 z-10 relative overflow-hidden flex justify-center items-center">
                          <img 
                            src={resolveMediaUrl(post.cover_image_url || post.image_url)} 
                            alt={post.title || 'Feed Image'} 
                            loading="lazy"
                            className="w-full h-auto max-h-[460px] object-contain block transition-opacity duration-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      {/* Unified Post Action Bar (Below image) */}
                      <div className="mt-4 flex justify-between items-center z-10 px-0.5">
                        <div className="flex gap-4 items-center">
                          {(() => {
                            const postId = post.id || post._id;
                            const postLikeState = postLikes[postId] || { liked: false, count: post.likes || 0 };
                            return (
                              <button 
                                onClick={() => {
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
                          <button className="text-gray-500 hover:text-blue-500 transition-colors cursor-pointer">
                            <MessageSquare size={21} strokeWidth={2} />
                          </button>
                          <button className="text-gray-500 hover:text-[#9B51E0] transition-colors cursor-pointer -rotate-12 mt-[-2px]">
                            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="22" y1="2" x2="11" y2="13"></line>
                              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex gap-4 items-center relative">
                          {/* Save Button */}
                          {(() => {
                            const postId = post.id || post._id;
                            const isSaved = !!savedPosts[postId];
                            return (
                              <button 
                                onClick={() => {
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
              reelsFeed
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
                        {recommendations.reels.map((r, i) => (
                          <div 
                            key={`rec-${i}`} 
                            className="bg-slate-900 aspect-[9/16] rounded-xl overflow-hidden relative cursor-pointer group shadow-sm"
                            onClick={() => {
                              setViewingMedia('recommendation');
                              setActiveStoryIndex(i);
                              setActiveTab('stories');
                            }}
                          >
                            <SkeletonImage 
                              src={resolveMediaUrl(r.cover_image_url)} 
                              alt="Reel Cover" 
                              className="w-full h-full object-cover opacity-85 group-hover:scale-102 transition-transform duration-300"
                              wrapperStyle={{ width: '100%', height: '100%', display: 'block' }}
                            />
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
                            <SkeletonImage 
                              src={resolveMediaUrl(r.cover_image_url)} 
                              alt="Reel Cover" 
                              className="w-full h-full object-cover opacity-85 group-hover:scale-102 transition-transform duration-300"
                              wrapperStyle={{ width: '100%', height: '100%', display: 'block' }}
                            />
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
                              <span className="text-[#3A125E] font-bold text-xs flex items-center gap-1 uppercase">{u.name} <GoldVerifiedBadge size={14} /></span>
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

        {/* Create/Add Tab */}
        {activeTab === 'add' && (
          <div className="p-4 pb-24 h-full animate-in fade-in duration-200">
            <CreateInstagramMenu token={token} onComplete={handleUploadPanelComplete} />
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
                }}
              />
            </div>
          ) : (
            <div className="p-4 pb-24 flex flex-col gap-4 animate-in fade-in duration-200">
            {/* View Mode Toggle: Dashboard vs Grid layout */}
            <div className="flex bg-[#3A125E]/5 border border-[#3A125E]/10 rounded-xl p-1 shrink-0">
              <button 
                onClick={() => setProfileViewMode('dashboard')}
                className={`flex-1 py-2 text-[10.5px] font-bold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${profileViewMode === 'dashboard' ? 'bg-[#3A125E] text-white shadow-md' : 'text-gray-500 hover:text-[#3A125E]'}`}
              >
                Dashboard View
              </button>
              <button 
                onClick={() => setProfileViewMode('content')}
                className={`flex-1 py-2 text-[10.5px] font-bold tracking-wider uppercase rounded-lg transition-all cursor-pointer ${profileViewMode === 'content' ? 'bg-[#3A125E] text-white shadow-md' : 'text-gray-500 hover:text-[#3A125E]'}`}
              >
                Grid & Connections
              </button>
            </div>

            {/* Profile Identity Card */}
            <div className="bg-white rounded-[24px] p-4 shadow-[0_8px_30px_rgba(58,18,94,0.03)] relative border border-gray-100 overflow-hidden shrink-0">
              {/* Subtle watermark background pattern */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-[24px]" 
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.83-53.797 53.8-2.49-2.49L54.627 0z' fill='%233A125E' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}>
              </div>
              
              <div className="flex gap-4 relative z-10">
                <div className="w-[84px] h-[84px] rounded-[18px] overflow-hidden border-2 border-gray-100 shadow-sm shrink-0">
                  <img 
                    src={getRefinedAvatar(adminData?.name || adminData?.username || 'Admin', adminData?.avatar_url)} 
                    alt="Profile Avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center flex-1">
                  <div className="flex items-start justify-between">
                    <h2 className="font-black text-[15px] text-[#3A125E] leading-[1.2] uppercase tracking-wide">
                      {adminData?.name || 'PREETAM SINGH YADAV'}
                    </h2>
                    <GoldVerifiedBadge size={18} className="shrink-0 mt-0.5" />
                  </div>
                  <p className="text-gray-400 font-semibold text-[11px] mt-1.5">
                    4/18/2026 • Recorded
                  </p>
                  <p className="text-[#3A125E]/60 font-bold text-[11.5px] mt-0.5">
                    {adminData?.role ? adminData.role.toUpperCase() : 'RAMLAL ANAND COLLEGE'}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 text-gray-700 text-[13px] font-bold relative z-10 flex justify-between items-center">
                <span>Welcome Back, {adminData?.name || 'Preetam'}! Let's Dance!</span>
                {token && (
                  <button 
                    onClick={() => {
                      localStorage.clear();
                      setToken(null);
                      setAdminId(null);
                      setAdminData(null);
                      setSelectedProfileId(null);
                    }}
                    className="text-red-500 hover:text-red-700 text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Logout
                  </button>
                )}
              </div>
            </div>

            {/* Profile View Content Area */}
            {profileViewMode === 'dashboard' ? (
              // SUB-VIEW A: Dashboard View (matching Screen 3)
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                {/* Stats Row */}
                {(() => {
                  const myReels = reelsFeed.filter(r => r.creator_id === adminId || r.creator_name === adminData?.name);
                  const myPosts = feed.filter(p => p.author_id === adminId);
                  const totalLikes = myReels.reduce((sum, r) => sum + (r.likes || 0), 0);
                  return (
                    <div className="flex gap-2">
                      <div className="flex-grow flex-1 bg-[#FFD700] rounded-[16px] p-3 flex flex-col relative overflow-hidden shadow-[0_4px_15px_rgba(255,215,0,0.25)] border border-[#FFD700]/10">
                        <span className="text-[#3A125E] text-[10px] font-extrabold mb-1.5 uppercase tracking-wide opacity-80">Total Clips</span>
                        <span className="text-[#3A125E] text-lg font-black leading-none">{myReels.length}</span>
                        <Activity size={36} className="absolute -right-2.5 -bottom-2.5 text-[#3A125E]/10" strokeWidth={3} />
                      </div>
                      <div className="flex-grow flex-1 bg-[#3A125E] rounded-[16px] p-3 flex flex-col relative overflow-hidden shadow-[0_4px_15px_rgba(58,18,94,0.15)]">
                        <span className="text-white/80 text-[10px] font-semibold mb-1.5 uppercase tracking-wide">Feed Posts</span>
                        <span className="text-white text-lg font-black leading-none">{myPosts.length}</span>
                        <Users size={32} className="absolute -right-2 -bottom-2 text-white/5" />
                      </div>
                      <div className="flex-grow flex-grow-0 w-[110px] bg-[#3A125E] rounded-[16px] p-3 flex flex-col relative overflow-hidden shadow-[0_4px_15px_rgba(58,18,94,0.15)]">
                        <span className="text-white/80 text-[10px] font-semibold mb-1.5 uppercase tracking-wide">Clips Likes</span>
                        <span className="text-white text-lg font-black leading-none">{totalLikes}</span>
                        <TrendingUp size={32} className="absolute -right-2 -bottom-2 text-white/5" />
                      </div>
                    </div>
                  );
                })()}

                {/* Performance Chart Card */}
                <div className="bg-white rounded-[24px] p-4 shadow-[0_8px_30px_rgba(58,18,94,0.03)] border border-gray-100 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-extrabold text-[#3A125E] text-[13.5px] uppercase tracking-wide">Performance Chart</h3>
                    <span className="text-[12px] font-bold text-emerald-500">+250 Growth</span>
                  </div>
                  
                  {/* Chart Placeholder Area (Gold-Purple Area Chart) */}
                  <div className="h-[110px] w-full relative mb-1.5 flex items-end">
                    <div 
                      className="w-full h-[75%] bg-gradient-to-t from-[#3A125E]/20 to-[#FFD700]/10 rounded-t-lg relative overflow-hidden" 
                      style={{ clipPath: 'polygon(0 100%, 0 80%, 20% 65%, 40% 72%, 60% 35%, 80% 25%, 100% 8%, 100% 100%)' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-white to-transparent opacity-60"></div>
                    </div>
                    <svg className="absolute inset-0 h-full w-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                      <path d="M0 80 C 10 70 20 65 30 68 C 40 72 50 50 60 35 C 70 20 80 25 100 8" fill="none" stroke="url(#chartGrad)" strokeWidth="3.5" strokeLinecap="round"/>
                      <defs>
                        <linearGradient id="chartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3A125E" />
                          <stop offset="100%" stopColor="#FFD700" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  
                  <div className="flex justify-between text-[10px] text-gray-400 font-extrabold uppercase tracking-wide mb-5">
                    <span>Last</span>
                    <span>30 days</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-around items-center gap-3">
                    <button 
                      onClick={() => setActiveTab('add')}
                      className="flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <div className="w-[46px] h-[46px] rounded-full bg-[#FF7675] text-white flex items-center justify-center shadow-[0_4px_15px_rgba(255,118,117,0.35)] group-hover:scale-105 transition-transform duration-200">
                        <Play fill="white" size={18} className="ml-0.5" />
                      </div>
                      <span className="text-[10px] font-bold text-center text-[#3A125E] leading-tight uppercase tracking-wider">Upload New<br/>Routine (+)</span>
                    </button>
                    <button 
                      onClick={openEditProfileModal}
                      className="flex flex-col items-center gap-2 group cursor-pointer"
                    >
                      <div className="w-[46px] h-[46px] rounded-full border border-gray-100 text-[#3A125E] flex items-center justify-center bg-gray-50 shadow-xs group-hover:bg-gray-100 transition-colors duration-200">
                        <UserCog size={18} />
                      </div>
                      <span className="text-[10px] font-bold text-center text-[#3A125E] leading-tight uppercase tracking-wider">Edit Profile<br/>(👤)</span>
                    </button>
                    <button className="flex flex-col items-center gap-2 group cursor-pointer">
                      <div className="w-[46px] h-[46px] rounded-full border border-gray-100 text-[#3A125E] flex items-center justify-center bg-gray-50 shadow-xs group-hover:bg-gray-100 transition-colors duration-200">
                        <BarChart2 size={18} />
                      </div>
                      <span className="text-[10px] font-bold text-center text-[#3A125E] leading-tight uppercase tracking-wider">View Insights<br/>&nbsp;</span>
                    </button>
                  </div>
                </div>

                {/* Single Post Preview Card at bottom */}
                <div className="bg-white rounded-[20px] p-3 shadow-[0_4px_18px_rgba(58,18,94,0.02)] border border-gray-100 flex items-center gap-3.5 relative overflow-hidden group">
                  <div className="w-[60px] h-[60px] rounded-xl overflow-hidden bg-slate-900 shrink-0 relative">
                    <div className="absolute inset-0 bg-black/10 z-10"></div>
                    <div className="absolute inset-0 flex items-center justify-center z-15">
                      <Play size={14} fill="white" className="text-white ml-0.5" />
                    </div>
                    {reelsFeed.length > 0 && reelsFeed[0].cover_image_url && (
                      <img src={resolveMediaUrl(reelsFeed[0].cover_image_url)} alt="Thumbnail" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 flex justify-between items-center pr-1.5">
                    <div className="flex gap-4">
                      <div className="flex flex-col">
                        <span className="text-gray-400 font-extrabold text-[9px] uppercase tracking-wider">Views</span>
                        <span className="text-[#3A125E] font-black text-sm">5.2k</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 font-extrabold text-[9px] uppercase tracking-wider">Likes</span>
                        <span className="text-[#3A125E] font-black text-sm">310</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-gray-400 font-extrabold text-[9px] uppercase tracking-wider">Comments</span>
                        <span className="text-[#3A125E] font-black text-sm">25</span>
                      </div>
                    </div>
                    <GoldVerifiedBadge size={18} />
                  </div>
                </div>
              </div>
            ) : (
              // SUB-VIEW B: Grid & Connections View (matching Screen 2)
              <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                {/* Alternative Stats Row */}
                {(() => {
                  const myReels = reelsFeed.filter(r => r.creator_id === adminId || r.creator_name === adminData?.name);
                  const myPosts = feed.filter(p => p.author_id === adminId);
                  const totalRoutinesCount = myReels.length + myPosts.length;
                  return (
                    <div className="flex gap-2">
                      <div className="flex-grow flex-1 bg-[#1A3B47] text-white rounded-[16px] p-3 flex flex-col justify-center relative overflow-hidden shadow-md">
                        <span className="text-white/60 text-[9px] font-extrabold uppercase tracking-wide">Posts</span>
                        <span className="text-white text-xl font-black mt-0.5">{totalRoutinesCount}</span>
                        <Play size={26} className="absolute right-2.5 bottom-2.5 text-white/10" fill="currentColor" />
                      </div>
                      <div className="flex-grow flex-1 bg-[#D4AF37] text-[#3A125E] rounded-[16px] p-3 flex flex-col justify-center relative overflow-hidden shadow-md">
                        <span className="text-[#3A125E]/60 text-[9px] font-extrabold uppercase tracking-wide">Followers</span>
                        <span className="text-[#3A125E] text-xl font-black mt-0.5">{adminData?.followers || 0}</span>
                        <Users size={26} className="absolute right-2.5 bottom-2.5 text-[#3A125E]/10" />
                      </div>
                      <div className="flex-grow flex-grow-0 w-[110px] bg-[#B38F24] text-white rounded-[16px] p-3 flex flex-col justify-center relative overflow-hidden shadow-md">
                        <span className="text-white/60 text-[9px] font-extrabold uppercase tracking-wide">Following</span>
                        <span className="text-white text-xl font-black mt-0.5">{adminData?.following || 0}</span>
                        <Share2 size={24} className="absolute right-2.5 bottom-2.5 text-white/10" />
                      </div>
                    </div>
                  );
                })()}

                {/* Profile Grid content box */}
                <div className="bg-white rounded-[24px] shadow-[0_8px_30px_rgba(58,18,94,0.03)] border border-gray-100 flex flex-col overflow-hidden">
                  <div className="bg-gray-50/50 py-3 text-center border-b border-gray-100">
                    <span className="text-[#3A125E] font-black text-xs uppercase tracking-widest">Profile Content</span>
                  </div>

                  <div className="flex border-b border-gray-100 shrink-0">
                    <button 
                      onClick={() => setProfileActiveTab('grid')}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${profileActiveTab === 'grid' ? 'text-[#3A125E] border-b-3 border-[#3A125E]' : 'text-gray-400 border-b-3 border-transparent'}`}
                    >
                      Recent Posts (Grid)
                    </button>
                    <button 
                      onClick={() => setProfileActiveTab('list')}
                      className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer ${profileActiveTab === 'list' ? 'text-[#3A125E] border-b-3 border-[#3A125E]' : 'text-gray-400 border-b-3 border-transparent'}`}
                    >
                      Connections (List)
                    </button>
                  </div>

                  <div className="p-3">
                    {profileActiveTab === 'grid' ? (
                      // Grid View Layout split: Grid on left 2/3, Connections on right 1/3
                      <div className="flex gap-3">
                        {/* 3x3 Grid (left 2/3 width) */}
                        <div className="w-[62%] grid grid-cols-3 gap-2">
                          {(reelsFeed.length > 0 ? reelsFeed.slice(0, 9) : Array(9).fill(0)).map((item, idx) => (
                            <div 
                              key={item.id || idx} 
                              className="aspect-[3/4] bg-slate-900 rounded-lg overflow-hidden relative cursor-pointer group shadow-sm"
                              onClick={() => {
                                if (item.id) {
                                  setViewingMedia('reel');
                                  setActiveStoryIndex(idx);
                                  setActiveTab('stories');
                                }
                              }}
                            >
                              {item.cover_image_url ? (
                                <img src={resolveMediaUrl(item.cover_image_url)} alt="Thumbnail" className="w-full h-full object-cover" />
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
                              <div className="absolute bottom-0 left-0 right-0 p-1 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col z-10 leading-tight">
                                <span className="text-white/70 text-[6.5px] uppercase font-semibold">Views</span>
                                <span className="text-white text-[9.5px] font-black">{item.views ? (item.views > 999 ? (item.views/1000).toFixed(1) + 'k' : item.views) : '5k'}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Connections List (right 1/3 width) */}
                        <div className="w-[38%] flex flex-col gap-3.5 border-l border-gray-100 pl-3">
                          {/* Followers list */}
                          <div className="flex flex-col gap-1.5">
                            <h4 className="text-[#3A125E] font-black text-[9.5px] uppercase tracking-wider mb-0.5">Followers</h4>
                            {adminData?.followers_list && adminData.followers_list.length > 0 ? (
                              adminData.followers_list.map((f, i) => (
                                <div key={i} className="flex items-center gap-1.5 border-b border-gray-50/50 pb-1.5 last:border-0 last:pb-0">
                                  <div className="w-[28px] h-[28px] rounded-full overflow-hidden bg-gray-100 border border-gray-200/50 shadow-xs shrink-0">
                                    <img src={getRefinedAvatar(f.name || f.handle || 'User', f.avatar_url)} alt="avatar" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex flex-col min-w-0 flex-1 leading-none">
                                    <span className="text-gray-400 font-extrabold text-[7px] uppercase truncate mb-0.5">Handle</span>
                                    <span className="text-[#3A125E] font-black text-[9px] truncate">@{f.handle || 'dancer'}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-[9px] text-gray-400 font-bold uppercase text-center py-2">No followers yet</div>
                            )}
                          </div>

                          <div className="border-t border-gray-100 pt-2.5 flex flex-col gap-1.5">
                            <h4 className="text-[#3A125E] font-black text-[9.5px] uppercase tracking-wider mb-0.5">Following</h4>
                            {adminData?.following_list && adminData.following_list.length > 0 ? (
                              adminData.following_list.map((f, i) => (
                                <div key={i} className="flex items-center gap-1.5 border-b border-gray-50/50 pb-1.5 last:border-0 last:pb-0">
                                  <div className="w-[28px] h-[28px] rounded-full overflow-hidden bg-gray-100 border border-gray-200/50 shadow-xs shrink-0">
                                    <img src={getRefinedAvatar(f.name || f.handle || 'User', f.avatar_url)} alt="avatar" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex flex-col min-w-0 flex-1 leading-none">
                                    <span className="text-gray-400 font-extrabold text-[7px] uppercase truncate mb-0.5">Handle</span>
                                    <span className="text-[#3A125E] font-black text-[9px] truncate">@{f.handle || 'dancer'}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-[9px] text-gray-400 font-bold uppercase text-center py-2">Not following anyone</div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-gray-400 font-semibold text-xs leading-normal">
                         Archival connection list is stored in Appwrite Database. Log into uploader to view relationships.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
          </div>
          )
        )}
      </main>

      {/* 3. Bottom Navigation Bar */}
      {activeTab !== 'stories' && (
        <nav className="absolute bottom-0 left-0 right-0 bg-[#F4ECD8] border-t border-gray-200/50 shadow-[0_-4px_25px_rgba(58,18,94,0.06)] z-50 shrink-0 flex flex-col">
          <div className="flex justify-around items-center h-[64px] px-2 relative">
            
            {/* Tab 1: Home */}
            <button 
              onClick={() => {
                setSelectedProfileId(null);
                setActiveTab('home');
              }}
              className="flex items-center justify-center w-14 h-full relative group cursor-pointer"
            >
              {activeTab === 'home' && (
                <div className="absolute w-[44px] h-[44px] rounded-full bg-gradient-to-tr from-[#00FFFF] via-[#9B51E0] to-[#3A125E] shadow-[0_4px_12px_rgba(155,81,224,0.4)] animate-in zoom-in duration-200"></div>
              )}
              <Home 
                size={22} 
                className={`relative z-10 transition-colors duration-200 ${activeTab === 'home' ? 'text-white' : 'text-[#3A125E]/60 group-hover:text-[#3A125E]'}`} 
                strokeWidth={activeTab === 'home' ? 2.5 : 2} 
              />
            </button>

            {/* Tab 2: Stories (Clips) */}
            <button 
              onClick={() => {
                setViewingMedia('reel');
                setActiveStoryIndex(0);
                setActiveTab('stories');
              }}
              className="flex items-center justify-center w-14 h-full relative group cursor-pointer"
            >
              {activeTab === 'stories' && (
                <div className="absolute w-[44px] h-[44px] rounded-full bg-gradient-to-tr from-[#00FFFF] via-[#9B51E0] to-[#3A125E] shadow-[0_4px_12px_rgba(155,81,224,0.4)] animate-in zoom-in duration-200"></div>
              )}
              <Film 
                size={22} 
                className={`relative z-10 transition-colors duration-200 ${activeTab === 'stories' ? 'text-white' : 'text-[#3A125E]/60 group-hover:text-[#3A125E]'}`} 
                strokeWidth={activeTab === 'stories' ? 2.5 : 2} 
              />
            </button>

            {/* Tab 3: Search */}
            <button 
              onClick={() => setActiveTab('search')}
              className="flex items-center justify-center w-14 h-full relative group cursor-pointer"
            >
              {activeTab === 'search' && (
                <div className="absolute w-[44px] h-[44px] rounded-full bg-gradient-to-tr from-[#00FFFF] via-[#9B51E0] to-[#3A125E] shadow-[0_4px_12px_rgba(155,81,224,0.4)] animate-in zoom-in duration-200"></div>
              )}
              <Search 
                size={22} 
                className={`relative z-10 transition-colors duration-200 ${activeTab === 'search' ? 'text-white' : 'text-[#3A125E]/60 group-hover:text-[#3A125E]'}`} 
                strokeWidth={activeTab === 'search' ? 2.5 : 2} 
              />
            </button>

            {/* Tab 4: Add */}
            <button 
              onClick={() => setActiveTab('add')}
              className="flex items-center justify-center w-14 h-full relative group cursor-pointer"
            >
              {activeTab === 'add' && (
                <div className="absolute w-[44px] h-[44px] rounded-full bg-gradient-to-tr from-[#00FFFF] via-[#9B51E0] to-[#3A125E] shadow-[0_4px_12px_rgba(155,81,224,0.4)] animate-in zoom-in duration-200"></div>
              )}
              <PlusSquare 
                size={22} 
                className={`relative z-10 transition-colors duration-200 ${activeTab === 'add' ? 'text-white' : 'text-[#3A125E]/60 group-hover:text-[#3A125E]'}`} 
                strokeWidth={activeTab === 'add' ? 2.5 : 2} 
              />
            </button>

            {/* Tab 5: Profile */}
            <button 
              onClick={() => {
                setSelectedProfileId(null);
                setActiveTab('profile');
              }}
              className="flex items-center justify-center w-14 h-full relative group cursor-pointer"
            >
              {activeTab === 'profile' && (
                <div className="absolute w-[44px] h-[44px] rounded-full bg-gradient-to-tr from-[#00FFFF] via-[#9B51E0] to-[#3A125E] shadow-[0_4px_12px_rgba(155,81,224,0.4)] animate-in zoom-in duration-200"></div>
              )}
              <User 
                size={22} 
                className={`relative z-10 transition-colors duration-200 ${activeTab === 'profile' ? 'text-white' : 'text-[#3A125E]/60 group-hover:text-[#3A125E]'}`} 
                strokeWidth={activeTab === 'profile' ? 2.5 : 2} 
              />
            </button>

          </div>
          
          {/* Version string under the icons */}
          <div className="w-full text-center pb-[calc(env(safe-area-inset-bottom)+4px)] pt-0.5 opacity-60">
            <span className="text-[#3A125E] text-[7.5px] font-extrabold tracking-[0.18em] uppercase select-none block leading-none">
              DenceWance • v{versionData.version} ({versionData.gitHash || 'stable'})
            </span>
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

    </div>
  );
}
