import React from 'react';
import './App.css';
import SocialApp from './components/SocialApp';

const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '6388.01';

function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '1 0 auto' }}>
        <SocialApp />
      </div>
      <div
        style={{
          flex: '0 0 auto',
          textAlign: 'center',
          fontSize: '12px',
          color: '#8a8f98',
          padding: '8px 10px',
          borderTop: '1px solid rgba(138, 143, 152, 0.2)',
          background: 'rgba(255, 255, 255, 0.8)'
        }}
      >
        Version {APP_VERSION}
      </div>
    </div>
  );
}

export default App;
