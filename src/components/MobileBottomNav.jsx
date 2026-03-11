export const MobileBottomNav = ({ items, activeKey, onNavigate }) => {
  return (
    <nav className="mobile-nav" aria-label="Primary mobile navigation">
      {items.map((item) => (
        <button
          key={item.key}
          className={`mobile-nav-item ${activeKey === item.key ? 'active' : ''}`}
          onClick={() => onNavigate(item.path)}
          aria-current={activeKey === item.key ? 'page' : undefined}
        >
          <span className="mobile-nav-icon-wrap">
            <span className="mobile-nav-icon">{item.icon}</span>
          </span>
          <span className="mobile-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
