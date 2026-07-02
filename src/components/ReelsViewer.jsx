import React, { useState, useEffect, useRef } from 'react';
import { Heart, Share2, MoreVertical, Volume2, VolumeX, Settings, MessageSquare, Bookmark } from 'lucide-react';

import './ReelsViewer.css';
import { translations as tAll } from '../translations';
import UserProfileView from './UserProfileView';
import CommentsSection from './CommentsSection';
import LikeButton from './LikeButton';
import VerifiedBadge from './VerifiedBadge';
import { trackEvent, sendContentReport, sendDeveloperReport } from '../utils/analyticsTracker';

const REEL_KEEP_BEHIND = 1; 
const REEL_PRELOAD_AHEAD = 2;

export const DEFAULT_VISUAL_HUD = [
  { id: 'creatorProfile', type: 'creator', x: 4, y: 78, visible: true },
  { id: 'captionText', type: 'caption', x: 4, y: 85, visible: true },
  { id: 'musicTicker', type: 'music', x: 4, y: 92, visible: true },
  { id: 'likeBtn', type: 'like', x: 100, y: 55, visible: true },
  { id: 'commentBtn', type: 'comment', x: 100, y: 65, visible: true },
  { id: 'shareBtn', type: 'share', x: 100, y: 75, visible: true },
  { id: 'settingsBtn', type: 'settings', x: 100, y: 85, visible: true },
  { id: 'saveBtn', type: 'save', x: 100, y: 45, visible: false },
];

const HUD_COMPONENTS_MAP = {
  like: { icon: '❤️', label: 'Like' },
  comment: { icon: '💬', label: 'Comment' },
  save: { icon: '🔖', label: 'Save' },
  share: { icon: '🔗', label: 'Share' },
  settings: { icon: '⚙️', label: 'Settings' },
  creator: { icon: '👤', label: 'Profile' },
  caption: { icon: '📝', label: 'Caption' },
  music: { icon: '🎵', label: 'Music' }
};

const getEmbedSource = (input) => {
  if (!input || typeof input !== 'string') return { type: 'unknown', src: '', id: '' };
  
  const ytMatch = input.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    return { type: 'youtube', src: `https://www.youtube.com/embed/${ytMatch[1]}`, id: ytMatch[1] };
  }

  const igMatch = input.match(/(?:instagram\.com|instagr\.am)\/(?:p|reel|tv)\/([a-zA-Z0-9_\-]+)/i);
  if (igMatch && igMatch[1]) {
    return { type: 'instagram', src: `https://www.instagram.com/reel/${igMatch[1]}/embed/`, id: igMatch[1] };
  }

  return { type: 'video', src: input, id: input };
};

const API_URL = import.meta.env.VITE_API_URL || '';

