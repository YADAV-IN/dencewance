import fs from 'fs';

const cssPath = 'src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');

css = css.replace(
  "@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800&display=swap');",
  "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Roboto:wght@300;400;500;700&display=swap');"
);

css = css.replace(
  /:root \{[\s\S]*?\}/,
  `:root {
  /* DenceWance New Design System */
  --bg: #F4ECD8; /* Cream/Light Beige */
  --bg-gradient-end: #FFFFFF;
  --bg-card: #FFFFFF;
  --bg-card-hover: #F8F5F0;
  
  --bg-subtle: rgba(58, 18, 94, 0.04);
  --border-light: rgba(58, 18, 94, 0.08);
  --border-med: rgba(58, 18, 94, 0.12);
  --border-strong: rgba(58, 18, 94, 0.16);
  --border-heavy: rgba(58, 18, 94, 0.22);
  
  --text-primary: #1F0A33; /* Dark Purple tint for readable text */
  --text-muted: #5A4A6B;
  
  --accent: #FFD700; /* Bright Gold */
  --accent-gradient: linear-gradient(135deg, #FFD700, #F5B000);
  
  --primary-dark: #3A125E; /* Dark Purple */
  --primary-dark-glow: rgba(58, 18, 94, 0.2);
  
  --bg-glow-1: rgba(255, 215, 0, 0.1);
  --bg-glow-2: rgba(58, 18, 94, 0.05);
  --bg-glow-3: rgba(255, 215, 0, 0.05);
  
  --header-bg: #3A125E;
  --header-border: rgba(255, 255, 255, 0.1);
  --nav-chip-bg: rgba(58, 18, 94, 0.06);
  --nav-chip-hover: rgba(255, 215, 0, 0.15);
  --mobile-nav-bg: #F8F5F2;
  --mobile-nav-border: rgba(58, 18, 94, 0.1);
  --mobile-nav-active-bg: rgba(255, 215, 0, 0.2);
  --mobile-nav-active-text: #B29600;
  
  --font-primary: 'Inter', sans-serif;
  --font-display: 'Inter', sans-serif;
}`
);

// Remove light theme block
css = css.replace(/:root\[data-theme='light'\] \{[\s\S]*?\}/, '');

// Add scrollbar utilities
if (!css.includes('scrollbar-hide')) {
  css = css.replace(
    /(\* \{[\s\S]*?\})/,
    `$1\n\n/* Scrollbar Hide Utility */\n.scrollbar-hide::-webkit-scrollbar {\n  display: none;\n}\n.scrollbar-hide {\n  -ms-overflow-style: none;\n  scrollbar-width: none;\n}`
  );
}

// Update body background
css = css.replace(
  /background: var\(--bg\);\s*background-image:\s*radial-gradient[\s\S]*?transparent 50%\);/,
  "background: linear-gradient(to bottom, var(--bg), var(--bg-gradient-end));"
);

fs.writeFileSync(cssPath, css);
console.log('Updated index.css');

// Now update SocialApp.jsx
const saPath = 'src/components/SocialApp.jsx';
let sa = fs.readFileSync(saPath, 'utf8');

sa = sa.replace("e.target.src = '/logo192.png';", "e.target.src = '/dencewance-logo.jpg';");
sa = sa.replace(
  "name: adminData?.name || 'You',",
  "name: adminData?.name || localStorage.getItem('userName') || 'You',\n      handle: adminData?.email?.split('@')[0] || localStorage.getItem('userHandle') || '',\n      avatar: adminData?.avatar_url || localStorage.getItem('userAvatar') || '',"
);

fs.writeFileSync(saPath, sa);
console.log('Updated SocialApp.jsx');

// UserProfileView.jsx
const upPath = 'src/components/UserProfileView.jsx';
let up = fs.readFileSync(upPath, 'utf8');
if (!up.includes('import { getAvatarUrl }')) {
  up = up.replace("import SkeletonImage from './SkeletonImage';", "import SkeletonImage from './SkeletonImage';\nimport { getAvatarUrl } from '../utils/avatar';");
}
up = up.replace(
  /src=\{profile\.avatar_url \|\| `https:\/\/ui-avatars\.com\/api\/\?name=\$\{encodeURIComponent\(profile\.name\)\}&background=1a1a2e&color=fff&size=128`\}/,
  "src={profile.avatar_url || getAvatarUrl(profile._id || profile.id, profile.name)}"
);
fs.writeFileSync(upPath, up);
console.log('Updated UserProfileView.jsx');
