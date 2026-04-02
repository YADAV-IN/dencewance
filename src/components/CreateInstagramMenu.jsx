import React, { useState } from 'react';
import './CreateInstagramMenu.css';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://server-kappa-lac.vercel.app');

export default function CreateInstagramMenu({ onComplete }) {
  const [token] = useState(localStorage.getItem('adminToken') || '');
  const [activeTab, setActiveTab] = useState('post'); // 'post' or 'reel'

  // Post State
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCover, setPostCover] = useState(null);
  const [postCoverPreview, setPostCoverPreview] = useState('');

  // Reel State
  const [reelTitle, setReelTitle] = useState('');
  const [reelCaption, setReelCaption] = useState('');
  const [reelVideoFile, setReelVideoFile] = useState(null);
  const [reelVideoPreview, setReelVideoPreview] = useState('');
  
  const [isUploading, setIsUploading] = useState(false);

  if (!token) {
    return (
      <div className="ig-create-container">
        <div className="ig-create-card">
          <h2>Create</h2>
          <p>Please log in from the Profile tab first to create posts.</p>
        </div>
      </div>
    );
  }

  const handlePostCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostCover(file);
      setPostCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleReelVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReelVideoFile(file);
      setReelVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postCover) return alert("Please select an image");
    setIsUploading(true);
    try {
      let currentCoverUrl = '';
      const formData = new FormData();
      formData.append('cover', postCover);
      const uploadRes = await fetch(`${API_URL}/api/uploads/cover`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        currentCoverUrl = uploadData.data?.url || uploadData.data;
      }

      const payload = {
        title: postTitle || "Untitled",
        content: postContent || " ", // At least space
        excerpt: postContent.substring(0, 50) || " ",
        status: 'published',
        creator_mode: 'official',
        cover_image_url: currentCoverUrl
      };

      const res = await fetch(`${API_URL}/api/news`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert('Post published successfully!');
        if (onComplete) onComplete();
      } else {
        alert('Failed to publish post');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating post');
    }
    setIsUploading(false);
  };

  const handleCreateReel = async (e) => {
    e.preventDefault();
    if (!reelVideoFile) return alert("Please select a video file!");
    setIsUploading(true);
    try {
      let videoUrl = '';
      const formData = new FormData();
      formData.append('media', reelVideoFile);
      
      const uploadRes = await fetch(`${API_URL}/api/uploads/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        videoUrl = uploadData.data?.url || uploadData.data;
      } else {
        alert('Failed to upload video to media server.');
        setIsUploading(false);
        return;
      }

      const payload = {
        title: reelTitle || "My Reel",
        caption: reelCaption,
        video_url: videoUrl,
        creator_mode: 'official'
      };

      const res = await fetch(`${API_URL}/api/reels`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert('Reel published successfully!');
        if (onComplete) onComplete();
      } else {
        alert('Failed to publish reel.');
      }
    } catch(err) {
      console.error(err);
      alert('Error creating reel. Your video might be too large if connected without R2 bucket.');
    }
    setIsUploading(false);
  };

  return (
    <div className="ig-create-container">
      <div className="ig-create-header">
        <h2>New post</h2>
      </div>

      <div className="ig-create-tabs">
        <button 
          className={`ig-tab ${activeTab === 'post' ? 'active' : ''}`}
          onClick={() => setActiveTab('post')}
        >
          POST
        </button>
        <button 
          className={`ig-tab ${activeTab === 'reel' ? 'active' : ''}`}
          onClick={() => setActiveTab('reel')}
        >
          REEL
        </button>
      </div>

      <div className="ig-create-body">
        {activeTab === 'post' && (
          <form className="ig-create-form" onSubmit={handleCreatePost}>
            <div className="ig-media-upload">
              {postCoverPreview ? (
                <div className="ig-preview-wrap">
                   <img src={postCoverPreview} alt="Preview" className="ig-preview-media" />
                   <button type="button" className="ig-clear-media" onClick={() => {setPostCover(null); setPostCoverPreview('');}}>✕</button>
                </div>
              ) : (
                <label className="ig-upload-label">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 19V5h14v14H5zm8.5-5.5l2.5 3.01L19 19H5l3.5-4.51 2.5 3.01z"></path>
                  </svg>
                  <span>Select Image</span>
                  <input type="file" accept="image/*" onChange={handlePostCoverChange} hidden />
                </label>
              )}
            </div>
            
            <div className="ig-text-inputs">
              <input type="text" placeholder="Title (optional)" value={postTitle} onChange={(e)=>setPostTitle(e.target.value)} />
              <textarea placeholder="Write a caption..." value={postContent} onChange={(e)=>setPostContent(e.target.value)} />
            </div>

            <button type="submit" className="ig-submit-btn" disabled={!postCover || isUploading}>
              {isUploading ? 'Sharing...' : 'Share'}
            </button>
          </form>
        )}

        {activeTab === 'reel' && (
          <form className="ig-create-form" onSubmit={handleCreateReel}>
            <div className="ig-media-upload">
              {reelVideoPreview ? (
                <div className="ig-preview-wrap">
                   <video src={reelVideoPreview} className="ig-preview-media" muted autoPlay loop playsInline />
                   <button type="button" className="ig-clear-media" onClick={() => {setReelVideoFile(null); setReelVideoPreview('');}}>✕</button>
                </div>
              ) : (
                <label className="ig-upload-label reel-upload-color">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"></path>
                  </svg>
                  <span>Select Video</span>
                  <input type="file" accept="video/mp4,video/x-m4v,video/*" onChange={handleReelVideoChange} hidden />
                </label>
              )}
            </div>
            
            <div className="ig-text-inputs">
              <input type="text" placeholder="Title (optional)" value={reelTitle} onChange={(e)=>setReelTitle(e.target.value)} />
              <textarea placeholder="Write a caption..." value={reelCaption} onChange={(e)=>setReelCaption(e.target.value)} />
            </div>

            <button type="submit" className="ig-submit-btn" disabled={!reelVideoFile || isUploading}>
              {isUploading ? 'Sharing...' : 'Share Reel'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
