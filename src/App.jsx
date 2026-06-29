import React, { useState, useEffect } from 'react';
import './App.css';
import PixelPerfectSocialApp from './components/PixelPerfectSocialApp';
import SplashScreen from './components/SplashScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('dencewance_view_mode') || 'desktop';
  });

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('dencewance_view_mode', mode);
  };

  useEffect(() => {
    if (viewMode === 'phone') {
      document.body.classList.add('body-phone-mode');
    } else {
      document.body.classList.remove('body-phone-mode');
    }
    return () => {
      document.body.classList.remove('body-phone-mode');
    };
  }, [viewMode]);

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('dencewance_splash_shown', 'true');
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className={`app-root-container ${viewMode === 'phone' ? 'use-phone-frame' : 'use-desktop-layout'}`}>
        {viewMode === 'phone' ? (
          <div className="device-wrapper">
            <div className="device-ambient-glow" />
            <div className="phone-frame">
              <div className="phone-notch" />
              <div className="phone-screen">
                <PixelPerfectSocialApp viewMode={viewMode} setViewMode={handleToggleViewMode} />
              </div>
              <div className="phone-home-indicator" />
              <div className="phone-reflection" />
            </div>
          </div>
        ) : (
          <PixelPerfectSocialApp viewMode={viewMode} setViewMode={handleToggleViewMode} />
        )}
      </div>
    </>
  );
}

export default App;

