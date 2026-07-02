import React, { useState, useEffect } from 'react';
import { 
  X, Heart, MessageSquare, Repeat2, Bookmark, BarChart2, 
  Sparkles, ShieldAlert, Share, ArrowRight
} from 'lucide-react';

import VerifiedBadge from './VerifiedBadge';

const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string' || url === 'null' || url === 'undefined') return '';
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function XInstaHybridModal({ post, onClose, adminData, onLikeToggle, isLiked, initialLikesCount, onNavigateToProfile }) {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(initialLikesCount || post.likes || 0);
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 50);
  }, []);

  const handleLike = (e) => {
    e.stopPropagation();
    const newLikedState = !localIsLiked;
    setLocalIsLiked(newLikedState);
    setLocalLikeCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
    if (onLikeToggle) onLikeToggle(post.id || post._id);
  };

  if (!post) return null;

  const authorId = post.author_id || post.creator_id || 'anonymous';
  const authorName = post.author_name || 'Preetam Singh';
  const authorHandle = (typeof post.author_name === 'string' ? post.author_name.trim().toLowerCase().replace(/\s+/g, '') : 'preetam');
  
  const baseCount = localLikeCount || 15;
  const replyCount = Math.floor(baseCount * 0.4);
  const viewCount = baseCount * (post.views ? post.views : 142);
  const imageUrl = resolveMediaUrl(post.cover_image_url || post.image_url);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-0 md:p-8 bg-black/20 backdrop-blur-md transition-opacity duration-300" onClick={onClose}>
      
      {/* 
        MINIMALIST PREMIUM MODAL (Apple/Vercel Aesthetic)
        Pure white, perfect borders, huge soft shadows, flawless alignment.
      */}
      <div 
        className={`w-full h-full md:w-[95%] md:max-w-[1100px] md:h-[85%] bg-white md:rounded-[32px] overflow-hidden flex flex-col md:flex-row relative shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] ring-1 ring-black/5 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] transform ${isLoaded ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-[0.98]'}`}
        onClick={e => e.stopPropagation()}
      >
        
        <button onClick={onClose} className="md:hidden absolute top-4 right-4 z-50 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-black border border-black/10 shadow-sm">
          <X size={18} strokeWidth={2.5} />
        </button>

        {/* LEFT PANE: Uncompromising Media Presentation */}
        <div className="w-full h-[40dvh] md:h-full md:w-[50%] bg-[#F7F7F7] relative flex items-center justify-center shrink-0 border-b md:border-b-0 md:border-r border-black/5">
           {imageUrl ? (
               <img 
                 src={imageUrl} 
                 alt={post.title}
                 className="w-full h-full object-cover"
               />
           ) : (
             <div className="text-gray-400 font-medium">No Media Available</div>
           )}
        </div>

        {/* RIGHT PANE: Pristine Reading Experience */}
        <div className="w-full flex-1 md:w-[50%] flex flex-col h-[60dvh] md:h-full overflow-hidden bg-white relative">
          
          {/* Header */}
          <div className="px-8 py-6 flex items-center justify-between shrink-0 border-b border-black/5">
             <div className="flex items-center gap-4 cursor-pointer group" onClick={() => { onClose(); if (onNavigateToProfile) onNavigateToProfile(authorId); }}>
                <img src={`https://ui-avatars.com/api/?name=${authorHandle}&background=random`} alt="Author" className="w-12 h-12 rounded-full object-cover border border-black/10 group-hover:scale-105 transition-transform" />
                <div className="flex flex-col">
                  <span className="font-bold text-[16px] text-black tracking-tight flex items-center gap-1.5">
                    {authorName}
                    {((authorId === adminData?.id && adminData?.is_verified) || post.author_is_verified || post.badge_type) && (
                      <VerifiedBadge 
                        type={post.badge_type || 'blue'}
                        size={16} 
                      />
                    )}
                  </span>
                  <span className="text-gray-500 text-[14px] font-medium tracking-tight">@{authorHandle}</span>
                </div>
             </div>
             
             <div className="flex items-center gap-4">
               <button className="bg-black hover:bg-gray-800 text-white text-[14px] font-semibold px-5 py-2 rounded-full transition-colors shadow-sm">
                 Follow
               </button>
               <button className="hidden md:flex text-gray-400 hover:text-black hover:bg-gray-100 p-2 rounded-full transition-colors" onClick={onClose}>
                 <X size={20} strokeWidth={2} />
               </button>
             </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6 hide-scrollbar pb-32">
             
             {/* Content */}
             <div className="text-[17px] text-black leading-[1.6] whitespace-pre-wrap font-medium tracking-tight">
               {post.content || post.title || 'Incredible moments captured beautifully. 🌟'}
             </div>
             
             {/* Views & Date */}
             <div className="mt-6 flex items-center gap-2 text-[14px] text-gray-500 font-medium">
               <span className="text-black font-semibold">{viewCount.toLocaleString()} Views</span>
               <span>·</span>
               <span>{new Date().toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})}</span>
             </div>

             {/* AI Summary - Refined Minimalist */}
             <div className="mt-8 border border-black/10 rounded-2xl p-1">
                {!aiSummary ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsSummarizing(true); setTimeout(() => setAiSummary("An engaging update featuring immersive visuals and highly interactive discussions around the recent highlights."), 1200); }}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-3 text-black font-semibold text-[15px]">
                      <Sparkles size={18} className={isSummarizing ? "animate-pulse" : "text-gray-400 group-hover:text-black transition-colors"} />
                      {isSummarizing ? "Analyzing context..." : "AI Thread Summary"}
                    </div>
                    <ArrowRight size={18} className="text-gray-300 group-hover:text-black group-hover:translate-x-1 transition-all" />
                  </button>
                ) : (
                  <div className="p-5 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 text-black font-bold text-[13px] mb-2 uppercase tracking-wider">
                      <Sparkles size={14} /> AI Synthesis
                    </div>
                    <p className="text-gray-600 text-[15px] leading-relaxed font-medium">{aiSummary}</p>
                  </div>
                )}
             </div>

             {/* Community Context - Monochrome Minimal */}
             <div className="mt-6 bg-[#F9F9F9] border border-black/5 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert size={16} className="text-black" />
                  <span className="font-bold text-[13px] text-black tracking-wide uppercase">Community Context</span>
                </div>
                <p className="text-gray-600 text-[14px] leading-relaxed font-medium">
                  This media represents a pre-recorded event. For live interactive sessions, please visit the official broadcasting page.
                </p>
             </div>

             {/* Strict Monochrome Thread */}
             <div className="mt-10 flex flex-col gap-8">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <img src="https://ui-avatars.com/api/?name=Fan&background=random" className="w-10 h-10 rounded-full object-cover" alt="fan" />
                    <div className="w-[1px] bg-gray-200 flex-1 mt-3"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-black text-[15px] tracking-tight">SuperFan</span>
                      <span className="text-gray-500 text-[14px]">@superfan • 2h</span>
                    </div>
                    <p className="text-black text-[15px] leading-relaxed font-medium">The aesthetics here are absolutely unmatched. This is next level!</p>
                  </div>
                </div>
             </div>
          </div>

          {/* Precision Footer Actions */}
          <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-white via-white to-transparent pt-10 flex items-center justify-between border-t border-black/5 backdrop-blur-md">
             
             {/* Left side: Pure clean actions */}
             <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 text-gray-500 hover:text-black transition-colors group">
                  <MessageSquare size={20} strokeWidth={2} className="group-hover:-translate-y-0.5 transition-transform" />
                  <span className="font-semibold text-[15px]">{replyCount}</span>
                </button>
                <button onClick={handleLike} className={`flex items-center gap-2 transition-colors group ${localIsLiked ? 'text-black' : 'text-gray-500 hover:text-black'}`}>
                  <Heart size={20} strokeWidth={2} className={`group-hover:-translate-y-0.5 transition-transform ${localIsLiked ? 'fill-current' : ''}`} />
                  <span className="font-semibold text-[15px]">{localLikeCount}</span>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setIsBookmarked(!isBookmarked); }} className={`transition-colors group ${isBookmarked ? 'text-black' : 'text-gray-500 hover:text-black'}`}>
                  <Bookmark size={20} strokeWidth={2} className={`group-hover:-translate-y-0.5 transition-transform ${isBookmarked ? 'fill-current' : ''}`} />
                </button>
             </div>

             {/* Right side: Input */}
             <div className="flex-1 max-w-[200px] bg-gray-100 rounded-full p-1 pl-4 flex items-center gap-2">
               <input 
                 type="text" 
                 placeholder="Reply..." 
                 className="flex-1 bg-transparent text-[14px] outline-none text-black font-medium"
               />
               <button className="bg-black text-white font-semibold text-[13px] px-4 py-1.5 rounded-full hover:bg-gray-800 transition-colors">
                 Post
               </button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
