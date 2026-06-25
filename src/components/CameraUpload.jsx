import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, RefreshCw, Circle, Square, Video, Image as ImageIcon, Send, X, Check, LayoutGrid, Film } from 'lucide-react';
import { uploadMediaToAppwrite } from '../utils/appwriteClient';
import { buildCreatorIdentity } from '../utils/creatorIdentity';

const API_URL = import.meta.env.VITE_API_URL || '';

const FILTERS = [
  // Classic
  { name: 'Normal', css: 'none', category: 'Classic' },
  { name: 'Clarendon', css: 'contrast(120%) saturate(130%) sepia(10%)', category: 'Classic' },
  { name: 'Gingham', css: 'brightness(105%) hue-rotate(350deg)', category: 'Classic' },
  { name: 'Moon', css: 'grayscale(100%) contrast(110%) brightness(110%)', category: 'Classic' },
  { name: 'Lark', css: 'contrast(90%) saturate(110%) brightness(110%)', category: 'Classic' },
  { name: 'Reyes', css: 'sepia(20%) brightness(110%) contrast(80%)', category: 'Classic' },
  { name: 'Juno', css: 'saturate(140%) contrast(110%) sepia(10%)', category: 'Classic' },
  { name: 'Slumber', css: 'saturate(60%) sepia(30%) brightness(105%)', category: 'Classic' },
  { name: 'Crema', css: 'sepia(50%) contrast(110%) brightness(110%)', category: 'Classic' },
  { name: 'Ludwig', css: 'contrast(110%) saturate(120%) brightness(105%)', category: 'Classic' },
  
  // Pro
  { name: 'Cinematic', css: 'contrast(120%) saturate(110%) sepia(20%) hue-rotate(-10deg)', category: 'Pro' },
  { name: 'Moody', css: 'brightness(90%) contrast(130%) saturate(80%)', category: 'Pro' },
  { name: 'Vintage', css: 'sepia(40%) contrast(110%) brightness(90%) hue-rotate(-20deg)', category: 'Pro' },
  { name: 'Noir', css: 'grayscale(100%) contrast(150%)', category: 'Pro' },
  { name: 'Warm', css: 'sepia(30%) saturate(140%) contrast(110%)', category: 'Pro' },
  
  // Effects
  { name: 'Cyberpunk', css: 'contrast(140%) saturate(150%) hue-rotate(45deg)', category: 'Effects' },
  { name: 'Glitch', css: 'hue-rotate(90deg) saturate(200%) contrast(120%)', category: 'Effects' },
  { name: 'Dreamy', css: 'blur(1px) contrast(110%) brightness(110%) saturate(120%)', category: 'Effects' },

  // Face
  { name: 'Cyber Visor', css: 'contrast(110%) saturate(120%)', category: 'Face' },
  { name: 'Dog Mask', css: 'brightness(110%)', category: 'Face' },
  { name: 'Alien Warp', css: 'contrast(120%)', category: 'Face' }
];

