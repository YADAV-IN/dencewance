import React, { useState, useEffect } from 'react';
import './SocialApp.css';
import ReelsViewer from './ReelsViewer';
import CreateInstagramMenu from './CreateInstagramMenu';
import ProfileDashboard from './ProfileDashboard';
import { demoReels } from './demoData';

// Vintage/Historical Custom SVG Icons
export const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
);

export const MapIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
);

export const QuillIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
);

export const ScrollIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M2 15h10"></path><path d="M2 19h10"></path></svg>
);

export const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

export const VideoStoriesIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="3" ry="3"></rect>
    <polygon points="10 8 15 12 10 16 10 8"></polygon>
    <line x1="8" y1="4" x2="16" y2="4"></line>
    <line x1="8" y1="20" x2="16" y2="20"></line>
  </svg>
);

export const HeartIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
);

export const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
);

export const BellIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
  </svg>
);

// Animated ModeBook Logo (Scalable via props)
export const ModeBookLogo = ({ width = 36, height = 36 }) => (
  <svg className="modebook-logo-animated" viewBox="0 0 100 100" width={width} height={height} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f3e5ab" />
        <stop offset="50%" stopColor="#c59715" />
        <stop offset="100%" stopColor="#8a5a19" />
      </linearGradient>
    </defs>
    <g transform="translate(50, 50)">
      <circle cx="0" cy="0" r="42" fill="none" stroke="url(#goldGrad)" strokeWidth="3" className="spin-slow" strokeDasharray="15 5" />
      <circle cx="0" cy="0" r="34" fill="none" stroke="url(#goldGrad)" strokeWidth="2" className="spin-reverse" strokeDasharray="4 8" />
      <polygon points="0,-22 19,11 -19,11" fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" className="pulse-glow" />
      <polygon points="0,22 19,-11 -19,-11" fill="none" stroke="url(#goldGrad)" strokeWidth="2.5" className="pulse-glow" />
      <circle cx="0" cy="0" r="6" fill="url(#goldGrad)" className="pulse-glow" />
    </g>
  </svg>
);

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://server-kappa-lac.vercel.app');

const resolveMediaUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  if (url.startsWith('http') || url.startsWith('//') || url.startsWith('data:')) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default function SocialApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [stories, setStories] = useState([]);
  const [feed, setFeed] = useState([]);

  useEffect(() => {
    // Fetch video stories (reels) from backend Cloudflare integration
    fetch(`${API_URL}/api/reels`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          setStories(data.data.slice(0, 10)); // Top 10 stories
        } else {
          setStories(demoReels);
        }
      })
      .catch(err => {
        console.error('Failed to load stories', err);
        setStories(demoReels);
      });

    // Fetch feed posts (news) from backend
    fetch(`${API_URL}/api/news`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.data)) {
          setFeed(data.data);
        }
      })
      .catch(err => console.error('Failed to load feed', err));
  }, []);

  return (
    <>
      {activeTab === 'stories' ? (
        <ReelsViewer 
          key={`reels-${activeStoryIndex}`} 
          reels={stories} 
          initialIndex={activeStoryIndex} 
          onClose={() => setActiveTab('home')}
        />
      ) : (
        <div className="social-app-container historical-theme">
          
          {/* Universal Top Navigation Bar (One Line) */}
          <header className="top-nav-bar">
        <div className="brand-container animated-brand">
          <ModeBookLogo />
          <h1 className="logo-text vintage-shimmer">ModeBook</h1>
        </div>
        
        {/* Opposite side Notification Bell */}
        <div className="top-nav-actions">
          <button className="icon-btn notification-btn">
            <BellIcon />
            <span className="notification-badge">3</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div className="app-body">
        {/* Sidebar for Desktop */}
        <nav className="desktop-sidebar">
          <ul className="nav-links">
            <li className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}>
              <HomeIcon /> <span>Sanctuary</span>
            </li>
            <li className={activeTab === 'stories' ? 'active' : ''} onClick={() => setActiveTab('stories')}>
              <VideoStoriesIcon /> <span>Stories</span>
            </li>
            <li className={activeTab === 'search' ? 'active' : ''} onClick={() => setActiveTab('search')}>
              <MapIcon /> <span>Atlas</span>
            </li>
            <li className={activeTab === 'messages' ? 'active' : ''} onClick={() => setActiveTab('messages')}>
              <ScrollIcon /> <span>Scrolls</span>
            </li>
            <li className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>
            <li className={activeTab === 'add' ? 'active' : ''} onClick={() => setActiveTab('add')}>
              <QuillIcon /> <span>Create</span>
            </li>
              <EyeIcon /> <span>Profile</span>
            </li>
          </ul>
        </nav>

        {/* Main Content Area */}
        <main className="main-content">
          {activeTab === 'search' ? (
            <div style={{ padding: '20px', color: '#fff', textAlign: 'center' }}><h2>Atlas (Search)</h2><p>The compendium is currently hidden...</p></div>
          ) : activeTab === 'messages' ? (
            <div style={{ padding: '20px', color: '#fff', textAlign: 'center' }}><h2>Scrolls (Messages)</h2><p>No new scrolls received from the archivists...</p></div>
          ) : activeTab === 'profile' ? (
             <ProfileDashboard /> ) : activeTab === 'add' ? ( <CreateInstagramMenu />
          ) : (
            <>
              {/* Stories Section Dropdown top */}
              <section className="stories-container">
            {stories.length > 0 ? (
              stories.map((story, i) => (
                <div 
                  className="story" 
                  key={story._id || i} 
                  onClick={() => {
                    if (story.video_url) {
                      setActiveStoryIndex(i);
                      setActiveTab('stories');
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="story-ring">
                    <img src={resolveMediaUrl(story.cover_image_url) || `https://i.pravatar.cc/150?img=${i + 20}`} alt={story.title} />
                  </div>
                  <span>{story.creator_name || story.title ? story.title.substring(0, 10) : 'Story'}</span>
                </div>
              ))
            ) : (
              ['Preetam', 'Arya', 'Karan', 'Dev', 'Mira'].map((name, i) => (
                <div className="story" key={i}>
                  <div className="story-ring">
                    <img src={`https://i.pravatar.cc/150?img=${i + 20}`} alt={name} />
                  </div>
                  <span>{name}</span>
                </div>
              ))
            )}
          </section>

          {/* Feed Section */}
          <section className="feed-container">
            {feed.length > 0 ? (
              feed.map((post, i) => (
                <div className="post" key={post._id || i}>
                  <div className="post-header">
                    <img src={post.source || `https://i.pravatar.cc/150?img=${10 + i}`} alt="Avatar" className="avatar" />
                    <div className="post-user-info">
                      <strong>{post.author_name || 'ModeBook User'}</strong>
                      <small>{new Date(post.published_at || Date.now()).toLocaleDateString()} • Recorded</small>
                    </div>
                  </div>
                  <div className="post-body">
                    {post.title && !post.title.includes('Untitled') && !post.title.includes('ModeBook') && !post.content?.startsWith(post.title?.replace(/...$/, '')) && (<h4>{post.title}</h4>)}
                    <p>{post.excerpt || post.content}</p>
                    {post.cover_image_url && (
                      <img src={resolveMediaUrl(post.cover_image_url)} alt={post.title} className="post-image" />
                    )}
                  </div>
                  <div className="post-actions">
                    <button><HeartIcon /> Honor</button>
                    <button><QuillIcon /> Inscribe</button>
                    <button><ShareIcon /> Propagate</button>
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Post Example 1 */}
            <div className="post">
              <div className="post-header">
                <img src="https://i.pravatar.cc/150?img=11" alt="Avatar" className="avatar" />
                <div className="post-user-info">
                  <strong>Preetam M.</strong>
                  <small>II hours ago • Chronicled</small>
                </div>
              </div>
              <div className="post-body">
                <p>Uncovering the ancient algorithms of Rome. The past is written in the sacred nodes. We reinvent the machine not from metal, but from the lost codex. 🏛️📜 #ModeBook #HistoricalTech</p>
                <img src="https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80" alt="Historical Tech Post" className="post-image" />
              </div>
              <div className="post-actions">
                <button><HeartIcon /> Honor</button>
                <button><QuillIcon /> Inscribe</button>
                <button><ShareIcon /> Propagate</button>
              </div>
            </div>

            {/* Post Example 2 - Video format placeholder */}
            <div className="post">
               <div className="post-header">
                <img src="https://i.pravatar.cc/150?img=33" alt="Avatar" className="avatar" />
                <div className="post-user-info">
                  <strong>Alchemist Nexus</strong>
                  <small>V hours ago</small>
                </div>
              </div>
              <div className="post-body">
                <p>Transmuting base code into golden UI. Witness the spectacle in the grand theater of pixels. ✨</p>
                <div className="video-placeholder">
                  <div className="magic-play-btn">▶ Behold</div>
                </div>
              </div>
               <div className="post-actions">
                <button><HeartIcon /> Honor</button>
                <button><QuillIcon /> Inscribe</button>
                <button><ShareIcon /> Propagate</button>
              </div>
            </div>
              </>
            )}
          </section>
          </>)}
        </main>

        {/* Right Sidebar for Suggestions / Messaging (Desktop) */}
        <aside className="suggestion-sidebar">
          <h3>Fellow Scholars</h3>
          <div className="message-preview">
            <img src="https://i.pravatar.cc/150?img=52" alt="User" />
            <div className="msg-text">
              <strong>DaVinci_Core</strong>
              <p>The manuscript is perfectly aligning...</p>
            </div>
          </div>
          <div className="message-preview">
            <img src="https://i.pravatar.cc/150?img=47" alt="User" />
            <div className="msg-text">
              <strong>Arya</strong>
              <p>Decoded the latest cipher, brother.</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <button className={activeTab === 'home' ? 'active' : ''} onClick={() => setActiveTab('home')}><HomeIcon /></button>
        <button className={activeTab === 'stories' ? 'active' : ''} onClick={() => setActiveTab('stories')}><VideoStoriesIcon /></button>
        <button className={activeTab === 'search' ? 'active' : ''} onClick={() => setActiveTab('search')}><MapIcon /></button>
        <button className={activeTab === 'add' ? 'active' : ''} onClick={() => setActiveTab('add')}><QuillIcon /></button>
        <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}><EyeIcon /></button>
      </nav>
    </div>
      )}
    </>
  );
}
