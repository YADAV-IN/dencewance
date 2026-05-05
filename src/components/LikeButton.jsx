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
      style={{
        background: 'none',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 14,
        fontWeight: 700,
        color: liked ? '#FF1493' : '#fff',
        transition: 'all 0.3s',
        opacity: loading ? 0.5 : 1,
        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
      }}
      onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.1)')}
      onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
    >
      <span style={{ fontSize: '18px', transition: 'transform 0.3s', display: 'inline-block' }}>
        {liked ? '❤️' : '🤍'}
      </span>
      {likes > 0 && <span>{likes}</span>}
    </button>
  );
}
