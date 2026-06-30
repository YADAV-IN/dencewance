import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function LikeButton({ reelId, userId, initialLikes = 0 }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && reelId) {
      checkLiked();
    }
  }, [reelId, userId]);

  const checkLiked = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reels/${reelId}/liked-by/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikes(data.likes);
      }
    } catch (err) {
      console.error('Failed to check like status:', err);
    }
  };

  const handleLike = async () => {
    if (!userId) {
      alert('Please login to like this reel');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/reels/${reelId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId })
      });

      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikes(data.likes);
      }
    } catch (err) {
      console.error('Failed to like reel:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      className={`hover:scale-105 active:scale-95 transition-transform ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{
        background: 'none',
        border: 'none',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        color: '#fff',
      }}
    >
      <div style={{ filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}>
        <svg 
          viewBox="0 0 24 24" 
          width="28" 
          height="28" 
          stroke={liked ? "#FF2D55" : "currentColor"} 
          strokeWidth="1.5" 
          fill={liked ? "#FF2D55" : "none"} 
          className="transition-colors duration-300"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>
      {likes > 0 && <span className="font-medium text-[13px] drop-shadow-sm">{likes}</span>}
    </button>
  );
}
