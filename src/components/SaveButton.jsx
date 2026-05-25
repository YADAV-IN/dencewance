import React, { useState, useEffect } from 'react';
import { logAIActivity } from '../utils/analyticsTracker';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function SaveButton({ reelId, userId, tags = '' }) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && reelId) {
      checkSaved();
    }
  }, [reelId, userId]);

  const checkSaved = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reels/${reelId}/saved-by/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setSaved(data.saved);
      }
    } catch (err) {
      console.error('Failed to check save status:', err);
    }
  };

  const handleSave = async () => {
    if (!userId) {
      alert('Please login to save this reel');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/api/reels/${reelId}/save`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ user_id: userId })
      });

      if (res.ok) {
        const data = await res.json();
        setSaved(data.saved);
        if (data.saved) {
          logAIActivity('save', reelId, 'reel', tags);
        }
      }
    } catch (err) {
      console.error('Failed to save reel:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={loading}
      className="reel-action-btn"
      style={{
        background: 'none',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        color: saved ? '#FFD700' : '#fff',
        transition: 'all 0.3s',
        opacity: loading ? 0.5 : 1,
        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
      }}
      onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'scale(1.1)')}
      onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'scale(1)')}
    >
      <span className="reel-action-icon">
        <svg viewBox="0 0 24 24" fill={saved ? '#FFD700' : 'none'} stroke={saved ? '#FFD700' : 'currentColor'} strokeWidth="2" width="28" height="28">
          <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
        </svg>
      </span>
      <span className="reel-action-count" style={{ fontSize: '10px', marginTop: '2px' }}>
        {saved ? 'Saved' : 'Save'}
      </span>
    </button>
  );
}