export default function CameraUpload({ token: propToken, onComplete, onClose }) {
  const token = propToken || localStorage.getItem('adminToken') || '';
  
  // DOM Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  
  // Face Tracking Refs
  const faceMeshRef = useRef(null);
  const latestLandmarksRef = useRef(null);
  const animationRef = useRef(null);
  const lastFaceDetectTimeRef = useRef(0);
  
  // Interaction Refs
  const pressTimeoutRef = useRef(null);
  
  // Camera State
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
  const [activeCategory, setActiveCategory] = useState('Classic');
  const [activeFilterIndex, setActiveFilterIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [destinationType, setDestinationType] = useState('auto'); // 'auto', 'post', 'reel'
  const [isFaceMeshLoading, setIsFaceMeshLoading] = useState(false);

  const activeFilter = FILTERS[activeFilterIndex];

  // Initialize FaceMesh if Face category is selected
  useEffect(() => {
    if (activeCategory === 'Face' && !faceMeshRef.current && window.FaceMesh) {
      setIsFaceMeshLoading(true);
      const faceMesh = new window.FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      faceMesh.onResults((results) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          latestLandmarksRef.current = results.multiFaceLandmarks[0];
        } else {
          latestLandmarksRef.current = null;
        }
      });
      
      faceMesh.initialize().then(() => {
        setIsFaceMeshLoading(false);
      }).catch(err => {
        console.error("FaceMesh init failed", err);
        setIsFaceMeshLoading(false);
      });

      faceMeshRef.current = faceMesh;
    }
  }, [activeCategory]);

  // Main Render Loop (Draws video + effects to Canvas)
  const renderLoop = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      animationRef.current = requestAnimationFrame(renderLoop);
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    // willReadFrequently forces CPU rendering which ensures captureStream() doesn't skip CSS filters due to hardware acceleration bugs on Chrome Android
    const ctx = canvas.getContext('2d', { willReadFrequently: true }) || canvas.getContext('2d');
    if (!ctx) {
      animationRef.current = requestAnimationFrame(renderLoop);
      return;
    }
    
    if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
      // Size canvas to video
      if (canvas.width !== video.videoWidth) {
         canvas.width = video.videoWidth;
         canvas.height = video.videoHeight;
      }

      ctx.save();
      // Apply active CSS filter to canvas context
      ctx.filter = activeFilter.css;

      // Handle mirroring
      if (facingMode === 'user') {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      
      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Draw Face Effects
      const landmarks = latestLandmarksRef.current;
      if (landmarks && activeFilter.category === 'Face') {
         drawFaceEffects(ctx, canvas, landmarks, activeFilter.name, facingMode === 'user');
      }

      // Throttle FaceMesh detection (run at ~15fps to save CPU)
      const now = performance.now();
      if (activeFilter.category === 'Face' && faceMeshRef.current && !isFaceMeshLoading) {
         if (now - lastFaceDetectTimeRef.current > 66) { // ~15 FPS
            lastFaceDetectTimeRef.current = now;
            // Send frame to FaceMesh
            try {
               faceMeshRef.current.send({ image: video });
            } catch (e) {
               console.error("FaceMesh error:", e);
            }
         }
      }
    }

    animationRef.current = requestAnimationFrame(renderLoop);
  }, [activeFilter, facingMode, isFaceMeshLoading]);

  // Start/Stop render loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(renderLoop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [renderLoop]);

  // Drawing Helpers
  const drawFaceEffects = (ctx, canvas, landmarks, effectName, isMirrored) => {
    const w = canvas.width;
    const h = canvas.height;
    
    // Helper to get mapped coordinates
    const getPoint = (idx) => {
       const lm = landmarks[idx];
       let x = lm.x * w;
       let y = lm.y * h;
       if (isMirrored) x = w - x;
       return { x, y };
    };

    if (effectName === 'Cyber Visor') {
       const leftEye = getPoint(33); // Left eye outer corner
       const rightEye = getPoint(263); // Right eye outer corner
       
       const width = rightEye.x - leftEye.x;
       const height = width * 0.4;
       
       ctx.fillStyle = 'rgba(0, 255, 255, 0.4)';
       ctx.shadowColor = 'cyan';
       ctx.shadowBlur = 20;
       
       // Draw a glowing visor over eyes
       ctx.beginPath();
       ctx.roundRect(leftEye.x - width * 0.1, leftEye.y - height * 0.5, width * 1.2, height, 10);
       ctx.fill();
       
       // Inner bright strip
       ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
       ctx.shadowBlur = 5;
       ctx.fillRect(leftEye.x, leftEye.y - 2, width, 4);
    } 
    else if (effectName === 'Dog Mask') {
       // Dog Nose
       const noseTip = getPoint(1);
       ctx.fillStyle = 'black';
       ctx.shadowBlur = 0;
       ctx.beginPath();
       ctx.ellipse(noseTip.x, noseTip.y, 25, 15, 0, 0, Math.PI * 2);
       ctx.fill();
       // Highlights
       ctx.fillStyle = 'white';
       ctx.beginPath();
       ctx.arc(noseTip.x - 5, noseTip.y - 4, 4, 0, Math.PI * 2);
       ctx.fill();
       
       // Dog Ears
       const leftForehead = getPoint(227);
       const rightForehead = getPoint(447);
       
       ctx.fillStyle = '#8B4513';
       // Left ear
       ctx.beginPath();
       ctx.moveTo(leftForehead.x, leftForehead.y);
       ctx.quadraticCurveTo(leftForehead.x - 50, leftForehead.y - 100, leftForehead.x - 80, leftForehead.y);
       ctx.fill();
       // Right ear
       ctx.beginPath();
       ctx.moveTo(rightForehead.x, rightForehead.y);
       ctx.quadraticCurveTo(rightForehead.x + 50, rightForehead.y - 100, rightForehead.x + 80, rightForehead.y);
       ctx.fill();
    }
    else if (effectName === 'Alien Warp') {
       // A very basic approximation of Alien Warp via canvas 2D scaling
       // Real mesh warping requires WebGL, but we can do a fun huge-eye trick
       const leftEye = getPoint(159);
       const rightEye = getPoint(386);
       
       // Draw big eyes
       ctx.fillStyle = 'black';
       ctx.beginPath();
       ctx.ellipse(leftEye.x, leftEye.y, 40, 50, 0.2, 0, Math.PI * 2);
       ctx.fill();
       ctx.beginPath();
       ctx.ellipse(rightEye.x, rightEye.y, 40, 50, -0.2, 0, Math.PI * 2);
       ctx.fill();
    }
  };

  // Initialize Camera
  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const constraints = {
        video: { 
          facingMode: facingMode, 
          width: { ideal: 1280 }, 
          height: { ideal: 720 }
        },
        audio: true
      };
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = newStream;
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(e => console.error("Play error:", e));
        };
      }
      setHasCameraAccess(true);
    } catch (err) {
      console.error("Camera access error:", err);
      // Fallback to basic constraints if overconstrained
      try {
        const fallbackConstraints = { video: true, audio: true };
        const newStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
        streamRef.current = newStream;
        setStream(newStream);
        if (videoRef.current) {
          videoRef.current.srcObject = newStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch(e => console.error("Fallback 1 play error:", e));
          };
        }
        setHasCameraAccess(true);
      } catch (err2) {
        console.error("Camera fallback 1 error:", err2);
        // Last resort: just video
        try {
          const finalConstraints = { video: true };
          const newStream = await navigator.mediaDevices.getUserMedia(finalConstraints);
          streamRef.current = newStream;
          setStream(newStream);
          if (videoRef.current) {
            videoRef.current.srcObject = newStream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current.play().catch(e => console.error("Fallback 2 play error:", e));
            };
          }
          setHasCameraAccess(true);
        } catch (err3) {
          console.error("All camera fallbacks failed:", err3);
        }
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

  // Capture Photo from CANVAS
  const capturePhoto = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // Stop rendering to prevent black frames if video stream stops mid-capture
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    
    canvas.toBlob((blob) => {
      setCapturedMediaBlob(blob);
      setCapturedMediaUrl(URL.createObjectURL(blob));
      setMediaType('image');
      setDestinationType('post');
      if (stream) stream.getTracks().forEach(track => track.stop());
    }, 'image/jpeg', 0.9);
  };

  // Start Video Recording from CANVAS
  const startRecording = () => {
    if (!canvasRef.current) return;
    setRecordedChunks([]);
    
    // Capture stream from canvas so filters are baked in!
    const canvasStream = canvasRef.current.captureStream(30); 
    
    // Add audio track from original mic stream
    if (streamRef.current) {
       const audioTracks = streamRef.current.getAudioTracks();
       if (audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0]);
       }
    }

    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const mimeType = isSafari ? 'video/mp4' : 'video/webm';
    
    const options = { videoBitsPerSecond: 3500000 }; // High quality 3.5 Mbps
    if (MediaRecorder.isTypeSupported(mimeType)) {
      options.mimeType = mimeType;
    }

    const recorder = new MediaRecorder(canvasStream, options);
    
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

  return (
    <div className="bg-black w-full h-[100dvh] md:h-full flex flex-col relative text-white animate-fade-in overflow-hidden z-[100]">
      {/* Header */}
      <div className="absolute top-0 w-full z-50 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
         {capturedMediaBlob ? (
           <button onClick={resetCamera} className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center z-50 text-white cursor-pointer active:scale-95"><X size={28} /></button>
         ) : (
           <button onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
              if (onClose) onClose();
           }} className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center z-50 text-white cursor-pointer active:scale-95"><X size={28} /></button>
         )}
         <span className="font-bold tracking-wider">
           {capturedMediaBlob ? 'Preview' : (isFaceMeshLoading ? 'Loading AI...' : 'Camera')}
         </span>
         {!capturedMediaBlob && hasCameraAccess ? (
            <button onClick={toggleCamera} className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur">
              <RefreshCw size={20} />
            </button>
         ) : <div className="w-10"></div>}
      </div>

      {/* Viewfinder / Preview Area */}
      <div className="flex-1 w-full bg-zinc-950 relative flex items-center justify-center overflow-hidden">
        
        {/* Background blur for portrait card effect on preview */}
        {/* Background blur for portrait card effect removed for full screen */}

        <div className="relative z-10 w-full h-full">
          {!capturedMediaBlob ? (
             hasCameraAccess ? (
               <>
                 {/* Visible raw video feed (behind canvas) to prevent occlusion culling on mobile */}
                 <video 
                   ref={videoRef} 
                   autoPlay 
                   playsInline 
                   muted 
                   className="absolute inset-0 w-full h-full object-cover opacity-1 z-0"
                 />
                 {/* Canvas that displays the final baked feed */}
                 <canvas
                   ref={canvasRef}
                   className="w-full h-full object-cover relative z-10"
                 />
               </>
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
                  className="w-full h-full object-cover bg-black/50" 
                  style={{ filter: activeFilter.css }}
                  alt="Preview" 
                />
              ) : (
                <video 
                  src={capturedMediaUrl} 
                  autoPlay 
                  loop 
                  playsInline 
                  controls
                  className="w-full h-full object-cover bg-black/50"
                  style={{ filter: activeFilter.css }}
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Controls & Editor */}
      <div className="w-full bg-black z-20 flex flex-col pb-6 md:pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        
        {/* Category Tabs */}
        {/* Category Tabs */}
          <div className="flex justify-center gap-6 text-xs font-semibold pt-2 text-gray-500">
             {['Classic', 'Pro', 'Effects', 'Face'].map(cat => (
               <button 
                  key={cat} 
                  onClick={() => {
                     setActiveCategory(cat);
                     const firstIdx = FILTERS.findIndex(f => f.category === cat);
                     if (firstIdx !== -1) setActiveFilterIndex(firstIdx);
                  }}
                  className={`transition-colors ${activeCategory === cat ? 'text-white border-b-2 border-pink-500 pb-1' : 'hover:text-gray-300 pb-1'}`}
               >
                  {cat}
               </button>
             ))}
          </div>

        {/* Filters Scroll */}
        {/* Filters Scroll */}
          <div className="w-full py-4 px-2 overflow-x-auto flex gap-3 snap-x hide-scrollbar">
            {FILTERS.map((f, i) => f.category === activeCategory && (
               <button 
                  key={f.name}
                  onClick={() => setActiveFilterIndex(i)}
                  className={`snap-center flex-shrink-0 flex flex-col items-center gap-1 transition-transform ${activeFilterIndex === i ? 'scale-110 text-white' : 'text-gray-500 hover:text-gray-300'}`}
               >
                  <div 
                     className={`w-14 h-14 rounded-full overflow-hidden border-2 ${activeFilterIndex === i ? 'border-pink-500' : 'border-gray-800'}`}
                     style={{ filter: f.css }}
                  >
                    <div className="w-full h-full bg-gradient-to-tr from-blue-400 via-purple-500 to-yellow-500">
                      {f.category === 'Face' && <div className="w-full h-full flex items-center justify-center text-[8px] text-white/50">AI</div>}
                    </div>
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
                 onContextMenu={(e) => e.preventDefault()}
                 className={`w-20 h-20 rounded-full border-4 flex items-center justify-center transition-all ${isRecording ? 'border-red-500 scale-125' : 'border-white'} touch-none`}
              >
                 <div className={`w-16 h-16 rounded-full ${isRecording ? 'bg-red-500 scale-50' : 'bg-white'} transition-all duration-300`}></div>
              </button>

              <div className="w-12 h-12 text-[10px] font-semibold text-gray-500 text-center flex items-center justify-center leading-tight">
                 Tap Photo<br/>Hold Video
              </div>
           </div>
        ) : (
           <div className="px-4 py-2 flex flex-col gap-4">
              
              {/* Destination Toggle */}
              <div className="flex bg-zinc-900 rounded-lg p-1 w-full max-w-[200px] mx-auto mt-2">
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
