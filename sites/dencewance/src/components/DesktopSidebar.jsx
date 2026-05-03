import React from 'react';

export const DesktopSidebar = ({ posts = [], news = [], setActivePage, setActiveCategory }) => {
  const feedItems = posts.length > 0 ? posts : news;
  const categories = [...new Set(feedItems.map((item) => item.category))].slice(0, 8);

  const getPathForPage = (item) => {
    switch (item) {
      case 'होम': return '/';
      case 'ट्रेंडिंग': return '/trending';
      case 'फ़ीचर्ड': return '/trending';
      case 'वीडियो': return '/videos';
      case 'टाइमलाइन': return '/latest';
      default: return '/';
    }
  };

  return (
    <aside className="desktop-sidebar">
      <h3>🔗 क्विक नेविगेशन</h3>
      {['होम', 'ट्रेंडिंग', 'फ़ीचर्ड', 'वीडियो', 'टाइमलाइन'].map((item) => (
        <a
          key={item}
          href={getPathForPage(item)}
          className="sidebar-item"
          onClick={(e) => { e.preventDefault(); setActivePage(item); }}
          style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
        >
          {item}
        </a>
      ))}

      <h3 style={{ marginTop: '24px' }}>📊 टॉप कैटेगरीज़</h3>
      {categories.map((cat) => (
        <a
          key={cat}
          href={`/categories?category=${encodeURIComponent(cat)}`}
          className="sidebar-item"
          onClick={(e) => { e.preventDefault(); setActiveCategory(cat); setActivePage('फ़ीचर्ड'); }}
          style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
        >
          {cat}
        </a>
      ))}

      <h3 style={{ marginTop: '24px' }}>⭐ ट्रेंडिंग पोस्ट्स</h3>
      {trending.map((item) => (
        <div
          key={item.id}
          className="sidebar-item"
          style={{ fontSize: '12px', lineHeight: '1.3' }}
        >
          {item.title.substring(0, 30)}...
        </div>
      ))}
    </aside>
  );
};
