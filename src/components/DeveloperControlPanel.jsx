import React, { useState } from 'react';
import { uploadMediaToAppwrite } from '../utils/appwriteClient';
import { buildCreatorIdentity, getPreferredCreatorMode } from '../utils/creatorIdentity';
import { 
  LayoutDashboard, Settings, Video, Image as ImageIcon, Music, Save, 
  UploadCloud, CheckCircle2, AlertCircle, X, ChevronRight, Activity, Users, FileVideo, ShieldCheck,
  TrendingUp, PlayCircle, Wand2, Terminal, Code, Trash2, User
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function DeveloperControlPanel({ token: propToken, onComplete }) {
  const token = propToken || localStorage.getItem('adminToken') || '';
  const [activeMenu, setActiveMenu] = useState('dashboard'); // dashboard, post, reel, music, settings, magic

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
  
  // Upload State
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

  // Magic System State
  const [magicCss, setMagicCss] = useState('');
  const [magicJs, setMagicJs] = useState('');
  const [magicOutput, setMagicOutput] = useState('');

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
      if (onComplete) onComplete(savedReel); else setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      alert('Upload Error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('TRENDING_REELS_LIMIT', trendingLimit);
    localStorage.setItem('TRENDING_REELS_HOURS', trendingHours);
    localStorage.setItem('SHOW_PYQ_BUBBLE', showPyqBubble);
    alert('Settings Saved Globally (for this device)! Note: In a real backend, this would sync to all users.');
    window.dispatchEvent(new Event('trendingSettingsUpdated'));
    window.dispatchEvent(new Event('pyqSettingsUpdated'));
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
    if (activeMenu === 'music') {
      loadMusicTracks();
    }
  }, [activeMenu]);

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

  // UI Components
  const MenuButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveMenu(id)}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold
        ${activeMenu === id 
          ? (id === 'magic' ? 'bg-[#00FFFF] text-black shadow-lg shadow-[#00FFFF]/30 translate-x-1' : 'bg-[#3A125E] text-white shadow-lg shadow-[#3A125E]/30 translate-x-1') 
          : 'text-gray-500 hover:bg-gray-100 hover:text-[#3A125E]'}`}
    >
      <Icon size={18} className={activeMenu === id ? (id === 'magic' ? 'text-black' : 'text-[#00FFFF]') : ''} />
      {label}
    </button>
  );

  return (
    <div className="w-full h-full bg-gray-50 rounded-[24px] overflow-hidden flex flex-col md:flex-row border border-gray-200 shadow-2xl relative">
      
      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 p-4 shrink-0 overflow-y-auto">
        <div className="flex items-center gap-2 mb-8 px-2 mt-2">
          <ShieldCheck className="text-[#3A125E]" size={28} />
          <h1 className="font-black text-lg text-[#3A125E] tracking-tight">Admin Console</h1>
        </div>
        
        <div className="space-y-1.5 flex-1">
          <MenuButton id="dashboard" icon={LayoutDashboard} label="Dashboard Overview" />
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Content</div>
          <MenuButton id="reel" icon={Video} label="Video Stories" />
          <MenuButton id="post" icon={ImageIcon} label="Image Posts" />
          <MenuButton id="music" icon={Music} label="Music Library" />
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">System</div>
          <MenuButton id="settings" icon={Settings} label="Platform Settings" />
          <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Advanced</div>
          <MenuButton id="magic" icon={Wand2} label="Magic System" />
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3A125E] to-[#9B51E0] flex items-center justify-center text-white font-bold">
              DEV
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Super Admin</p>
              <p className="text-[10px] text-gray-500">Platform Manager</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col overflow-hidden relative ${activeMenu === 'magic' ? 'bg-[#010409]' : 'bg-[#F8F9FA]'}`}>
        {/* Mobile Header */}
        <div className={`md:hidden flex items-center gap-2 p-4 border-b sticky top-0 z-20 ${activeMenu === 'magic' ? 'bg-[#0D1117] border-gray-800' : 'bg-white border-gray-200'}`}>
          <ShieldCheck className={activeMenu === 'magic' ? "text-[#00FFFF]" : "text-[#3A125E]"} size={24} />
          <h1 className={`font-black text-md tracking-tight flex-1 ${activeMenu === 'magic' ? 'text-white' : 'text-[#3A125E]'}`}>Admin Console</h1>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3A125E] to-[#9B51E0] flex items-center justify-center text-white font-bold text-[10px]">
            DEV
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {/* Header Title */}
          <div className="mb-6 animate-in slide-in-from-left-4 duration-300">
            <h2 className={`text-2xl font-black tracking-tight ${activeMenu === 'magic' ? 'text-white' : 'text-gray-900'}`}>
              {activeMenu === 'dashboard' && 'Dashboard Overview'}
              {activeMenu === 'reel' && 'Manage Video Stories'}
              {activeMenu === 'post' && 'Manage Image Posts'}
              {activeMenu === 'music' && 'Music Library'}
              {activeMenu === 'settings' && 'Platform Settings'}
              {activeMenu === 'magic' && 'Advanced Magic System'}
            </h2>
            <p className={`text-sm mt-1 ${activeMenu === 'magic' ? 'text-gray-400' : 'text-gray-500'}`}>
              {activeMenu === 'dashboard' && 'Platform performance and quick actions.'}
              {activeMenu === 'reel' && 'Upload and publish short video clips to the Reels feed.'}
              {activeMenu === 'post' && 'Upload and publish static image posts to the News feed.'}
              {activeMenu === 'music' && 'Manage audio tracks available in the camera studio.'}
              {activeMenu === 'settings' && 'Configure core platform algorithms and features.'}
              {activeMenu === 'magic' && 'Forcefully manipulate the platform via dynamic injection pipelines.'}
            </p>
          </div>

          {/* DASHBOARD VIEW */}
          {activeMenu === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-300">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-semibold">System Status</p>
                  <p className="text-2xl font-black text-gray-900">All Systems Go</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-semibold">Active Users</p>
                  <p className="text-2xl font-black text-gray-900">1,248</p>
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-pink-600">
                  <FileVideo size={20} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-semibold">Published Reels</p>
                  <p className="text-2xl font-black text-gray-900">842</p>
                </div>
              </div>
              
              <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-br from-[#3A125E] to-[#240b3b] p-6 rounded-2xl text-white shadow-xl mt-4 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
                <div className="relative z-10 flex-1">
                  <h3 className="text-xl font-black mb-2">Ready to publish new content?</h3>
                  <p className="text-white/70 text-sm max-w-md">Use the content manager to upload high-quality video stories or image posts directly to the global feed.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto relative z-10">
                  <button onClick={() => setActiveMenu('reel')} className="flex-1 md:flex-none px-6 py-3 bg-[#00FFFF] text-black font-bold rounded-xl hover:bg-white transition-colors text-sm text-center">
                    Upload Reel
                  </button>
                  <button onClick={() => setActiveMenu('post')} className="flex-1 md:flex-none px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors text-sm text-center backdrop-blur">
                    Upload Post
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* COMMON UPLOADER IDENTITY (For Post and Reel) */}
          {(activeMenu === 'post' || activeMenu === 'reel') && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User size={16} className="text-[#3A125E]" /> Author Identity
              </h3>
              <div className="flex flex-wrap gap-2">
                {['official', 'developer', 'anonymous', 'male', 'female'].map((type) => (
                  <button 
                    key={type}
                    onClick={() => setUploaderType(type)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                      uploaderType === type 
                        ? 'bg-[#3A125E] text-white shadow-md' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {uploaderType !== 'official' && (
                <div className="mt-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Custom Display Name</label>
                  <input 
                    type="text" 
                    placeholder="E.g., John Doe" 
                    value={uploaderName} 
                    onChange={(e) => setUploaderName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-[#3A125E] focus:ring-1 focus:ring-[#3A125E] transition-all" 
                  />
                </div>
              )}
            </div>
          )}

          {/* REEL UPLOAD */}
          {activeMenu === 'reel' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Video Caption</label>
                    <textarea 
                      placeholder="Write an engaging caption for this reel..." 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-[#3A125E] focus:ring-1 focus:ring-[#3A125E] transition-all min-h-[120px] resize-none" 
                      value={reelCaption} 
                      onChange={e=>setReelCaption(e.target.value)}
                    ></textarea>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">External Video URL (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="https://example.com/video.mp4" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-[#3A125E] transition-all" 
                      value={reelVideoUrlInput} 
                      onChange={e=>setReelVideoUrlInput(e.target.value)} 
                    />
                  </div>
                </div>
                
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Media File</label>
                  <div className="w-full aspect-[9/16] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#3A125E] hover:bg-purple-50 transition-colors flex items-center justify-center relative overflow-hidden group">
                    {reelVideoPreview ? (
                      <>
                        <video src={reelVideoPreview} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={()=>{setReelVideoFile(null); setReelVideoPreview('')}} className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-3 text-gray-400 w-full h-full justify-center p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#3A125E]">
                          <UploadCloud size={24} />
                        </div>
                        <span className="font-bold text-sm text-gray-600">Click to upload video</span>
                        <span className="text-xs text-gray-400">MP4, WebM (Max 50MB)</span>
                        <input type="file" accept="video/*" className="hidden" onChange={(e)=>{
                          if(e.target.files[0]) {
                            setReelVideoFile(e.target.files[0]);
                            setReelVideoPreview(URL.createObjectURL(e.target.files[0]));
                          }
                        }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                    <span className="flex items-center gap-2"><UploadCloud size={14} className="animate-pulse text-[#3A125E]" /> Uploading Media...</span>
                    <span>{uploadStatusText}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-[#3A125E] h-full transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleCreateReel} 
                  disabled={isUploading || (!reelVideoFile && !reelVideoUrlInput)} 
                  className="px-8 py-3.5 bg-[#3A125E] text-white font-bold rounded-xl hover:bg-[#240b3b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-[#3A125E]/20"
                >
                  <CheckCircle2 size={18} /> {isUploading ? 'Publishing...' : 'Publish Video Story'}
                </button>
              </div>
            </div>
          )}

          {/* POST UPLOAD */}
          {activeMenu === 'post' && (
             <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">Post Content</label>
                    <textarea 
                      placeholder="Write what's on your mind..." 
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-[#3A125E] focus:ring-1 focus:ring-[#3A125E] transition-all min-h-[160px] resize-none" 
                      value={postContent} 
                      onChange={e=>setPostContent(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                
                <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Image File</label>
                  <div className="w-full aspect-square bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#3A125E] hover:bg-purple-50 transition-colors flex items-center justify-center relative overflow-hidden group">
                    {postCoverPreview ? (
                      <>
                        <img src={postCoverPreview} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={()=>{setPostCover(null); setPostCoverPreview('')}} className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-3 text-gray-400 w-full h-full justify-center p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#3A125E]">
                          <ImageIcon size={24} />
                        </div>
                        <span className="font-bold text-sm text-gray-600">Upload image</span>
                        <span className="text-xs text-gray-400">JPG, PNG (Max 10MB)</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e)=>{
                          if(e.target.files[0]) {
                            setPostCover(e.target.files[0]);
                            setPostCoverPreview(URL.createObjectURL(e.target.files[0]));
                          }
                        }} />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex justify-between text-xs font-bold text-gray-600 mb-2">
                    <span className="flex items-center gap-2"><UploadCloud size={14} className="animate-pulse text-[#3A125E]" /> Uploading Media...</span>
                    <span>{uploadStatusText}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-[#3A125E] h-full transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={handleCreatePost} 
                  disabled={isUploading || !postCover} 
                  className="px-8 py-3.5 bg-[#3A125E] text-white font-bold rounded-xl hover:bg-[#240b3b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-[#3A125E]/20"
                >
                  <CheckCircle2 size={18} /> {isUploading ? 'Publishing...' : 'Publish Image Post'}
                </button>
              </div>
            </div>
          )}

          {/* MUSIC LIBRARY */}
          {activeMenu === 'music' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
              
              {/* Add New Music Form */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-32 shrink-0">
                  <div className="w-32 h-32 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 hover:border-[#3A125E] transition-colors flex items-center justify-center relative overflow-hidden group">
                    {musicCover ? (
                      <>
                        <img src={URL.createObjectURL(musicCover)} className="w-full h-full object-cover" alt="Cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={()=>{setMusicCover(null);}} className="w-8 h-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors">
                            <X size={16} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 w-full h-full justify-center p-2 text-center">
                        <ImageIcon size={20} className="text-[#3A125E]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Add Cover</span>
                        <input type="file" accept="image/*" className="hidden" onChange={(e)=>{ if(e.target.files[0]) setMusicCover(e.target.files[0]); }} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex-1 flex flex-col justify-center gap-3">
                  <div className="flex gap-3">
                    <input type="text" placeholder="Track Title *" value={musicTitle} onChange={e=>setMusicTitle(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-[#3A125E] transition-all" />
                    <input type="text" placeholder="Artist Name" value={musicArtist} onChange={e=>setMusicArtist(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:border-[#3A125E] transition-all" />
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                        {musicFile ? (
                          <div className="flex items-center gap-2 w-full">
                            <Music size={16} className="text-cyan-500 shrink-0" />
                            <span className="text-sm font-bold text-gray-700 truncate flex-1">{musicFile.name}</span>
                            <button onClick={()=>setMusicFile(null)} className="text-red-500 hover:bg-red-50 p-1 rounded-md transition-colors"><X size={16}/></button>
                          </div>
                        ) : (
                          <label className="cursor-pointer flex items-center gap-2 w-full text-gray-500 hover:text-[#3A125E] transition-colors">
                            <UploadCloud size={16} />
                            <span className="text-sm font-bold flex-1">Select Audio File (.mp3) *</span>
                            <input type="file" accept="audio/*" className="hidden" onChange={(e)=>{ if(e.target.files[0]) setMusicFile(e.target.files[0]); }} />
                          </label>
                        )}
                     </div>
                     <button 
                        onClick={handleCreateMusic} 
                        disabled={isUploading || !musicTitle || !musicFile} 
                        className="px-6 py-3.5 bg-[#3A125E] text-white font-bold rounded-xl hover:bg-[#240b3b] transition-colors disabled:opacity-50 shrink-0 shadow-md"
                      >
                        {isUploading ? 'Uploading...' : 'Add to Library'}
                      </button>
                  </div>
                </div>
              </div>

              {/* Music List */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[400px]">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-bold text-gray-800 flex items-center gap-2"><Music size={18} className="text-[#3A125E]"/> Current Library Tracks ({musicTracks.length})</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {musicTracks.map(track => (
                    <div key={track._id || track.id} className="flex items-center gap-4 hover:bg-gray-50 p-2 rounded-xl transition-colors group">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                        {track.cover_image_url ? <img src={track.cover_image_url} alt="Cover" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Music size={20}/></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-gray-900 truncate">{track.title}</div>
                        <div className="text-xs font-semibold text-gray-500 truncate">{track.artist || 'Unknown Artist'}</div>
                      </div>
                      <button onClick={async () => {
                        if(window.confirm('Are you sure you want to delete this track from the platform library?')) {
                            await fetch(`${API_URL}/api/music/${track._id || track.id}`, { method: 'DELETE', headers: { 'x-developer-secret': 'DENCEWANCE_DEV_2026' }});
                            loadMusicTracks();
                        }
                      }} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {musicTracks.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                      <Music size={40} className="opacity-20" />
                      <p className="text-sm font-semibold">No music tracks found in database</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* SETTINGS */}
          {activeMenu === 'settings' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <Settings size={24} className="text-[#3A125E]" />
                <div>
                  <h3 className="text-lg font-black text-gray-900 tracking-tight">Platform Configuration</h3>
                  <p className="text-xs text-gray-500 font-semibold">Manage core algorithms and feature toggles</p>
                </div>
              </div>
              
              <div className="p-6 space-y-8">
                
                {/* Section 1 */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <TrendingUp size={16} className="text-cyan-500" /> Trending Algorithm
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <label className="text-sm font-bold text-gray-700 block mb-1">Max Trending Clips Limit</label>
                      <p className="text-xs text-gray-500 mb-3">Maximum number of clips shown in the trending section on the home page.</p>
                      <input 
                        type="number" 
                        min="1" max="100"
                        value={trendingLimit} 
                        onChange={(e) => setTrendingLimit(Number(e.target.value))}
                        className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm font-medium focus:outline-none focus:border-[#3A125E] focus:ring-1 focus:ring-[#3A125E] transition-all" 
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <label className="text-sm font-bold text-gray-700 block mb-1">Time Window (Hours)</label>
                      <p className="text-xs text-gray-500 mb-3">Clips older than this threshold will not be considered trending.</p>
                      <input 
                        type="number" 
                        min="1" max="720"
                        value={trendingHours} 
                        onChange={(e) => setTrendingHours(Number(e.target.value))}
                        className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm font-medium focus:outline-none focus:border-[#3A125E] focus:ring-1 focus:ring-[#3A125E] transition-all" 
                      />
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />
                
                {/* Section 2 */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <PlayCircle size={16} className="text-purple-500" /> Feature Toggles
                  </h4>
                  
                  <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl p-5">
                    <div>
                      <label className="text-sm font-bold text-gray-900 block">Enable PYQ AI Assistant</label>
                      <p className="text-xs text-gray-500 mt-1">Shows the floating PYQ button globally on the screen for all users.</p>
                    </div>
                    <button
                      onClick={() => setShowPyqBubble(!showPyqBubble)}
                      className={`w-14 h-7 rounded-full relative transition-colors shadow-inner ${showPyqBubble ? 'bg-[#3A125E]' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white absolute top-1 shadow-sm transition-transform ${showPyqBubble ? 'translate-x-8' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Section 3 */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <User size={16} className="text-red-500" /> Identity Management
                  </h4>
                  
                  <div className="flex items-center justify-between bg-red-50 border border-red-100 rounded-xl p-5">
                    <div>
                      <label className="text-sm font-bold text-red-900 block">Delete Developer Profile</label>
                      <p className="text-xs text-red-700 mt-1">Clears the developer identity from your browser so you can create a fresh one.</p>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete your Developer Identity?')) {
                          localStorage.removeItem('dwDeveloperCreatorId');
                          localStorage.removeItem('activeUploader');
                          alert('Developer Identity deleted. Please refresh.');
                          window.location.reload();
                        }
                      }}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow transition-colors flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Delete Profile
                    </button>
                  </div>
                </div>
  
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button 
                  onClick={handleSaveSettings}
                  className="px-6 py-2.5 bg-[#3A125E] text-white font-bold rounded-lg hover:bg-[#240b3b] transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Save size={16} /> Save Configuration
                </button>
              </div>

            </div>
          )}

          {/* MAGIC SYSTEM */}
          {activeMenu === 'magic' && (
            <div className="bg-[#0D1117] rounded-2xl border border-gray-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
              <div className="p-6 border-b border-gray-800 bg-[#161B22] flex items-center gap-3">
                <Wand2 size={24} className="text-[#00FFFF]" />
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Advanced Magic System</h3>
                  <p className="text-xs text-gray-400 font-semibold">Force inject CSS or execute pipeline JS globally</p>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                
                {/* CSS Injector */}
                <div>
                  <h4 className="text-sm font-bold text-[#00FFFF] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Code size={16} /> Dynamic CSS Injector
                  </h4>
                  <p className="text-xs text-gray-400 mb-3">Write raw CSS to forcefully alter the UI. Will be injected into document head.</p>
                  <textarea 
                    value={magicCss}
                    onChange={(e) => setMagicCss(e.target.value)}
                    placeholder=".class { color: red !important; }"
                    className="w-full h-32 bg-[#010409] text-green-400 font-mono text-sm border border-gray-700 rounded-lg p-4 focus:outline-none focus:border-[#00FFFF] transition-colors"
                  />
                  <div className="mt-2 flex justify-end">
                    <button 
                      onClick={() => {
                        let styleEl = document.getElementById('magic-css-injector');
                        if (!styleEl) {
                          styleEl = document.createElement('style');
                          styleEl.id = 'magic-css-injector';
                          document.head.appendChild(styleEl);
                        }
                        styleEl.innerHTML = magicCss;
                        setMagicOutput((prev) => prev + `\n[CSS INJECTED]: Successfully applied ${magicCss.length} bytes of CSS.`);
                      }}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded transition-colors"
                    >
                      Inject CSS
                    </button>
                  </div>
                </div>

                <hr className="border-gray-800" />
                
                {/* JS Execution Pipeline */}
                <div>
                  <h4 className="text-sm font-bold text-[#00FFFF] uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Terminal size={16} /> Runtime JS Pipeline
                  </h4>
                  <p className="text-xs text-gray-400 mb-3">Execute JS to force trigger unconnected features or manipulate state.</p>
                  <textarea 
                    value={magicJs}
                    onChange={(e) => setMagicJs(e.target.value)}
                    placeholder="console.log('Force connect...');"
                    className="w-full h-32 bg-[#010409] text-blue-400 font-mono text-sm border border-gray-700 rounded-lg p-4 focus:outline-none focus:border-[#00FFFF] transition-colors"
                  />
                  <div className="mt-2 flex justify-end">
                    <button 
                      onClick={() => {
                        try {
                          // Note: eval is intentionally used for this developer "magic" tool.
                          // eslint-disable-next-line
                          const result = eval(magicJs);
                          setMagicOutput((prev) => prev + `\n> ${magicJs}\n<- ${String(result)}`);
                        } catch (err) {
                          setMagicOutput((prev) => prev + `\n> ${magicJs}\n[ERROR]: ${err.message}`);
                        }
                      }}
                      className="px-4 py-2 bg-[#3A125E] hover:bg-[#9B51E0] text-white font-bold text-xs rounded transition-colors"
                    >
                      Execute Pipeline
                    </button>
                  </div>
                </div>
                
                {/* Output Console */}
                <div className="bg-[#010409] border border-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Console Output</span>
                    <button onClick={() => setMagicOutput('')} className="text-xs text-gray-500 hover:text-white transition-colors">Clear</button>
                  </div>
                  <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap min-h-[60px] max-h-[150px] overflow-y-auto">
                    {magicOutput || 'System ready.'}
                  </pre>
                </div>
                
              </div>
            </div>
          )}

        </div>

        {/* Mobile Navigation Bar */}
        <div className={`md:hidden flex border-t sticky bottom-0 z-20 pb-[env(safe-area-inset-bottom)] shrink-0 ${activeMenu === 'magic' ? 'bg-[#0D1117] border-gray-800' : 'bg-white border-gray-200'}`}>
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' },
            { id: 'reel', icon: Video, label: 'Reels' },
            { id: 'post', icon: ImageIcon, label: 'Posts' },
            { id: 'music', icon: Music, label: 'Music' },
            { id: 'magic', icon: Wand2, label: 'Magic' }
          ].map(menu => (
            <button 
              key={menu.id}
              onClick={() => setActiveMenu(menu.id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${activeMenu === menu.id ? (activeMenu === 'magic' ? 'text-[#00FFFF]' : 'text-[#3A125E]') : 'text-gray-400'}`}
            >
              <menu.icon size={20} strokeWidth={activeMenu === menu.id ? 2.5 : 2} />
              <span className="text-[9px] font-bold tracking-wider uppercase">{menu.label}</span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}