const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const getViewerAvatar = (creatorHandle, creatorName, creatorAvatar) => {
  if (creatorAvatar && typeof creatorAvatar === 'string' && creatorAvatar.trim() !== '' && 
      !creatorAvatar.includes('ui-avatars.com') && !creatorAvatar.includes('placeholder') && !creatorAvatar.includes('unsplash.com')) {
    return resolveMediaUrl(creatorAvatar);
  }
  let cleanName = String(creatorHandle || creatorName || 'User').trim();
  if (cleanName.startsWith('+')) {
    cleanName = cleanName.replace(/^\+/, '');
  }
  if (/^\d+$/.test(cleanName) || cleanName.length === 0) {
    cleanName = 'User';
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=random`;
};

const postYouTubeCommand = (iframe, command) => {
  if (!iframe || !iframe.contentWindow) return;
  try {
    iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: command, args: [] }), '*');
  } catch (err) {}
};

const syncYouTubePlaybackState = (iframe, { shouldMute, shouldPlay }) => {
  if (!iframe || !iframe.contentWindow) return;
  try {
    if (shouldMute) postYouTubeCommand(iframe, 'mute'); else postYouTubeCommand(iframe, 'unMute');
    if (shouldPlay) postYouTubeCommand(iframe, 'playVideo'); else postYouTubeCommand(iframe, 'pauseVideo');
  } catch (err) {}
};

const syncYouTubeAudioState = (iframe, shouldMute) => {
  if (!iframe || !iframe.contentWindow) return;
  try { if (shouldMute) postYouTubeCommand(iframe, 'mute'); else postYouTubeCommand(iframe, 'unMute'); } catch (err) {}
};

const enableVideoImmersiveMode = () => {};
const disableVideoImmersiveMode = () => {};

export default function ReelsViewer({ reels: fallbackData = [], initialIndex = 0, onClose, onDelete, adminData, onNavigateToProfile }) {

    const renderVisualComponent = (type, item, idx) => {
    const config = visualHud.find(v => v.type === type);
    if (!config || !config.visible) return null;

    const isSelected = isHUDEditMode && selectedHudItem === config.id;
    const isActionItem = ['like', 'comment', 'share', 'save', 'settings'].includes(type);
    
    return (
      <div 
        key={config.id} 
        style={{
          position: 'absolute',
          left: `${config.x}%`,
          top: `${config.y}%`,
          zIndex: 40,
          transform: `translate(${config.x >= 50 ? '-100%' : '0'}, -50%) translateZ(0)`,
          willChange: 'transform',
          WebkitFontSmoothing: 'antialiased'
        }}
        className={`${isHUDEditMode ? 'transition-all pointer-events-auto cursor-move' : 'pointer-events-none'} ${isSelected ? 'ring-2 ring-[#FF2D55] bg-[#FF2D55]/20 rounded-lg p-2' : ''}`}
        onPointerDown={(e) => onVisualPointerDown(e, config.id)}
      >
        <div style={{ pointerEvents: isHUDEditMode ? 'none' : 'auto' }} className={`flex flex-col items-center gap-2 ${isActionItem ? 'w-[60px]' : ''}`}>
          {type === 'like' && (
            <div className="reel-action-item">
              <LikeButton
                reelId={item._id || item.id}
                initialLikes={item.likes_count || item.likes || 0}
                isLikedByMe={!!item.is_liked_by_me}
                onLikeToggle={handleLikeReel}
              />
            </div>
          )}
          {type === 'comment' && (
            <div className="reel-action-item drop-shadow-sm">
              <button className="reel-action-btn hover:scale-105 active:scale-95 transition-transform" onClick={(e) => { e.stopPropagation(); setSelectedReelForComments(item._id); setShowComments(true); }}>
                <span className="reel-action-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'scaleX(-1)' }}>
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                </span>
              </button>
              <span className="reel-action-count font-medium text-[13px]">{item.comments_count || (item.comments ? item.comments.length : 0) || 0}</span>
            </div>
          )}
          {type === 'save' && (() => {
            const reelId = item._id || item.id;
            const isSaved = savedReels[reelId] !== undefined ? savedReels[reelId] : !!item.is_saved_by_me;
            return (
              <div className={`reel-action-item drop-shadow-sm ${isSaved ? 'save-active' : ''}`}>
                <button className="reel-action-btn hover:scale-105 active:scale-95 transition-transform" onClick={(e) => { e.stopPropagation(); handleSaveReel(reelId, !!item.is_saved_by_me); }}>
                  <span className="reel-action-icon">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill={isSaved ? "#FFFFFF" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                    </svg>
                  </span>
                </button>
                <span className="reel-action-count font-medium text-[13px]">{isSaved ? "Saved" : "Save"}</span>
              </div>
            );
          })()}
          {type === 'share' && (
            <div className="reel-action-item drop-shadow-sm">
              <button className="reel-action-btn hover:scale-105 active:scale-95 transition-transform" onClick={(e) => { 
                e.stopPropagation(); 
                if (navigator.share) { navigator.share({ title: item.title, text: item.caption, url: window.location.href }).catch(() => {}); }
                else { alert("Share link copied to clipboard!"); navigator.clipboard.writeText(window.location.href); }
              }}>
                <span className="reel-action-icon">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(15deg) translateY(-2px)' }}>
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </span>
              </button>
              <span className="reel-action-count font-medium text-[13px]">{item.shares || 0}</span>
            </div>
          )}
          {type === 'settings' && (
            <div className="reel-action-item drop-shadow-sm">
              <div className="relative">
                <button className="reel-action-btn hover:scale-105 active:scale-95 transition-transform" onClick={(e) => { e.stopPropagation(); setActiveDropdownIndex(activeDropdownIndex === idx ? null : idx); }}>
                  <span className="reel-action-icon">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <line x1="3" y1="12" x2="10" y2="12"></line>
                      <line x1="3" y1="18" x2="7" y2="18"></line>
                      <g transform="translate(10.4, 9.4) scale(0.55)" strokeWidth="2.72">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </g>
                    </svg>
                  </span>
                </button>
                {activeDropdownIndex === idx && !isHUDEditMode && (
                  <div className="absolute right-full mr-2 bottom-0 w-48 bg-black/80 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-2xl z-[60] flex flex-col gap-1">
                    <button className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-lg flex items-center gap-2 cursor-pointer transition-colors" onClick={(e) => { e.stopPropagation(); toggleReelsMute(); setActiveDropdownIndex(null); }}>
                      {reelsMuted ? '🔊 Unmute Audio' : '🔇 Mute Audio'}
                    </button>
                    <button className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-lg flex items-center gap-2 cursor-pointer transition-colors mt-1" onClick={(e) => { e.stopPropagation(); trackEvent('report_open', item._id); setReportReelId(item._id); setShowReportSheet(true); setReportSuccess(false); setReportReason(''); setReportDetails(''); setActiveDropdownIndex(null); }}>
                      🚩 Report Clip
                    </button>
                    <button className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-lg flex items-center gap-2 cursor-pointer transition-colors mt-1" onClick={(e) => { e.stopPropagation(); trackEvent('dev_report', item._id); sendDeveloperReport('user_feedback', `Clip ${item._id} issue reported by user`, { video_id: item._id }); alert('Bug report sent to developer!'); setActiveDropdownIndex(null); }}>
                      🐛 Report Bug
                    </button>
                    <button className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-lg flex items-center gap-2 cursor-pointer transition-colors mt-1" onClick={(e) => { e.stopPropagation(); setActiveDropdownIndex(null); setIsHUDEditMode(true); }}>
                      👆 Edit HUD Layout
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {type === 'creator' && (
            <div className="flex items-center gap-2 pointer-events-auto group" onClick={(e) => { e.stopPropagation(); const handle = item.creator_handle || item.creator_name || 'user'; if (onNavigateToProfile) onNavigateToProfile(item.creator_id || handle); else window.location.href = `/profile/${handle}`; }}>
              <div className="w-[34px] h-[34px] rounded-full overflow-hidden border-[1.5px] border-white/50 shadow-sm cursor-pointer group-active:scale-95 transition-transform">
                <img src={getViewerAvatar(item.creator_handle, item.creator_name, item.creator_avatar)} alt="Creator" className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col items-start cursor-pointer drop-shadow-md">
                <div className="flex items-center gap-1.5">
                  <span className="text-white font-semibold text-[15px] leading-tight flex items-center gap-1">
                    {slugifyText(item.creator_handle || item.creator_name || 'user')}
                    {((item.creator_is_verified || item.author_is_verified || (JSON.parse(localStorage.getItem('DEV_ASSIGNED_BADGES') || '{}')[item.creator_id || item.author_id || item.user_id]))) && (
                      <VerifiedBadge 
                        type={JSON.parse(localStorage.getItem('DEV_ASSIGNED_BADGES') || '{}')[item.creator_id || item.author_id || item.user_id] || item.badge_type || 'blue'} 
                        size={14} 
                      />
                    )}
                  </span>
                  <span className="w-1 h-1 bg-white rounded-full opacity-60"></span>
                  <button className="text-white font-semibold text-[12px] bg-transparent border border-white/40 px-2 py-[2px] rounded-md hover:bg-white/20 transition-colors backdrop-blur-sm">
                    Follow
                  </button>
                </div>
              </div>
            </div>
          )}
          {type === 'caption' && (
            <div className="reel-caption-line max-w-[280px] pointer-events-none mt-1">
              <p className="text-white text-[14px] font-normal leading-tight drop-shadow-sm line-clamp-2">{item.caption || item.title || ''}</p>
            </div>
          )}
          {type === 'music' && (
            <div className="reel-music-line flex items-center gap-1.5 mt-1.5 pointer-events-none bg-black/20 backdrop-blur-md px-2.5 py-1 rounded-full w-max">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
              <span className="text-white text-[13px] font-medium drop-shadow-sm flex items-center gap-1 truncate max-w-[150px]">{item.music_title || 'Original audio'}</span>
            </div>
          )}
        </div>
      </div>
    );
  };


  const language = localStorage.getItem('socialAppLanguage') || 'en';
  const t = (key, lang) => {
     const translation = tAll[key];
     if (!translation) return key;
     return typeof translation === 'object' ? translation[lang] || translation['en'] : translation;
  };
  const siteSettings = { site_name: 'Seen.Ly' };


  const isMobile = window.innerWidth <= 768;
  const adminToken = null; // Removed admin actions from client Reels viewer
  const videoUploadState = { state: 'idle', message: '' };
  const [reelCreatorMode, setReelCreatorMode] = useState('auto');
  const reelUploadInputRef = useRef(null);
  const reelUploadProgress = 0;
  const [followedCreators, setFollowedCreators] = useState({});

  const toggleFollowCreator = async (item) => {
    const adminId = localStorage.getItem('adminId');
    const token = localStorage.getItem('adminToken');
    if (!adminId || !token) {
      alert("Please login to follow creators.");
      return;
    }
    const creatorId = item.creator_id || '69d663c300013ae31bb4';
    if (adminId === creatorId) return;

    setFollowedCreators(prev => {
      const isCurrentlyFollowing = prev[creatorId] !== undefined ? prev[creatorId] : !!item.is_following_creator;
      return { ...prev, [creatorId]: !isCurrentlyFollowing };
    });

    try {
      await fetch(`${API_URL}/api/users/${creatorId}/follow`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error(e);
    }
  };
  const handleReelLike = async (item) => {
    if (likedTracking[item._id]?.liked) return; // User already liked locally
    
    // Optistic UI update
    setLikedTracking(prev => ({
      ...prev,
      [item._id]: {
        liked: true,
        count: (item.likes || 0) + 1
      }
    }));

    try {
      const res = await fetch(`${API_URL}/api/reels/${item._id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error('Like failed');
    } catch (e) {
      console.error(e);
      // Revert optimism if failed
      setLikedTracking(prev => ({
        ...prev,
        [item._id]: {
          liked: false,
          count: item.likes || 0
        }
      }));
    }
  };
  const handleReelFileUpload = () => {};
  const navigateTo = () => { /* Handle back navigation nicely if needed */ };
  const openReel = () => {};
  const shareReel = () => {};
  const deleteReel = async () => {
    if (!onDelete) return;
    const item = reels[activeReelIndex];
    if (!item) return;
    const reelId = item.id || item._id;
    if (!window.confirm('Delete this clip permanently?')) return;
    onDelete(reelId);
  };
  const formatCompactNumber = (n) => {
    if (!n) return '0';
    return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  };
  const slugifyText = (t) => (typeof t === 'string' ? t : '').toLowerCase().replace(/\s+/g, '-');
  const reelsUrlInput = '';

  const reels = Array.isArray(fallbackData) ? fallbackData : [];
  const reelItems = reels;
  const currentPageKey = 'videos';

  const [activeReelIndex, setActiveReelIndex] = useState(initialIndex);
  const [reelsMuted, setReelsMuted] = useState(false); // Changed to false by default as requested
  const [likedTracking, setLikedTracking] = useState({}); // Track local likes
  const [likedReels, setLikedReels] = useState({}); // { [reelId]: { liked: boolean, count: number } }
  const [savedReels, setSavedReels] = useState({}); // { [reelId]: boolean }

  const [isHUDEditMode, setIsHUDEditMode] = useState(false);
  const [visualHud, setVisualHud] = useState(DEFAULT_VISUAL_HUD);
  const [selectedHudItem, setSelectedHudItem] = useState(null);

  const visualDragRef = useRef({
    isDragging: false,
    id: null,
    startX: 0,
    startY: 0,
    startItemX: 0,
    startItemY: 0
  });

  const handleVisualHUDSave = () => {
    localStorage.setItem('CLIPS_VISUAL_HUD_V5', JSON.stringify(visualHud));
    setIsHUDEditMode(false);
    setSelectedHudItem(null);
  };

  const resetVisualHUD = () => {
    setVisualHud(DEFAULT_VISUAL_HUD);
  };
  
  const clearVisualHUD = () => {
    setVisualHud(prev => prev.map(item => ({ ...item, visible: false })));
  };

  const toggleVisualItemVisibility = (type) => {
    setVisualHud(prev => {
      const exists = prev.find(i => i.type === type);
      if (exists) {
        return prev.map(i => i.type === type ? { ...i, visible: !i.visible } : i);
      }
      return [...prev, { id: type + Date.now(), type, x: 50, y: 50, visible: true }];
    });
  };

  const onVisualPointerDown = (e, id) => {
    if (!isHUDEditMode) return;
    e.stopPropagation();
    setSelectedHudItem(id);
    
    const item = visualHud.find(z => z.id === id);
    if (!item) return;

    visualDragRef.current = {
      isDragging: true,
      id,
      startX: e.clientX,
      startY: e.clientY,
      startItemX: item.x,
      startItemY: item.y
    };

    window.addEventListener('pointermove', onVisualPointerMove);
    window.addEventListener('pointerup', onVisualPointerUp);
  };

  const onVisualPointerMove = (e) => {
    const drag = visualDragRef.current;
    if (!drag.isDragging || !drag.id) return;

    const container = document.querySelector('.reel-active .reel-video-wrap');
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;

    let newX = drag.startItemX + dx;
    let newY = drag.startItemY + dy;
    newX = Math.max(0, Math.min(newX, 95));
    newY = Math.max(0, Math.min(newY, 95));

    setVisualHud(prev => prev.map(i => i.id === drag.id ? { ...i, x: newX, y: newY } : i));
  };

  const onVisualPointerUp = () => {
    visualDragRef.current.isDragging = false;
    window.removeEventListener('pointermove', onVisualPointerMove);
    window.removeEventListener('pointerup', onVisualPointerUp);
  };

  useEffect(() => {
    const fetchVisualZones = () => {
      const stored = localStorage.getItem('CLIPS_VISUAL_HUD_V3');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVisualHud(parsed);
            return;
          }
        } catch(e) {}
      }
      setVisualHud(DEFAULT_VISUAL_HUD);
    };
    fetchVisualZones();
    window.addEventListener('visualHudLayoutUpdated', fetchVisualZones);
  return () => window.removeEventListener('visualHudLayoutUpdated', fetchVisualZones);
  }, []);

  const handleLikeReel = async (reelId, initialLikes, isLikedByMe) => {
    const adminId = localStorage.getItem('adminId');
    const token = localStorage.getItem('adminToken');
    if (!adminId || !token) {
      alert("Please login to like this post.");
      return;
    }
    
    setLikedReels(prev => {
      const current = prev[reelId] || { liked: isLikedByMe, count: initialLikes };
      const nextLiked = !current.liked;
      return {
        ...prev,
        [reelId]: {
          liked: nextLiked,
          count: nextLiked ? current.count + 1 : Math.max(0, current.count - 1)
        }
      };
    });

    try {
      await fetch(`${API_URL}/api/interactions/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ target_id: reelId, target_type: 'reel' })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveReel = async (reelId, isSavedByMe) => {
    const adminId = localStorage.getItem('adminId');
    const token = localStorage.getItem('adminToken');
    if (!adminId || !token) {
      alert("Please login to save this post.");
      return;
    }

    setSavedReels(prev => {
      const currentLiked = prev[reelId] !== undefined ? prev[reelId] : isSavedByMe;
      return {
        ...prev,
        [reelId]: !currentLiked
      };
    });

    try {
      await fetch(`${API_URL}/api/interactions/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ target_id: reelId, target_type: 'reel' })
      });
    } catch (e) {
      console.error(e);
    }
  };
  const toggleReelsMute = (e) => {
    if (e) e.stopPropagation();
    setReelsMuted(!reelsMuted);
  };

  const [reelPaused, setReelPaused] = useState(new Set());
  const [isStoryPage, setIsStoryPage] = useState(false);
  const [routeStory, setRouteStory] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [selectedReelForComments, setSelectedReelForComments] = useState(null);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [reportReelId, setReportReelId] = useState(null);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);


  const reelsContainerRef = useRef(null);
  const reelVideoRefs = useRef({});
  const reelYouTubeRefs = useRef({});
  const hasUnlockedVideoAudioRef = useRef(false);

  useEffect(() => {
    if (false) {
      hasUnlockedVideoAudioRef.current = false;
      return;
    }

    const unlockAudio = () => {
      if (hasUnlockedVideoAudioRef.current) return;
      hasUnlockedVideoAudioRef.current = true;
      setReelsMuted(false);

      const activeVideo = reelVideoRefs.current[activeReelIndex];
      if (activeVideo) {
        activeVideo.muted = false;
        activeVideo.volume = 1;
        activeVideo.play().catch(() => {});
      }

      const activeIframe = reelYouTubeRefs.current[activeReelIndex];
      if (activeIframe) {
        syncYouTubePlaybackState(activeIframe, { shouldMute: false, shouldPlay: true });
      }
    };

    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    return () => window.removeEventListener('pointerdown', unlockAudio);
  }, [currentPageKey, activeReelIndex]);

  useEffect(() => {
    if (!reelsContainerRef.current) return;
    const targetIdx = initialIndex || 0;
    const targetEl = reelsContainerRef.current.querySelector(`[data-reel-idx="${targetIdx}"]`);
    if (targetEl) {
      targetEl.scrollIntoView();
      setActiveReelIndex(targetIdx);
    }
  }, [initialIndex]);

  // Reels: IntersectionObserver for active reel detection + native video play/pause
  useEffect(() => {
    if (currentPageKey !== 'videos') {
      setActiveReelIndex(0);
      return;
    }
    const container = reelsContainerRef.current;
    if (!container) return;
    const frames = Array.from(container.querySelectorAll('.reel-frame'));
    if (!frames.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = parseInt(entry.target.dataset.reelIdx, 10);
            if (!isNaN(idx)) setActiveReelIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );
    frames.forEach((f) => observer.observe(f));
    return () => observer.disconnect();
  }, [currentPageKey, reels.length]);

  // Sync play/pause strictly to activeReelIndex (using refs for performance)
  useEffect(() => {
    if (currentPageKey !== 'videos') return;

    // Pause/mute all non-active native videos via refs
    Object.entries(reelVideoRefs.current).forEach(([idxStr, videoEl]) => {
      const idx = Number(idxStr);
      if (!videoEl || Number.isNaN(idx)) return;
      const isActive = idx === activeReelIndex;
      videoEl.muted = isActive ? reelsMuted : true;
      if (isActive && !reelPaused.has(idx)) {
        videoEl.play().catch(() => {});
      } else if (!isActive) {
        videoEl.pause();
      }
    });

    // Sync YouTube iframes via refs
    Object.entries(reelYouTubeRefs.current).forEach(([idxStr, iframeEl]) => {
      const idx = Number(idxStr);
      if (!iframeEl || Number.isNaN(idx)) return;
      const isActive = idx === activeReelIndex;
      if (isActive && !reelPaused.has(idx)) {
        syncYouTubePlaybackState(iframeEl, { shouldMute: reelsMuted, shouldPlay: true });
      } else if (!isActive) {
        postYouTubeCommand(iframeEl, 'stopVideo');
        syncYouTubePlaybackState(iframeEl, { shouldMute: true, shouldPlay: false });
      }
    });
  }, [activeReelIndex, reelPaused, currentPageKey, reelsMuted]);

  // Sync mute state to all native video elements in reels (using refs for performance)
  useEffect(() => {
    if (currentPageKey !== 'videos') return;
    Object.entries(reelVideoRefs.current).forEach(([idxStr, videoEl]) => {
      const idx = Number(idxStr);
      if (!videoEl || Number.isNaN(idx)) return;
      videoEl.muted = idx === activeReelIndex ? reelsMuted : true;
    });
    Object.entries(reelYouTubeRefs.current).forEach(([idxStr, iframeEl]) => {
      const idx = Number(idxStr);
      if (!iframeEl || Number.isNaN(idx)) return;
      syncYouTubeAudioState(iframeEl, idx === activeReelIndex ? reelsMuted : true);
    });
  }, [reelsMuted, currentPageKey, activeReelIndex]);

  useEffect(() => {
    if (currentPageKey !== 'videos') return;

    Object.entries(reelVideoRefs.current).forEach(([idxStr, videoEl]) => {
      const idx = Number(idxStr);
      if (!videoEl || Number.isNaN(idx)) return;
      const distance = idx - activeReelIndex;
      videoEl.preload = distance >= 0 && distance <= REEL_PRELOAD_AHEAD ? 'auto' : 'metadata';
    });
  }, [activeReelIndex, currentPageKey, reels.length]);


  const executeGesture = (action, item, videoRef, ytRef, idx, isYouTube, isPaused) => {
    if (!action || action === 'none') return;
    
    if (action === 'play_pause') {
      if (!isYouTube && videoRef) {
        if (videoRef.paused) {
          videoRef.play().catch(() => {});
          setReelPaused((prev) => { const n = new Set(prev); n.delete(idx); return n; });
        } else {
          videoRef.pause();
          setReelPaused((prev) => { const n = new Set(prev); n.add(idx); return n; });
        }
      } else if (isYouTube && ytRef) {
        if (isPaused) {
          postYouTubeCommand(ytRef, 'playVideo');
          setReelPaused((prev) => { const n = new Set(prev); n.delete(idx); return n; });
        } else {
          postYouTubeCommand(ytRef, 'pauseVideo');
          setReelPaused((prev) => { const n = new Set(prev); n.add(idx); return n; });
        }
      }
    } else if (action === 'mute_unmute') {
      setReelsMuted(prev => !prev);
    } else if (action === 'like') {
      const reelId = item._id || item.id;
      const initialLikes = item.likes || 0;
      const isLikedByMe = !!item.is_liked_by_me;
      handleLikeReel(reelId, initialLikes, isLikedByMe);
    } else if (action === 'open_comments') {
      setSelectedReelForComments(item._id);
      setShowComments(true);
    } else if (action === 'next') {
      const container = reelsContainerRef.current;
      if (container) {
        const nextEl = container.querySelector(`[data-reel-idx="${idx + 1}"]`);
        if (nextEl) nextEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (action === 'prev') {
      const container = reelsContainerRef.current;
      if (container) {
        const prevEl = container.querySelector(`[data-reel-idx="${idx - 1}"]`);
        if (prevEl) prevEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
<div className="reels-container" ref={reelsContainerRef} style={{ overflowY: isHUDEditMode ? 'hidden' : 'auto' }}>
              {reelItems.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100dvh', background: '#000', padding: '20px', zIndex: 999 }}>
                  <div style={{ width: '100%', height: '80%', background: '#222', borderRadius: '12px', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }}></div>
                  <div style={{ display: 'flex', marginTop: '16px', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#222', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }}></div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ width: '60%', height: '14px', background: '#222', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }}></div>
                      <div style={{ width: '40%', height: '14px', background: '#222', borderRadius: '4px', animation: 'skeleton-pulse 1.5s infinite ease-in-out' }}></div>
                    </div>
                  </div>
                  <style>{`
                    @keyframes skeleton-pulse {
                      0% { opacity: 1; }
                      50% { opacity: 0.4; }
                      100% { opacity: 1; }
                    }
                  `}</style>
                </div>
              )}
              {reelItems.map((item, idx) => {
                const embed = getEmbedSource(item.video_url);
                const isYouTube = embed.type === 'youtube';
                const isInstagram = embed.type === 'instagram';
                const isActive = activeReelIndex === idx;
                const isPaused = reelPaused.has(idx);
                const creatorInitial = (typeof item.creator_name === 'string' ? item.creator_name : 'A').charAt(0).toUpperCase();
                const creatorAvatar = item.creator_avatar || '';
                const shouldWarm = embed.type === 'video'
                  && idx >= activeReelIndex - REEL_KEEP_BEHIND
                  && idx <= activeReelIndex + REEL_PRELOAD_AHEAD;
                return (
                  <div
                    key={item.id}
                    className={`reel-frame${isActive ? ' reel-active' : ''}`}
                    data-reel-idx={idx}
                  >
                    {/* Video layer — gesture detection overlay */}
                    <div
                      className="reel-video-wrap"
                      onPointerDown={(e) => {
                        if (isHUDEditMode && isActive) return; // Disable standard gestures in edit mode

                        const currentTarget = e.currentTarget;
                        const v = reelVideoRefs.current[idx];
                        const y = reelYouTubeRefs.current[idx];
                        
                        // Ignore if we clicked a button inside (though there shouldn't be any here)
                        
                        let touchStartX = e.clientX;
                        let touchStartY = e.clientY;
                        let touchStartTime = Date.now();

                        const handlePointerUp = (upEvent) => {
                          window.removeEventListener('pointerup', handlePointerUp);
                          
                          let touchEndX = upEvent.clientX;
                          let touchEndY = upEvent.clientY;
                          let touchEndTime = Date.now();
                          let duration = touchEndTime - touchStartTime;
                          let dx = touchEndX - touchStartX;
                          let dy = touchEndY - touchStartY;
                          
                          // Determine gesture
                          let gesture = 'singleTap';
                          if (duration < 300 && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
                            const lastTap = window.lastVideoTapTime || 0;
                            if (touchEndTime - lastTap < 300) {
                              gesture = 'doubleTap';
                              window.lastVideoTapTime = 0;
                            } else {
                              window.lastVideoTapTime = touchEndTime;
                              setTimeout(() => {
                                if (window.lastVideoTapTime === touchEndTime) {
                                  processGesture('singleTap');
                                }
                              }, 300);
                              return;
                            }
                          } else if (duration < 500) {
                            if (Math.abs(dx) > Math.abs(dy)) {
                              if (dx > 50) gesture = 'swipeRight';
                              else if (dx < -50) gesture = 'swipeLeft';
                            } else {
                              if (dy > 50) gesture = 'swipeDown';
                              else if (dy < -50) gesture = 'swipeUp';
                            }
                          }

                          processGesture(gesture);
                          
                          function processGesture(detectedGesture) {
                            let action = 'none';
                            if (detectedGesture === 'singleTap') action = 'play_pause';
                            else if (detectedGesture === 'doubleTap') action = 'like';
                            else if (detectedGesture === 'swipeLeft') action = 'profile';

                            if (action !== 'none') {
                              executeGesture(action, item, v, y, idx, isYouTube, isPaused);
                            }
                          }
                        };
                        
                        window.addEventListener('pointerup', handlePointerUp);
                      }}
                    >
                      {isHUDEditMode && isActive && (
                        <div className="absolute inset-0 z-50 pointer-events-none border-4 border-dashed border-[#FF2D55]/50 flex flex-col justify-between">
                          {/* Top Toolbar */}
                          <div className="p-2 sm:p-4 bg-black/80 backdrop-blur-md pointer-events-auto border-b border-white/20 flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <span className="text-white font-black italic tracking-wider text-sm">VISUAL HUD EDITOR</span>
                              <div className="flex gap-2">
                                <button onClick={(e) => { e.stopPropagation(); clearVisualHUD(); }} className="px-3 py-1.5 bg-gray-500/30 hover:bg-gray-500/50 text-white rounded font-bold text-xs cursor-pointer">Clear All</button>
                                <button onClick={(e) => { e.stopPropagation(); resetVisualHUD(); }} className="px-3 py-1.5 bg-gray-500/30 hover:bg-gray-500/50 text-white rounded font-bold text-xs cursor-pointer">Reset</button>
                                <button onClick={(e) => { e.stopPropagation(); handleVisualHUDSave(); }} className="px-3 py-1.5 bg-[#FF2D55] hover:bg-[#ff1a47] text-white rounded font-bold text-xs shadow-[0_0_10px_rgba(255,45,85,0.5)] cursor-pointer">Save & Exit</button>
                              </div>
                            </div>
                            
                            {/* Icon Bar (Toolbox) */}
                            <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                              {Object.entries(HUD_COMPONENTS_MAP).map(([type, config]) => {
                                const isVisible = visualHud.find(v => v.type === type)?.visible;
                              
  return (
                                  <button
                                    key={type}
                                    onClick={(e) => { e.stopPropagation(); toggleVisualItemVisibility(type); }}
                                    className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full border ${isVisible ? 'border-[#FF2D55] bg-[#FF2D55]/20 text-[#FF2D55]' : 'border-white/20 bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'}`}
                                  >
                                    <span className="text-sm">{config.icon}</span>
                                    <span className="text-[10px] font-bold uppercase">{config.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <div className="text-[9px] text-white/50 text-center font-bold">DRAG ITEMS TO MOVE THEM AROUND THE SCREEN</div>
                          </div>
                        </div>
                      )}
                      
                      {isYouTube ? (
                        (isActive || shouldWarm) ? (
                          <>
                          <iframe
                            ref={(el) => {
                              if (el) reelYouTubeRefs.current[idx] = el;
                            }}
                            onLoad={(event) => {
                              const iframeEl = event.currentTarget;
                              const shouldMute = isActive ? reelsMuted : true;
                              syncYouTubePlaybackState(iframeEl, {
                                shouldMute,
                                shouldPlay: isActive && !isPaused,
                              });
                            }}
                            src={`${embed.src}?autoplay=${isActive ? 1 : 0}&mute=${isActive ? (reelsMuted ? 1 : 0) : 1}&loop=1&playlist=${embed.id}&controls=0&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&fs=0&disablekb=1&vq=hd720&enablejsapi=1&origin=${window.location.origin}`}
                            title={item.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="reel-iframe"
                          />
                          <div className="reel-youtube-logo-mask" aria-hidden="true">
                            <span>{siteSettings.site_name || 'Website'}</span>
                          </div>
                          </>
                        ) : (
                          <div
                            className="reel-cover-fallback"
                            style={{ backgroundImage: `url(https://img.youtube.com/vi/${embed.id}/hqdefault.jpg)` }}
                          />
                        )
                      ) : isInstagram ? (
                        (isActive || shouldWarm) ? (
                          <iframe
                            src={`${embed.src}?autoplay=${isActive ? 1 : 0}`}
                            title={item.title}
                            frameBorder="0"
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                            allowFullScreen
                            className="reel-iframe"
                          />
                        ) : (
                          <div
                            className="reel-cover-fallback"
                            style={{ backgroundImage: `url(${resolveMediaUrl(item.cover_image_url)})` }}
                          />
                        )
                      ) : embed.type === 'video' && item.video_url ? (
                        (isActive || shouldWarm) ? (
                          <video
                            ref={(el) => { if (el) reelVideoRefs.current[idx] = el; }}
                            src={resolveMediaUrl(item.video_url)}
                            className="reel-video-el"
                            loop
                            playsInline
                            muted={reelsMuted}
                            autoPlay={isActive && !isPaused}
                            preload={idx === activeReelIndex + 1 || isActive ? 'auto' : 'metadata'}
                            poster={item.cover_image_url ? resolveMediaUrl(item.cover_image_url) : undefined}
                            onLoadedMetadata={(event) => {
                              event.currentTarget.volume = 1;
                            }}
                          />
                        ) : (
                          <div
                            className="reel-cover-fallback"
                            style={{ backgroundImage: `url(${resolveMediaUrl(item.cover_image_url)})` }}
                          />
                        )
                      ) : (
                        <div
                          className="reel-cover-fallback"
                          style={{ backgroundImage: `url(${resolveMediaUrl(item.cover_image_url)})` }}
                        />
                      )}
                      {isPaused && (
                        <div className="reel-pause-indicator">
                          <svg viewBox="0 0 24 24" fill="white" width="64" height="64">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Gradient overlay (non-interactive) */}

                    {/* Watermark & Back Navigation */}
                    <div className="reel-top-overlay" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button 
                          className="reel-back-btn" 
                          onClick={(e) => { e.preventDefault(); if (onClose) { onClose(); } else navigateTo('/'); }}
                          style={{
                            background: 'transparent',
                            boxShadow: 'none',
                            backdropFilter: 'none',
                            fontSize: '28px',
                            textShadow: 'none',
                            padding: 0,
                            marginLeft: '-12px'
                          }}
                        >
                          ←
                        </button>
                        <div className="reel-watermark-logo" style={{
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          marginLeft: '-5px',
                          padding: '4px 10px 4px 6px',
                          borderRadius: '20px'
                        }}>
                          <span style={{ 
                            fontFamily: "'Dancing Script', cursive", 
                            fontWeight: '700', 
                            fontSize: '25px', 
                            color: '#FFFFFF',
                            textShadow: '0 2px 8px rgba(0, 0, 0, 0.65)',
                            pointerEvents: 'none',
                            letterSpacing: '1px'
                          }}>Clips</span>
                        </div>
                      </div>
                      
                      {/* Top right Settings cog dropdown */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', pointerEvents: 'auto', position: 'relative' }}>
                        <button 
                          className="w-9 h-9 rounded-full bg-black/35 text-white flex items-center justify-center border border-white/10  cursor-pointer hover:bg-black/60 transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveDropdownIndex(activeDropdownIndex === idx ? null : idx);
                          }}
                        >
                          <Settings size={18} />
                        </button>
                        
                        {activeDropdownIndex === idx && (
                          <div className="absolute right-0 top-11 bg-black/85 border border-white/15 rounded-xl p-1.5 shadow-2xl z-[150] min-w-[130px]  animate-in fade-in slide-in-from-top-2 duration-150" onClick={(e) => e.stopPropagation()}>
                             {((adminData?.role === 'admin' || adminData?.role === 'superadmin') || (item.creator_id && item.creator_id === localStorage.getItem('adminId')) || (adminData && (item.creator_id === adminData.id || item.creator_id === adminData._id || (item.creator_name && item.creator_name === adminData.name)))) && onDelete && (
                              <button 
                                className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-950/40 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setActiveDropdownIndex(null);
                                  onDelete(item.id || item._id);
                                }}
                              >
                                🗑️ Delete Clip
                              </button>
                            )}
                            <button 
                              className="w-full text-left px-3 py-2 text-xs font-bold text-white hover:bg-white/10 rounded-lg flex items-center gap-2 cursor-pointer transition-colors mt-1"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveDropdownIndex(null);
                                setIsHUDEditMode(true);
                              }}
                            >
                              👆 Edit Gesture HUD
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Visual HUD Render Engine */}
                    {Math.abs(idx - activeReelIndex) <= 2 && visualHud.map(v => renderVisualComponent(v.type, item, idx))}

                    {/* Reel counter (top-right) */}
                    {/* Reel counter removed */}

                    {/* Desktop nav arrows */}
                    {idx > 0 && (
                      <button
                        className="reel-nav-btn reel-nav-up"
                        onClick={() => {
                          reelsContainerRef.current?.querySelector(`[data-reel-idx="${idx - 1}"]`)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >↑</button>
                    )}
                    {idx < reelItems.length - 1 && (
                      <button
                        className="reel-nav-btn reel-nav-down"
                        onClick={() => {
                          reelsContainerRef.current?.querySelector(`[data-reel-idx="${idx + 1}"]`)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >↓</button>
                    )}

                    {/* Comments Panel inside the reel frame */}
                    {showComments && selectedReelForComments === item._id && (
                      <div
                        className="reel-comments-sheet"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CommentsSection
                          reelId={selectedReelForComments}
                          userId={localStorage.getItem('adminId')}
                          adminData={adminData}
                          onNavigateToProfile={onNavigateToProfile}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowComments(false); }}
                          className="reel-comments-close-btn"
                          aria-label="Close comments"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Report Sheet inside the reel frame */}
                    {showReportSheet && reportReelId === item._id && (
                      <div
                        className="reel-comments-sheet"
                        onClick={(e) => e.stopPropagation()}
                        style={{ zIndex: 110 }}
                      >
                        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
                          <h3 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: '18px', marginBottom: '16px', color: '#fff' }}>
                            {reportSuccess ? '✅ Report Submitted!' : '🚩 Report this Clip'}
                          </h3>
                          {reportSuccess ? (
                            <p style={{ color: '#a3a3a3', fontSize: '14px' }}>Thank you for reporting. Our team will review this clip.</p>
                          ) : (
                            <>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                {['Inappropriate Content', 'Spam', 'Copyright Violation', 'Misinformation', 'Harassment', 'Other'].map(reason => (
                                  <button
                                    key={reason}
                                    onClick={() => setReportReason(reason)}
                                    style={{
                                      padding: '12px 16px',
                                      borderRadius: '12px',
                                      border: reportReason === reason ? '1.5px solid #00FFFF' : '1px solid rgba(255,255,255,0.1)',
                                      background: reportReason === reason ? 'rgba(0, 255, 255, 0.1)' : 'rgba(255,255,255,0.05)',
                                      color: '#fff',
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      fontFamily: 'Montserrat, sans-serif',
                                      fontSize: '13px',
                                      fontWeight: reportReason === reason ? 600 : 400,
                                      transition: 'all 0.2s',
                                    }}
                                  >{reason}</button>
                                ))}
                              </div>
                              <textarea
                                placeholder="Additional details (optional)..."
                                value={reportDetails}
                                onChange={(e) => setReportDetails(e.target.value)}
                                style={{
                                  width: '100%',
                                  minHeight: '60px',
                                  padding: '12px',
                                  borderRadius: '12px',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  background: 'rgba(255,255,255,0.05)',
                                  color: '#fff',
                                  fontSize: '13px',
                                  fontFamily: 'Montserrat, sans-serif',
                                  resize: 'vertical',
                                  outline: 'none',
                                  marginBottom: '12px',
                                }}
                              />
                              <button
                                disabled={!reportReason || reportSubmitting}
                                onClick={async () => {
                                  setReportSubmitting(true);
                                  trackEvent('report_submit', item._id);
                                  await sendContentReport(item._id, 'clip', reportReason, reportDetails);
                                  setReportSubmitting(false);
                                  setReportSuccess(true);
                                  setTimeout(() => setShowReportSheet(false), 2000);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '14px',
                                  borderRadius: '14px',
                                  border: 'none',
                                  background: reportReason ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'rgba(255,255,255,0.1)',
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '14px',
                                  fontFamily: 'Montserrat, sans-serif',
                                  cursor: reportReason ? 'pointer' : 'not-allowed',
                                  opacity: reportReason ? 1 : 0.5,
                                  transition: 'all 0.2s',
                                }}
                              >
                                {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                              </button>
                            </>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowReportSheet(false); }}
                          className="reel-comments-close-btn"
                          aria-label="Close report"
                        >✕</button>
                      </div>
                    )}                  </div>
                );
              })}

              {/* User Profile Modal */}
              {selectedUserId && (
                <UserProfileView
                  userId={selectedUserId}
                  onClose={() => setSelectedUserId(null)}
                />
              )}

              <style>{`
                @keyframes slideInRight {
                  from { transform: translateX(100%); }
                  to { transform: translateX(0); }
                }
              `}</style>

              {/* Floating Upload Button (FAB) */}
              {adminToken && (
                <div className="reel-creator-mode-switch">
                  <button
                    className={`reel-mode-btn ${reelCreatorMode === 'auto' ? 'active' : ''}`}
                    onClick={() => setReelCreatorMode('auto')}
                    title="Auto creator IDs"
                  >
                    Auto IDs
                  </button>
                  <button
                    className={`reel-mode-btn ${reelCreatorMode === 'official' ? 'active' : ''}`}
                    onClick={() => setReelCreatorMode('official')}
                    title="Seen.Ly demo ID"
                  >
                    Demo ID
                  </button>
                </div>
              )}

              {adminToken && (
                <button
                  className="reel-upload-fab"
                  onClick={() => reelUploadInputRef.current?.click()}
                  title="Upload New Clip"
                >
                  <span className="reel-upload-fab-icon">＋</span>
                  <span className="reel-upload-fab-label">Upload</span>
                </button>
              )}
              <input
                ref={reelUploadInputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={handleReelFileUpload}
              />

              {/* Upload progress toast */}
              {videoUploadState.state === 'loading' && (
                <div className="reel-upload-toast">
                  <div className="reel-upload-toast-header">
                    <span className="reel-upload-toast-label">📤 Uploading clip...</span>
                    <strong className="reel-upload-toast-pct">{reelUploadProgress}%</strong>
                  </div>
                  <div className="reel-upload-progress-track">
                    <div
                      className="reel-upload-progress-fill"
                      style={{ width: `${reelUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {videoUploadState.state === 'online' && (
                <div className="reel-upload-toast reel-upload-toast-success">
                  <span>✅ {videoUploadState.message}</span>
                </div>
              )}
              {videoUploadState.state === 'error' && (
                <div className="reel-upload-toast reel-upload-toast-error">
                  <span>❌ {videoUploadState.message}</span>
                </div>
              )}
            </div>
  );
}
