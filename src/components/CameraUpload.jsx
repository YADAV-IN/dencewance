import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, RefreshCw, Circle, Square, Video, Image as ImageIcon, Send, X, Check, LayoutGrid, Film } from 'lucide-react';
import { uploadMediaToAppwrite } from '../utils/appwriteClient';
import { buildCreatorIdentity } from '../utils/creatorIdentity';

const API_URL = import.meta.env.VITE_API_URL || '';

const FILTERS = [
  { name: 'Normal', css: 'none' },
  { name: 'Cinematic', css: 'contrast(1.2) saturate(1.1) sepia(0.2) hue-rotate(-10deg)' },
  { name: 'Moody', css: 'brightness(0.9) contrast(1.3) saturate(0.8)' },
  { name: 'Vintage', css: 'sepia(0.4) contrast(1.1) brightness(0.9) hue-rotate(-20deg)' },
  { name: 'Cyberpunk', css: 'contrast(1.4) saturate(1.5) hue-rotate(45deg)' },
  { name: 'Noir', css: 'grayscale(1) contrast(1.5)' },
  { name: 'Glitch', css: 'hue-rotate(90deg) saturate(2) contrast(1.2)' },
  { name: 'Dreamy', css: 'blur(1px) contrast(1.1) brightness(1.1) saturate(1.2)' },
  { name: 'Warm', css: 'sepia(0.3) saturate(1.4) contrast(1.1)' }
];

