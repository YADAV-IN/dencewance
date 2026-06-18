const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src/components/SocialApp.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

let lines = content.split('\n');

const replacementLines = `          <button className="icon-btn notification-btn" onClick={() => setActiveTab('messages')} style={{ border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent' }}>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <span className="notification-badge">1</span>
          </button>
          <button className="icon-btn notification-btn" style={{ border: '1px solid var(--accent)', color: 'var(--accent)', background: 'transparent' }}>
            <BellIcon />
            <span className="notification-badge">3</span>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', cursor: 'pointer', border: '1px solid var(--accent)', borderRadius: '50%' }}>
             <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--accent)" stroke="none">
               <path d="M12 2l2.4 2.8 3.7-.5.9 3.6 3.4 1.5-1.5 3.4.9 3.6-3.7-.5-2.4 2.8L12 18l-3.7.8-2.4-2.8-3.7.5.9-3.6-3.4-1.5 1.5-3.4-.9-3.6 3.7.5 2.4-2.8L12 2z"/>
               <path d="M9 12l2 2 4-4" stroke="var(--header-bg)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>

          <button onClick={() => setActiveTab('pyq')} style={{ background: 'var(--accent)', color: 'var(--primary-dark)', fontWeight: 'bold', padding: '6px 16px', borderRadius: '8px', fontSize: '14px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-primary)' }}>PYQ</button>`.split('\n');

// Replace lines 800 to 810 (0-indexed 800 to 809)
lines.splice(800, 10, ...replacementLines);

fs.writeFileSync(targetPath, lines.join('\n'), 'utf8');
console.log('Successfully updated lines in SocialApp.jsx');
