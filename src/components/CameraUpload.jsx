import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, RefreshCw, Circle, Square, Video, Image as ImageIcon, Send, X, Check } from 'lucide-react';
import { uploadMediaToAppwrite } from '../utils/appwriteClient';
import { buildCreatorIdentity } from '../utils/creatorIdentity';

const API_URL = import.meta.env.VITE_API_URL || '';

const FILTERS = [
  { name: 'Normal', css: 'none' },
  { name: 'Clarendon', css: 'contrast(1.2) saturate(1.3) sepia(0.1)' },
  { name: 'Gingham', css: 'brightness(1.05) hue-rotate(350deg)' },
  { name: 'Moon', css: 'grayscale(1) contrast(1.1) brightness(1.1)' },
  { name: 'Lark', css: 'contrast(0.9) saturate(1.1) brightness(1.1)' },
  { name: 'Reyes', css: 'sepia(0.2) brightness(1.1) contrast(0.8)' },
  { name: 'Juno', css: 'saturate(1.4) contrast(1.1) sepia(0.1)' },
  { name: 'Slumber', css: 'saturate(0.6) sepia(0.3) brightness(1.05)' },
  { name: 'Crema', css: 'sepia(0.5) contrast(1.1) brightness(1.1)' },
  { name: 'Ludwig', css: 'contrast(1.1) saturate(1.2) brightness(1.05)' }
];

export default function CameraUpload({ token: propToken, onComplete, onClose }) {
  const token = propToken || localStorage.getItem('adminToken') || '';
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  
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

  // Initialize Camera
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const constraints = {
        video: { facingMode: facingMode, width: { ideal: 720 }, height: { ideal: 1280 } },
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
        // Do not alert aggressively, just rely on file upload fallback
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
      if (stream) stream.getTracks().forEach(track => track.stop());
    }, 'image/jpeg', 0.9);
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    setRecordedChunks([]);
    const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm', videoBitsPerSecond: 2500000 });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) setRecordedChunks(prev => [...prev, e.data]);
    };
    
    recorder.onstop = () => {
      // Logic handled in useEffect below
    };
    
    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setTimeout(() => {
        setMediaType('video');
      }, 500);
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
    } else {
      setMediaType('image');
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
    startCamera();
  };

  const handlePublish = async () => {
    if (!capturedMediaBlob) return;
    setIsUploading(true);
    
    const isVideo = mediaType === 'video';
    const endpoint = isVideo ? '/api/reels' : '/api/news';
    
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

          const payload = isVideo 
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
    <div className="bg-black w-full h-full flex flex-col relative text-white animate-fade-in overflow-hidden">
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
      <div className="flex-1 w-full bg-zinc-900 relative flex items-center justify-center overflow-hidden">
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
             <div className="text-zinc-500 flex flex-col items-center">
                <Camera size={48} className="mb-4 opacity-50" />
                <p>Camera access denied or unavailable</p>
             </div>
           )
        ) : (
          <>
            {mediaType === 'image' ? (
              <img 
                src={capturedMediaUrl} 
                className="w-full h-full object-cover" 
                style={{ filter: currentFilterCss }} 
                alt="Preview" 
              />
            ) : (
              <video 
                src={capturedMediaUrl} 
                autoPlay 
                loop 
                playsInline 
                controls
                className="w-full h-full object-cover"
                style={{ filter: currentFilterCss }} 
              />
            )}
          </>
        )}
      </div>

      {/* Controls & Editor */}
      <div className="w-full bg-black z-10 flex flex-col pb-6">
        
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
                 onMouseDown={startRecording}
                 onMouseUp={stopRecording}
                 onMouseLeave={stopRecording}
                 onTouchStart={startRecording}
                 onTouchEnd={stopRecording}
                 onClick={capturePhoto} 
                 className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${isRecording ? 'border-red-500 scale-125' : 'border-white'}`}
              >
                 <div className={`w-16 h-16 rounded-full ${isRecording ? 'bg-red-500' : 'bg-white'}`}></div>
              </button>

              <div className="w-12 h-12"></div>
           </div>
        ) : (
           <div className="px-4 py-2 flex flex-col gap-4">
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
                       <span>Publishing to Feed...</span>
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
                   Share to Story/Feed <Send size={18} />
                 </button>
              )}
           </div>
        )}

      </div>
    </div>
  );
}
