const fs = require('fs');

let code = fs.readFileSync('src/components/SocialApp.jsx', 'utf8');

// Add import
if (!code.includes("import { io }")) {
    code = code.replace(/import React, \{ useState, useEffect, useRef, useCallback \} from 'react';/, 
      "import React, { useState, useEffect, useRef, useCallback } from 'react';\nimport { io } from 'socket.io-client';");
}

// Add socket connection
if (!code.includes("const socket = io(")) {
    code = code.replace(/const API_URL = (.*?);/, "const API_URL = $1;\nconst socket = io(API_URL);");
}

// Modify left position
code = code.replace(/left: '8px', top: '-22px',/, "left: '0px', top: '-22px',");


// Add socket event listener inside SocialApp
const useEffectSocket = `
  useEffect(() => {
    socket.on('realtime_update', (data) => {
      console.log('Realtime update received:', data);
      // Re-fetch data depending on type
      if (data.type === 'status' || data.type === 'delete') {
        fetch(API_URL + '/api/global-status').then(res => res.json()).then(d => { if(d.data) setStatuses(d.data.slice(0, 15)); });
      }
      if (data.type === 'reel' || data.type === 'delete') {
        fetch(API_URL + '/api/reels?t=' + Date.now()).then(res => res.json()).then(d => { if(d.data) setReelsFeed(d.data); });
      }
      if (data.type === 'delete') {
         fetch(API_URL + '/api/news').then(res => res.json()).then(d => { if(d.data) setFeed(d.data); });
      }
    });
    return () => socket.off('realtime_update');
  }, [API_URL]);
`;

if (!code.includes("socket.on('realtime_update'")) {
    code = code.replace(/useEffect\(\(\) => \{\n    const token = localStorage\.getItem\('adminToken'\);/, useEffectSocket + "\n  useEffect(() => {\n    const token = localStorage.getItem('adminToken');");
}


// Add video inside story thumbnail loop 
// find <SkeletonImage src={resolveMediaUrl(thumb)} ... />
const videoTag = `<video src={resolveMediaUrl(story.media_url || thumb)} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />`;

code = code.replace(/<SkeletonImage src=\{resolveMediaUrl\(thumb\)\} alt=\{story\.title \|\| 'Preview'\} wrapperStyle=\{\{ width: '100%', height: '100%', display: 'block' \}\} style=\{\{ width: '100%', height: '100%', objectFit: 'cover' \}\} \/>/, 
  "{ (story.media_url && String(story.media_url).match(/\\.(mp4|webm|mov)$/i)) ? " + videoTag + " : <SkeletonImage src={resolveMediaUrl(thumb)} alt={story.title || 'Preview'} wrapperStyle={{ width: '100%', height: '100%', display: 'block' }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> }"
);


fs.writeFileSync('src/components/SocialApp.jsx', code);
