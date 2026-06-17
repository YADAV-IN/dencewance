import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

const getCommentAvatar = (authorName, authorAvatar) => {
  if (authorAvatar && typeof authorAvatar === 'string' && authorAvatar.trim() !== '' && 
      !authorAvatar.includes('ui-avatars.com') && !authorAvatar.includes('placeholder') && !authorAvatar.includes('unsplash.com')) {
    if (authorAvatar.startsWith('http') || authorAvatar.startsWith('//') || authorAvatar.startsWith('data:')) {
      return authorAvatar;
    }
    return `${API_URL}${authorAvatar.startsWith('/') ? '' : '/'}${authorAvatar}`;
  }
  let cleanName = String(authorName || 'User').trim();
  if (cleanName.startsWith('+')) {
    cleanName = cleanName.replace(/^\+/, '');
  }
  if (/^\d+$/.test(cleanName) || cleanName.length === 0) {
    cleanName = 'User';
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=0b0b0b&color=fff&size=32`;
};

const ReplyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"></polyline>
    <path d="M20.49 15a9 9 0 1 1-2-8.94"></path>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

export default function CommentsSection({ reelId, userId, adminData, onNavigateToProfile }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [likedComments, setLikedComments] = useState({});

  useEffect(() => {
    loadComments();
  }, [reelId]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/reels/${reelId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const activeUserId = userId || localStorage.getItem('adminId');
    let anonId = '';
    if (!activeUserId) {
      anonId = localStorage.getItem('dwAnonymousCreatorId');
      if (!anonId) {
        anonId = 'anon_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('dwAnonymousCreatorId', anonId);
      }
    }

    const finalUserId = activeUserId || anonId;
    const finalName = localStorage.getItem('userName') || (activeUserId ? 'Scholarly Creator' : 'Anonymous');
    const finalHandle = localStorage.getItem('userHandle') || (activeUserId ? 'user' : 'anon-' + finalUserId.substring(5));
    const finalAvatar = localStorage.getItem('userAvatar') || '';

    setPosting(true);
    try {
      const res = await fetch(`${API_URL}/api/reels/${reelId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: finalUserId,
          author_name: finalName,
          author_handle: '@' + finalHandle.replace(/^@/, ''),
          author_avatar: finalAvatar,
          text: newComment.trim()
        })
      });

      if (res.ok) {
        const comment = await res.json();
        setComments([comment, ...comments]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const res = await fetch(`${API_URL}/api/reels/${reelId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
      });
      if (res.ok) {
        setComments(comments.filter(c => c._id !== commentId));
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const toggleCommentLike = (commentId) => {
    setLikedComments(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 700 }}>💬 {comments.length} Comments</h3>
      </div>

      {/* Comment Input */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}>
        <form onSubmit={handlePostComment} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#fff',
              fontSize: 13,
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#00BFFF'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <button
            type="submit"
            disabled={posting || !newComment.trim()}
            style={{
              background: '#00BFFF',
              color: '#000',
              border: 'none',
              borderRadius: 8,
              padding: '8px 16px',
              fontWeight: 700,
              fontSize: 13,
              cursor: posting || !newComment.trim() ? 'not-allowed' : 'pointer',
              opacity: posting || !newComment.trim() ? 0.5 : 1,
              transition: 'all 0.3s'
            }}
          >
            {posting ? '...' : 'Post'}
          </button>
        </form>
      </div>

      {/* Comments List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {loading ? (
          <div style={{ color: '#666', textAlign: 'center', padding: 32 }}>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div style={{ color: '#666', textAlign: 'center', padding: 32, fontSize: 13 }}>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment._id || comment.id} style={{
              marginBottom: 12,
              padding: 12,
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.05)',
              transition: 'background 0.3s'
            }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'} onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
              {/* Comment Header */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button 
                  onClick={() => onNavigateToProfile && onNavigateToProfile(comment.user_id)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <img
                    src={getCommentAvatar(comment.author_name, comment.author_avatar)}
                    alt={comment.author_name}
                    style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getCommentAvatar('User', null);
                    }}
                  />
                </button>
                <div style={{ flex: 1 }}>
                  <button 
                    onClick={() => onNavigateToProfile && onNavigateToProfile(comment.user_id)}
                    style={{ margin: '0 0 2px 0', color: '#fff', fontSize: 13, fontWeight: 700, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
                  >
                    {comment.author_name}
                  </button>
                  <p style={{ margin: 0, color: '#00BFFF', fontSize: 11 }}>
                    {comment.author_handle}
                  </p>
                </div>
              </div>

              {/* Comment Text */}
              <p style={{ margin: '8px 0', color: '#ddd', fontSize: 13, lineHeight: 1.5, paddingLeft: 40 }}>
                {comment.text}
              </p>

              {/* Comment Actions */}
              <div style={{ display: 'flex', gap: 12, marginTop: 8, paddingLeft: 40, fontSize: 12 }}>
                <button
                  onClick={() => toggleCommentLike(comment._id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: likedComments[comment._id] ? '#FF1493' : '#666',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    transition: 'color 0.3s'
                  }}
                >
                  {likedComments[comment._id] ? '❤️' : '🤍'} {comment.likes || 0}
                </button>
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#666',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    transition: 'color 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#00BFFF'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
                >
                  <ReplyIcon /> Reply
                </button>
                {(userId && (userId === comment.user_id || adminData?.role === 'admin' || adminData?.role === 'superadmin')) && (
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#666',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      transition: 'color 0.3s',
                      marginLeft: 'auto'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ff6666'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
                  >
                    <TrashIcon /> Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
