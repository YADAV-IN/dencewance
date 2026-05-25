import React, { useState, useEffect, useRef } from 'react';
import { Heart, Share2, MoreVertical, Volume2, VolumeX, Settings } from 'lucide-react';

import './ReelsViewer.css';
import { translations as tAll } from '../translations';
import UserProfileView from './UserProfileView';
import CommentsSection from './CommentsSection';
import LikeButton from './LikeButton';
import { trackEvent, sendContentReport, sendDeveloperReport } from '../utils/analyticsTracker';

const REEL_PRELOAD_AHEAD = 1; // Kam kiya gaya hai taaki data kam consume ho

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
  const language = localStorage.getItem('socialAppLanguage') || 'en';
  const t = (key, lang) => {
     const translation = tAll[key];
     if (!translation) return key;
     return typeof translation === 'object' ? translation[lang] || translation['en'] : translation;
  };
  const siteSettings = { site_name: 'DenceWance' };


  const isMobile = window.innerWidth <= 768;
  const adminToken = null; // Removed admin actions from client Reels viewer
  const videoUploadState = { state: 'idle', message: '' };
  const [reelCreatorMode, setReelCreatorMode] = useState('auto');
  const reelUploadInputRef = useRef(null);
  const reelUploadProgress = 0;
  const toggleFollowCreator = () => {};
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
  console.log("Rendering ReelsViewer, total reels:", reels.length);

  const [activeReelIndex, setActiveReelIndex] = useState(initialIndex);
  const [reelsMuted, setReelsMuted] = useState(false); // Changed to false by default as requested
  const [likedTracking, setLikedTracking] = useState({}); // Track local likes
  const toggleReelsMute = (e) => {
    e.stopPropagation();
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

  // Sync play/pause strictly to activeReelIndex
  useEffect(() => {
    if (currentPageKey !== 'videos' || !reelsContainerRef.current) return;
    const frames = reelsContainerRef.current.querySelectorAll('.reel-frame');
    frames.forEach((frame) => {
      const idx = parseInt(frame.dataset.reelIdx, 10);
      if (Number.isNaN(idx)) return;
      const isActive = idx === activeReelIndex;
      const videoEl = frame.querySelector('video');
      const iframeEl = frame.querySelector('iframe');
      if (videoEl) {
        videoEl.muted = isActive ? reelsMuted : true;
        if (isActive && !reelPaused.has(idx)) {
          videoEl.play().catch(() => {});
        } else {
          videoEl.pause();
        }
      }
      if (iframeEl) {
        if (isActive && !reelPaused.has(idx)) {
          syncYouTubePlaybackState(iframeEl, { shouldMute: reelsMuted, shouldPlay: true });
        } else {
          postYouTubeCommand(iframeEl, 'stopVideo');
          syncYouTubePlaybackState(iframeEl, { shouldMute: true, shouldPlay: false });
        }
      }
    });
  }, [activeReelIndex, reelPaused, currentPageKey, reelsMuted]);

  // Sync mute state to all native video elements in reels
  useEffect(() => {
    if (currentPageKey !== 'videos' || !reelsContainerRef.current) return;
    const frames = reelsContainerRef.current.querySelectorAll('.reel-frame');
    frames.forEach((frame) => {
      const idx = parseInt(frame.dataset.reelIdx, 10);
      if (Number.isNaN(idx)) return;
      const isActive = idx === activeReelIndex;
      const videoEl = frame.querySelector('video');
      if (videoEl) {
        videoEl.muted = isActive ? reelsMuted : true;
      }
      const iframeEl = frame.querySelector('iframe');
      if (iframeEl) {
        syncYouTubeAudioState(iframeEl, isActive ? reelsMuted : true);
      }
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



  return (
<div className="reels-container" ref={reelsContainerRef}>
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
                  && idx >= activeReelIndex
                  && idx <= activeReelIndex + REEL_PRELOAD_AHEAD;
                return (
                  <div
                    key={item.id}
                    className={`reel-frame${isActive ? ' reel-active' : ''}`}
                    data-reel-idx={idx}
                  >
                    {/* Video layer — tap to pause/play */}
                    <div
                      className="reel-video-wrap"
                      onClick={() => {
                        const v = reelVideoRefs.current[idx];
                        if (v) {
                          if (v.paused) {
                            v.play().catch(() => {});
                            setReelPaused((prev) => { const n = new Set(prev); n.delete(idx); return n; });
                          } else {
                            v.pause();
                            setReelPaused((prev) => { const n = new Set(prev); n.add(idx); return n; });
                          }
                          return;
                        }

                        const y = reelYouTubeRefs.current[idx];
                        if (isYouTube && y) {
                          if (isPaused) {
                            postYouTubeCommand(y, 'playVideo');
                            setReelPaused((prev) => { const n = new Set(prev); n.delete(idx); return n; });
                          } else {
                            postYouTubeCommand(y, 'pauseVideo');
                            setReelPaused((prev) => { const n = new Set(prev); n.add(idx); return n; });
                          }
                        }
                      }}
                    >
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
                            src={`${embed.src}?autoplay=${isActive ? 1 : 0}&mute=${isActive ? (reelsMuted ? 1 : 0) : 1}&loop=1&playlist=${embed.id}&controls=0&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&fs=0&disablekb=1&vq=hd1080&enablejsapi=1&origin=${window.location.origin}`}
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
                        <video
                          ref={(el) => { if (el) reelVideoRefs.current[idx] = el; }}
                          src={resolveMediaUrl(item.video_url)}
                          className="reel-video-el"
                          loop
                          playsInline
                          muted={reelsMuted}
                          autoPlay={isActive && !isPaused}
                          preload={shouldWarm ? 'auto' : 'metadata'}
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
                    <div className="reel-top-overlay" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingLeft: '8px' }}>
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
                          className="w-9 h-9 rounded-full bg-black/35 text-white flex items-center justify-center border border-white/10 backdrop-blur-md cursor-pointer hover:bg-black/60 transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveDropdownIndex(activeDropdownIndex === idx ? null : idx);
                          }}
                        >
                          <Settings size={18} />
                        </button>
                        
                        {activeDropdownIndex === idx && (
                          <div className="absolute right-0 top-11 bg-black/85 border border-white/15 rounded-xl p-1.5 shadow-2xl z-[150] min-w-[130px] backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150" onClick={(e) => e.stopPropagation()}>
                            {((adminData?.role === 'admin') || (item.creator_id === localStorage.getItem('adminId')) || (adminData && (item.creator_id === adminData.id || item.creator_id === adminData._id || item.creator_name === adminData.name)) || localStorage.getItem('adminToken')) && onDelete ? (
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
                            ) : (
                              <div className="px-3 py-2 text-[9px] text-gray-500 font-bold uppercase tracking-wider text-center">
                                No Actions
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right action column (TikTok-style) */}
                    <div className="reel-actions-col">
                      {/* Creator avatar + follow pill */}
                      <button
                        className="reel-creator-pill"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          if (onNavigateToProfile && item.creator_id) {
                            onNavigateToProfile(item.creator_id);
                          } else {
                            setSelectedUserId(item.creator_id || item.creator_name); 
                          }
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <img 
                          loading="lazy" 
                          src={creatorAvatar ? resolveMediaUrl(creatorAvatar) : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.creator_name || 'User')}&background=random`} 
                          alt="creator" 
                          className="reel-creator-avatar-sm" 
                          style={{ objectFit: 'cover', background: '#333' }} 
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.creator_name || 'User')}&background=random`;
                          }}
                        />
                        <button
                          className="reel-follow-fab-btn"
                          onClick={(e) => { e.stopPropagation(); toggleFollowCreator(item); }}
                          title="Follow creator"
                        >＋</button>
                      </button>

                      {/* Like */}
                      <div className="reel-action-item">
                        <LikeButton
                          reelId={item._id}
                          userId={localStorage.getItem('adminId')}
                          initialLikes={item.likes || 0}
                        />
                      </div>

                      {/* Comment / Open comments panel */}
                      <div className="reel-action-item">
                        <button
                          className="reel-action-btn"
                          onClick={(e) => { e.stopPropagation(); setSelectedReelForComments(item._id); setShowComments(true); }}
                        >
                          <span className="reel-action-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                              <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                            </svg>
                          </span>
                        </button>
                        <span className="reel-action-count">💬</span>
                      </div>

                      {/* Bookmark */}
                      <div className="reel-action-item">
                        <button className="reel-action-btn" onClick={(e) => e.stopPropagation()}>
                          <span className="reel-action-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                              <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                            </svg>
                          </span>
                        </button>
                        <span className="reel-action-count">Save</span>
                      </div>

                      {/* Share */}
                      <div className="reel-action-item">
                        <button className="reel-action-btn" onClick={(e) => { e.stopPropagation(); shareReel(item); }}>
                          <span className="reel-action-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" style={{ transform: 'scaleX(-1)' }}>
                              <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                            </svg>
                          </span>
                        </button>
                        <span className="reel-action-count">{formatCompactNumber(item.shares || 0)}</span>
                      </div>

                      {/* Sound */}
                      <div className="reel-action-item">
                        <button className="reel-action-btn" onClick={toggleReelsMute}>
                          <span className="reel-action-icon">
                            {reelsMuted ? (
                              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                              </svg>
                            )}
                          </span>
                        </button>
                        <span className="reel-action-count">{reelsMuted ? 'Off' : 'On'}</span>
                      </div>

                      {/* Report */}
                      <div className="reel-action-item">
                        <button className="reel-action-btn" onClick={(e) => { e.stopPropagation(); trackEvent('report_open', item._id); setReportReelId(item._id); setShowReportSheet(true); setReportSuccess(false); setReportReason(''); setReportDetails(''); }}>
                          <span className="reel-action-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                              <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
                            </svg>
                          </span>
                        </button>
                        <span className="reel-action-count">Report</span>
                      </div>

                      {/* Dev Report */}
                      <div className="reel-action-item">
                        <button className="reel-action-btn" onClick={(e) => { e.stopPropagation(); trackEvent('dev_report', item._id); sendDeveloperReport('user_feedback', `Clip ${item._id} issue reported by user`, { video_id: item._id }); alert('Bug report sent to developer! 🛠️'); }}>
                          <span className="reel-action-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                              <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5c-.49 0-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z"/>
                            </svg>
                          </span>
                        </button>
                        <span className="reel-action-count">Bug</span>
                      </div>

                      {/* Admin: Delete */}
                      {adminToken && onDelete && (
                        <div className="reel-action-item">
                          <button
                            className="reel-action-btn reel-delete-btn"
                            onClick={(e) => { e.stopPropagation(); onDelete(item.id || item._id); }}
                          >
                            <span className="reel-action-icon">
                              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                              </svg>
                            </span>
                          </button>
                          <span className="reel-action-count">Del</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom info area (TikTok-style caption zone) */}
                    
                    <div className="reel-bottom-info">
                      <div className="reel-creator-line">
                        <button 
                          className="reel-creator-handle" 
                          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNavigateToProfile && item.creator_id) {
                              onNavigateToProfile(item.creator_id);
                            }
                          }}
                        >
                          @{item.creator_handle || slugifyText(item.creator_name || 'creator').replace(/-/g, '')}
                          {item.is_official_creator && (
                            <svg viewBox="0 0 24 24" fill="#00FFFF" width="16" height="16" style={{ filter: 'drop-shadow(0 0 2px rgba(0, 255, 255, 0.4))' }}>
                              <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1.8 14.8L6.4 13l1.4-1.4 2.4 2.4 6-6L17.6 9l-7.4 7.8z"/>
                            </svg>
                          )}
                        </button>
                        {item.is_demo_creator && <span className="reel-category-badge">Demo</span>}
                        {item.category && <span className="reel-category-badge">{item.category}</span>}
                      </div>
                      <p className="reel-caption-text">
                        {(item.caption || item.excerpt || item.title || '').slice(0, 120)}
                      </p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="reel-hashtag-row">
                          {item.tags.slice(0, 4).map((tag) => (
                            <span key={tag}>#{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="reel-audio-ticker">
                        <span className="reel-audio-disc">🎵</span>
                        <div className="reel-audio-text-wrap">
                          <span className="reel-audio-text">
                            {item.creator_name || 'ALOK Creator'} · Original Audio
                          </span>
                        </div>
                      </div>
                    </div>

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
                    title="Dencewance demo ID"
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
