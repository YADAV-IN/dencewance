import React, { useState } from 'react';
import { uploadMediaToAppwrite } from '../utils/appwriteClient';
import SkeletonImage from './SkeletonImage';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://alok-backend.onrender.com');

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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusText, setUploadStatusText] = useState('0%');

  // Uploader Identity
  const [uploaderType, setUploaderType] = useState('official');
  const [uploaderName, setUploaderName] = useState('');

  const uploadToAppwrite = async (file, bucketId) => {
    return await uploadMediaToAppwrite(file, bucketId, (progress) => {
        setUploadProgress(Math.round(progress.progress));
        setUploadStatusText(`${Math.round(progress.progress)}%`);
    });
  };

  const handleCreatePost = async (e) => {
    if (e) e.preventDefault();
    if (!postCover) return alert("Please select an image");
    setIsUploading(true);
    try {
      const imageUrl = await uploadToAppwrite(postCover, 'alok_media');
      const res = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: postContent ? postContent.slice(0, 30) : 'New Photo Post',
          caption: postContent,
          excerpt: postContent ? postContent.slice(0, 100) : 'Photo.',
          content: postContent || 'Photo post without caption.',
          image_url: imageUrl,
          cover_image_url: imageUrl,
          category: 'social',
          status: 'published',
          creator_mode: uploaderType,
          custom_author_name: uploaderName
        })
      });
      if (!res.ok) throw new Error('Failed to create post');
      alert('Post Created Successfully!');
      setPostContent(''); setPostCover(null); setPostCoverPreview('');
      const savedPost = await res.json();
      if (onComplete) onComplete(savedPost); else window.location.reload();
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
        videoUrl = await uploadToAppwrite(reelVideoFile, 'alok_media');
      }
      const res = await fetch(`${API_URL}/api/reels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: reelCaption.slice(0, 20) || 'Viral Reel',
          caption: reelCaption,
          video_url: videoUrl,
          status: 'published',
          creator_mode: uploaderType,
          custom_author_name: uploaderName
        })
      });
      if (!res.ok) throw new Error('Failed to create Reel');
      const savedReel = await res.json();
      alert('Video Story (Reel) Uploaded Successfully!');
      setReelCaption(''); setReelVideoFile(null); setReelVideoPreview(''); setReelVideoUrlInput('');
      finalizeReelUpload(savedReel);
    } catch (err) {
      alert('Upload Error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // When finished successfully navigate to new reel
  const finalizeReelUpload = (savedReel) => {
      if(savedReel && savedReel.data && savedReel.data.id) {
         window.location.hash = '#viewReel=' + savedReel.data.id;
      }
      if (onComplete) onComplete(savedReel);
      else window.location.reload();
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

      {/* Upload Identity Option */}
      <div className="flex flex-col gap-2 p-4 pt-1 mb-4 border-b border-gray-800">
        <label className="text-gray-400 text-xs font-bold tracking-wider uppercase">Posting As Profile</label>
        <div className="flex bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <button className={`flex-1 py-3 text-sm font-semibold transition ${uploaderType === 'official' ? 'bg-cyan-600 text-black' : 'text-gray-400 hover:text-white'}`} onClick={() => setUploaderType('official')}>
             Official
          </button>
          <button className={`flex-1 py-3 text-sm font-semibold transition ${uploaderType === 'male' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`} onClick={() => setUploaderType('male')}>
             Male
          </button>
          <button className={`flex-1 py-3 text-sm font-semibold transition ${uploaderType === 'female' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`} onClick={() => setUploaderType('female')}>
             Female
          </button>
        </div>
        
        {uploaderType !== 'official' && (
          <input 
            type="text" 
            placeholder="Custom Author Name (Optional)" 
            value={uploaderName} 
            onChange={(e) => setUploaderName(e.target.value)}
            className="w-full bg-gray-900 text-gray-200 border border-gray-800 rounded-lg p-3 text-sm focus:outline-none focus:border-cyan-500 transition-colors mt-2" 
          />
        )}
      </div>

      <div className="p-4 pt-0 flex-1 overflow-y-auto">
        {activeTab === 'post' ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="w-full aspect-square bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center relative border border-gray-800">
              {postCoverPreview ? (
                <>
                    <SkeletonImage src={postCoverPreview} className="w-full h-full object-cover" alt="Preview" wrapperStyle={{ width: '100%', height: '100%', display: 'block' }} />
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
            {isUploading && (
              <div className="w-full mb-4">
                 <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Uploading...</span>
                    <span className="font-bold text-white">{uploadStatusText}</span>
                 </div>
                 <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden outline outline-1 outline-gray-600 relative">
                    <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 h-full transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
                 </div>
              </div>
            )}
            {isUploading && (
              <div className="w-full mb-4">
                 <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Uploading...</span>
                    <span className="font-bold text-white">{uploadStatusText}</span>
                 </div>
                 <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden outline outline-1 outline-gray-600 relative">
                    <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 h-full transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
                 </div>
              </div>
            )}
            <button onClick={handleCreatePost} disabled={isUploading} className="w-full bg-blue-500 rounded-lg p-3 font-semibold disabled:opacity-50 mt-4">
              {isUploading ? `Uploading... ${uploadStatusText}` : 'Share Post'}
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
            
            
            {isUploading && (
              <div className="w-full mb-4 mt-2">
                 <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Uploading Video...</span>
                    <span className="font-bold text-white text-sm">{uploadStatusText}</span>
                 </div>
                 <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden outline outline-1 outline-gray-600 relative">
                    <div className="bg-green-500 h-full transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
                 </div>
              </div>
            )}
            <button onClick={handleCreateReel} disabled={isUploading} className="w-full bg-blue-500 rounded-lg p-3 font-semibold disabled:opacity-50 mt-4">
              {isUploading ? `Uploading... ${uploadStatusText}` : 'Share Video Story'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
