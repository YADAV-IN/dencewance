import React, { useEffect, useState } from 'react';

const SplashScreen = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Start fade out after 2.2 seconds
    const timer1 = setTimeout(() => {
      setIsFadingOut(true);
    }, 2200);

    // Complete splash screen after 2.8 seconds (giving 600ms for fade out)
    const timer2 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#FAF7EE] transition-opacity duration-700 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Glowing Background Rings */}
        <div className="absolute w-[200px] h-[200px] rounded-full bg-gradient-to-tr from-[#9B51E0]/20 via-[#D4AF37]/20 to-[#00FFFF]/20 blur-2xl animate-pulse" style={{ animationDuration: '2s' }}></div>
        
        {/* Main Logo Text */}
        <h1 
          className="relative z-10 font-serif font-black italic text-5xl tracking-wider text-[#2B2315] opacity-0 translate-y-4"
          style={{ 
            animation: 'slideUpFade 0.8s ease-out forwards 0.3s',
            textShadow: '0 4px 20px rgba(43, 35, 21, 0.15)'
          }}
        >
          Seen.Ly
        </h1>
        
        {/* Subtitle / Tagline */}
        <p 
          className="relative z-10 mt-3 font-sans font-medium text-sm tracking-widest text-[#2B2315]/60 uppercase opacity-0"
          style={{ animation: 'fadeIn 1s ease-out forwards 1.2s' }}
        >
          Elevate Your Rhythm
        </p>

        {/* Loading Bar */}
        <div 
          className="relative z-10 mt-8 w-48 h-1 bg-[#2B2315]/10 rounded-full overflow-hidden opacity-0"
          style={{ animation: 'fadeIn 0.5s ease-out forwards 1.5s' }}
        >
          <div 
            className="h-full bg-gradient-to-r from-[#9B51E0] via-[#D4AF37] to-[#9B51E0] rounded-full"
            style={{ 
              width: '0%', 
              animation: 'progressWidth 1s ease-out forwards 1.5s' 
            }}
          ></div>
        </div>
      </div>
      
      {/* Footer Branding like Meta */}
      <div 
        className="absolute bottom-10 flex flex-col items-center opacity-0"
        style={{ animation: 'fadeIn 1s ease-out forwards 1.5s' }}
      >
        <span className="text-[11px] text-[#2B2315]/50 tracking-widest font-medium uppercase mb-0.5">from</span>
        <span className="text-lg font-bold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-[#9B51E0] via-[#D4AF37] to-[#00FFFF]">
          Microbyte
        </span>
      </div>
      
      {/* Keyframes embedded for this component */}
      <style>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes progressWidth {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
