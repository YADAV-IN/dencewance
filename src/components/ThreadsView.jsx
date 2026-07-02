import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageSquare, Repeat2, Send, MoreHorizontal, 
  ArrowLeft, CheckCircle2, ShieldAlert
} from 'lucide-react';

import VerifiedBadge from './VerifiedBadge';
const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string' || url === 'null' || url === 'undefined') return '';
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function ThreadsView({ post, onClose, adminData, onLikeToggle, isLiked, initialLikesCount }) {
  const [localLikeCount, setLocalLikeCount] = useState(initialLikesCount || post.likes || 0);
  const [localIsLiked, setLocalIsLiked] = useState(isLiked);
  const [replyText, setReplyText] = useState('');
  const [threads, setThreads] = useState([]);
  
  // Real-time optimistic update setup
  const addThreadOptimistically = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    const newThread = {
      id: Date.now().toString(),
      author_name: adminData?.name || 'You',
      author_handle: adminData?.username || adminData?.name?.toLowerCase().replace(/\s/g, '') || 'user',
      avatar_url: adminData?.avatar_url || `https://ui-avatars.com/api/?name=${adminData?.name || 'U'}&background=random`,
      is_verified: adminData?.is_verified || false,
      content: replyText,
      time: 'Just now',
      likes: 0,
      replies: 0,
      isLiked: false
    };

    setThreads([newThread, ...threads]);
    setReplyText('');
    
    // In a real app with real-time support:
    // emitSocketEvent('new_thread', { postId: post.id, ...newThread });
    // appwrite.databases.createDocument(...)
  };

  useEffect(() => {
    // Simulated fetch of connected threads (would be real-time subscription here)
    setThreads([
      {
        id: '1',
        author_name: 'Tech Enthusiast',
        author_handle: 'techguy_99',
        avatar_url: 'https://ui-avatars.com/api/?name=Tech+Enthusiast&background=random',
        is_verified: true,
        content: 'This is exactly what the community needed. Have you considered open-sourcing the design system you used here?',
        time: '2h',
        likes: 124,
        replies: 12,
        isLiked: true
      },
      {
        id: '2',
        author_name: 'Sarah Designs',
        author_handle: 'sarah_ui',
        avatar_url: 'https://ui-avatars.com/api/?name=Sarah+Designs&background=random',
        is_verified: false,
        content: 'The typography is incredibly clean. I am definitely branching this idea for my next project.',
        time: '4h',
        likes: 45,
        replies: 2,
        isLiked: false
      },
      {
        id: '3',
        author_name: 'Alex Developer',
        author_handle: 'alex_dev',
        avatar_url: 'https://ui-avatars.com/api/?name=Alex+Developer&background=random',
        is_verified: false,
        content: 'I built something similar last year, but this implementation is much smoother. Great work!',
        time: '5h',
        likes: 12,
        replies: 0,
        isLiked: false
      }
    ]);
  }, []);

  const handleLike = (e) => {
    e.stopPropagation();
    const newLikedState = !localIsLiked;
    setLocalIsLiked(newLikedState);
    setLocalLikeCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
    if (onLikeToggle) onLikeToggle(post.id || post._id);
  };

  if (!post) return null;

  const authorName = post.author_name || 'PREETAM SINGH';
  const authorHandle = (post.author_id === adminData?.id ? (adminData?.username || adminData?.handle) : (post.author_handle || post.author_username)) || (typeof post.author_name === 'string' ? post.author_name.trim().toLowerCase().replace(/\s+/g, '') : 'preetam');
  const imageUrl = resolveMediaUrl(post.cover_image_url || post.image_url);

  return (
    <div className="fixed inset-0 z-[300] bg-white flex flex-col md:flex-row animate-in slide-in-from-right duration-300">
      
      {/* Centered Column for the true Threads/Twitter experience */}
      <div className="w-full md:max-w-[600px] mx-auto h-full flex flex-col border-x border-gray-100 bg-white shadow-xl md:shadow-none">
        
        {/* Header */}
        <div className="flex items-center px-4 h-14 border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-md z-50">
          <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-black" />
          </button>
          <h2 className="ml-4 font-bold text-[17px] text-black">Thread</h2>
        </div>

        {/* Scrollable Feed */}
        <div className="flex-1 overflow-y-auto hide-scrollbar pb-24">
          
          {/* Main Parent Post */}
          <div className="px-4 pt-4 pb-2">
            <div className="flex gap-3">
              {/* Left Column: Avatar & Vertical Line */}
              <div className="flex flex-col items-center">
                <img 
                  src={`https://ui-avatars.com/api/?name=${authorHandle}&background=random`} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer border border-gray-100"
                />
                <div className="w-[2px] bg-gray-200 flex-1 my-2 rounded-full min-h-[30px]"></div>
              </div>

              {/* Right Column: Content */}
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 cursor-pointer">
                    <span className="font-bold text-[15px] text-black leading-none">{authorName}</span>
                    {((post.author_id === adminData?.id && adminData?.is_verified) || post.author_is_verified || (JSON.parse(localStorage.getItem('DEV_ASSIGNED_BADGES') || '{}')[post.author_id])) && (
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
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-[14px]">2h</span>
                    <MoreHorizontal size={18} className="cursor-pointer hover:bg-gray-100 rounded-full" />
                  </div>
                </div>

                <div className="mt-1 text-[15px] text-black leading-[1.5] whitespace-pre-wrap font-medium">
                  {post.content || post.title || 'Welcome to the new Threads view. Join the conversation below!'}
                </div>

                {imageUrl && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 max-h-[400px]">
                    <img src={imageUrl} alt="Post media" className="w-full h-full object-contain" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-6 mt-3 text-gray-500">
                  <button onClick={handleLike} className={`flex items-center gap-1.5 transition-colors group ${localIsLiked ? 'text-red-500' : 'hover:text-red-500'}`}>
                    <div className="p-1.5 -ml-1.5 rounded-full group-hover:bg-red-50">
                      <Heart size={20} strokeWidth={2} className={localIsLiked ? 'fill-current' : ''} />
                    </div>
                    <span className="text-[13px] font-medium">{localLikeCount > 0 ? localLikeCount : ''}</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
                    <div className="p-1.5 -ml-1.5 rounded-full group-hover:bg-blue-50">
                      <MessageSquare size={20} strokeWidth={2} />
                    </div>
                    <span className="text-[13px] font-medium">{threads.length}</span>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors group">
                    <div className="p-1.5 -ml-1.5 rounded-full group-hover:bg-green-50">
                      <Repeat2 size={20} strokeWidth={2} />
                    </div>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors group">
                    <div className="p-1.5 -ml-1.5 rounded-full group-hover:bg-blue-50">
                      <Send size={18} strokeWidth={2} className="-mt-0.5" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Child Threads (Replies) */}
          <div className="border-t border-gray-100/50">
            {threads.map((thread, index) => (
              <div key={thread.id} className="px-4 pt-3 hover:bg-gray-50/50 transition-colors">
                <div className="flex gap-3">
                  {/* Left Column: Avatar & Line */}
                  <div className="flex flex-col items-center">
                    <img 
                      src={thread.avatar_url} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-full object-cover shrink-0 cursor-pointer border border-gray-100"
                    />
                    {/* Only show line if it's NOT the last thread */}
                    {index !== threads.length - 1 && (
                      <div className="w-[2px] bg-gray-200 flex-1 my-2 rounded-full min-h-[30px]"></div>
                    )}
                  </div>

                  {/* Right Column: Content */}
                  <div className="flex-1 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 cursor-pointer">
                        <span className="font-bold text-[15px] text-black leading-none">{thread.author_name}</span>
                        {(thread.is_verified || (JSON.parse(localStorage.getItem('DEV_ASSIGNED_BADGES') || '{}')[thread.author_id || thread.id])) && (
                          <VerifiedBadge 
                            type={(() => {
                              try {
                                const assigned = JSON.parse(localStorage.getItem('DEV_ASSIGNED_BADGES') || '{}');
                                return assigned[thread.author_id || thread.id] || thread.badge_type || 'blue';
                              } catch (e) { return thread.badge_type || 'blue'; }
                            })()}
                            size={14} 
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <span className="text-[14px]">{thread.time}</span>
                        <MoreHorizontal size={18} className="cursor-pointer" />
                      </div>
                    </div>
                    
                    <div className="mt-0.5 text-[15px] text-black leading-[1.4] whitespace-pre-wrap">
                      {thread.content}
                    </div>

                    <div className="flex items-center gap-6 mt-2 text-gray-500">
                      <button className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                        <Heart size={18} strokeWidth={2} className={thread.isLiked ? 'fill-current text-red-500' : ''} />
                        {thread.likes > 0 && <span className="text-[13px] font-medium">{thread.likes}</span>}
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                        <MessageSquare size={18} strokeWidth={2} />
                        {thread.replies > 0 && <span className="text-[13px] font-medium">{thread.replies}</span>}
                      </button>
                      <button className="flex items-center gap-1.5 hover:text-green-500 transition-colors">
                        <Repeat2 size={18} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
        
        {/* Bottom Input Area for creating a new Thread/Branch */}
        <div className="p-3 border-t border-gray-100 bg-white shrink-0 sticky bottom-0 z-50">
          <form onSubmit={addThreadOptimistically} className="flex items-center gap-3">
            <img 
              src={adminData?.avatar_url || `https://ui-avatars.com/api/?name=${adminData?.name || 'U'}&background=random`} 
              className="w-9 h-9 rounded-full bg-gray-100 object-cover" 
              alt="You" 
            />
            <input 
              type="text" 
              placeholder={`Reply to ${authorName}...`} 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="flex-1 bg-gray-100 text-[15px] rounded-full px-4 py-2.5 outline-none text-black placeholder-gray-500"
            />
            <button 
              type="submit" 
              disabled={!replyText.trim()}
              className="text-[#1d9bf0] font-bold text-[15px] px-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
