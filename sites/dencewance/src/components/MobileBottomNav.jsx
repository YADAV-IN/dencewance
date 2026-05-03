export const MobileBottomNav = ({ items, activeKey, onNavigate }) => {
  return (
    <nav className="mobile-nav" aria-label="Primary mobile navigation">
      {items.map((item) => (
        <a
          key={item.key}
          href={item.path}
          className={`mobile-nav-item ${activeKey === item.key ? 'active' : ''}`}
          onClick={(e) => { e.preventDefault(); onNavigate(item.path); }}
          aria-current={activeKey === item.key ? 'page' : undefined}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <span className="mobile-nav-icon-wrap">
            <span className="mobile-nav-icon">{item.icon}</span>
          </span>
          <span className="mobile-nav-label">{item.label}</span>
        </a>
      ))}
    </nav>
  );
};
