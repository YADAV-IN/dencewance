import React, { useState, useEffect } from 'react';
import SkeletonImage from './SkeletonImage';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://alok-backend.onrender.com');

const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
  </svg>
);

const VerifiedIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="#00BFFF"></path>
  </svg>
);

export default function UserProfileView({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [content, setContent] = useState({ reels: [], posts: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reels');

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, contentRes] = await Promise.all([
        fetch(`${API_URL}/api/users/${userId}`),
        fetch(`${API_URL}/api/users/${userId}/content`)
      ]);

      if (profileRes.ok) {
        const pData = await profileRes.json();
        setProfile(pData);
      }

      if (contentRes.ok) {
        const cData = await contentRes.json();
        setContent(cData);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div style={{ background: '#0b0b0b', padding: 40, borderRadius: 16, color: '#fff' }}>
          <div style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>⏳</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div style={{ background: '#0b0b0b', padding: 40, borderRadius: 16, color: '#ff6666', textAlign: 'center' }}>
          <h3>User not found</h3>
          <button onClick={onClose} style={{ marginTop: 16, padding: '10px 20px', background: '#333', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', overflowY: 'auto', zIndex: 9999, paddingBottom: 40 }}>
      {/* Header Close */}
      <button onClick={onClose} style={{ position: 'fixed', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 50, width: 44, height: 44, color: '#fff', cursor: 'pointer', fontSize: 24, zIndex: 10000 }}>✕</button>

      {/* Profile Header */}
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', padding: '40px 20px', borderBottom: '1px solid #333' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          {/* Avatar */}
          <div style={{ marginBottom: 20 }}>
            <img
              src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=1a1a2e&color=fff&size=128`}
              alt={profile.name}
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                border: '3px solid #00BFFF',
                objectFit: 'cover',
                margin: '0 auto'
              }}
            />
          </div>

          {/* Name & Handle */}
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ margin: '8px 0', fontSize: 28, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {profile.name}
              {profile.verified && <VerifiedIcon />}
            </h2>
            <p style={{ margin: 0, color: '#00BFFF', fontSize: 14, fontWeight: 600 }}>@{profile.handle}</p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p style={{ color: '#ccc', fontSize: 14, maxWidth: 600, margin: '16px auto', lineHeight: 1.6 }}>{profile.bio}</p>
          )}

          {/* Stats */}
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#00BFFF' }}>{content.totalReels || 0}</p>
              <p style={{ margin: '6px 0 0 0', color: '#aaa', fontSize: 12 }}>REELS</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#00BFFF' }}>{profile.followers || 0}</p>
              <p style={{ margin: '6px 0 0 0', color: '#aaa', fontSize: 12 }}>FOLLOWERS</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#00BFFF' }}>{profile.following || 0}</p>
              <p style={{ margin: '6px 0 0 0', color: '#aaa', fontSize: 12 }}>FOLLOWING</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 24, borderBottom: '2px solid #333', marginBottom: 32 }}>
          <button
            onClick={() => setActiveTab('reels')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'reels' ? '#00BFFF' : '#666',
              fontSize: 14,
              fontWeight: 700,
              padding: '12px 0',
              borderBottom: activeTab === 'reels' ? '2px solid #00BFFF' : 'none',
              cursor: 'pointer',
              transition: 'all 0.3s',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}
          >
            🎬 Reels ({content.totalReels || 0})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'posts' ? '#00BFFF' : '#666',
              fontSize: 14,
              fontWeight: 700,
              padding: '12px 0',
              borderBottom: activeTab === 'posts' ? '2px solid #00BFFF' : 'none',
              cursor: 'pointer',
              transition: 'all 0.3s',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}
          >
            📝 Posts ({content.totalPosts || 0})
          </button>
        </div>

        {/* Content Grid */}
        {activeTab === 'reels' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {content.reels?.map((reel) => (
              <div key={reel._id || reel.id} style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #333',
                cursor: 'pointer',
                background: '#111',
                transition: 'transform 0.3s, border-color 0.3s',
                ':hover': { transform: 'scale(1.02)', borderColor: '#00BFFF' }
              }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.borderColor = '#00BFFF'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#333'; }}>
                <div style={{
                  height: 250,
                  background: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {reel.cover_image_url ? (
                    <SkeletonImage src={reel.cover_image_url} alt={reel.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ color: '#666', fontSize: 40 }}>▶</div>
                  )}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: 12
                  }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{reel.title || 'Untitled'}</p>
                      <p style={{ margin: 0, color: '#aaa', fontSize: 11 }}>❤️ {reel.likes || 0} • 👁️ {reel.views || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {content.posts?.map((post) => (
              <div key={post._id || post.id} style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #333',
                cursor: 'pointer',
                background: '#111',
                transition: 'transform 0.3s, border-color 0.3s'
              }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.borderColor = '#00BFFF'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = '#333'; }}>
                <div style={{
                  height: 250,
                  background: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {post.cover_image_url ? (
                    <SkeletonImage src={post.cover_image_url} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ color: '#666', fontSize: 40 }}>📰</div>
                  )}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: 12
                  }}>
                    <div>
                      <p style={{ margin: '0 0 4px 0', color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>{post.title || 'Untitled'}</p>
                      <p style={{ margin: 0, color: '#aaa', fontSize: 11 }}>📅 {new Date(post.published_at || post.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'reels' && content.reels?.length === 0) || (activeTab === 'posts' && content.posts?.length === 0)) && (
          <div style={{
            textAlign: 'center',
            padding: 80,
            color: '#666'
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
            <p style={{ fontSize: 16, fontWeight: 600 }}>No {activeTab} yet</p>
            <p style={{ color: '#555', fontSize: 14 }}>This user hasn't posted any {activeTab} yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