export default function CameraUpload({ token: propToken, onComplete, onClose }) {
  const token = propToken || localStorage.getItem('adminToken') || '';
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const pressTimeoutRef = useRef(null);
  
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState('user'); // 'user' or 'environment'
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  
  // Captured state
  const [mediaType, setMediaType] = useState(null); // 'image' or 'video'
  const [capturedMediaBlob, setCapturedMediaBlob] = useState(null);
  const [capturedMediaUrl, setCapturedMediaUrl] = useState('');
  
  // Editor state
  const [activeFilterIndex, setActiveFilterIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [destinationType, setDestinationType] = useState('auto'); // 'auto', 'post', 'reel'

  // Initialize Camera
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const constraints = {
        video: { 
          facingMode: facingMode, 
          width: { ideal: 1080 }, 
          height: { ideal: 1920 },
          frameRate: { ideal: 60, min: 30 }
        },
        audio: true
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setHasCameraAccess(true);
    } catch (err) {
      console.error("Camera access error:", err);
      // Fallback to video only if mic fails
      try {
        const constraints = { video: { facingMode: facingMode } };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = newStream;
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
        }
        setHasCameraAccess(true);
      } catch (err2) {
        console.error("Camera fallback error:", err2);
      }
    }
  }, [facingMode]);

  useEffect(() => {
    if (!capturedMediaBlob) {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (pressTimeoutRef.current) {
        clearTimeout(pressTimeoutRef.current);
      }
    };
  }, [capturedMediaBlob, facingMode, startCamera]); 

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // Apply filter via context so it's baked into the image
    ctx.filter = FILTERS[activeFilterIndex].css;
    
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      setCapturedMediaBlob(blob);
      setCapturedMediaUrl(URL.createObjectURL(blob));
      setMediaType('image');
      setDestinationType('post');
      if (stream) stream.getTracks().forEach(track => track.stop());
    }, 'image/jpeg', 0.9);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    setRecordedChunks([]);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const mimeType = isSafari ? 'video/mp4' : 'video/webm';
    
    // Increased quality to 3.5Mbps for better visual fidelity
    const options = { videoBitsPerSecond: 3500000 };
    if (MediaRecorder.isTypeSupported(mimeType)) {
      options.mimeType = mimeType;
    }

    const recorder = new MediaRecorder(streamRef.current, options);
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) setRecordedChunks(prev => [...prev, e.data]);
    };
    
    recorder.onstop = () => {
      // Handled in useEffect
    };
    
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setTimeout(() => {
      setMediaType('video');
      setDestinationType('reel');
    }, 500);
  };

  const handlePointerDown = (e) => {
    e.preventDefault();
    if (pressTimeoutRef.current) clearTimeout(pressTimeoutRef.current);
    
    pressTimeoutRef.current = setTimeout(() => {
      startRecording();
    }, 300); // 300ms hold starts video
  };

  const handlePointerUp = (e) => {
    e.preventDefault();
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
      pressTimeoutRef.current = null;
    }
    if (isRecording) {
      stopRecording();
    } else {
      // Tap (under 300ms)
      capturePhoto();
    }
  };

  useEffect(() => {
    if (mediaType === 'video' && recordedChunks.length > 0 && !isRecording) {
       const blob = new Blob(recordedChunks, { type: 'video/webm' });
       setCapturedMediaBlob(blob);
       setCapturedMediaUrl(URL.createObjectURL(blob));
       if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    }
  }, [recordedChunks, isRecording, mediaType]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type.startsWith('video/')) {
      setMediaType('video');
      setDestinationType('reel');
    } else {
      setMediaType('image');
      setDestinationType('post');
    }
    setCapturedMediaBlob(file);
    setCapturedMediaUrl(URL.createObjectURL(file));
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
  };

  const resetCamera = () => {
    setCapturedMediaBlob(null);
    setCapturedMediaUrl('');
    setMediaType(null);
    setCaption('');
    setUploadProgress(0);
    setRecordedChunks([]);
    setDestinationType('auto');
    startCamera();
  };

  const handlePublish = async () => {
    if (!capturedMediaBlob) return;
    setIsUploading(true);
    
    // Determine the actual destination based on user choice, not just mediaType
    const isDestReel = destinationType === 'reel';
    const endpoint = isDestReel ? '/api/reels' : '/api/news';
    const isVideo = mediaType === 'video';
    
    try {
      const bucketId = import.meta.env.VITE_APPWRITE_BUCKET_ID || 'media';
      
      const file = new File([capturedMediaBlob], isVideo ? `video-${Date.now()}.webm` : `photo-${Date.now()}.jpg`, {
        type: capturedMediaBlob.type
      });
      
      const mediaUrl = await uploadMediaToAppwrite(file, bucketId, (prog) => {
        setUploadProgress(Math.round(prog.progress));
      });

      const creatorIdentity = buildCreatorIdentity({
        mode: 'official', 
        seed: caption || `upload-${Date.now()}`,
        name: ''
      });

      const payload = isDestReel 
        ? {
            title: caption.slice(0, 20) || 'My Reel',
            caption: caption,
            video_url: mediaUrl,
            status: 'published',
            is_active: true,
            ...creatorIdentity
          }
        : {
            title: caption.slice(0, 30) || 'New Photo',
            caption: caption,
            excerpt: caption.slice(0, 100) || 'Photo',
            content: caption || 'Photo post',
            image_url: mediaUrl,
            cover_image_url: mediaUrl,
            category: 'social',
            status: 'published',
            ...creatorIdentity
          };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Failed to publish');
      
      const savedData = await res.json();
      if (onComplete) onComplete(savedData);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const currentFilterCss = FILTERS[activeFilterIndex].css;

  return (
    <div className="bg-black w-full h-[100dvh] md:h-full flex flex-col relative text-white animate-fade-in overflow-hidden z-[100]">
      {/* Header */}
      <div className="absolute top-0 w-full z-10 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
         {capturedMediaBlob ? (
           <button onClick={resetCamera} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur"><X size={24} /></button>
         ) : (
           <button onClick={() => {
              if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
              if (onClose) onClose();
           }} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur"><X size={24} /></button>
         )}
         <span className="font-bold tracking-wider">{capturedMediaBlob ? 'Preview' : 'Camera'}</span>
         {!capturedMediaBlob && hasCameraAccess ? (
            <button onClick={toggleCamera} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur">
              <RefreshCw size={20} />
            </button>
         ) : <div className="w-10"></div>}
      </div>

      {/* Viewfinder / Preview Area */}
      <div className="flex-1 w-full bg-zinc-950 relative flex items-center justify-center overflow-hidden">
        
        {/* Background blur for portrait card effect on preview */}
        {capturedMediaBlob && (
          <div 
            className="absolute inset-0 opacity-40 scale-110 blur-2xl z-0" 
            style={{
              backgroundImage: `url(${mediaType === 'image' ? capturedMediaUrl : ''})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}

        <div className={`relative z-10 ${capturedMediaBlob ? 'w-[90%] max-w-sm aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-zinc-800' : 'w-full h-full'}`}>
          {!capturedMediaBlob ? (
             hasCameraAccess ? (
               <video 
                 ref={videoRef} 
                 autoPlay 
                 playsInline 
                 muted 
                 className="w-full h-full object-cover"
                 style={{ 
                   transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                   filter: currentFilterCss
                 }}
               />
             ) : (
               <div className="w-full h-full text-zinc-500 flex flex-col items-center justify-center bg-zinc-900">
                  <Camera size={48} className="mb-4 opacity-50" />
                  <p>Camera access denied or unavailable</p>
               </div>
             )
          ) : (
            <>
              {mediaType === 'image' ? (
                <img 
                  src={capturedMediaUrl} 
                  className="w-full h-full object-contain bg-black/50" 
                  style={{ 
                    filter: currentFilterCss,
                    // REMOVED transform scaleX(-1) so text is readable
                  }} 
                  alt="Preview" 
                />
              ) : (
                <video 
                  src={capturedMediaUrl} 
                  autoPlay 
                  loop 
                  playsInline 
                  controls
                  className="w-full h-full object-contain bg-black/50"
                  style={{ 
                    filter: currentFilterCss,
                    // REMOVED transform scaleX(-1) so text is readable
                  }} 
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Controls & Editor */}
      <div className="w-full bg-black z-20 flex flex-col pb-6 md:pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        
        {/* Filters Scroll */}
        <div className="w-full py-4 px-2 overflow-x-auto flex gap-3 snap-x hide-scrollbar">
          {FILTERS.map((f, i) => (
             <button 
                key={f.name}
                onClick={() => setActiveFilterIndex(i)}
                className={`snap-center flex-shrink-0 flex flex-col items-center gap-1 transition-transform ${activeFilterIndex === i ? 'scale-110 text-white' : 'text-gray-500 hover:text-gray-300'}`}
             >
                <div 
                   className={`w-14 h-14 rounded-full overflow-hidden border-2 ${activeFilterIndex === i ? 'border-pink-500' : 'border-gray-800'}`}
                   style={{ filter: f.css }}
                >
                  <div className="w-full h-full bg-gradient-to-tr from-blue-400 via-purple-500 to-yellow-500"></div>
                </div>
                <span className="text-[10px] font-semibold">{f.name}</span>
             </button>
          ))}
        </div>

        {/* Action Buttons */}
        {!capturedMediaBlob ? (
           <div className="flex justify-between items-center px-8 py-4">
              <label className="w-12 h-12 bg-zinc-800 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-zinc-700 transition">
                 <ImageIcon size={20} />
                 <span className="text-[8px] mt-1 uppercase font-bold">Gallery</span>
                 <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileUpload} />
              </label>

              {/* Shutter Button */}
              <button 
                 onPointerDown={handlePointerDown}
                 onPointerUp={handlePointerUp}
                 onPointerLeave={handlePointerUp}
                 onContextMenu={(e) => e.preventDefault()} // Prevent context menu on long press
                 className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${isRecording ? 'border-red-500 scale-125' : 'border-white'} touch-none`}
              >
                 <div className={`w-16 h-16 rounded-full ${isRecording ? 'bg-red-500 scale-50' : 'bg-white'} transition-all duration-300`}></div>
              </button>

              <div className="w-12 h-12 text-[10px] font-semibold text-gray-500 text-center flex items-center justify-center">
                 Tap for Photo<br/>Hold for Video
              </div>
           </div>
        ) : (
           <div className="px-4 py-2 flex flex-col gap-4">
              
              {/* Destination Toggle */}
              <div className="flex bg-zinc-900 rounded-lg p-1 w-full max-w-[200px] mx-auto mb-2">
                 <button 
                   onClick={() => setDestinationType('post')}
                   className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${destinationType === 'post' ? 'bg-white text-black shadow' : 'text-gray-400'}`}
                 >
                   <LayoutGrid size={14} /> Post
                 </button>
                 <button 
                   onClick={() => setDestinationType('reel')}
                   className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-md transition-all ${destinationType === 'reel' ? 'bg-white text-black shadow' : 'text-gray-400'}`}
                 >
                   <Film size={14} /> Clip
                 </button>
              </div>

              <div className="flex gap-2">
                 <textarea 
                   placeholder="Add a caption..." 
                   className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white focus:outline-none resize-none h-14"
                   value={caption}
                   onChange={e => setCaption(e.target.value)}
                 />
              </div>
              
              {isUploading ? (
                 <div className="w-full mb-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                       <span>Publishing...</span>
                       <span className="font-bold text-white text-sm">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                       <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-500 h-full transition-all duration-300" style={{width: `${uploadProgress}%`}}></div>
                    </div>
                 </div>
              ) : (
                 <button 
                   onClick={handlePublish}
                   className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-pink-500/30"
                 >
                   Share <Send size={18} />
                 </button>
              )}
           </div>
        )}

      </div>
    </div>
  );
}
