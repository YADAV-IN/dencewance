import { useState, useEffect } from 'react';

export const useDevice = () => {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isAndroid: false,
    isIOS: false,
  });

  useEffect(() => {
    const detectDevice = () => {
      const ua = navigator.userAgent.toLowerCase();
      const isAndroid = /android/.test(ua);
      const isIOS = /iphone|ipad|ipod/.test(ua);
      const isMobileOrTablet = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(ua);
      
      const width = window.innerWidth;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      setDevice({
        isMobile,
        isTablet,
        isDesktop,
        isAndroid: isAndroid && isMobile,
        isIOS: isIOS && isMobile,
      });
    };

    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);

  return device;
};
