import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://server-kappa-lac.vercel.app');

export default function CreateInstagramMenu({ onComplete }) {
  const [token] = useState(localStorage.getItem('adminToken') || '');
  const [activeTab, setActiveTab] = useState('post'); // 'post' or 'reel'

  // Post State
  const [postContent, setPostContent] = useState('');
  const [postCover, setPostCover] = useState(null);
  const [postCoverPreview, setPostCoverPreview] = useState('');

  // Reel State
  const [reelCaption, setReelCaption] = useState('');
  const [reelVideoFile, setReelVideoFile] = useState(null);
  const [reelVideoPreview, setReelVideoPreview] = useState('');
  const [reelVideoUrlInput, setReelVideoUrlInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const uploadToR2 = async (file) => {
    try {
      const signRes = await fetch(`${API_URL}/api/uploads/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      });
      const configData = await signRes.json();
      
      if (!signRes.ok) {
        // Fallback to standard proxy
        const formData = new FormData();
        formData.append('media', file);
        const uploadRes = await fetch(`${API_URL}/api/uploads/media`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Proxy upload failed');
        return uploadData.data?.url || uploadData.data;
      }

      // Direct R2
      const s3Res = await fetch(configData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      if (!s3Res.ok) throw new Error('Cloudflare R2 Direct Upload Failed');
      return configData.publicUrl;
    } catch (err) {
      throw err;
    }
  };

  const handleCreatePost = async (e) => {
    if (e) e.preventDefault();
    if (!postCover) return alert("Please select an image");
    setIsUploading(true);
    try {
      const imageUrl = await uploadToR2(postCover);
      const res = await fetch(`${API_URL}/api/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: postContent.slice(0, 30) || 'New Post',
          caption: postContent,
          image_url: imageUrl,
          content: postContent,
          category: 'social',
          status: 'published'
        })
      });
      if (!res.ok) throw new Error('Failed to create post');
      alert('Post Created Successfully!');
      setPostContent(''); setPostCover(null); setPostCoverPreview('');
      if (onComplete) onComplete();
      else window.location.reload();
    } catch (err) {
      alert('Upload Error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateReel = async (e) => {
    if (e) e.preventDefault();
    if (!reelVideoFile && !reelVideoUrlInput) return alert("Please select a video file or enter URL!");
    setIsUploading(true);
    try {
      let videoUrl = reelVideoUrlInput;
      if (reelVideoFile && !reelVideoUrlInput) {
        videoUrl = await uploadToR2(reelVideoFile);
      }
      const res = await fetch(`${API_URL}/api/reels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: reelCaption.slice(0, 20) || 'Viral Reel',
          caption: reelCaption,
          video_url: videoUrl,
          status: 'published'
        })
      });
      if (!res.ok) throw new Error('Failed to create Reel');
      alert('Video Story (Reel) Uploaded Successfully!');
      setReelCaption(''); setReelVideoFile(null); setReelVideoPreview(''); setReelVideoUrlInput('');
      if (onComplete) onComplete();
      else window.location.reload();
    } catch (err) {
      alert('Upload Error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (!token) {
    return <div className="text-center mt-20 text-white font-bold">Please log in via the Profile tab to create content.</div>;
  }

  return (
    <div className="bg-black text-white w-full max-w-2xl mx-auto flex flex-col pb-20 mt-4 h-full">
      <div className="flex font-semibold text-lg flex-1 justify-center mb-4">
         New {activeTab === 'post' ? 'Post' : 'Video Story (Reel)'}
      </div>

      <div className="flex px-4 py-4 gap-4 justify-center border-b border-gray-800">
        <button onClick={()=>setActiveTab('post')} className={`px-6 py-2 rounded-full font-semibold text-sm transition ${activeTab==='post'?'bg-white text-black':'bg-gray-900 text-gray-300'}`}>Post</button>
        <button onClick={()=>setActiveTab('reel')} className={`px-6 py-2 rounded-full font-semibold text-sm transition ${activeTab==='reel'?'bg-white text-black':'bg-gray-900 text-gray-300'}`}>Video Story</button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {activeTab === 'post' ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="w-full aspect-square bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center relative border border-gray-800">
              {postCoverPreview ? (
                <>
                  <img src={postCoverPreview} className="w-full h-full object-cover" alt="Preview"/>
                  <button type="button" onClick={()=>{setPostCover(null); setPostCoverPreview('')}} className="absolute top-2 right-2 bg-black/60 rounded-full w-8 h-8 items-center text-white backdrop-blur">✕</button>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 w-full h-full justify-center">
                  <svg className="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span className="font-semibold text-sm">Select Image for Post</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e)=>{
                    if(e.target.files[0]) {
                      setPostCover(e.target.files[0]);
                      setPostCoverPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </label>
              )}
            </div>
            <textarea placeholder="Write a post caption..." className="bg-gray-900 p-4 border border-gray-800 rounded-lg text-white text-sm mt-2 w-full min-h-[100px] resize-none" value={postContent} onChange={e=>setPostContent(e.target.value)}></textarea>
            <button onClick={handleCreatePost} disabled={isUploading} className="w-full bg-blue-500 rounded-lg p-3 font-semibold disabled:opacity-50 mt-4">
              {isUploading ? 'Sharing Post...' : 'Share Post'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="w-full aspect-[9/16] max-h-[400px] bg-gray-900 mx-auto rounded-xl overflow-hidden flex items-center justify-center relative border border-gray-800">
              {reelVideoPreview ? (
                <>
                  <video src={reelVideoPreview} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                  <button type="button" onClick={()=>{setReelVideoFile(null); setReelVideoPreview('')}} className="absolute top-2 right-2 bg-black/60 rounded-full w-8 h-8 flex justify-center items-center text-white backdrop-blur">✕</button>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 w-full h-full justify-center">
                  <svg className="w-12 h-12 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  <span className="font-semibold text-sm">Select Video Story</span>
                  <input type="file" accept="video/*" className="hidden" onChange={(e)=>{
                    if(e.target.files[0]) {
                      setReelVideoFile(e.target.files[0]);
                      setReelVideoPreview(URL.createObjectURL(e.target.files[0]));
                    }
                  }} />
                </label>
              )}
            </div>
            
            <div className="flex items-center w-full my-1">
               <hr className="flex-1 border-gray-800"/>
               <span className="px-3 text-xs text-gray-500 font-bold uppercase tracking-widest">OR</span>
               <hr className="flex-1 border-gray-800"/>
            </div>

            <input type="text" placeholder="Paste a Video URL directly (for huge files)" className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-gray-500 mb-2" value={reelVideoUrlInput} onChange={e=>setReelVideoUrlInput(e.target.value)} />
            <textarea placeholder="Write a reel caption..." className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-white focus:ring-0 text-sm w-full min-h-[100px] resize-none" value={reelCaption} onChange={e=>setReelCaption(e.target.value)}></textarea>
            
            <button onClick={handleCreateReel} disabled={isUploading} className="w-full bg-blue-500 rounded-lg p-3 font-semibold disabled:opacity-50 mt-4">
              {isUploading ? 'Sharing Video Story...' : 'Share Video Story'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
