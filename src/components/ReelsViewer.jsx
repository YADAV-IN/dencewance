import React, { useState, useEffect, useRef } from 'react';
import { Heart, Share2, MoreVertical, Volume2, VolumeX } from 'lucide-react';
import { demoReels } from './demoData';
import { translations as tAll } from '../translations';

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

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://server-kappa-lac.vercel.app');

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

export default function ReelsViewer({ reels: fallbackData = [], initialIndex = 0, onClose, onDelete, adminData }) {
  const language = localStorage.getItem('socialAppLanguage') || 'en';
  const t = (key, lang) => {
     const translation = tAll[key];
     if (!translation) return key;
     return typeof translation === 'object' ? translation[lang] || translation['en'] : translation;
  };
  const siteSettings = { site_name: 'ModeBook' };


  const isMobile = window.innerWidth <= 768;
  const adminToken = null; // Removed admin actions from client Reels viewer
  const videoUploadState = { state: 'idle', message: '' };
  const [reelCreatorMode, setReelCreatorMode] = useState('auto');
  const reelUploadInputRef = useRef(null);
  const reelUploadProgress = 0;
  const toggleFollowCreator = () => {};
  const handleReelLike = () => {};
  const handleReelFileUpload = () => {};
  const navigateTo = () => { /* Handle back navigation nicely if needed */ };
  const openReel = () => {};
  const shareReel = () => {};
  const deleteReel = () => {};
  const formatCompactNumber = (n) => {
    if (!n) return '0';
    return Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  };
  const slugifyText = (t) => (typeof t === 'string' ? t : '').toLowerCase().replace(/\s+/g, '-');
  const reelsUrlInput = '';

  const reels = fallbackData && fallbackData.length > 0 ? fallbackData : demoReels;
  const reelItems = reels;
  const currentPageKey = 'videos';
  console.log("Rendering ReelsViewer, total reels:", reels.length);

  const [activeReelIndex, setActiveReelIndex] = useState(initialIndex);
  const [reelsMuted, setReelsMuted] = useState(true);
  const toggleReelsMute = (e) => {
    e.stopPropagation();
    setReelsMuted(!reelsMuted);
  };

  const [reelPaused, setReelPaused] = useState(new Set());
  const [isStoryPage, setIsStoryPage] = useState(false);
  const [routeStory, setRouteStory] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);

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
                <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100dvh', width: '100%', background: '#000', zIndex: 999 }}>
                  <div className="pulse-dot" style={{ width: '20px', height: '20px', marginBottom: '16px' }}></div>
                  <h3>Loading Video Stories...</h3>
                  <p style={{ opacity: 0.6, fontSize: '14px', marginTop: '8px' }}>Please wait while content is loading or check your connection.</p>
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
                          <svg viewBox="0 0 24 24" fill="white" width="64" height="64" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Gradient overlay (non-interactive) */}
                    <div className="reel-gradient-overlay" />

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
                          background: 'rgba(0, 0, 0, 0.4)',
                          padding: '4px 10px 4px 6px',
                          borderRadius: '20px',
                          backdropFilter: 'blur(5px)',
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                          <svg className="modebook-logo-animated" viewBox="0 0 100 100" width="22" height="22" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
                            <defs>
                              <linearGradient id="multiGradWatermark" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#fff" />
                                <stop offset="50%" stopColor="#e0e0e0" />
                                <stop offset="100%" stopColor="#aaa" />
                              </linearGradient>
                            </defs>
                            <g transform="translate(50, 50)">
                              <circle cx="0" cy="0" r="42" fill="none" stroke="url(#multiGradWatermark)" strokeWidth="6" className={isActive ? "spin-slow" : ""} />
                              <circle cx="0" cy="0" r="30" fill="none" stroke="url(#multiGradWatermark)" strokeWidth="4" className={isActive ? "spin-reverse" : ""} strokeDasharray="10 10" />
                              <polygon points="0,-18 16,9 -16,9" fill="url(#multiGradWatermark)" />
                            </g>
                          </svg>
                          <span style={{ 
                            fontFamily: "'Cinzel', serif", 
                            fontWeight: '900', 
                            fontSize: '15px', 
                            color: 'rgba(255,255,255,0.95)',
                            letterSpacing: '1px',
                            textTransform: 'uppercase',
                            textShadow: '0 2px 5px rgba(0,0,0,0.8)'
                          }}>ModeBook</span>
                        </div>
                      </div>
                      
                      {((adminData?.role === 'admin') || (item.creator_id === localStorage.getItem('adminId')) || (adminData && (item.creator_id === adminData.id || item.creator_id === adminData._id || item.creator_name === adminData.name)) || localStorage.getItem('adminToken')) && onDelete && (
                        <button 
                          className="reel-delete-btn" 
                          onClick={(e) => { e.preventDefault(); onDelete(item.id || item._id); }}
                          style={{
                            background: 'rgba(255, 0, 0, 0.7)',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            backdropFilter: 'blur(4px)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            marginRight: '20px'
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {/* Right action column (TikTok-style) */}
                    <div className="reel-actions-col">
                      {/* Creator avatar + follow pill */}
                      <div className="reel-creator-pill">
                        {creatorAvatar ? (
                          <img loading="lazy" src={resolveMediaUrl(creatorAvatar)} alt="creator" className="reel-creator-avatar-sm" style={{ objectFit: 'cover' }} />
                        ) : (
                          <div className="reel-creator-avatar-sm">{creatorInitial}</div>
                        )}
                        <button
                          className="reel-follow-fab-btn"
                          onClick={(e) => { e.stopPropagation(); toggleFollowCreator(item); }}
                          title="Follow creator"
                        >＋</button>
                      </div>

                      {/* Like */}
                      <div className="reel-action-item">
                        <button className="reel-action-btn" onClick={(e) => { e.stopPropagation(); handleReelLike(item); }}>
                          <span className="reel-action-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          </span>
                        </button>
                        <span className="reel-action-count">{formatCompactNumber(item.likes || 0)}</span>
                      </div>

                      {/* Comment / Open reel page */}
                      <div className="reel-action-item">
                        <button className="reel-action-btn" onClick={(e) => { e.stopPropagation(); openReel(item); }}>
                          <span className="reel-action-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                              <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                            </svg>
                          </span>
                        </button>
                        <span className="reel-action-count">12</span>
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

                      {/* Admin: Delete */}
                      {adminToken && (
                        <div className="reel-action-item">
                          <button
                            className="reel-action-btn reel-delete-btn"
                            onClick={(e) => { e.stopPropagation(); deleteReel(item.id || item._id); }}
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
                    {/* FLOATING WATERMARK */}
                    <div className="reel-floating-watermark" style={{
                      position: 'absolute',
                      bottom: '120px',
                      right: '15px',
                      opacity: 0.7,
                      pointerEvents: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                      zIndex: 10
                    }}>
                      <svg viewBox="0 0 100 100" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                        <g transform="translate(50, 50)">
                          <circle cx="0" cy="0" r="42" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="6" />
                          <circle cx="0" cy="0" r="30" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="4" strokeDasharray="10 10" />
                          <polygon points="0,-18 16,9 -16,9" fill="rgba(255,255,255,0.9)" />
                        </g>
                      </svg>
                      <span style={{
                        marginTop: '4px',
                        fontFamily: "'Cinzel', serif",
                        fontWeight: '900',
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.9)',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                      }}>MODEBOOK</span>
                    </div>
                    
                    {/* FLOATING WATERMARK */}
                    <div className="reel-floating-watermark" style={{
                      position: 'absolute',
                      bottom: '120px',
                      right: '15px',
                      opacity: 0.7,
                      pointerEvents: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                      zIndex: 10
                    }}>
                      <svg viewBox="0 0 100 100" width="36" height="36" xmlns="http://www.w3.org/2000/svg">
                        <g transform="translate(50, 50)">
                          <circle cx="0" cy="0" r="42" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="6" />
                          <circle cx="0" cy="0" r="30" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="4" strokeDasharray="10 10" />
                          <polygon points="0,-18 16,9 -16,9" fill="rgba(255,255,255,0.9)" />
                        </g>
                      </svg>
                      <span style={{
                        marginTop: '4px',
                        fontFamily: "'Cinzel', serif",
                        fontWeight: '900',
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.9)',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                      }}>MODEBOOK</span>
                    </div>
                    
                    <div className="reel-bottom-info">
                      <div className="reel-creator-line">
                        <strong className="reel-creator-handle">
                          @{item.creator_handle || slugifyText(item.creator_name || 'creator').replace(/-/g, '')}
                        </strong>
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
                    <div className="reel-counter">{idx + 1} / {reelItems.length}</div>

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
                  </div>
                );
              })}

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
                    title="Official admin ID"
                  >
                    Official ID
                  </button>
                </div>
              )}

              {adminToken && (
                <button
                  className="reel-upload-fab"
                  onClick={() => reelUploadInputRef.current?.click()}
                  title="Upload New Reel"
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
                    <span className="reel-upload-toast-label">📤 Uploading reel...</span>
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
