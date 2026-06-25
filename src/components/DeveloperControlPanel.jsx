import React, { useState } from 'react';
import { uploadMediaToAppwrite } from '../utils/appwriteClient';
import { buildCreatorIdentity, getPreferredCreatorMode } from '../utils/creatorIdentity';
import SkeletonImage from './SkeletonImage';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function CreateInstagramMenu({ token: propToken, onComplete }) {
  const token = propToken || localStorage.getItem('adminToken') || '';
  const [activeTab, setActiveTab] = useState('post'); // 'post', 'reel', 'settings'

  // Settings State
  const [trendingLimit, setTrendingLimit] = useState(Number(localStorage.getItem('TRENDING_REELS_LIMIT')) || 12);
  const [trendingHours, setTrendingHours] = useState(Number(localStorage.getItem('TRENDING_REELS_HOURS')) || 24);
  const [showPyqBubble, setShowPyqBubble] = useState(localStorage.getItem('SHOW_PYQ_BUBBLE') === 'true');

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

  // Music State
  const [musicTitle, setMusicTitle] = useState('');
  const [musicArtist, setMusicArtist] = useState('');
  const [musicFile, setMusicFile] = useState(null);
  const [musicCover, setMusicCover] = useState(null);
  const [musicTracks, setMusicTracks] = useState([]);

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
    const creatorIdentity = buildCreatorIdentity({
      mode: uploaderType,
      seed: postContent || postCover?.name || `post-${Date.now()}`,
      name: uploaderName,
    });
    try {
      const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID || 'media';
      const imageUrl = await uploadToAppwrite(postCover, bucketId);
      const res = await fetch(`${API_URL}/api/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
          custom_author_name: uploaderName,
          ...creatorIdentity
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
    const creatorIdentity = buildCreatorIdentity({
      mode: uploaderType || getPreferredCreatorMode(),
      seed: reelCaption || reelVideoUrlInput || reelVideoFile?.name || `reel-${Date.now()}`,
      name: uploaderName,
    });
    try {
      let videoUrl = reelVideoUrlInput;
      if (reelVideoFile && !reelVideoUrlInput) {
        const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID || 'media';
        videoUrl = await uploadToAppwrite(reelVideoFile, bucketId);
      }
      const res = await fetch(`${API_URL}/api/reels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          title: reelCaption.slice(0, 20) || 'Viral Reel',
          caption: reelCaption,
          video_url: videoUrl,
          status: 'published',
          creator_mode: uploaderType,
          custom_author_name: uploaderName,
          ...creatorIdentity,
          is_active: true
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
      // Call onComplete FIRST to add reel to feed, then navigate
      if (onComplete) {
        // Pass the reel data and let parent handle navigation
        onComplete(savedReel);
      } else {
        // Fallback: just reload page if no parent handler
        setTimeout(() => window.location.reload(), 1000);
      }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('TRENDING_REELS_LIMIT', trendingLimit);
    localStorage.setItem('TRENDING_REELS_HOURS', trendingHours);
    localStorage.setItem('SHOW_PYQ_BUBBLE', showPyqBubble);
    alert('Settings Saved Globally (for this device)! Note: In a real backend, this would sync to all users.');
    // Trigger a custom event to notify PixelPerfectSocialApp to reload reels if needed
    window.dispatchEvent(new Event('trendingSettingsUpdated'));
    window.dispatchEvent(new Event('pyqSettingsUpdated'));
  };

  const handleOpenPyq = () => {
    window.dispatchEvent(new Event('openPyq'));
  };

  const loadMusicTracks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/music`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) setMusicTracks(data.data);
      }
    } catch (err) {
      console.error('Failed to load music tracks', err);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'music') {
      loadMusicTracks();
    }
  }, [activeTab]);

  const handleCreateMusic = async (e) => {
    e.preventDefault();
    if (!musicTitle || !musicFile) return alert("Title and Audio file are required!");
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', musicTitle);
      formData.append('artist', musicArtist);
      formData.append('audio', musicFile);
      if (musicCover) formData.append('cover', musicCover);
      formData.append('developer_secret', 'DENCEWANCE_DEV_2026');

      const res = await fetch(`${API_URL}/api/music`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Failed to upload music');
      alert('Music Track Uploaded Successfully!');
      setMusicTitle(''); setMusicArtist(''); setMusicFile(null); setMusicCover(null);
      loadMusicTracks();
    } catch (err) {
      alert('Upload Error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-black text-white w-full max-w-2xl mx-auto flex flex-col pb-20 mt-4 h-full">
      {!token && (
        <div className="mx-4 mt-4 rounded-xl border border-yellow-700 bg-yellow-950/40 px-4 py-3 text-sm text-yellow-100">
          Anonymous reel upload is enabled. Login is only required for post publishing.
        </div>
      )}
      <div className="flex font-semibold text-lg flex-1 justify-center mb-4">
         New {activeTab === 'post' ? 'Post' : activeTab === 'reel' ? 'Video Story (Reel)' : activeTab === 'music' ? 'Music Track' : 'Settings'}
      </div>

      <div className="flex px-4 py-4 gap-4 justify-center border-b border-gray-800">
        <button onClick={()=>setActiveTab('post')} className={`px-4 py-2 rounded-full font-semibold text-sm transition ${activeTab==='post'?'bg-white text-black':'bg-gray-900 text-gray-300'}`}>Post</button>
        <button onClick={()=>setActiveTab('reel')} className={`px-4 py-2 rounded-full font-semibold text-sm transition ${activeTab==='reel'?'bg-white text-black':'bg-gray-900 text-gray-300'}`}>Video Story</button>
        <button onClick={()=>setActiveTab('music')} className={`px-4 py-2 rounded-full font-semibold text-sm transition ${activeTab==='music'?'bg-white text-black':'bg-gray-900 text-gray-300'}`}>Music</button>
        <button onClick={()=>setActiveTab('settings')} className={`px-4 py-2 rounded-full font-semibold text-sm transition ${activeTab==='settings'?'bg-white text-black':'bg-gray-900 text-gray-300'}`}>Settings</button>
      </div>

      {/* Upload Identity Option */}
      {(activeTab === 'post' || activeTab === 'reel') && (
      <div className="flex flex-col gap-2 p-4 pt-1 mb-4 border-b border-gray-800">
        <label className="text-gray-400 text-xs font-bold tracking-wider uppercase">Posting As Profile</label>
        <div className="flex bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
          <button className={`flex-1 py-3 text-sm font-semibold transition ${uploaderType === 'official' ? 'bg-cyan-600 text-black' : 'text-gray-400 hover:text-white'}`} onClick={() => setUploaderType('official')}>
             Official
          </button>
         <button className={`flex-1 py-3 text-sm font-semibold transition ${uploaderType === 'developer' ? 'bg-emerald-600 text-black' : 'text-gray-400 hover:text-white'}`} onClick={() => setUploaderType('developer')}>
           Developer
         </button>
         <button className={`flex-1 py-3 text-sm font-semibold transition ${uploaderType === 'anonymous' ? 'bg-zinc-600 text-white' : 'text-gray-400 hover:text-white'}`} onClick={() => setUploaderType('anonymous')}>
           Anonymous
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
      )}

      <div className="p-4 pt-0 flex-1 overflow-y-auto">
        {activeTab === 'settings' ? (
          <div className="flex flex-col gap-6 animate-fade-in">
            <h3 className="text-xl font-bold mb-2 text-cyan-400">Trending Clips Configuration</h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-300">Max Trending Clips (Limit)</label>
              <input 
                type="number" 
                min="1" max="100"
                value={trendingLimit} 
                onChange={(e) => setTrendingLimit(Number(e.target.value))}
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-cyan-500" 
              />
              <p className="text-xs text-gray-500">Only this many clips will be shown in the trending section.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-300">Time Window (Hours)</label>
              <input 
                type="number" 
                min="1" max="720"
                value={trendingHours} 
                onChange={(e) => setTrendingHours(Number(e.target.value))}
                className="w-full bg-gray-900 text-white border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-cyan-500" 
              />
              <p className="text-xs text-gray-500">Clips older than this will not be considered trending.</p>
            </div>

            <hr className="border-gray-800 my-2" />
            
            <h3 className="text-xl font-bold text-cyan-400">PYQ Feature Configuration</h3>
            
            <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div>
                <label className="text-sm font-semibold text-gray-300 block">Enable PYQ Bubble</label>
                <p className="text-xs text-gray-500 mt-1">Show floating PYQ button on screen</p>
              </div>
              <button
                onClick={() => setShowPyqBubble(!showPyqBubble)}
                className={`w-12 h-6 rounded-full relative transition-colors ${showPyqBubble ? 'bg-cyan-500' : 'bg-gray-700'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${showPyqBubble ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            
            <button 
              onClick={handleOpenPyq}
              className="w-full border border-gray-600 hover:bg-gray-800 text-gray-300 font-bold py-3 rounded-xl transition"
            >
              Open PYQ Page Directly
            </button>

            <button 
              onClick={handleSaveSettings}
              className="mt-4 w-full bg-cyan-600 hover:bg-cyan-500 text-black font-bold py-3 rounded-xl transition"
            >
              Save Settings
            </button>
          </div>
        ) : activeTab === 'post' ? (
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
        ) : activeTab === 'music' ? (
          <div className="flex flex-col gap-4 animate-fade-in">
            <h3 className="text-xl font-bold mb-2 text-cyan-400">Add Music to Library</h3>
            <div className="w-full aspect-square max-h-[200px] bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center relative border border-gray-800">
              {musicCover ? (
                <>
                  <img src={URL.createObjectURL(musicCover)} className="w-full h-full object-cover" alt="Cover" />
                  <button type="button" onClick={()=>{setMusicCover(null);}} className="absolute top-2 right-2 bg-black/60 rounded-full w-8 h-8 items-center text-white backdrop-blur">✕</button>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 w-full h-full justify-center">
                  <svg className="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span className="font-semibold text-sm">Select Cover Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ if(e.target.files[0]) setMusicCover(e.target.files[0]); }} />
                </label>
              )}
            </div>

            <div className="flex flex-col gap-2">
               <input type="text" placeholder="Track Title *" value={musicTitle} onChange={e=>setMusicTitle(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-white" />
               <input type="text" placeholder="Artist Name" value={musicArtist} onChange={e=>setMusicArtist(e.target.value)} className="bg-gray-900 border border-gray-800 rounded-lg p-3 text-white" />
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col items-center justify-center">
               {musicFile ? (
                 <div className="text-center">
                   <div className="text-cyan-400 text-sm font-bold truncate max-w-[250px] mb-2">{musicFile.name}</div>
                   <button onClick={()=>setMusicFile(null)} className="text-xs text-red-400 hover:text-red-300">Remove Audio</button>
                 </div>
               ) : (
                 <label className="cursor-pointer text-cyan-400 font-bold flex flex-col items-center">
                   <span className="text-2xl mb-1">🎵</span>
                   <span>Select Audio File (.mp3) *</span>
                   <input type="file" accept="audio/*" className="hidden" onChange={(e)=>{ if(e.target.files[0]) setMusicFile(e.target.files[0]); }} />
                 </label>
               )}
            </div>

            {isUploading && <div className="text-center text-sm font-bold text-cyan-400 mt-2">Uploading Track...</div>}

            <button onClick={handleCreateMusic} disabled={isUploading} className="w-full bg-cyan-600 rounded-lg p-3 font-semibold disabled:opacity-50 mt-2">
              {isUploading ? 'Uploading...' : 'Upload Music'}
            </button>

            <hr className="border-gray-800 my-4" />
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Library Tracks ({musicTracks.length})</h3>
            <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
              {musicTracks.map(track => (
                <div key={track._id || track.id} className="flex items-center gap-3 bg-gray-900 p-2 rounded-lg border border-gray-800">
                  <div className="w-10 h-10 bg-gray-800 rounded-md overflow-hidden shrink-0">
                    {track.cover_image_url ? <img src={track.cover_image_url} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🎵</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{track.title}</div>
                    <div className="text-xs text-gray-400 truncate">{track.artist}</div>
                  </div>
                  <button onClick={async () => {
                     if(window.confirm('Delete this track?')) {
                        await fetch(`${API_URL}/api/music/${track._id || track.id}`, { method: 'DELETE', headers: { 'x-developer-secret': 'DENCEWANCE_DEV_2026' }});
                        loadMusicTracks();
                     }
                  }} className="text-red-500 p-2 font-bold hover:bg-red-950 rounded-lg">✕</button>
                </div>
              ))}
              {musicTracks.length === 0 && <div className="text-sm text-gray-500 text-center py-4">No music tracks in library</div>}
            </div>
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
