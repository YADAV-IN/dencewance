import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useDevice } from './hooks/useDevice';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DesktopSidebar } from './components/DesktopSidebar';
import { TranslationTool } from './components/TranslationTool';
import { CampaignLayer } from './components/CampaignLayer';
import { t, detectLanguage } from './translations';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'https://server-kappa-lac.vercel.app');

const demoNews = [
  {
    id: 1,
    title: 'बीजेएमसी न्यूज़रूम में स्मार्ट न्यूज़ फ्लो',
    slug: 'bjmc-news-flow',
    excerpt: 'कैंपस डेस्क पर रियल टाइम फैक्ट चेक और मल्टी-पर्सपेक्टिव स्टोरी मैप्स।',
    content:
      'डिजिटल वर्कफ़्लो के साथ न्यूज रूम तेज़, सटीक और डेटा-संचालित बन रहा है। इसमें अलर्ट्स, ट्रेंड स्कैन और ऑटो-समरी शामिल है।',
    category: 'कैंपस',
    tags: ['BJMC', 'न्यूज़रूम'],
    cover_image_url:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop',
    video_url: 'https://www.youtube.com/embed/ysz5S6PUM-U',
    source: 'ALOK इनसाइट',
    ai_summary: 'उन्नत टूल्स से कैंपस न्यूज़ कवरेज तेज़ और फैक्ट-बेस्ड हुआ है।',
    published_at: '2026-02-15T10:30:00.000Z',
    reading_time: 4,
    is_featured: 1,
    is_breaking: 1,
    views: 924,
  },
  {
    id: 2,
    title: 'इमर्सिव रिपोर्टिंग सुविधा लॉन्च',
    slug: 'future-media-lab-xr',
    excerpt: 'बीजेएमसी के लिए XR आधारित इमर्सिव स्टोरीटेलिंग सुविधा तैयार।',
    content:
      'नई सुविधा में 3D सिनेमैटिक्स, वर्चुअल प्रोडक्शन और लाइव सिमुलेशन सेटअप है।',
    category: 'टेक',
    tags: ['XR', 'इमर्सिव', 'रिपोर्टिंग'],
    cover_image_url:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    video_url: '',
    source: 'कैंपस प्रेस',
    ai_summary: 'XR सुविधा से इमर्सिव जर्नलिज़्म प्रोजेक्ट्स को नई दिशा मिली।',
    published_at: '2026-02-12T08:15:00.000Z',
    reading_time: 3,
    is_featured: 1,
    is_breaking: 1,
    views: 712,
  },
  {
    id: 3,
    title: 'डेटा डेस्क रिपोर्ट: लोकल इशू ट्रैकर',
    slug: 'data-desk-local-issue-tracker',
    excerpt: 'वार्ड-स्तर की समस्याओं को मैप करने वाला ओपन डैशबोर्ड लॉन्च।',
    content:
      'डैशबोर्ड में इन्फ्रास्ट्रक्चर, सुरक्षा, ट्रैफिक और शिक्षा सूचकांक दिखते हैं।',
    category: 'डेटा',
    tags: ['डेटा', 'डैशबोर्ड'],
    cover_image_url:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=1200&auto=format&fit=crop',
    video_url: '',
    source: 'ALOK डेटा',
    ai_summary: 'लोकल इशू ट्रैकर से रिपोर्टिंग के लिए ठोस डेटा पॉइंट्स मिलते हैं।',
    published_at: '2026-02-10T12:00:00.000Z',
    reading_time: 5,
    is_featured: 0,
    is_breaking: 0,
    views: 488,
  },
  {
    id: 4,
    title: 'लाइव बुलेटिन: स्टूडेंट इनोवेशन फेयर',
    slug: 'student-innovation-fair',
    excerpt: '100+ प्रोजेक्ट्स, मीडिया-टेक और उन्नत प्रोटोटाइप्स का शोकेस।',
    content:
      'फेयर में छात्रों ने न्यूज़ ऑटोमेशन, मल्टी-लैंग्वेज सबटाइटल और साउंडस्केपिंग डेमो किया।',
    category: 'इवेंट',
    tags: ['इवेंट', 'इनोवेशन'],
    cover_image_url:
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop',
    video_url: '',
    source: 'कैंपस लाइव',
    ai_summary: 'इनोवेशन फेयर ने न्यू मीडिया प्रोजेक्ट्स को एक मंच दिया।',
    published_at: '2026-02-09T09:40:00.000Z',
    reading_time: 2,
    is_featured: 0,
    is_breaking: 0,
    views: 367,
  },
];

const formatDate = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  const months = ['जन॰', 'फ़र॰', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अग॰', 'सित॰', 'अक्टू॰', 'नव॰', 'दिस॰'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12 || 12;
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};

const getCurrentISOTime = () => {
  return new Date().toISOString();
};

const slugifyText = (value = '') => value
  .toString()
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9\u0900-\u097f]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'story';

const getStorySlug = (item) => item?.slug || slugifyText(item?.title || 'story');

const getReelSlug = (item) => getStorySlug(item);

const formatCompactNumber = (value = 0) => new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
}).format(Math.max(0, Number(value) || 0));

const getRouteSnapshot = () => {
  if (typeof window === 'undefined') {
    return { pathname: '/', search: '' };
  }

  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  return {
    pathname,
    search: window.location.search || '',
  };
};

const resolvePageKey = (pathname) => {
  if (pathname === '/' || pathname === '') return 'home';
  if (pathname === '/latest') return 'latest';
  if (pathname === '/trending') return 'trending';
  if (pathname.startsWith('/videos/reel/')) return 'reel';
  if (pathname === '/videos') return 'videos';
  if (pathname === '/categories') return 'categories';
  if (pathname === '/features') return 'features';
  if (pathname === '/workspace') return 'workspace';
  if (pathname.startsWith('/story/')) return 'story';
  return 'home';
};

const timeAgo = (dateString, language = 'hi') => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const months = Math.round(days / 30);
  const years = Math.round(days / 365);

  if (language === 'hi') {
    if (seconds < 60) return `अभी-अभी`;
    if (minutes < 60) return `${minutes} मिनट पहले`;
    if (hours < 24) return `${hours} घंटे पहले`;
    if (days < 30) return `${days} दिन पहले`;
    if (months < 12) return `${months} महीने पहले`;
    return `${years} साल पहले`;
  } else {
    if (seconds < 60) return `Just now`;
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    if (months < 12) return `${months}mo ago`;
    return `${years}y ago`;
  }
};

const defaultCampaignSettings = {
  enabled: false,
  mode: 'banner',
  title: '',
  subtitle: '',
  description: '',
  ctaText: '',
  ctaUrl: '',
  mediaType: 'none',
  mediaUrl: '',
  startAt: '',
  endAt: '',
  dismissHours: 24,
  allowDismiss: true,
  openInNewTab: true,
};

const mergeCampaignSettings = (campaign = {}) => ({
  ...defaultCampaignSettings,
  ...(campaign || {}),
});

const isCampaignWithinTime = (campaign = {}) => {
  const now = Date.now();
  const start = campaign.startAt ? new Date(campaign.startAt).getTime() : null;
  const end = campaign.endAt ? new Date(campaign.endAt).getTime() : null;
  if (start && !Number.isNaN(start) && now < start) return false;
  if (end && !Number.isNaN(end) && now > end) return false;
  return true;
};

const extractYouTubeId = (url) => {
  if (!url || typeof url !== 'string') return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i);
  if (match && match[1]) {
    return match[1];
  }
  return '';
};

const resolveMediaUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http') || value.startsWith('data:') || value.startsWith('blob:')) return value;
  return `${API_URL}${value}`;
};

const getWordCount = (value = '') => {
  const normalized = value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized ? normalized.split(/\s+/).length : 0;
};

const compressImageToDataUrl = (file, { maxDimension = 640, quality = 0.82 } = {}) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('इमेज पढ़ने में त्रुटि।'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('इमेज प्रोसेस नहीं हो पाई।'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(maxDimension / image.width, maxDimension / image.height, 1);
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext('2d');

        if (!context) {
          reject(new Error('इमेज प्रोसेसर उपलब्ध नहीं है।'));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

function App() {
  const avatarInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const sectionRefs = useRef({});
  const reelsContainerRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const reelUploadInputRef = useRef(null);
  const reelVideoRefs = useRef({});
  const device = useDevice();
  const [news, setNews] = useState([]);
  const [reels, setReels] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('alok_token') || '');
  const [adminProfile, setAdminProfile] = useState(null);
  const [adminList, setAdminList] = useState([]);
  const [adminPasswords, setAdminPasswords] = useState({});
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [activeReelIndex, setActiveReelIndex] = useState(0);
  const [reelsMuted, setReelsMuted] = useState(false);
  const [videoUploadState, setVideoUploadState] = useState({ state: 'idle', message: '' });
  const [reelUploadProgress, setReelUploadProgress] = useState(0);
  const [reelPaused, setReelPaused] = useState(new Set());
  const [followedCreators, setFollowedCreators] = useState(() => {
    try {
      const raw = localStorage.getItem('alok_reel_follows');
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'author', bio: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [routeState, setRouteState] = useState(() => getRouteSnapshot());
  const [activeCategory, setActiveCategory] = useState('सभी');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginState, setLoginState] = useState({ state: 'idle', message: '' });
  const [profileForm, setProfileForm] = useState({ name: '', bio: '', email: '' });
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '', bio: '' });
  const [newsForm, setNewsForm] = useState({
    title: '',
    category: 'कैंपस',
    excerpt: '',
    content: '',
    tags: 'BJMC, मीडिया',
    cover_image_url: '',
    gallery_urls: '',
    video_url: '',
    audio_url: '',
    source: 'ALOK',
    ai_summary: '',
    published_at: getCurrentISOTime(),
    is_featured: false,
    is_breaking: false,
    // Author fields
    author_name: adminProfile?.name || 'ALOK Team',
    author_email: adminProfile?.email || '',
    author_twitter: '',
    author_instagram: '',
    // SEO fields
    meta_description: '',
    meta_keywords: '',
    seo_title: '',
    // Location
    location: '',
    coordinates: '',
    // Social Media Links
    twitter_url: '',
    facebook_url: '',
    instagram_url: '',
    youtube_url: '',
    // Publishing
    status: 'published',
    priority: 'normal',
    language: 'hi',
    expire_at: '',
  });
  const [editingNews, setEditingNews] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReelModal, setShowReelModal] = useState(false);
  const [editingReel, setEditingReel] = useState(null);
  const [reelForm, setReelForm] = useState({
    title: '', caption: '', video_url: '', tags: '', status: 'published'
  });
  const [siteSettings, setSiteSettings] = useState({
    site_name: 'ALOK',
    site_subtitle: 'बीजेएमसी न्यूज़',
    site_title: 'ALOK - बीजेएमसी न्यूज़',
    site_description: 'बीजेएमसी न्यूज़रूम - आपकी खबरों का भरोसेमंद स्रोत',
    campaign: { ...defaultCampaignSettings },
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('alok_theme') || 'light');
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('alok_language');
    if (saved) return saved;
    return detectLanguage();
  });
  const [languageOverride, setLanguageOverride] = useState(() => {
    return localStorage.getItem('alok_language_override') === 'true';
  });
  const [showTranslationTool, setShowTranslationTool] = useState(false);
  const [cropper, setCropper] = useState({ open: false, src: '', target: 'avatar', aspect: 1 });
  const [cropZoom, setCropZoom] = useState(1.1);
  const [isApplyingCrop, setIsApplyingCrop] = useState(false);
  const [isAvatarDragActive, setIsAvatarDragActive] = useState(false);
  const [isCoverDragActive, setIsCoverDragActive] = useState(false);
  const [dismissedCampaignKey, setDismissedCampaignKey] = useState('');
  const [showTermsBanner, setShowTermsBanner] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [visitorName, setVisitorName] = useState(() => localStorage.getItem('alok_visitor_name') || '');
  const [liveVisitors, setLiveVisitors] = useState(1);
  const [totalSiteViews, setTotalSiteViews] = useState(0);

  // Live stats effect connecting to backend
  useEffect(() => {
    let visitorId = localStorage.getItem('alok_visitor_id');
    if (!visitorId) {
      // Simple random ID for session
      visitorId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('alok_visitor_id', visitorId);
    }

    const pingStats = async () => {
      try {
        const response = await fetch(`${API_URL}/stats/ping`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId })
        });
        if (response.ok) {
          const data = await response.json();
          setLiveVisitors(data.activeVisitors);
          setTotalSiteViews(data.totalViews);
        }
      } catch (err) {
        console.error('Error fetching live stats:', err);
      }
    };

    pingStats(); // Initial ping
    const visitorInterval = setInterval(pingStats, 10000); // Ping every 10 seconds

    return () => clearInterval(visitorInterval);
  }, []);

  const currentPath = routeState.pathname;
  const currentSearch = routeState.search;
  const currentPageKey = useMemo(() => resolvePageKey(currentPath), [currentPath]);
  const isStoryPage = currentPageKey === 'story';
  const isReelPage = currentPageKey === 'reel';
  const isWorkspacePage = currentPageKey === 'workspace';

  const navigateTo = (targetPath, { replace = false } = {}) => {
    if (typeof window === 'undefined') return;
    const nextPath = targetPath || '/';
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (nextPath === currentUrl) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.history[replace ? 'replaceState' : 'pushState']({}, '', nextPath);
    setRouteState(getRouteSnapshot());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const featureGroups = useMemo(() => ([
    {
      title: 'Content Studio',
      description: 'Rich editor, SEO, scheduling aur smart draft pipeline',
      badges: ['Writer', 'SEO', 'Schedule'],
    },
    {
      title: 'Media Toolkit',
      description: 'Image crop, drag-drop uploads aur video embeds',
      badges: ['Upload', 'Crop', 'Video'],
    },
    {
      title: 'People & Roles',
      description: 'Admin, Editor, Author permissions with safe publishing rules',
      badges: ['RBAC', 'Users', 'Security'],
    },
    {
      title: 'Campaign Control',
      description: 'Banner/full-page takeover with schedule and dismiss controls',
      badges: ['Event', 'Takeover', 'Timed'],
    },
    {
      title: 'Localization',
      description: 'Hindi/English language tools with instant translation helper',
      badges: ['Hi/En', 'Translate', 'UX'],
    },
  ]), []);

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ header: [2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['blockquote', 'link'],
      ['clean'],
    ],
  }), []);

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'blockquote', 'link',
  ];

  const categories = useMemo(() => {
    const set = new Set(news.map((item) => item.category));
    return [t('allCategories', language), ...Array.from(set)];
  }, [news, language]);

  const filteredNews = useMemo(() => {
    if (activeCategory === t('allCategories', language)) return news;
    return news.filter((item) => item.category === activeCategory);
  }, [activeCategory, news, language]);

  const trendingNews = useMemo(() => {
    return [...news].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 10);
  }, [news]);

  const featuredNews = useMemo(() => {
    return news.filter((item) => item.is_featured);
  }, [news]);

  const imageNews = useMemo(() => {
    return news.filter((item) => item.cover_image_url);
  }, [news]);

  const editorTags = useMemo(() => {
    return newsForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
  }, [newsForm.tags]);

  const editorWordCount = useMemo(() => getWordCount(newsForm.content), [newsForm.content]);

  const editorReadMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(editorWordCount / 180));
  }, [editorWordCount]);

  const editorCompletion = useMemo(() => {
    const checkpoints = [
      Boolean(newsForm.title.trim()),
      Boolean(newsForm.excerpt.trim()),
      Boolean(newsForm.content.trim()),
      editorTags.length > 0,
      Boolean(newsForm.cover_image_url.trim()),
      Boolean(newsForm.author_name.trim()),
      Boolean(newsForm.meta_description.trim()),
    ];

    return Math.round((checkpoints.filter(Boolean).length / checkpoints.length) * 100);
  }, [newsForm, editorTags.length]);

  const currentRole = adminProfile?.role || 'guest';
  const canWriteNews = ['admin', 'editor', 'author'].includes(currentRole);
  const canPublishNews = ['admin', 'editor'].includes(currentRole);

  const editorPublishTone = useMemo(() => {
    if (!canPublishNews && canWriteNews) return 'Author mode: auto-saved as draft';
    if (newsForm.status === 'published') return 'Ready for live readers';
    if (newsForm.status === 'scheduled') return 'Scheduled for a timed release';
    if (newsForm.status === 'archived') return 'Stored in archive mode';
    return 'Still in draft mode';
  }, [newsForm.status, canPublishNews, canWriteNews]);

  const editorPreviewImage =
    resolveMediaUrl(newsForm.cover_image_url) ||
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=900&auto=format&fit=crop';

  const campaignConfig = useMemo(() => mergeCampaignSettings(siteSettings.campaign), [siteSettings.campaign]);

  const campaignIdentity = useMemo(() => {
    const keyParts = [
      campaignConfig.title,
      campaignConfig.startAt,
      campaignConfig.endAt,
      campaignConfig.mediaUrl,
      campaignConfig.mode,
    ];
    return `campaign-${keyParts.join('|')}`;
  }, [campaignConfig]);

  const isCampaignVisible = useMemo(() => {
    if (!campaignConfig.enabled) return false;
    if (!isCampaignWithinTime(campaignConfig)) return false;
    if (dismissedCampaignKey === campaignIdentity) return false;
    return true;
  }, [campaignConfig, dismissedCampaignKey, campaignIdentity]);

  const isFullPageCampaign = isCampaignVisible && campaignConfig.mode === 'fullpage';

  const navItems = useMemo(() => ([
    { key: 'latest', label: t('latestNews', language), path: '/latest' },
    { key: 'trending', label: t('trending', language), path: '/trending' },
    { key: 'videos', label: t('videoStories', language), path: '/videos' },
    { key: 'categories', label: t('categories', language), path: '/categories' },
    { key: 'features', label: 'Feature Hub', path: '/features' },
  ]), [language]);

  const mobileNavItems = useMemo(() => ([
    { key: 'home', label: t('home', language), icon: '⌂', path: '/' },
    { key: 'trending', label: t('trending', language), icon: '◉', path: '/trending' },
    { key: 'videos', label: t('videoStories', language), icon: '▷', path: '/videos' },
    { key: 'categories', label: t('categories', language), icon: '□', path: '/categories' },
    { key: 'workspace', label: adminToken ? 'Panel' : t('login', language), icon: adminToken ? '✦' : '○', path: '/workspace' },
  ]), [adminToken, language]);

  const storySlug = useMemo(() => {
    if (!currentPath.startsWith('/story/')) return '';
    return decodeURIComponent(currentPath.replace('/story/', ''));
  }, [currentPath]);

  const reelSlug = useMemo(() => {
    if (!currentPath.startsWith('/videos/reel/')) return '';
    return decodeURIComponent(currentPath.replace('/videos/reel/', ''));
  }, [currentPath]);

  const routeStory = useMemo(() => {
    if (!storySlug) return null;
    const allStories = [...news, ...demoNews];
    return allStories.find((item) => getStorySlug(item) === storySlug) || null;
  }, [news, storySlug]);

  const routeReel = useMemo(() => {
    if (!reelSlug) return null;
    const allReels = [...reels].filter((item) => item.video_url);
    return allReels.find((item) => getReelSlug(item) === reelSlug) || null;
  }, [reels, reelSlug]);

  const openStory = (item) => {
    if (!item) return;
    navigateTo(`/story/${encodeURIComponent(getStorySlug(item))}`);
  };

  const getReelPath = (item) => `/videos/reel/${encodeURIComponent(getReelSlug(item))}`;

  const openReel = (item) => {
    if (!item) return;
    navigateTo(getReelPath(item));
  };

  const shareReel = async (item) => {
    if (!item || typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}${getReelPath(item)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text: item.excerpt || item.title, url: shareUrl });
        return;
      } catch (error) {
        // fall back to clipboard copy
      }
    }
    await navigator.clipboard?.writeText(shareUrl);
    setVideoUploadState({ state: 'online', message: 'Reel link copy ho gaya.' });
  };

  const shareStory = async (item) => {
    if (!item || typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/story/${encodeURIComponent(getStorySlug(item))}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text: item.excerpt || item.title, url: shareUrl });
        return;
      } catch (error) {
        // fall back to clipboard copy
      }
    }
    await navigator.clipboard?.writeText(shareUrl);
    alert('Link copied to clipboard!');
  };

  const openCategoryPage = (category) => {
    const allCategoriesLabel = t('allCategories', language);
    const search = category && category !== allCategoriesLabel
      ? `?category=${encodeURIComponent(category)}`
      : '';
    navigateTo(`/categories${search}`);
  };

  const openWorkspace = () => {
    setShowAdmin(true);
    navigateTo('/workspace');
  };

  const getCreatorKey = (item) => slugifyText(item?.author_name || item?.source || siteSettings.site_name || 'creator');

  const toggleFollowCreator = (item) => {
    const creatorKey = getCreatorKey(item);
    setFollowedCreators((prev) => (
      prev.includes(creatorKey)
        ? prev.filter((entry) => entry !== creatorKey)
        : [...prev, creatorKey]
    ));
  };

  const deleteReel = async (reelId) => {
    if (!reelId) return;
    // Local-only reel
    if (typeof reelId === 'string' && reelId.startsWith('local-')) {
      setReels((prev) => prev.filter((r) => r.id !== reelId));
      return;
    }
    // Backend reel
    if (!adminToken) return;
    try {
      const response = await fetch(`${API_URL}/api/reels/${reelId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (response.ok || response.status === 204) {
        setReels((prev) => prev.filter((r) => r.id !== reelId && r._id !== reelId));
        setStatus({ state: 'online', message: 'Reel deleted.' });
      } else {
        const err = await response.json().catch(() => ({}));
        setStatus({ state: 'error', message: err.error || 'Delete failed.' });
      }
    } catch (error) {
      setStatus({ state: 'error', message: 'Reel delete failed.' });
    }
  };

  const setSectionRef = (key) => (node) => {
    sectionRefs.current[key] = node;
  };

  const updateCampaignField = (field, value) => {
    setSiteSettings((prev) => ({
      ...prev,
      campaign: {
        ...mergeCampaignSettings(prev.campaign),
        [field]: value,
      },
    }));
  };

  const handleDismissCampaign = () => {
    const hours = Number(campaignConfig.dismissHours) > 0 ? Number(campaignConfig.dismissHours) : 24;
    const expireAt = Date.now() + hours * 60 * 60 * 1000;
    const payload = JSON.stringify({ key: campaignIdentity, expireAt });
    localStorage.setItem('alok_campaign_dismiss', payload);
    setDismissedCampaignKey(campaignIdentity);
  };

  const renderEditorRail = () => (
    <aside className="editor-rail">
      <section className="editor-card editor-card-accent">
        <p className="editor-card-kicker">Story Pulse</p>
        <div className="editor-progress-row">
          <strong>{editorCompletion}%</strong>
          <span>{editorPublishTone}</span>
        </div>
        <div className="editor-progress-track">
          <span style={{ width: `${editorCompletion}%` }} />
        </div>
        <div className="editor-metric-grid">
          <div>
            <strong>{editorWordCount}</strong>
            <span>words</span>
          </div>
          <div>
            <strong>{editorReadMinutes}m</strong>
            <span>read time</span>
          </div>
          <div>
            <strong>{editorTags.length}</strong>
            <span>tags</span>
          </div>
          <div>
            <strong>{newsForm.language.toUpperCase()}</strong>
            <span>language</span>
          </div>
        </div>
      </section>

      <section className="editor-card">
        <p className="editor-card-kicker">Live Preview</p>
        <div
          className="editor-preview-media"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(8, 12, 18, 0.05), rgba(8, 12, 18, 0.72)), url(${editorPreviewImage})`,
          }}
        />
        <div className="editor-preview-copy">
          <h4>{newsForm.title || 'Your headline will appear here'}</h4>
          <p>{newsForm.excerpt || 'Write a sharp excerpt to preview how your story will open for readers.'}</p>
        </div>
      </section>

      <section className="editor-card">
        <p className="editor-card-kicker">Publishing Snapshot</p>
        <div className="editor-chip-row">
          <span className={`editor-chip editor-chip-${newsForm.status}`}>{newsForm.status}</span>
          <span className={`editor-chip editor-chip-priority-${newsForm.priority}`}>{newsForm.priority}</span>
          {newsForm.is_breaking && <span className="editor-chip editor-chip-alert">breaking</span>}
          {newsForm.is_featured && <span className="editor-chip editor-chip-featured">featured</span>}
        </div>
        <div className="editor-brief-list">
          <div>
            <span>Author</span>
            <strong>{newsForm.author_name || 'Unassigned'}</strong>
          </div>
          <div>
            <span>Category</span>
            <strong>{newsForm.category || 'Not set'}</strong>
          </div>
          <div>
            <span>Publish at</span>
            <strong>{newsForm.published_at ? formatDate(newsForm.published_at) : 'Immediate'}</strong>
          </div>
        </div>
      </section>

      <section className="editor-card">
        <p className="editor-card-kicker">Role Access</p>
        <div className="editor-brief-list">
          <div>
            <span>Current role</span>
            <strong>{currentRole}</strong>
          </div>
          <div>
            <span>Write news</span>
            <strong>{canWriteNews ? 'Allowed' : 'Restricted'}</strong>
          </div>
          <div>
            <span>Publish / Feature</span>
            <strong>{canPublishNews ? 'Allowed' : 'Draft only'}</strong>
          </div>
        </div>
      </section>

      <section className="editor-card">
        <p className="editor-card-kicker">Checklist</p>
        <div className="editor-checklist">
          <div className={newsForm.title.trim() ? 'done' : ''}>Headline is ready</div>
          <div className={newsForm.excerpt.trim() ? 'done' : ''}>Excerpt adds context</div>
          <div className={newsForm.content.trim() ? 'done' : ''}>Body copy is written</div>
          <div className={newsForm.cover_image_url.trim() ? 'done' : ''}>Cover image is attached</div>
          <div className={newsForm.meta_description.trim() ? 'done' : ''}>SEO description is filled</div>
        </div>
        <div className="editor-tag-cloud">
          {editorTags.length ? editorTags.map((tag) => <span key={tag}>{tag}</span>) : <span className="editor-tag-empty">Add tags to sharpen discovery</span>}
        </div>
      </section>
    </aside>
  );

  const openCropperForFile = async (file, target) => {
    try {
      const base64Image = await compressImageToDataUrl(file, { maxDimension: 1600, quality: 0.9 });
      setCropZoom(1.1);
      setCropper({
        open: true,
        src: base64Image,
        target,
        aspect: target === 'avatar' ? 1 : 16 / 9,
      });
    } catch (error) {
      setStatus({ state: 'error', message: error?.message || 'इमेज प्रोसेस नहीं हो पाई।' });
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !adminToken) return;
    setStatus({ state: 'loading', message: 'फाइल अपलोड हो रही है...' });
    const formData = new FormData();
    formData.append('media', file);
    try {
      const response = await fetch(`${API_URL}/api/uploads/media`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Upload failed');
      
      const updateRes = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: profileForm.name || adminProfile?.name || '',
          email: profileForm.email || adminProfile?.email || '',
          bio: profileForm.bio || adminProfile?.bio || '',
          avatar_url: payload.data.url,
        }),
      });
      const updatePayload = await updateRes.json();
      if (!updateRes.ok) throw new Error(updatePayload.error || 'Update failed');
      setAdminProfile(updatePayload.data);
      setStatus({ state: 'online', message: 'प्रोफाइल फोटो अपडेट हो गई!' });
    } catch (error) {
      console.error(error);
      setStatus({ state: 'error', message: 'फाइल अपलोड फेल हो गया।' });
    }
    event.target.value = '';
  };

  const handleCoverUpload = async (event) => {
    await handleMediaUpload(event, 'cover_image_url');
  };

  const handleAvatarDrop = async (event) => {
    event.preventDefault();
    setIsAvatarDragActive(false);
    if (!adminToken) return;
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    await handleAvatarUpload({ target: { files: [file], value: '' } });
  };

  const handleCoverDrop = async (event) => {
    event.preventDefault();
    setIsCoverDragActive(false);
    if (!adminToken) return;
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    
    // Simulate event object for handleMediaUpload
    await handleMediaUpload({ target: { files: [file], value: '' } }, 'cover_image_url');
  };

  // Direct browser→Cloudinary upload — bypasses Vercel's 4.5MB request body limit entirely.
  // Backend only signs the request (tiny JSON call), file goes straight to Cloudinary.
  const uploadVideoAsset = async (file, { assignToForm = true } = {}) => {
    if (!file) return null;

    if (!adminToken) {
      const blobUrl = URL.createObjectURL(file);
      if (assignToForm) setNewsForm((prev) => ({ ...prev, video_url: blobUrl }));
      setVideoUploadState({ state: 'preview', message: 'Local preview ready. Login for permanent upload.' });
      return blobUrl;
    }

    setReelUploadProgress(0);
    setVideoUploadState({ state: 'loading', message: 'Uploading... 0%' });
    setStatus({ state: 'loading', message: 'वीडियो अपलोड हो रहा है...' });

    // Step 1: get a signed upload token from our backend (small request, no file)
    let signData;
    try {
      const signRes = await fetch(`${API_URL}/api/uploads/sign`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
      });
      const signJson = await signRes.json();
      if (!signRes.ok) throw new Error(signJson?.error || 'Could not get upload token');
      signData = signJson.data;
    } catch (err) {
      const msg = err.message || 'Upload sign failed';
      setVideoUploadState({ state: 'error', message: msg });
      setStatus({ state: 'error', message: msg });
      return null;
    }

    // Step 2: upload file directly to Cloudinary (no Vercel size limit)
    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signData.api_key);
      formData.append('timestamp', signData.timestamp);
      formData.append('signature', signData.signature);
      formData.append('folder', signData.folder);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setReelUploadProgress(pct);
          setVideoUploadState({ state: 'loading', message: `Uploading... ${pct}%` });
        }
      };

      xhr.onload = () => {
        setReelUploadProgress(100);
        let result;
        try {
          result = JSON.parse(xhr.responseText);
        } catch {
          const msg = xhr.status === 413
            ? 'File too large for Cloudinary.'
            : `Upload failed (status ${xhr.status})`;
          setVideoUploadState({ state: 'error', message: msg });
          setStatus({ state: 'error', message: msg });
          return resolve(null);
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          const url = result.secure_url;
          if (assignToForm) setNewsForm((prev) => ({ ...prev, video_url: url }));
          setVideoUploadState({ state: 'online', message: 'Upload complete. Saving reel...' });
          setStatus({ state: 'online', message: 'वीडियो सफलतापूर्वक अपलोड हो गया।' });
          resolve(url);
        } else {
          const msg = result?.error?.message || `Cloudinary upload failed (${xhr.status})`;
          setVideoUploadState({ state: 'error', message: msg });
          setStatus({ state: 'error', message: msg });
          resolve(null);
        }
      };

      xhr.onerror = () => {
        setVideoUploadState({ state: 'error', message: 'Network error during upload.' });
        setStatus({ state: 'error', message: 'वीडियो अपलोड फेल हो गया।' });
        resolve(null);
      };

      // Direct Cloudinary auto-upload endpoint
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${signData.cloud_name}/video/upload`);
      xhr.send(formData);
    });
  };

  const handleVideoFileUpload = async (event) => {
    const file = event.target.files?.[0];
    await uploadVideoAsset(file);
    event.target.value = '';
  };

  const handleReelFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Client-side validation: max 120MB for video uploads
    const maxSize = 120 * 1024 * 1024;
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      setVideoUploadState({ state: 'error', message: `File too large (${fileSizeMB}MB). Max 120MB allowed.` });
      setStatus({ state: 'error', message: 'वीडियो फाइल बहुत बड़ी है। अधिकतम 120MB की अनुमति है।' });
      event.target.value = '';
      return;
    }

    const uploadedUrl = await uploadVideoAsset(file, { assignToForm: false });
    event.target.value = '';
    if (!uploadedUrl) return;

    const baseTitle = file.name.replace(/\.[^/.]+$/, '') || 'Untitled Reel';
    const nextReelPayload = {
      title: baseTitle,
      caption: `Fresh upload: ${baseTitle}`,
      video_url: uploadedUrl,
      creator_name: adminProfile?.name || siteSettings.site_name || 'ALOK Creator',
      creator_avatar: adminProfile?.avatar_url || '',
      creator_handle: adminProfile?.handle || adminProfile?.name?.toLowerCase().replace(/\s+/g, '') || 'aloklive',
      tags: ['upload'],
      status: 'published',
      published_at: new Date().toISOString(),
    };

    if (adminToken) {
      try {
        const response = await fetch(`${API_URL}/api/reels`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify(nextReelPayload),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Reel save failed');

        setReels((prev) => [payload.data, ...prev.filter((item) => item.id !== payload.data.id)]);

        // Re-fetch all reels from DB so state is in sync
        try {
          const reloadRes = await fetch(`${API_URL}/api/reels?limit=80`);
          if (reloadRes.ok) {
            const reloadData = await reloadRes.json();
            setReels(Array.isArray(reloadData.data) ? reloadData.data : [payload.data]);
          }
        } catch (e) {}
        setVideoUploadState({ state: 'online', message: 'Reel uploaded and saved in database! ✓' });
        setStatus({ state: 'online', message: 'रील सफलतापूर्वक सहेजा गया।' });
        openReel(payload.data);
        return;
      } catch (error) {
        console.error('Reel save error:', error);
        const errMsg = error.message || 'Failed to save reel to database';
        setStatus({ state: 'error', message: errMsg });
        setVideoUploadState({ state: 'error', message: errMsg });
        return;
      }
    }

    // No admin token — local only
    const localReel = {
      ...nextReelPayload,
      id: `local-${Date.now()}`,
      slug: `${baseTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`,
      views: 0,
      likes: 0,
      shares: 0,
      is_active: 1,
    };
    setReels((prev) => [localReel, ...prev]);
    setVideoUploadState({ state: 'preview', message: 'Reel locally added. Login for permanent save.' });
    openReel(localReel);
  };

  const applyCroppedImage = async () => {
    if (!cropper.open || !cropper.src) return;
    setIsApplyingCrop(true);
    try {
      const image = new Image();
      image.src = cropper.src;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const outputWidth = cropper.target === 'avatar' ? 360 : 1280;
      const outputHeight = cropper.target === 'avatar' ? 360 : 720;
      const canvas = document.createElement('canvas');
      canvas.width = outputWidth;
      canvas.height = outputHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('इमेज एडिटर उपलब्ध नहीं है।');

      const targetAspect = outputWidth / outputHeight;
      const zoom = Math.max(1, Number(cropZoom) || 1);
      let srcWidth = image.width / zoom;
      let srcHeight = image.height / zoom;

      if (srcWidth / srcHeight > targetAspect) {
        srcWidth = srcHeight * targetAspect;
      } else {
        srcHeight = srcWidth / targetAspect;
      }

      const sx = (image.width - srcWidth) / 2;
      const sy = (image.height - srcHeight) / 2;
      ctx.drawImage(image, sx, sy, srcWidth, srcHeight, 0, 0, outputWidth, outputHeight);

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

      if (cropper.target === 'avatar') {
        const response = await fetch(`${API_URL}/api/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: profileForm.name || adminProfile?.name || '',
            email: profileForm.email || adminProfile?.email || '',
            bio: profileForm.bio || adminProfile?.bio || '',
            avatar_url: croppedDataUrl,
          }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Upload failed');
        setAdminProfile(payload.data);
        setStatus({ state: 'online', message: 'प्रोफाइल फोटो अपडेट हो गई!' });
      } else {
        setNewsForm((prev) => ({ ...prev, cover_image_url: croppedDataUrl }));
        setStatus({ state: 'online', message: 'कवर इमेज तैयार है।' });
      }

      setCropper({ open: false, src: '', target: 'avatar', aspect: 1 });
    } catch (error) {
      setStatus({ state: 'error', message: error?.message || 'क्रॉप लागू नहीं हो सका।' });
    } finally {
      setIsApplyingCrop(false);
    }
  };

  useEffect(() => {
    const loadNews = async () => {
      setStatus({ state: 'loading', message: 'डेटा कनेक्शन सक्रिय हो रहा है...' });
      try {
        const response = await fetch(`${API_URL}/api/news?limit=12`);
        if (!response.ok) throw new Error('API unavailable');
        const payload = await response.json();
        const list = payload.data || [];
        setNews(list);
        setFeatured(list.filter((item) => item.is_featured));
        setStatus({ state: 'online', message: 'डेटा कनेक्शन स्थिर है।' });
      } catch (error) {
        setNews(demoNews);
        setFeatured(demoNews.filter((item) => item.is_featured));
        setStatus({ state: 'offline', message: 'लोकल डेमो डेटा चल रहा है।' });
      }
    };

    loadNews();

    // Background Keep-Alive Ping to prevent Vercel from sleeping completely while users are active
    const keepAliveInterval = setInterval(() => {
      fetch(`${API_URL}/api/health`).catch(() => {});
    }, 60000); // Prompts backend strictly every 60 seconds

    return () => clearInterval(keepAliveInterval);
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!adminToken) return;
      try {
        const response = await fetch(`${API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!response.ok) throw new Error('Profile error');
        const payload = await response.json();
        setAdminProfile(payload.data);
        setProfileForm({
          name: payload.data.name || '',
          bio: payload.data.bio || '',
          email: payload.data.email || '',
        });
      } catch (error) {
        setAdminProfile(null);
      }
    };

    loadProfile();
  }, [adminToken]);

  useEffect(() => {
    const loadAdmins = async () => {
      if (!adminToken) return;
      try {
        const response = await fetch(`${API_URL}/api/admins`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!response.ok) throw new Error('Admins error');
        const payload = await response.json();
        setAdminList(payload.data || []);
      } catch (error) {
        setAdminList([]);
      }
    };

    loadAdmins();
  }, [adminToken]);

  useEffect(() => {
    // 1. Device ID Generation
    if (!localStorage.getItem('alok_imei_uuid')) {
      const generateUUID = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      localStorage.setItem('alok_imei_uuid', generateUUID());
    }

    // 2. Term & Conditions Check
    if (!localStorage.getItem('alok_terms_agreed')) {
      setShowTermsBanner(true);
    } else if (!localStorage.getItem('alok_visitor_name')) {
      // 3. Username Onboarding Check
      setShowOnboardingModal(true);
    }
  }, []);

  const handleAcceptTerms = () => {
    localStorage.setItem('alok_terms_agreed', 'true');
    setShowTermsBanner(false);
    if (!localStorage.getItem('alok_visitor_name')) {
      setShowOnboardingModal(true);
    }
  };

  const handleSaveVisitorName = (e) => {
    e.preventDefault();
    if (visitorName.trim()) {
      localStorage.setItem('alok_visitor_name', visitorName.trim());
      setShowOnboardingModal(false);
    }
  };

  // Load users when user management panel opens
  useEffect(() => {
    if (showUserManagement && adminToken) {
      fetchUsers();
    }
  }, [showUserManagement, adminToken]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginState({ state: 'loading', message: 'लॉगिन हो रहा है...' });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
        signal: controller.signal,
      });
      let payload = {};
      try {
        payload = await response.json();
      } catch (error) {
        payload = {};
      }
      if (!response.ok) throw new Error(payload.error || 'Login failed');
      setAdminToken(payload.data.token);
      localStorage.setItem('alok_token', payload.data.token);
      setAdminProfile(payload.data.profile);
      setProfileForm({
        name: payload.data.profile.name || '',
        bio: payload.data.profile.bio || '',
        email: payload.data.profile.email || '',
      });
      setShowAdmin(true);
      navigateTo('/workspace');
      setLoginState({ state: 'success', message: 'लॉगिन सफल है।' });
    } catch (error) {
      const message =
        error?.name === 'AbortError'
          ? 'सर्वर से जवाब नहीं मिला। सर्वर चालू है या नहीं जांचें।'
          : error?.message || 'लॉगिन असफल: विवरण जांचें।';
      setLoginState({ state: 'error', message });
      setStatus({ state: 'error', message });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleLogout = () => {
    setAdminToken('');
    setAdminProfile(null);
    setShowAdmin(false);
    localStorage.removeItem('alok_token');
    navigateTo('/');
  };

  // User Management Functions
  const fetchUsers = async () => {
    if (!adminToken) return;
    try {
      const response = await fetch(`${API_URL}/api/admins`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const payload = await response.json();
      if (response.ok) {
        setAdminList(payload.data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleUserCreate = async (event) => {
    event.preventDefault();
    if (!adminToken) return;
    try {
      const response = await fetch(`${API_URL}/api/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(userForm),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'User creation failed');
      setAdminList((prev) => [payload.data, ...prev]);
      setUserForm({ name: '', email: '', password: '', role: 'author', bio: '' });
      setStatus({ state: 'online', message: `${userForm.name} successfully added!` });
    } catch (error) {
      setStatus({ state: 'error', message: error.message || 'User creation failed' });
    }
  };

  const handleUserUpdate = async (userId, updates) => {
    if (!adminToken) return;
    try {
      const response = await fetch(`${API_URL}/api/admins/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(updates),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'User update failed');
      setAdminList((prev) => prev.map(u => u.id === userId ? payload.data : u));
      setEditingUser(null);
      setStatus({ state: 'online', message: 'User updated successfully!' });
    } catch (error) {
      setStatus({ state: 'error', message: error.message || 'User update failed' });
    }
  };

  const handleUserDelete = async (userId) => {
    if (!adminToken) return;
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`${API_URL}/api/admins/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'User deletion failed');
      setAdminList((prev) => prev.filter(u => u.id !== userId));
      setStatus({ state: 'online', message: 'User deleted successfully!' });
    } catch (error) {
      setStatus({ state: 'error', message: error.message || 'User deletion failed' });
    }
  };

  const handlePasswordChange = async (userId, newPassword) => {
    if (!adminToken) return;
    try {
      const response = await fetch(`${API_URL}/api/admins/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Password change failed');
      setAdminPasswords((prev) => ({ ...prev, [userId]: '' }));
      setStatus({ state: 'online', message: 'Password updated successfully!' });
    } catch (error) {
      setStatus({ state: 'error', message: error.message || 'Password change failed' });
    }
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
    if (!adminToken) return;
    try {
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(profileForm),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Profile save failed');
      setAdminProfile(payload.data);
      setStatus({ state: 'online', message: 'प्रोफाइल अपडेट हो गया।' });
    } catch (error) {
      setStatus({ state: 'error', message: 'प्रोफाइल अपडेट नहीं हो पाया।' });
    }
  };

  const handleNewsCreate = async (event) => {
    event.preventDefault();
    if (!adminToken) return;

    if (!canWriteNews) {
      setStatus({ state: 'error', message: 'आपके रोल को खबर लिखने की अनुमति नहीं है।' });
      return;
    }

    const payload = {
      ...newsForm,
      tags: newsForm.tags.split(',').map((tag) => tag.trim()),
      status: canPublishNews ? newsForm.status : 'draft',
      is_featured: canPublishNews ? newsForm.is_featured : false,
      is_breaking: canPublishNews ? newsForm.is_breaking : false,
    };
    try {
      const response = await fetch(`${API_URL}/api/news`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'News create failed');
      setNews((prev) => [result.data, ...prev]);
      if (result.data.is_featured) {
        setFeatured((prev) => [result.data, ...prev]);
      }
      setNewsForm({
        title: '',
        category: 'कैंपस',
        excerpt: '',
        content: '',
        tags: 'BJMC, मीडिया',
        cover_image_url: '',
        gallery_urls: '',
        video_url: '',
        audio_url: '',
        source: 'ALOK',
        ai_summary: '',
        published_at: '',
        is_featured: false,
        is_breaking: false,
        author_name: 'ALOK Team',
        author_email: '',
        author_twitter: '',
        author_instagram: '',
        meta_description: '',
        meta_keywords: '',
        seo_title: '',
        location: '',
        coordinates: '',
        twitter_url: '',
        facebook_url: '',
        instagram_url: '',
        youtube_url: '',
        status: 'published',
        priority: 'normal',
        language: 'hi',
        expire_at: '',
      });
      setStatus({ state: 'online', message: 'नई खबर लाइव हो गई।' });
    } catch (error) {
      setStatus({ state: 'error', message: 'खबर सेव नहीं हो पाई।' });
    }
  };

  const handleAdminCreate = async (event) => {
    event.preventDefault();
    if (!adminToken) return;
    try {
      const response = await fetch(`${API_URL}/api/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(adminForm),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Admin create failed');
      setAdminForm({ name: '', email: '', password: '', bio: '' });
      setAdminList((prev) => [payload.data, ...prev]);
      setStatus({ state: 'online', message: 'नया एडमिन जोड़ दिया गया।' });
    } catch (error) {
      setStatus({ state: 'error', message: 'एडमिन ऐड नहीं हो पाया।' });
    }
  };

  const handleAdminPasswordSave = async (adminId) => {
    if (!adminToken) return;
    const newPassword = adminPasswords[adminId];
    if (!newPassword) {
      setStatus({ state: 'error', message: 'नया पासवर्ड दें।' });
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/admins/${adminId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Password update failed');
      setAdminPasswords((prev) => ({ ...prev, [adminId]: '' }));
      setStatus({ state: 'online', message: 'पासवर्ड अपडेट हो गया।' });
    } catch (error) {
      setStatus({ state: 'error', message: 'पासवर्ड अपडेट नहीं हो पाया।' });
    }
  };

  const handleMediaUpload = async (event, field) => {
    const file = event.target.files?.[0];
    if (!file || !adminToken) return;

    if (field === 'video_url') {
      await uploadVideoAsset(file);
      event.target.value = '';
      return;
    }

    setStatus({ state: 'loading', message: 'फाइल अपलोड हो रही है...' });

    const formData = new FormData();
    formData.append('media', file);

    try {
      const response = await fetch(`${API_URL}/api/uploads/media`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Upload failed');

      setNewsForm((prev) => ({ ...prev, [field]: payload.data.url }));
      setStatus({ state: 'online', message: 'फाइल सफलतापूर्वक अपलोड हुई।' });
    } catch (error) {
      console.error(error);
      setStatus({ state: 'error', message: 'फाइल अपलोड फेल हो गया।' });
    }
  };

  useEffect(() => {
    const loadReels = async () => {
      try {
        const response = await fetch(`${API_URL}/api/reels?limit=80`);
        if (!response.ok) throw new Error('Reels API unavailable');
        const payload = await response.json();
        setReels(Array.isArray(payload.data) ? payload.data : []);
      } catch (error) {
        setReels(demoNews); 
      }
    };

    loadReels();
  }, []);

  // Auto-cleanup junk reels (base64/blob) stored before Cloudinary was configured
  useEffect(() => {
    if (!adminToken) return;
    const cleanupJunk = async () => {
      try {
        const res = await fetch(`${API_URL}/api/reels/cleanup-junk`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.data?.deleted > 0) {
            console.info(`[Cleanup] Removed ${data.data.deleted} junk reel(s):`, data.data.titles);
            // Reload reels after cleanup
            const reloadRes = await fetch(`${API_URL}/api/reels?limit=80`);
            if (reloadRes.ok) {
              const reload = await reloadRes.json();
              setReels(Array.isArray(reload.data) ? reload.data : []);
            }
          }
        }
      } catch (e) {
        // Silent — cleanup is best-effort
      }
    };
    cleanupJunk();
  }, [adminToken]);

  // Load site settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/settings`);
        if (response.ok) {
          const payload = await response.json();
          if (payload.data) {
            setSiteSettings((prev) => ({
              ...prev,
              ...payload.data,
              campaign: mergeCampaignSettings(payload.data.campaign),
            }));
            document.title = payload.data.site_title || 'ALOK - बीजेएमसी न्यूज़';
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('alok_campaign_dismiss');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed?.key || !parsed?.expireAt) return;
      if (Date.now() >= Number(parsed.expireAt)) {
        localStorage.removeItem('alok_campaign_dismiss');
        return;
      }
      setDismissedCampaignKey(parsed.key);
    } catch (error) {
      console.error('Failed to restore campaign dismiss state:', error);
    }
  }, []);

  // Edit news handler
  const handleEditNews = (newsItem) => {
    setEditingNews(newsItem);
    setNewsForm({
      title: newsItem.title || '',
      category: newsItem.category || 'कैंपस',
      excerpt: newsItem.excerpt || '',
      content: newsItem.content || '',
      tags: Array.isArray(newsItem.tags) ? newsItem.tags.join(', ') : (newsItem.tags || 'BJMC'),
      cover_image_url: newsItem.cover_image_url || '',
      gallery_urls: newsItem.gallery_urls || '',
      video_url: newsItem.video_url || '',
      audio_url: newsItem.audio_url || '',
      source: newsItem.source || 'ALOK',
      ai_summary: newsItem.ai_summary || '',
      published_at: newsItem.published_at || '',
      is_featured: newsItem.is_featured || false,
      is_breaking: newsItem.is_breaking || false,
      author_name: newsItem.author_name || 'ALOK Team',
      author_email: newsItem.author_email || '',
      author_twitter: newsItem.author_twitter || '',
      author_instagram: newsItem.author_instagram || '',
      meta_description: newsItem.meta_description || '',
      meta_keywords: newsItem.meta_keywords || '',
      seo_title: newsItem.seo_title || '',
      location: newsItem.location || '',
      coordinates: newsItem.coordinates || '',
      twitter_url: newsItem.twitter_url || '',
      facebook_url: newsItem.facebook_url || '',
      instagram_url: newsItem.instagram_url || '',
      youtube_url: newsItem.youtube_url || '',
      status: newsItem.status || 'published',
      priority: newsItem.priority || 'normal',
      language: newsItem.language || 'hi',
      expire_at: newsItem.expire_at || '',
    });
    setShowEditModal(true);
  };

  // Save edited news
  const handleSaveNews = async (event) => {
    event.preventDefault();
    if (!adminToken || !editingNews) return;

    if (!canWriteNews) {
      setStatus({ state: 'error', message: 'आपके रोल को खबर संपादित करने की अनुमति नहीं है।' });
      return;
    }

    setStatus({ state: 'loading', message: 'खबर अपडेट हो रही है...' });

    try {
      const tags = newsForm.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const response = await fetch(`${API_URL}/api/news/${editingNews.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          ...newsForm,
          tags,
          status: canPublishNews ? newsForm.status : 'draft',
          is_featured: canPublishNews ? newsForm.is_featured : false,
          is_breaking: canPublishNews ? newsForm.is_breaking : false,
        }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Update failed');

      // Update news list
      setNews((prev) => prev.map((item) => item.id === editingNews.id ? payload.data : item));
      setShowEditModal(false);
      setEditingNews(null);
      setStatus({ state: 'online', message: 'खबर अपडेट हो गई!' });
    } catch (error) {
      setStatus({ state: 'error', message: 'अपडेट असफल रहा।' });
    }
  };

  const handleSaveReel = async (event) => {
    event.preventDefault();
    if (!adminToken) return;

    setStatus({ state: 'loading', message: 'रील सेव हो रही है...' });

    try {
      const tagsArray = typeof reelForm.tags === 'string' ? reelForm.tags.split(',').map((t) => t.trim()).filter(Boolean) : reelForm.tags;
      const payload = {
        ...reelForm,
        tags: tagsArray,
        creator_name: adminProfile?.name || siteSettings.site_name || 'ALOK Creator',
        creator_avatar: adminProfile?.avatar_url || '',
        creator_handle: adminProfile?.handle || adminProfile?.name?.toLowerCase().replace(/\s+/g, '') || 'aloklive',
        published_at: new Date().toISOString(),
      };

      const method = editingReel?.id === 'new-reel' ? 'POST' : 'PUT';
      const endpoint = editingReel?.id === 'new-reel' 
        ? `${API_URL}/api/reels` 
        : `${API_URL}/api/reels/${editingReel.id}`;

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error || 'Reel save failed');

      if (editingReel?.id === 'new-reel') {
        setReels((prev) => [resData.data, ...prev]);
      } else {
        setReels((prev) => prev.map((item) => item.id === editingReel.id ? resData.data : item));
      }

      setShowReelModal(false);
      setEditingReel(null);
      setReelForm({ title: '', caption: '', video_url: '', tags: '', status: 'published' });
      setStatus({ state: 'online', message: 'रील सेव हो गई!' });
    } catch (error) {
      console.error(error);
      setStatus({ state: 'error', message: 'रील सेव असफल रहा।' });
    }
  };

  // Delete news handler
  const handleDeleteNews = async (newsId) => {
    if (!adminToken || !confirm('क्या आप इस खबर को हटाना चाहते हैं?')) return;

    setStatus({ state: 'loading', message: 'खबर हटाई जा रही है...' });

    try {
      const response = await fetch(`${API_URL}/api/news/${newsId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      if (!response.ok) throw new Error('Delete failed');

      setNews((prev) => prev.filter((item) => item.id !== newsId));
      setStatus({ state: 'online', message: 'खबर हटा दी गई!' });
    } catch (error) {
      setStatus({ state: 'error', message: 'हटाना असफल रहा।' });
    }
  };

  // Update site settings
  const handleUpdateSettings = async (event) => {
    event.preventDefault();
    if (!adminToken) return;

    setStatus({ state: 'loading', message: 'सेटिंग्स अपडेट हो रही हैं...' });

    try {
      const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(siteSettings),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Update failed');

      setSiteSettings(payload.data);
      document.title = payload.data.site_title || 'ALOK - बीजेएमसी न्यूज़';
      setShowSettingsModal(false);
      setStatus({ state: 'online', message: 'सेटिंग्स अपडेट हो गईं!' });
    } catch (error) {
      setStatus({ state: 'error', message: 'अपडेट असफल रहा।' });
    }
  };

  // Language switcher
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('alok_language', newLang);
    if (!languageOverride) {
      setLanguageOverride(true);
      localStorage.setItem('alok_language_override', 'true');
    }
  };

  // Auto-detect language on first visit
  useEffect(() => {
    if (!languageOverride) {
      const detected = detectLanguage();
      setLanguage(detected);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('alok_theme', theme);
  }, [theme]);

  useEffect(() => {
    const handlePopState = () => {
      setRouteState(getRouteSnapshot());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Reels: IntersectionObserver for active reel detection + native video play/pause
  useEffect(() => {
    if (currentPageKey !== 'videos') {
      setActiveReelIndex(0);
      return;
    }
    const container = reelsContainerRef.current;
    if (!container) return;
    const frames = Array.from(container.querySelectorAll('.reel-frame'));
    if (!frames.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const idx = parseInt(entry.target.dataset.reelIdx, 10);
            if (!isNaN(idx)) setActiveReelIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.5 }
    );
    frames.forEach((f) => observer.observe(f));
    return () => observer.disconnect();
  }, [currentPageKey, reels.length]);

  // Sync play/pause strictly to activeReelIndex
  useEffect(() => {
    if (currentPageKey !== 'videos' || !reelsContainerRef.current) return;
    const frames = reelsContainerRef.current.querySelectorAll('.reel-frame');
    frames.forEach((frame) => {
      const idx = parseInt(frame.dataset.reelIdx, 10);
      const videoEl = frame.querySelector('video');
      if (videoEl) {
        if (idx === activeReelIndex && !reelPaused.has(idx)) {
          videoEl.play().catch(() => {});
        } else {
          videoEl.pause();
        }
      }
    });
  }, [activeReelIndex, reelPaused, currentPageKey]);

  // Sync mute state to all native video elements in reels
  useEffect(() => {
    if (currentPageKey !== 'videos' || !reelsContainerRef.current) return;
    reelsContainerRef.current.querySelectorAll('video').forEach((v) => { v.muted = reelsMuted; });
  }, [reelsMuted, currentPageKey]);

  useEffect(() => {
    setShowAdmin(isWorkspacePage);
  }, [isWorkspacePage]);

  useEffect(() => {
    if (currentPageKey !== 'categories') return;
    const params = new URLSearchParams(currentSearch);
    const nextCategory = params.get('category');
    setActiveCategory(nextCategory || t('allCategories', language));
  }, [currentPageKey, currentSearch, language]);

  useEffect(() => {
    if (isStoryPage) {
      setSelectedStory(routeStory);
      return;
    }
    setSelectedStory(null);
  }, [isStoryPage, routeStory]);

  useEffect(() => {
    localStorage.setItem('alok_reel_follows', JSON.stringify(followedCreators));
  }, [followedCreators]);

  // Breaking news: Manual (is_breaking) या Automatic (latest 5)
  const breakingNews = news.filter((item) => item.is_breaking);
  const tickerItems = breakingNews.length > 0 ? breakingNews.slice(0, 5) : news.slice(0, 5);

  const heroStory = featured[0] || news[0];
  const reelItems = reels;
  const reelPageItem = routeReel || reelItems[0] || null;
  const reelCreatorName = reelPageItem?.creator_name || reelPageItem?.author_name || reelPageItem?.source || siteSettings.site_name || 'ALOK Creator';
  const reelCreatorKey = reelPageItem ? getCreatorKey(reelPageItem) : '';
  const isFollowingReelCreator = reelCreatorKey ? followedCreators.includes(reelCreatorKey) : false;
  const reelFollowers = formatCompactNumber((reelPageItem?.views || 0) * 6 + 1200);
  const reelLikes = formatCompactNumber(reelPageItem?.likes ?? ((reelPageItem?.views || 0) * 2 + 180));
  const reelShares = formatCompactNumber(reelPageItem?.shares ?? (Math.round((reelPageItem?.views || 0) * 0.18) + 24));

  return (
    <div className={`App ${currentPageKey === 'videos' ? 'app-videos-mode' : ''}`}>
      <CampaignLayer campaign={isCampaignVisible ? campaignConfig : null} resolveMediaUrl={resolveMediaUrl} onDismiss={handleDismissCampaign} />
      {isFullPageCampaign && adminToken && (
        <button className="campaign-admin-exit" onClick={() => setShowSettingsModal(true)}>
          Manage Campaign
        </button>
      )}

      {!isFullPageCampaign && (
        <>
          {currentPageKey !== 'videos' && (
            <header className="header">
        <div className="header-content">
          <div className="logo-section logo-button" onClick={() => navigateTo('/')} role="button" tabIndex={0} onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              navigateTo('/');
            }
          }}>
            <span className="logo-dot"></span>
            <div>
              <h1>{siteSettings.site_name || 'ALOK'}</h1>
              <p>{siteSettings.site_subtitle || 'बीजेएमसी न्यूज़'}</p>
            </div>
            {adminToken && (
              <button
                className="edit-icon-btn"
                onClick={() => setShowSettingsModal(true)}
                title="साइट सेटिंग्स बदलें"
              >
                ✏️
              </button>
            )}
          </div>
          <div className="header-actions">
            <button
              className="translation-tool-btn"
              onClick={() => setShowTranslationTool(true)}
              title={language === 'hi' ? 'अनुवाद उपकरण' : 'Translation Tool'}
            >
              🌐
            </button>
            <div className="language-switcher">
              <button
                className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('hi')}
                title="हिंदी"
              >
                हि
              </button>
              <button
                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en')}
                title="English"
              >
                EN
              </button>
            </div>
            <button className="btn-secondary" onClick={openWorkspace}>
              <span className="admin-btn-icon">{adminToken ? '⚙️' : '🔐'}</span>
              <span className="admin-btn-label">{adminToken ? t('admin', language) : t('login', language)}</span>
            </button>
            <button
              className="theme-toggle-btn header-theme-btn"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              title={theme === 'dark' ? 'Switch to day mode' : 'Switch to night mode'}
            >
              <span className="theme-toggle-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span className="theme-toggle-label">{theme === 'dark' ? 'Day' : 'Night'}</span>
            </button>
          </div>
        </div>
        <div className="command-nav-row">
          <nav className="command-nav">
            {navItems.map((item) => (
              <a
                key={item.key}
                href={item.path}
                className={`command-nav-item ${currentPageKey === item.key || (currentPageKey === 'reel' && item.key === 'videos') ? 'active' : ''}`}
                onClick={(e) => { e.preventDefault(); navigateTo(item.path); }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </header>
      )}

      {/* Breaking News Ticker */}
      {tickerItems.length > 0 && currentPageKey !== 'videos' && (
        <section className="breaking-news">
          <span className="breaking-label">{t('breakingNews', language)}</span>
          <div className="ticker-wrapper" style={{ flexGrow: 1, overflow: 'hidden', whiteSpace: 'nowrap', maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 10px, black calc(100% - 20px), transparent)' }}>
            <div className="ticker-track">
              <div className="ticker-content">
                {tickerItems.concat(tickerItems).map((item, index) => (
                  <span
                    key={`${item.id}-${index}`}
                    onClick={() => openStory(item)}
                    className="ticker-item"
                  >
                    {item.title}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <div style={{ display: device.isDesktop && !isStoryPage && !isReelPage && currentPageKey !== 'videos' ? 'grid' : 'block', gridTemplateColumns: device.isDesktop && !isStoryPage && !isReelPage && currentPageKey !== 'videos' ? '1fr 320px' : '1fr', gap: '24px' }}>
        {/* Main Content */}
        <main className={`main-content ${currentPageKey === 'videos' ? 'videos-page-main' : ''}`}>
          {currentPageKey === 'home' && (
            <>
              {heroStory && (
                <section className="featured-story">
                  <div className="story-image" style={{ backgroundImage: `url(${resolveMediaUrl(heroStory.cover_image_url)})` }}>
                    {adminToken && (
                      <div className="featured-edit-actions">
                        <button
                          className="edit-icon-btn"
                          onClick={(e) => { e.stopPropagation(); handleEditNews(heroStory); }}
                          title="संपादित करें"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                    <div className="story-overlay">
                      <span className="story-badge">{heroStory.category}</span>
                      <h2>{heroStory.title}</h2>
                      <p>{heroStory.excerpt}</p>
                      <button className="btn-primary" onClick={() => openStory(heroStory)}>
                        {t('readFullStory', language)}
                      </button>
                    </div>
                  </div>
                </section>
              )}

              <section className="stories-section">
                <div className="section-header">
                  <h2>{t('latestNews', language)}</h2>
                  <p>{t('todayHeadlines', language)}</p>
                </div>
                <div className="stories-grid">
                  {news.slice(0, 6).map((item) => (
                    <article key={item.id} className="story-card">
                      <div className="card-image" style={{ backgroundImage: `url(${resolveMediaUrl(item.cover_image_url)})` }}>
                        {adminToken && (
                          <div className="card-edit-actions">
                            <button
                              className="edit-icon-btn"
                              onClick={(e) => { e.stopPropagation(); handleEditNews(item); }}
                              title="संपादित करें"
                            >
                              ✏️
                            </button>
                            <button
                              className="delete-icon-btn"
                              onClick={(e) => { e.stopPropagation(); handleDeleteNews(item.id); }}
                              title="हटाएं"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="card-content" onClick={() => openStory(item)}>
                        <span className="card-category">{item.category}</span>
                        <h3>{item.title}</h3>
                        <p>{item.excerpt}</p>
                        <div className="card-meta">
                          <span className="meta-time">{timeAgo(item.published_at || item.created_at, language)}</span>
                          <span>•</span>
                          <span className="meta-views" style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
                            👁 {item.views || 0}
                          </span>
                          <span>•</span>
                          <span className="meta-author">{item.author_name || 'ALOK'}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="categories-section">
                <div className="section-header">
                  <h2>{t('categories', language)}</h2>
                </div>
                <div className="categories-grid">
                  {categories
                    .filter((cat) => cat !== t('allCategories', language))
                    .slice(0, 4)
                    .map((cat) => (
                      <button
                        key={cat}
                        className="category-btn"
                        onClick={() => openCategoryPage(cat)}
                      >
                        <span>{cat}</span>
                        <small>{news.filter((n) => n.category === cat).length} {t('stories', language)}</small>
                      </button>
                    ))}
                </div>
              </section>

              <section className="feature-hub-section">
                <div className="section-header">
                  <h2>Platform Feature Hub</h2>
                  <p>All major capabilities grouped by their purpose.</p>
                </div>
                <div className="feature-hub-grid">
                  {featureGroups.map((group) => (
                    <article key={group.title} className="feature-hub-card">
                      <h3>{group.title}</h3>
                      <p>{group.description}</p>
                      <div className="feature-badge-row">
                        {group.badges.map((badge) => (
                          <span key={badge}>{badge}</span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </>
          )}

          {currentPageKey === 'latest' && (
            <section className="page-shell">
              <div className="page-hero">
                <p className="page-kicker">Latest Desk</p>
                <h2>{t('latestNews', language)}</h2>
                <p>{t('todayHeadlines', language)}</p>
              </div>
              <section className="stories-section">
                <div className="stories-grid">
                  {news.map((item) => (
                    <article key={item.id} className="story-card">
                      <div className="card-image" style={{ backgroundImage: `url(${resolveMediaUrl(item.cover_image_url)})` }} />
                      <div className="card-content" onClick={() => openStory(item)}>
                        <span className="card-category">{item.category}</span>
                        <h3>{item.title}</h3>
                        <p>{item.excerpt}</p>
                        <div className="card-meta">
                          <span className="meta-time">{timeAgo(item.published_at || item.created_at, language)}</span>
                          <span>•</span>
                          <span className="meta-views" style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
                            👁 {item.views || 0}
                          </span>
                          <span>•</span>
                          <span className="meta-author">{item.author_name || 'ALOK'}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          )}

          {currentPageKey === 'trending' && (
            <section className="page-shell">
              <div className="page-hero">
                <p className="page-kicker">Signal Board</p>
                <h2>{t('trending', language)}</h2>
                <p>Most-read aur fastest-rising stories ek dedicated page par.</p>
              </div>
              <section className="stories-section">
                <div className="stories-grid">
                  {trendingNews.map((item) => (
                    <article key={item.id} className="story-card">
                      <div className="card-image" style={{ backgroundImage: `url(${resolveMediaUrl(item.cover_image_url)})` }} />
                      <div className="card-content" onClick={() => openStory(item)}>
                        <span className="card-category">{item.category}</span>
                        <h3>{item.title}</h3>
                        <p>{item.excerpt}</p>
                        <div className="card-meta">
                          <span className="meta-time">{timeAgo(item.published_at || item.created_at, language)}</span>
                          <span>•</span>
                          <span className="meta-views" style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
                            👁 {item.views || 0}
                          </span>
                          <span>•</span>
                          <span className="meta-author">{item.author_name || 'ALOK'}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          )}

          {currentPageKey === 'categories' && (
            <section className="page-shell">
              <div className="page-hero">
                <p className="page-kicker">Structured Browsing</p>
                <h2>{t('categories', language)}</h2>
                <p>हर desk के लिए dedicated listing, ताकि users quickly filter कर सकें.</p>
              </div>
              <section className="categories-section">
                <div className="categories-grid">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                      onClick={() => openCategoryPage(cat)}
                    >
                      <span>{cat}</span>
                      <small>
                        {cat === t('allCategories', language)
                          ? news.length
                          : news.filter((n) => n.category === cat).length} {t('stories', language)}
                      </small>
                    </button>
                  ))}
                </div>
              </section>
              <section className="stories-section">
                <div className="section-header">
                  <h2>{activeCategory}</h2>
                  <p>{filteredNews.length} curated stories for this desk.</p>
                </div>
                <div className="stories-grid">
                  {filteredNews.map((item) => (
                    <article key={item.id} className="story-card">
                      <div className="card-image" style={{ backgroundImage: `url(${resolveMediaUrl(item.cover_image_url)})` }} />
                      <div className="card-content" onClick={() => openStory(item)}>
                        <span className="card-category">{item.category}</span>
                        <h3>{item.title}</h3>
                        <p>{item.excerpt}</p>
                        <div className="card-meta">
                          <span className="meta-time">{timeAgo(item.published_at || item.created_at, language)}</span>
                          <span>•</span>
                          <span className="meta-views" style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
                            👁 {item.views || 0}
                          </span>
                          <span>•</span>
                          <span className="meta-author">{item.author_name || 'ALOK'}</span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          )}

          {currentPageKey === 'videos' && (
            <div className="reels-container" ref={reelsContainerRef}>
              {reelItems.length === 0 && (
                <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100dvh', width: '100%', background: '#000', zIndex: 999 }}>
                  <div className="pulse-dot" style={{ width: '20px', height: '20px', marginBottom: '16px' }}></div>
                  <h3>Loading Video Stories...</h3>
                  <p style={{ opacity: 0.6, fontSize: '14px', marginTop: '8px' }}>Please wait while content is loading or check your connection.</p>
                </div>
              )}
              {reelItems.map((item, idx) => {
                const isYT = item.video_url && (item.video_url.includes('youtube') || item.video_url.includes('youtu.be') || item.video_url.includes('/embed/'));
                const ytId = isYT ? extractYouTubeId(item.video_url) : '';
                const isActive = activeReelIndex === idx;
                const isPaused = reelPaused.has(idx);
                const creatorInitial = (item.creator_name || 'A').charAt(0).toUpperCase();
                const creatorAvatar = item.creator_avatar || '';
                return (
                  <div
                    key={item.id}
                    className={`reel-frame${isActive ? ' reel-active' : ''}`}
                    data-reel-idx={idx}
                  >
                    {/* Video layer — tap to pause/play */}
                    <div
                      className="reel-video-wrap"
                      onClick={() => {
                        const v = reelVideoRefs.current[idx];
                        if (v) {
                          if (v.paused) {
                            v.play().catch(() => {});
                            setReelPaused((prev) => { const n = new Set(prev); n.delete(idx); return n; });
                          } else {
                            v.pause();
                            setReelPaused((prev) => { const n = new Set(prev); n.add(idx); return n; });
                          }
                        }
                      }}
                    >
                      {isYT && ytId ? (
                        isActive ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=${reelsMuted ? 1 : 0}&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&showinfo=0&playsinline=1&iv_load_policy=3&fs=0`}
                            title={item.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="reel-iframe"
                          />
                        ) : (
                          <div
                            className="reel-cover-fallback"
                            style={{ backgroundImage: `url(https://img.youtube.com/vi/${ytId}/hqdefault.jpg)` }}
                          />
                        )
                      ) : item.video_url ? (
                        <video
                          ref={(el) => { if (el) reelVideoRefs.current[idx] = el; }}
                          src={resolveMediaUrl(item.video_url)}
                          className="reel-video-el"
                          loop
                          playsInline
                          muted={reelsMuted}
                        />
                      ) : (
                        <div
                          className="reel-cover-fallback"
                          style={{ backgroundImage: `url(${resolveMediaUrl(item.cover_image_url)})` }}
                        />
                      )}
                      {isPaused && (
                        <div className="reel-pause-indicator">
                          <svg viewBox="0 0 24 24" fill="white" width="64" height="64" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }}>
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Gradient overlay (non-interactive) */}
                    <div className="reel-gradient-overlay" />

                    {/* Watermark & Back Navigation */}
                    <div className="reel-top-overlay">
                      <button className="reel-back-btn" onClick={(e) => { e.preventDefault(); navigateTo('/'); }}>
                        ←
                      </button>
                      <span className="reel-watermark-text">{siteSettings.site_name || 'ALOK'}</span>
                    </div>

                    {/* Right action column (TikTok-style) */}
                    <div className="reel-actions-col">
                      {/* Creator avatar + follow pill */}
                      <div className="reel-creator-pill">
                        {creatorAvatar ? (
                          <img src={resolveMediaUrl(creatorAvatar)} alt="creator" className="reel-creator-avatar-sm" style={{ objectFit: 'cover' }} />
                        ) : (
                          <div className="reel-creator-avatar-sm">{creatorInitial}</div>
                        )}
                        <button
                          className="reel-follow-fab-btn"
                          onClick={(e) => { e.stopPropagation(); toggleFollowCreator(item); }}
                          title="Follow creator"
                        >＋</button>
                      </div>

                      {/* Like */}
                      <div className="reel-action-item">
                        <button className="reel-action-btn" onClick={(e) => e.stopPropagation()}>
                          <span className="reel-action-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                            </svg>
                          </span>
                        </button>
                        <span className="reel-action-count">{formatCompactNumber(item.likes || 0)}</span>
                      </div>

                      {/* Comment / Open reel page */}
                      <div className="reel-action-item">
                        <button className="reel-action-btn" onClick={(e) => { e.stopPropagation(); openReel(item); }}>
                          <span className="reel-action-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                              <path d="M21 6h-2v9H6v2c0 .55.45 1 1 1h11l4 4V7c0-.55-.45-1-1-1zm-4 6V3c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v14l4-4h10c.55 0 1-.45 1-1z"/>
                            </svg>
                          </span>
                        </button>
                        <span className="reel-action-count">12</span>
                      </div>

                      {/* Bookmark */}
                      <div className="reel-action-item">
                        <button className="reel-action-btn" onClick={(e) => e.stopPropagation()}>
                          <span className="reel-action-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                              <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                            </svg>
                          </span>
                        </button>
                        <span className="reel-action-count">Save</span>
                      </div>

                      {/* Share */}
                      <div className="reel-action-item">
                        <button className="reel-action-btn" onClick={(e) => { e.stopPropagation(); shareReel(item); }}>
                          <span className="reel-action-icon">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" style={{ transform: 'scaleX(-1)' }}>
                              <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
                            </svg>
                          </span>
                        </button>
                        <span className="reel-action-count">{formatCompactNumber(item.shares || 0)}</span>
                      </div>

                      {/* Sound */}
                      <div className="reel-action-item">
                        <button className="reel-action-btn" onClick={(e) => { e.stopPropagation(); setReelsMuted((m) => !m); }}>
                          <span className="reel-action-icon">
                            {reelsMuted ? (
                              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                              </svg>
                            )}
                          </span>
                        </button>
                        <span className="reel-action-count">{reelsMuted ? 'Off' : 'On'}</span>
                      </div>

                      {/* Admin: Delete */}
                      {adminToken && (
                        <div className="reel-action-item">
                          <button
                            className="reel-action-btn reel-delete-btn"
                            onClick={(e) => { e.stopPropagation(); deleteReel(item.id || item._id); }}
                          >
                            <span className="reel-action-icon">
                              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                              </svg>
                            </span>
                          </button>
                          <span className="reel-action-count">Del</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom info area (TikTok-style caption zone) */}
                    <div className="reel-bottom-info">
                      <div className="reel-creator-line">
                        <strong className="reel-creator-handle">
                          @{item.creator_handle || slugifyText(item.creator_name || 'creator').replace(/-/g, '')}
                        </strong>
                        {item.category && <span className="reel-category-badge">{item.category}</span>}
                      </div>
                      <p className="reel-caption-text">
                        {(item.caption || item.excerpt || item.title || '').slice(0, 120)}
                      </p>
                      {item.tags && item.tags.length > 0 && (
                        <div className="reel-hashtag-row">
                          {item.tags.slice(0, 4).map((tag) => (
                            <span key={tag}>#{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="reel-audio-ticker">
                        <span className="reel-audio-disc">🎵</span>
                        <div className="reel-audio-text-wrap">
                          <span className="reel-audio-text">
                            {item.creator_name || 'ALOK Creator'} · Original Audio
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Reel counter (top-right) */}
                    <div className="reel-counter">{idx + 1} / {reelItems.length}</div>

                    {/* Desktop nav arrows */}
                    {idx > 0 && (
                      <button
                        className="reel-nav-btn reel-nav-up"
                        onClick={() => {
                          reelsContainerRef.current?.querySelector(`[data-reel-idx="${idx - 1}"]`)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >↑</button>
                    )}
                    {idx < reelItems.length - 1 && (
                      <button
                        className="reel-nav-btn reel-nav-down"
                        onClick={() => {
                          reelsContainerRef.current?.querySelector(`[data-reel-idx="${idx + 1}"]`)?.scrollIntoView({ behavior: 'smooth' });
                        }}
                      >↓</button>
                    )}
                  </div>
                );
              })}

              {/* Floating Upload Button (FAB) */}
              {adminToken && (
                <button
                  className="reel-upload-fab"
                  onClick={() => reelUploadInputRef.current?.click()}
                  title="Upload New Reel"
                >
                  <span className="reel-upload-fab-icon">＋</span>
                  <span className="reel-upload-fab-label">Upload</span>
                </button>
              )}
              <input
                ref={reelUploadInputRef}
                type="file"
                accept="video/*"
                style={{ display: 'none' }}
                onChange={handleReelFileUpload}
              />

              {/* Upload progress toast */}
              {videoUploadState.state === 'loading' && (
                <div className="reel-upload-toast">
                  <div className="reel-upload-toast-header">
                    <span className="reel-upload-toast-label">📤 Uploading reel...</span>
                    <strong className="reel-upload-toast-pct">{reelUploadProgress}%</strong>
                  </div>
                  <div className="reel-upload-progress-track">
                    <div
                      className="reel-upload-progress-fill"
                      style={{ width: `${reelUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {videoUploadState.state === 'online' && (
                <div className="reel-upload-toast reel-upload-toast-success">
                  <span>✅ {videoUploadState.message}</span>
                </div>
              )}
              {videoUploadState.state === 'error' && (
                <div className="reel-upload-toast reel-upload-toast-error">
                  <span>❌ {videoUploadState.message}</span>
                </div>
              )}
            </div>
          )}

          {currentPageKey === 'reel' && reelPageItem && (
            <section className="reel-share-page">
              <div className="reel-share-stage">
                <div className="reel-share-frame">
                  <div className="reel-video-wrap reel-share-video-wrap">
                    {(reelPageItem.video_url && (reelPageItem.video_url.includes('youtube') || reelPageItem.video_url.includes('youtu.be') || reelPageItem.video_url.includes('/embed/'))) ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${extractYouTubeId(reelPageItem.video_url)}?autoplay=1&mute=${reelsMuted ? 1 : 0}&loop=1&playlist=${extractYouTubeId(reelPageItem.video_url)}&controls=1&modestbranding=1&rel=0`}
                        title={reelPageItem.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="reel-iframe"
                      />
                    ) : (
                      <video
                        src={resolveMediaUrl(reelPageItem.video_url)}
                        className="reel-video-el"
                        loop
                        playsInline
                        muted={reelsMuted}
                        controls
                        autoPlay
                      />
                    )}
                  </div>

                  <div className="reel-overlay reel-share-overlay">
                    <div className="reel-info reel-share-info">
                      <span className="reel-category-badge">{reelPageItem.category || 'Reel'}</span>
                      <h1 className="reel-title reel-share-title">{reelPageItem.title}</h1>
                      <p className="reel-excerpt reel-share-caption">{reelPageItem.excerpt || reelPageItem.caption || reelPageItem.ai_summary || 'Short-form video story in full frame mode.'}</p>
                        <div className="reel-creator-row">
                          {reelPageItem.creator_avatar ? (
                            <img src={resolveMediaUrl(reelPageItem.creator_avatar)} alt="creator" className="reel-creator-avatar" style={{ objectFit: 'cover' }} />
                          ) : (
                            <div className="reel-creator-avatar">{reelCreatorName.slice(0, 1).toUpperCase()}</div>
                          )}
                          <div>
                            <strong>@{slugifyText(reelCreatorName).replace(/-/g, '') || 'creator'}</strong>
                          <span>{reelFollowers} followers</span>
                        </div>
                        <button className={`reel-follow-btn ${isFollowingReelCreator ? 'following' : ''}`} onClick={() => toggleFollowCreator(reelPageItem)}>
                          {isFollowingReelCreator ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    </div>

                    <div className="reel-actions-col reel-share-actions">
                      <button className="reel-action-btn" onClick={() => setReelsMuted((prev) => !prev)} title={reelsMuted ? 'Sound On' : 'Mute'}>
                        <span className="reel-action-icon">{reelsMuted ? '🔇' : '🔊'}</span>
                        <span className="reel-action-label">{reelsMuted ? 'Mute' : 'Sound'}</span>
                      </button>
                      <button className="reel-action-btn" onClick={() => shareReel(reelPageItem)} title="Share Reel">
                        <span className="reel-action-icon">↗️</span>
                        <span className="reel-action-label">Share</span>
                      </button>
                      {adminToken && (
                        <button
                          className="reel-action-btn reel-delete-btn"
                          title="Delete Reel"
                          onClick={() => { deleteReel(reelPageItem.id || reelPageItem._id); navigateTo('/videos'); }}
                        >
                          <span className="reel-action-icon">🗑️</span>
                          <span className="reel-action-label">Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <aside className="reel-share-panel">
                  <div className="reel-status-card">
                    <div>
                      <p className="page-kicker">Reel Status</p>
                      <h3>Share-ready video page</h3>
                    </div>
                    <span className={`reel-status-chip reel-status-${videoUploadState.state || 'idle'}`}>
                      {videoUploadState.message || (reelPageItem.status ? reelPageItem.status : 'Live now')}
                    </span>
                  </div>

                  <div className="reel-metrics-grid">
                    <div>
                      <strong>{reelLikes}</strong>
                      <span>likes</span>
                    </div>
                    <div>
                      <strong>{formatCompactNumber(reelPageItem.views || 0)}</strong>
                      <span>views</span>
                    </div>
                    <div>
                      <strong>{reelShares}</strong>
                      <span>shares</span>
                    </div>
                  </div>

                  {adminToken && (
                    <div className="reel-upload-card">
                      <div>
                        <p className="page-kicker">Upload Desk</p>
                        <h3>Next reel upload</h3>
                        <p>Direct video upload yahin se trigger karo. Upload status live dikh raha hai.</p>
                      </div>
                      <div className="reel-upload-actions">
                        <button className="btn-primary" type="button" onClick={() => reelUploadInputRef.current?.click()}>
                          Upload Reel
                        </button>
                        <button className="btn-secondary" type="button" onClick={() => navigateTo('/videos')}>
                          All reels
                        </button>
                      </div>
                      <input
                        ref={reelUploadInputRef}
                        type="file"
                        accept="video/*"
                        style={{ display: 'none' }}
                        onChange={handleReelFileUpload}
                      />
                      <div className="reel-upload-status">
                        <strong>{videoUploadState.state === 'loading' ? 'Uploading' : videoUploadState.state === 'online' ? 'Uploaded' : 'Status'}</strong>
                        <span>{videoUploadState.message || 'Ready for next short-form video.'}</span>
                      </div>
                    </div>
                  )}
                  {!adminToken && (
                    <div className="reel-upload-card" style={{ display: 'flex', justifyContent: 'center', background: 'transparent', border: 'none' }}>
                      <button className="btn-secondary" type="button" onClick={() => navigateTo('/videos')}>
                        All reels
                      </button>
                    </div>
                  )}

                  <div className="reel-share-meta">
                    <h3>About this reel</h3>
                    <p>{reelPageItem.caption || reelPageItem.ai_summary || reelPageItem.content || 'Short-form vertical reel experience.'}</p>
                    <div className="detail-tags">
                      {(reelPageItem.tags || []).map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>
            </section>
          )}

          {currentPageKey === 'features' && (
            <section className="page-shell">
              <div className="page-hero">
                <p className="page-kicker">Capability Map</p>
                <h2>Platform Feature Hub</h2>
                <p>Grouped capability pages make the experience more professional and easier to scan.</p>
              </div>
              <section className="feature-hub-section">
                <div className="feature-hub-grid">
                  {featureGroups.map((group) => (
                    <article key={group.title} className="feature-hub-card">
                      <h3>{group.title}</h3>
                      <p>{group.description}</p>
                      <div className="feature-badge-row">
                        {group.badges.map((badge) => (
                          <span key={badge}>{badge}</span>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          )}

          {currentPageKey === 'workspace' && (
            <section className="page-shell workspace-shell">
              <div className="page-hero">
                <p className="page-kicker">Control Center</p>
                <h2>{adminToken ? 'Editorial Workspace' : 'Secure Login Workspace'}</h2>
                <p>
                  {device.isDesktop
                    ? 'Desktop पर control panel right sidebar में खुलता है, ताकि workspace page clean aur dedicated रहे.'
                    : 'Mobile पर secure workspace bottom sheet में खुलता है, लेकिन route same domain page पर है.'}
                </p>
              </div>
              <div className="workspace-note-card">
                <strong>{adminToken ? 'Workspace ready' : 'Login required'}</strong>
                <p>
                  {adminToken
                    ? 'Profile, news publishing, campaign controls aur user management yahin se operate honge.'
                    : 'Login karke isi workspace route par editor tools access karo.'}
                </p>
              </div>
            </section>
          )}

          {currentPageKey === 'story' && (
            <section className="story-detail story-detail-page">
              <button className="close-btn" onClick={() => navigateTo('/latest')}>✕</button>
              <div className="detail-scroll-area">
                <div className="detail-content">
                  {selectedStory ? (
                    <>
                      <span className="detail-category">{selectedStory.category}</span>
                      <h2>{selectedStory.title}</h2>
                      <div className="detail-meta">
                        <span>{timeAgo(selectedStory.published_at || selectedStory.created_at, language)}</span>
                        <span>•</span>
                        <span>{selectedStory.reading_time} {t('min', language)}</span>
                        <span>•</span>
                        <span>👁 {selectedStory.views || 0}</span>
                      </div>
                      <div className="share-row" style={{ marginTop: '16px', marginBottom: '24px' }}>
                        <button className="btn-secondary" onClick={() => shareStory(selectedStory)}>🔗 Share this story</button>
                      </div>
                      {selectedStory.cover_image_url && !selectedStory.video_url && (
                        <div className="detail-image" style={{ backgroundImage: `url(${resolveMediaUrl(selectedStory.cover_image_url)})` }}></div>
                      )}
                      {selectedStory.video_url && (
                        <div className="detail-video-container" style={{ marginBottom: '32px' }}>
                          {(selectedStory.video_url && (selectedStory.video_url.includes('youtube.com') || selectedStory.video_url.includes('youtu.be'))) ? (
                            <iframe
                              width="100%"
                              height="100%"
                              src={selectedStory.video_url.includes('/embed/') ? selectedStory.video_url : `https://www.youtube.com/embed/${selectedStory.video_url.split('v=')[1]?.substring(0, 11) || selectedStory.video_url.split('.be/')[1]?.substring(0, 11)}`}
                              title="YouTube video player"
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="modern-video-player"
                            ></iframe>
                          ) : (
                            <video
                              controls
                              className="modern-video-player"
                              poster={selectedStory.cover_image_url ? resolveMediaUrl(selectedStory.cover_image_url) : undefined}
                              style={{ width: '100%', borderRadius: '20px', backgroundColor: '#000', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
                            >
                              <source src={resolveMediaUrl(selectedStory.video_url)} />
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                      )}
                      <div className="detail-body">
                        {/<[a-z][\s\S]*>/i.test(selectedStory.content || '') ? (
                          <div
                            className="story-html-content"
                            dangerouslySetInnerHTML={{ __html: selectedStory.content }}
                          />
                        ) : (
                          <p>{selectedStory.content}</p>
                        )}
                        <div className="detail-summary">
                          <strong>सारांश:</strong>
                          <p>{selectedStory.ai_summary}</p>
                        </div>
                        <div className="detail-tags">
                          {(selectedStory.tags || []).map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="page-hero story-not-found">
                      <p className="page-kicker">Story Lookup</p>
                      <h2>Story not found</h2>
                      <p>The article link is valid but this story is not available in the current feed.</p>
                      <button className="btn-primary" onClick={() => navigateTo('/latest')}>Back to latest</button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Sidebar */}
        {device.isDesktop && !isStoryPage && !isReelPage && currentPageKey !== 'videos' && (
          <aside className="sidebar">
            <div className="sidebar-section">
              <h3>🔥 {t('trending', language)}</h3>
              {trendingNews.slice(0, 5).map((item) => (
                <div key={item.id} className="sidebar-item">
                  <div onClick={() => openStory(item)} style={{ flex: 1, cursor: 'pointer' }}>
                    <strong>{item.title.substring(0, 30)}...</strong>
                    <small>{item.views} {t('views', language)}</small>
                  </div>
                  {adminToken && (
                    <button
                      className="edit-icon-btn small"
                      onClick={(e) => { e.stopPropagation(); handleEditNews(item); }}
                      title="संपादित करें"
                    >
                      ✏️
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="sidebar-section">
              <h3>📂 {t('categories', language)}</h3>
              {categories
                .filter((cat) => cat !== t('allCategories', language))
                .slice(0, 6)
                .map((cat) => (
                  <button
                    key={cat}
                    className="sidebar-item"
                    onClick={() => openCategoryPage(cat)}
                  >
                    {cat}
                  </button>
                ))}
            </div>

            {/* Desktop Admin Panel Inside Sidebar */}
            {showAdmin && (
              <div className="admin-panel desktop-view">
                <div className="admin-header">
                  <h2>{t('adminPanel', language)}</h2>
                  <button className="ghost" onClick={() => navigateTo('/')}>
                    {t('close', language)}
                  </button>
                </div>

                {!adminToken ? (
                  <form className="admin-form" onSubmit={handleLogin}>
                    <h3>{t('login', language)}</h3>
                    <label>
                      {t('email', language)}
                      <input
                        type="email"
                        value={loginForm.email}
                        onChange={(event) =>
                          setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <label>
                      {t('password', language)}
                      <input
                        type="password"
                        value={loginForm.password}
                        onChange={(event) =>
                          setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                        }
                        required
                      />
                    </label>
                    <button
                      className="primary"
                      type="submit"
                      disabled={loginState.state === 'loading'}
                    >
                      {loginState.state === 'loading' ? 'लॉगिन हो रहा है...' : t('login', language)}
                    </button>
                    {loginState.message && (
                      <div className={`login-status ${loginState.state}`} role="status">
                        {loginState.message}
                      </div>
                    )}
                  </form>
                ) : (
                  <div className="admin-content">
                    <div className="admin-profile">
                      <div className="profile-card">
                        <div
                          className={`avatar-wrapper ${isAvatarDragActive ? 'drag-active' : ''}`}
                          onDragOver={(event) => {
                            event.preventDefault();
                            setIsAvatarDragActive(true);
                          }}
                          onDragLeave={() => setIsAvatarDragActive(false)}
                          onDrop={handleAvatarDrop}
                        >
                          <img
                            src={
                              resolveMediaUrl(adminProfile?.avatar_url) ||
                              'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=300&auto=format&fit=crop'
                            }
                            alt="Admin"
                          />
                          <label className="avatar-change-btn" title={t('changePhoto', language)}>
                            📷
                            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                          </label>
                        </div>
                        <div>
                          <h3>{adminProfile?.name || 'ALOK एडमिन'}</h3>
                          <p>{adminProfile?.email}</p>
                          <button className="ghost" onClick={handleLogout}>
                            {t('logout', language)}
                          </button>
                        </div>
                      </div>
                    </div>

                    <form className="admin-form" onSubmit={handleProfileSave}>
                      <h3>{t('updateProfile', language)}</h3>
                      <label>
                        {t('name', language)}
                        <input
                          value={profileForm.name}
                          onChange={(event) =>
                            setProfileForm((prev) => ({ ...prev, name: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        {t('email', language)}
                        <input
                          type="email"
                          value={profileForm.email}
                          onChange={(event) =>
                            setProfileForm((prev) => ({ ...prev, email: event.target.value }))
                          }
                        />
                      </label>
                      <label>
                        {t('bio', language)}
                        <textarea
                          rows="3"
                          value={profileForm.bio}
                          onChange={(event) =>
                            setProfileForm((prev) => ({ ...prev, bio: event.target.value }))
                          }
                        />
                      </label>
                      <button className="primary" type="submit">
                        {t('save', language)}
                      </button>
                    </form>

                    {/* Desktop User Management */}
                    {adminProfile?.role === 'admin' && (
                      <>
                        <div className="admin-form">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3>👥 यूज़र मैनेजमेंट</h3>
                            <button
                              className={showUserManagement ? 'secondary' : 'primary'}
                              onClick={() => setShowUserManagement(!showUserManagement)}
                              type="button"
                            >
                              {showUserManagement ? 'बंद करें' : 'मैनेज करें'}
                            </button>
                          </div>
                        </div>

                        {showUserManagement && (
                          <div className="user-management-section">
                            <form className="admin-form" onSubmit={handleUserCreate}>
                              <h3>➕ नया यूज़र</h3>
                              <div className="form-row">
                                <label style={{ flex: 1 }}>
                                  नाम * <input value={userForm.name} onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))} required />
                                </label>
                                <label style={{ flex: 1 }}>
                                  ईमेल * <input type="email" value={userForm.email} onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))} required />
                                </label>
                              </div>
                              <div className="form-row">
                                <label style={{ flex: 1 }}>
                                  पासवर्ड * <input type="password" value={userForm.password} onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))} required />
                                </label>
                                <label style={{ flex: 1 }}>
                                  Role *
                                  <select value={userForm.role} onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}>
                                    <option value="author">👤 Author</option>
                                    <option value="editor">✏️ Editor</option>
                                    <option value="admin">👑 Admin</option>
                                  </select>
                                </label>
                              </div>
                              <button className="primary" type="submit" style={{ width: '100%' }}>✅ यूज़र जोड़ें</button>
                            </form>
                          </div>
                        )}
                      </>
                    )}

                    {/* Desktop Create News */}
                    <button
                      className="primary"
                      style={{ width: '100%', marginTop: '20px' }}
                      onClick={() => {
                        setNewsForm({
                          title: '', category: 'कैंपस', excerpt: '', content: '', tags: '',
                          cover_image_url: '', gallery_urls: '', video_url: '', audio_url: '',
                          source: 'ALOK', ai_summary: '', published_at: '', is_featured: false,
                          is_breaking: false, author_name: 'ALOK Team', author_email: '',
                          author_twitter: '', author_instagram: '', meta_description: '',
                          meta_keywords: '', seo_title: '', location: '', coordinates: '',
                          twitter_url: '', facebook_url: '', instagram_url: '', youtube_url: '',
                          status: 'draft', priority: 'normal', language: 'hi', expire_at: ''
                        });
                        setEditingNews({ id: 'new' });
                        setShowEditModal(true);
                      }}
                    >
                      📰 नई खबर बनाएं
                    </button>
                    <button
                      className="primary"
                      style={{ width: '100%', marginTop: '10px', background: '#e1306c', borderColor: '#e1306c' }}
                      onClick={() => {
                        setReelForm({ title: '', caption: '', video_url: '', tags: '', status: 'published' });
                        setEditingReel({ id: 'new-reel' });
                        setShowReelModal(true);
                      }}
                    >
                      🎥 नई वीडियो/रील बनाएं
                    </button>
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {device.isMobile && currentPageKey !== 'videos' && (
        <MobileBottomNav
          items={mobileNavItems}
          activeKey={currentPageKey === 'reel' ? 'videos' : currentPageKey}
          onNavigate={(path) => {
            if (path === '/workspace') {
              openWorkspace();
              return;
            }
            navigateTo(path);
          }}
        />
      )}

      {showAdmin && !device.isDesktop && (
        <aside className="admin-panel mobile-view">
          <div className="admin-header">
            <h2>{t('adminPanel', language)}</h2>
            <button className="ghost" onClick={() => navigateTo('/')}>
              {t('close', language)}
            </button>
          </div>

          {!adminToken ? (
            <form className="admin-form" onSubmit={handleLogin}>
              <h3>{t('login', language)}</h3>
              <label>
                {t('email', language)}
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((prev) => ({ ...prev, email: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                {t('password', language)}
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  required
                />
              </label>
              <button
                className="primary"
                type="submit"
                disabled={loginState.state === 'loading'}
              >
                {loginState.state === 'loading' ? 'लॉगिन हो रहा है...' : t('login', language)}
              </button>
              {loginState.message && (
                <div className={`login-status ${loginState.state}`} role="status">
                  {loginState.message}
                </div>
              )}
            </form>
          ) : (
            <div className="admin-content">
              <div className="admin-profile">
                <div className="profile-card">
                  <div
                    className={`avatar-wrapper ${isAvatarDragActive ? 'drag-active' : ''}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsAvatarDragActive(true);
                    }}
                    onDragLeave={() => setIsAvatarDragActive(false)}
                    onDrop={handleAvatarDrop}
                  >
                    <img
                      src={
                        resolveMediaUrl(adminProfile?.avatar_url) ||
                        'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=300&auto=format&fit=crop'
                      }
                      alt="Admin"
                    />
                    <label className="avatar-change-btn" title={t('changePhoto', language)}>
                      📷
                      <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                  <div>
                    <h3>{adminProfile?.name || 'ALOK एडमिन'}</h3>
                    <p>{adminProfile?.email}</p>
                    <button className="ghost" onClick={handleLogout}>
                      {t('logout', language)}
                    </button>
                  </div>
                </div>
              </div>

              <form className="admin-form" onSubmit={handleProfileSave}>
                <h3>{t('updateProfile', language)}</h3>
                <label>
                  {t('name', language)}
                  <input
                    value={profileForm.name}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                  />
                </label>
                <label>
                  {t('email', language)}
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </label>
                <label>
                  {t('bio', language)}
                  <textarea
                    rows="3"
                    value={profileForm.bio}
                    onChange={(event) =>
                      setProfileForm((prev) => ({ ...prev, bio: event.target.value }))
                    }
                  />
                </label>
                <button className="primary" type="submit">
                  {t('save', language)}
                </button>
              </form>

              {/* User Management Section - Only for Admins */}
              {adminProfile?.role === 'admin' && (
                <>
                  <div className="admin-form">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3>👥 यूज़र मैनेजमेंट</h3>
                      <button
                        className={showUserManagement ? 'secondary' : 'primary'}
                        onClick={() => setShowUserManagement(!showUserManagement)}
                        type="button"
                      >
                        {showUserManagement ? 'बंद करें' : 'मैनेज करें'}
                      </button>
                    </div>
                  </div>

                  {showUserManagement && (
                    <div className="user-management-section">
                      {/* Add New User Form */}
                      <form className="admin-form" onSubmit={handleUserCreate}>
                        <h3>➕ नया यूज़र जोड़ें</h3>
                        <div className="form-row">
                          <label style={{ flex: 1 }}>
                            नाम *
                            <input
                              value={userForm.name}
                              onChange={(e) => setUserForm((prev) => ({ ...prev, name: e.target.value }))}
                              required
                              placeholder="पूरा नाम"
                            />
                          </label>
                          <label style={{ flex: 1 }}>
                            ईमेल *
                            <input
                              type="email"
                              value={userForm.email}
                              onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                              required
                              placeholder="email@example.com"
                            />
                          </label>
                        </div>
                        <div className="form-row">
                          <label style={{ flex: 1 }}>
                            पासवर्ड *
                            <input
                              type="password"
                              value={userForm.password}
                              onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                              required
                              placeholder="मजबूत पासवर्ड"
                            />
                          </label>
                          <label style={{ flex: 1 }}>
                            Role *
                            <select value={userForm.role} onChange={(e) => setUserForm((prev) => ({ ...prev, role: e.target.value }))}>
                              <option value="author">👤 Author (लेखक)</option>
                              <option value="editor">✏️ Editor (संपादक)</option>
                              <option value="admin">👑 Admin (प्रशासक)</option>
                            </select>
                          </label>
                        </div>
                        <label>
                          बायो
                          <textarea
                            rows="2"
                            value={userForm.bio}
                            onChange={(e) => setUserForm((prev) => ({ ...prev, bio: e.target.value }))}
                            placeholder="छोटा परिचय..."
                          />
                        </label>
                        <button className="primary" type="submit" style={{ width: '100%' }}>
                          ✅ यूज़र जोड़ें
                        </button>
                      </form>

                      {/* User List */}
                      <div className="admin-form">
                        <h3>📋 सभी यूज़र्स ({adminList.length})</h3>
                        {adminList.length === 0 ? (
                          <p className="muted">कोई यूज़र नहीं मिला।</p>
                        ) : (
                          <div className="user-list">
                            {adminList.map((user) => (
                              <div key={user.id} className="user-card">
                                <div className="user-header">
                                  <div className="user-avatar">
                                    <img
                                      src={resolveMediaUrl(user.avatar_url) || 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=120&auto=format&fit=crop'}
                                      alt={user.name}
                                    />
                                  </div>
                                  <div className="user-info">
                                    <h4>{user.name}</h4>
                                    <p className="user-email">{user.email}</p>
                                    <div className="user-meta">
                                      <span className={`role-badge role-${user.role}`}>
                                        {user.role === 'admin' && '👑'}
                                        {user.role === 'editor' && '✏️'}
                                        {user.role === 'author' && '👤'}
                                        {user.role}
                                      </span>
                                      <span className={`status-badge status-${user.status}`}>
                                        {user.status === 'active' ? '🟢' : '🔴'} {user.status}
                                      </span>
                                    </div>
                                    {user.last_login && (
                                      <p className="user-last-login">
                                        Last login: {new Date(user.last_login).toLocaleDateString('hi-IN')}
                                      </p>
                                    )}
                                  </div>
                                  <div className="user-actions-btn">
                                    {user.id !== 1 && user.id !== adminProfile?.id && (
                                      <>
                                        <button
                                          className="btn-icon"
                                          title="Edit User"
                                          onClick={() => setEditingUser(user)}
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          className="btn-icon btn-danger"
                                          title="Delete User"
                                          onClick={() => handleUserDelete(user.id)}
                                        >
                                          🗑️
                                        </button>
                                      </>
                                    )}
                                    {user.id === 1 && adminProfile?.id === 1 && (
                                      <span className="primary-badge">🔒 Permanent ID: 1</span>
                                    )}
                                    {user.id === 1 && adminProfile?.id !== 1 && (
                                      <span className="primary-badge">🔒 Primary</span>
                                    )}
                                  </div>
                                </div>

                                {editingUser?.id === user.id && (
                                  <div className="user-edit-form">
                                    <h5>Edit User</h5>
                                    <div className="form-row">
                                      <label style={{ flex: 1 }}>
                                        नाम
                                        <input
                                          value={editingUser.name}
                                          onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                        />
                                      </label>
                                      <label style={{ flex: 1 }}>
                                        Role
                                        <select
                                          value={editingUser.role}
                                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                        >
                                          <option value="author">Author</option>
                                          <option value="editor">Editor</option>
                                          <option value="admin">Admin</option>
                                        </select>
                                      </label>
                                    </div>
                                    <div className="form-row">
                                      <label style={{ flex: 1 }}>
                                        Status
                                        <select
                                          value={editingUser.status}
                                          onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
                                        >
                                          <option value="active">Active</option>
                                          <option value="inactive">Inactive</option>
                                        </select>
                                      </label>
                                      <label style={{ flex: 1 }}>
                                        नया पासवर्ड (optional)
                                        <input
                                          type="password"
                                          placeholder="छोड़ें अगर नहीं बदलना"
                                          value={adminPasswords[user.id] || ''}
                                          onChange={(e) => setAdminPasswords({ ...adminPasswords, [user.id]: e.target.value })}
                                        />
                                      </label>
                                    </div>
                                    <div className="form-row" style={{ gap: '8px' }}>
                                      <button
                                        className="primary"
                                        onClick={() => {
                                          handleUserUpdate(user.id, {
                                            name: editingUser.name,
                                            role: editingUser.role,
                                            status: editingUser.status
                                          });
                                          if (adminPasswords[user.id]) {
                                            handlePasswordChange(user.id, adminPasswords[user.id]);
                                          }
                                        }}
                                      >
                                        💾 सेव करें
                                      </button>
                                      <button
                                        className="secondary"
                                        onClick={() => {
                                          setEditingUser(null);
                                          setAdminPasswords({ ...adminPasswords, [user.id]: '' });
                                        }}
                                      >
                                        ❌ कैंसल
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="mobile-admin-actions" style={{ padding: '0 16px 16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className="primary"
                  style={{ flex: 1, background: '#e1306c', borderColor: '#e1306c' }}
                  type="button"
                  onClick={() => {
                    setReelForm({ title: '', caption: '', video_url: '', tags: '', status: 'published' });
                    setEditingReel({ id: 'new-reel' });
                    setShowReelModal(true);
                  }}
                >
                  🎥 नई वीडियो/रील बनाएं
                </button>
              </div>

              <form className="admin-form advanced-form editor-form" onSubmit={handleNewsCreate}>
                <div className="editor-shell">
                  <div className="editor-hero">
                    <div>
                      <p className="editor-eyebrow">Newsroom Composer</p>
                      <h3>एक तेज़, साफ़ और modern writing dashboard</h3>
                      <p>Headline, structure, media and publishing signals ko ek hi flow mein handle karo.</p>
                    </div>
                    <div className="editor-hero-badges">
                      <span>Live preview</span>
                      <span>SEO ready</span>
                      <span>Editorial controls</span>
                    </div>
                  </div>

                  <div className="editor-layout">
                    <div className="editor-main">
                <div className="form-section form-section-highlight">
                  <h4>📝 मुख्य जानकारी</h4>
                  <label>
                    हेडलाइन *
                    <input value={newsForm.title} onChange={(e) => setNewsForm((prev) => ({ ...prev, title: e.target.value }))} required placeholder="खबर का शीर्षक..." />
                  </label>
                  <div className="form-row">
                    <label style={{ flex: 1 }}>
                      कैटेगरी *
                      <select value={newsForm.category} onChange={(e) => setNewsForm((prev) => ({ ...prev, category: e.target.value }))}>
                        <option value="कैंपस">कैंपस</option>
                        <option value="खेल">खेल</option>
                        <option value="मौसम">मौसम</option>
                        <option value="शिक्षा">शिक्षा</option>
                        <option value="तकनीक">तकनीक</option>
                        <option value="स्वास्थ्य">स्वास्थ्य</option>
                        <option value="अर्थव्यवस्था">अर्थव्यवस्था</option>
                        <option value="राजनीति">राजनीति</option>
                        <option value="मनोरंजन">मनोरंजन</option>
                      </select>
                    </label>
                    <label style={{ flex: 1 }}>
                      भाषा
                      <select value={newsForm.language} onChange={(e) => setNewsForm((prev) => ({ ...prev, language: e.target.value }))}>
                        <option value="hi">हिंदी</option>
                        <option value="en">English</option>
                      </select>
                    </label>
                  </div>
                  <label>
                    शॉर्ट एक्सर्प्ट *
                    <textarea rows="2" value={newsForm.excerpt} onChange={(e) => setNewsForm((prev) => ({ ...prev, excerpt: e.target.value }))} required placeholder="संक्षिप्त विवरण..." />
                  </label>
                  <label>
                    कंटेंट *
                    <div className="rich-editor-shell">
                      <ReactQuill
                        theme="snow"
                        value={newsForm.content}
                        onChange={(value) => setNewsForm((prev) => ({ ...prev, content: value }))}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="पूरी खबर यहां लिखें..."
                      />
                    </div>
                  </label>
                  <label>
                    टैग्स (comma separated)
                    <input value={newsForm.tags} onChange={(e) => setNewsForm((prev) => ({ ...prev, tags: e.target.value }))} placeholder="BJMC, मीडिया, खबर" />
                  </label>
                </div>

                {/* MEDIA & CONTENT */}
                <div className="form-section">
                  <h4>🎬 मीडिया फाइल्स</h4>
                  <label>
                    कवर इमेज (Upload or URL)
                    <div
                      className={`upload-input-group upload-dropzone ${isCoverDragActive ? 'drag-active' : ''}`}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setIsCoverDragActive(true);
                      }}
                      onDragLeave={() => setIsCoverDragActive(false)}
                      onDrop={handleCoverDrop}
                    >
                      <input
                        ref={coverInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                      />
                      <p>इमेज drag-drop करें या चुनें, crop करके auto-fit होगी</p>
                    </div>
                    <input
                      value={newsForm.cover_image_url}
                      onChange={(e) => setNewsForm((prev) => ({ ...prev, cover_image_url: e.target.value }))}
                      placeholder="या फिर इमेज URL पेस्ट करें (https://...)"
                      className="upload-url-field"
                    />
                  </label>
                  <label>
                    गैलरी URLs (comma separated)
                    <textarea rows="2" value={newsForm.gallery_urls} onChange={(e) => setNewsForm((prev) => ({ ...prev, gallery_urls: e.target.value }))} placeholder="https://img1.jpg, https://img2.jpg" />
                  </label>
                  <label>
                    वीडियो (Upload MP4 or URL)
                    <div className="upload-input-group">
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={(e) => handleMediaUpload(e, 'video_url')}
                      />
                    </div>
                    <input
                      value={newsForm.video_url}
                      onChange={(e) => setNewsForm((prev) => ({ ...prev, video_url: e.target.value }))}
                      placeholder="या फिर YouTube/Vimeo URL पेस्ट करें"
                      className="upload-url-field"
                    />
                  </label>
                  <label>
                    ऑडियो URL
                    <input value={newsForm.audio_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, audio_url: e.target.value }))} placeholder="https://example.com/audio.mp3" />
                  </label>
                </div>

                {/* AUTHOR DETAILS */}
                <div className="form-section">
                  <h4>✍️ लेखक जानकारी</h4>
                  <div className="form-row">
                    <label style={{ flex: 1 }}>
                      लेखक नाम
                      <input value={newsForm.author_name} onChange={(e) => setNewsForm((prev) => ({ ...prev, author_name: e.target.value }))} placeholder="ALOK Team" />
                    </label>
                    <label style={{ flex: 1 }}>
                      लेखक ईमेल
                      <input type="email" value={newsForm.author_email} onChange={(e) => setNewsForm((prev) => ({ ...prev, author_email: e.target.value }))} placeholder="author@alok.com" />
                    </label>
                  </div>
                  <div className="form-row">
                    <label style={{ flex: 1 }}>
                      🐦 Twitter Handle
                      <input value={newsForm.author_twitter} onChange={(e) => setNewsForm((prev) => ({ ...prev, author_twitter: e.target.value }))} placeholder="@username" />
                    </label>
                    <label style={{ flex: 1 }}>
                      📷 Instagram Handle
                      <input value={newsForm.author_instagram} onChange={(e) => setNewsForm((prev) => ({ ...prev, author_instagram: e.target.value }))} placeholder="@username" />
                    </label>
                  </div>
                  <label>
                    सोर्स/क्रेडिट
                    <input value={newsForm.source} onChange={(e) => setNewsForm((prev) => ({ ...prev, source: e.target.value }))} placeholder="ALOK" />
                  </label>
                </div>

                {/* SEO & METADATA */}
                <div className="form-section">
                  <h4>🔍 SEO & मेटाडेटा</h4>
                  <label>
                    SEO Title
                    <input value={newsForm.seo_title} onChange={(e) => setNewsForm((prev) => ({ ...prev, seo_title: e.target.value }))} placeholder="Search engine के लिए title" />
                  </label>
                  <label>
                    Meta Description
                    <textarea rows="2" value={newsForm.meta_description} onChange={(e) => setNewsForm((prev) => ({ ...prev, meta_description: e.target.value }))} placeholder="Search results में दिखने वाला description..." />
                  </label>
                  <label>
                    Meta Keywords (comma separated)
                    <input value={newsForm.meta_keywords} onChange={(e) => setNewsForm((prev) => ({ ...prev, meta_keywords: e.target.value }))} placeholder="keyword1, keyword2, keyword3" />
                  </label>
                  <label>
                    AI सारांश
                    <textarea rows="2" value={newsForm.ai_summary} onChange={(e) => setNewsForm((prev) => ({ ...prev, ai_summary: e.target.value }))} placeholder="AI generated summary..." />
                  </label>
                </div>

                {/* LOCATION */}
                <div className="form-section">
                  <h4>📍 स्थान</h4>
                  <div className="form-row">
                    <label style={{ flex: 1 }}>
                      Location/City
                      <input value={newsForm.location} onChange={(e) => setNewsForm((prev) => ({ ...prev, location: e.target.value }))} placeholder="नई दिल्ली, भारत" />
                    </label>
                    <label style={{ flex: 1 }}>
                      Coordinates (lat,long)
                      <input value={newsForm.coordinates} onChange={(e) => setNewsForm((prev) => ({ ...prev, coordinates: e.target.value }))} placeholder="28.6139, 77.2090" />
                    </label>
                  </div>
                </div>

                {/* SOCIAL MEDIA */}
                <div className="form-section">
                  <h4>🔗 सोशल मीडिया लिंक्स</h4>
                  <label>
                    🐦 Twitter Post URL
                    <input value={newsForm.twitter_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, twitter_url: e.target.value }))} placeholder="https://twitter.com/..." />
                  </label>
                  <label>
                    📘 Facebook Post URL
                    <input value={newsForm.facebook_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, facebook_url: e.target.value }))} placeholder="https://facebook.com/..." />
                  </label>
                  <label>
                    📷 Instagram Post URL
                    <input value={newsForm.instagram_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, instagram_url: e.target.value }))} placeholder="https://instagram.com/p/..." />
                  </label>
                  <label>
                    📺 YouTube Video URL
                    <input value={newsForm.youtube_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, youtube_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
                  </label>
                </div>

                {/* PUBLISHING OPTIONS */}
                <div className="form-section">
                  <h4>⚙️ पब्लिशिंग सेटिंग्स</h4>
                  {!canPublishNews && (
                    <p className="permission-note">Author mode: आपकी खबर draft में सेव होगी। Publish, Featured, Breaking controls editor/admin के लिए हैं।</p>
                  )}
                  <div className="form-row">
                    <label style={{ flex: 1 }}>
                      स्टेटस
                      <select value={newsForm.status} onChange={(e) => setNewsForm((prev) => ({ ...prev, status: e.target.value }))} disabled={!canPublishNews}>
                        <option value="draft">Draft (मसौदा)</option>
                        <option value="published">Published (प्रकाशित)</option>
                        <option value="scheduled">Scheduled (निर्धारित)</option>
                        <option value="archived">Archived (संग्रहित)</option>
                      </select>
                    </label>
                    <label style={{ flex: 1 }}>
                      प्राथमिकता
                      <select value={newsForm.priority} onChange={(e) => setNewsForm((prev) => ({ ...prev, priority: e.target.value }))}>
                        <option value="low">Low (कम)</option>
                        <option value="normal">Normal (सामान्य)</option>
                        <option value="high">High (उच्च)</option>
                        <option value="urgent">Urgent (तत्काल)</option>
                      </select>
                    </label>
                  </div>
                  <div className="form-row">
                    <label style={{ flex: 1 }}>
                      पब्लिश टाइम (ISO)
                      <input type="datetime-local" value={newsForm.published_at ? newsForm.published_at.slice(0, 16) : ''} onChange={(e) => setNewsForm((prev) => ({ ...prev, published_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))} />
                    </label>
                    <label style={{ flex: 1 }}>
                      एक्सपायरी टाइम
                      <input type="datetime-local" value={newsForm.expire_at ? newsForm.expire_at.slice(0, 16) : ''} onChange={(e) => setNewsForm((prev) => ({ ...prev, expire_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))} />
                    </label>
                  </div>
                  <div className="form-row" style={{ gap: '16px' }}>
                    <label className="switch">
                      <input type="checkbox" checked={newsForm.is_featured} onChange={(e) => setNewsForm((prev) => ({ ...prev, is_featured: e.target.checked }))} disabled={!canPublishNews} />
                      <span>⭐ फ़ीचर्ड रखें</span>
                    </label>
                    <label className="switch">
                      <input type="checkbox" checked={newsForm.is_breaking} onChange={(e) => setNewsForm((prev) => ({ ...prev, is_breaking: e.target.checked }))} disabled={!canPublishNews} />
                      <span>🔴 Breaking News रखें</span>
                    </label>
                  </div>
                </div>

                    </div>
                    {renderEditorRail()}
                  </div>

                  <div className="editor-submit-row">
                    <div>
                      <p className="editor-submit-label">Publishing lane</p>
                      <strong>{editorPublishTone}</strong>
                    </div>
                    <button className="primary editor-submit-btn" type="submit">
                      ✅ खबर सेव करें
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </aside>
      )}

      {/* Edit News Modal */}
      {showEditModal && editingNews && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowEditModal(false)}>✕</button>
            <h2>{editingNews.id === 'new' ? '📰 नई खबर बनाएं' : '📝 खबर संपादित करें'}</h2>
            <form className="editor-form" onSubmit={handleSaveNews}>
              <div className="editor-shell editor-shell-modal">
                <div className="editor-hero editor-hero-modal">
                  <div>
                    <p className="editor-eyebrow">Editorial Workspace</p>
                    <h3>{editingNews.id === 'new' ? 'Story build mode' : 'Refine and republish'}</h3>
                    <p>Draft ko polish karo, metadata tighten karo aur publication state ko ek glance mein control karo.</p>
                  </div>
                  <div className="editor-hero-badges">
                    <span>{editingNews.id === 'new' ? 'Fresh draft' : 'Edit mode'}</span>
                    <span>{editorReadMinutes} min read</span>
                    <span>{editorCompletion}% ready</span>
                  </div>
                </div>

                <div className="editor-layout">
                  <div className="editor-main">
              <div className="form-section form-section-highlight">
                <h4>📝 मुख्य जानकारी</h4>
                <label>
                  शीर्षक *
                  <input required value={newsForm.title} onChange={(e) => setNewsForm((prev) => ({ ...prev, title: e.target.value }))} />
                </label>
                <div className="form-row">
                  <label style={{ flex: 1 }}>
                    कैटेगरी *
                    <select value={newsForm.category} onChange={(e) => setNewsForm((prev) => ({ ...prev, category: e.target.value }))}>
                      <option value="कैंपस">कैंपस</option>
                      <option value="खेल">खेल</option>
                      <option value="मौसम">मौसम</option>
                      <option value="शिक्षा">शिक्षा</option>
                      <option value="तकनीक">तकनीक</option>
                      <option value="स्वास्थ्य">स्वास्थ्य</option>
                      <option value="अर्थव्यवस्था">अर्थव्यवस्था</option>
                      <option value="राजनीति">राजनीति</option>
                      <option value="मनोरंजन">मनोरंजन</option>
                    </select>
                  </label>
                  <label style={{ flex: 1 }}>
                    भाषा
                    <select value={newsForm.language} onChange={(e) => setNewsForm((prev) => ({ ...prev, language: e.target.value }))}>
                      <option value="hi">हिंदी</option>
                      <option value="en">English</option>
                    </select>
                  </label>
                </div>
                <label>
                  संक्षिप्त विवरण *
                  <textarea required rows="2" value={newsForm.excerpt} onChange={(e) => setNewsForm((prev) => ({ ...prev, excerpt: e.target.value }))} />
                </label>
                <label>
                  पूरी सामग्री *
                  <div className="rich-editor-shell">
                    <ReactQuill
                      theme="snow"
                      value={newsForm.content}
                      onChange={(value) => setNewsForm((prev) => ({ ...prev, content: value }))}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="पूरी खबर यहां लिखें..."
                    />
                  </div>
                </label>
                <label>
                  टैग्स (कॉमा से अलग)
                  <input value={newsForm.tags} onChange={(e) => setNewsForm((prev) => ({ ...prev, tags: e.target.value }))} />
                </label>
              </div>

              {/* MEDIA */}
              <div className="form-section">
                <h4>🎬 मीडिया</h4>
                <label>
                  कवर इमेज (Upload, Drag-Drop या URL)
                  <div
                    className={`upload-input-group upload-dropzone ${isCoverDragActive ? 'drag-active' : ''}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setIsCoverDragActive(true);
                    }}
                    onDragLeave={() => setIsCoverDragActive(false)}
                    onDrop={handleCoverDrop}
                  >
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverUpload}
                    />
                    <p>इमेज drag-drop करें या चुनें, crop करके auto-fit होगी</p>
                  </div>
                  <input type="url" value={newsForm.cover_image_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, cover_image_url: e.target.value }))} className="upload-url-field" />
                </label>
                <label>
                  गैलरी URLs (comma separated)
                  <textarea rows="2" value={newsForm.gallery_urls} onChange={(e) => setNewsForm((prev) => ({ ...prev, gallery_urls: e.target.value }))} placeholder="https://img1.jpg, https://img2.jpg" />
                </label>
                <label>
                  वीडियो URL / Upload
                  <div className="video-input-row">
                    <input
                      type="url"
                      value={newsForm.video_url}
                      onChange={(e) => setNewsForm((prev) => ({ ...prev, video_url: e.target.value }))}
                      placeholder="YouTube link या direct video URL"
                    />
                    <button
                      type="button"
                      className="btn-secondary video-file-pick-btn"
                      onClick={() => videoFileInputRef.current?.click()}
                      title="Video file upload करें"
                    >
                      📤 Upload
                    </button>
                    <input
                      ref={videoFileInputRef}
                      type="file"
                      accept="video/*"
                      style={{ display: 'none' }}
                      onChange={handleVideoFileUpload}
                    />
                  </div>
                  {newsForm.video_url && !newsForm.video_url.includes('youtube') && !newsForm.video_url.includes('youtu.be') && (
                    <video
                      src={newsForm.video_url}
                      muted
                      playsInline
                      controls
                      style={{ width: '100%', maxHeight: '160px', borderRadius: '8px', marginTop: '8px', background: '#000' }}
                    />
                  )}
                </label>
                <label>
                  ऑडियो URL
                  <input type="url" value={newsForm.audio_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, audio_url: e.target.value }))} />
                </label>
              </div>

              {/* AUTHOR */}
              <div className="form-section">
                <h4>✍️ लेखक</h4>
                <div className="form-row">
                  <label style={{ flex: 1 }}>
                    लेखक नाम
                    <input value={newsForm.author_name} onChange={(e) => setNewsForm((prev) => ({ ...prev, author_name: e.target.value }))} />
                  </label>
                  <label style={{ flex: 1 }}>
                    लेखक ईमेल
                    <input type="email" value={newsForm.author_email} onChange={(e) => setNewsForm((prev) => ({ ...prev, author_email: e.target.value }))} />
                  </label>
                </div>
                <div className="form-row">
                  <label style={{ flex: 1 }}>
                    🐦 Twitter
                    <input value={newsForm.author_twitter} onChange={(e) => setNewsForm((prev) => ({ ...prev, author_twitter: e.target.value }))} />
                  </label>
                  <label style={{ flex: 1 }}>
                    📷 Instagram
                    <input value={newsForm.author_instagram} onChange={(e) => setNewsForm((prev) => ({ ...prev, author_instagram: e.target.value }))} />
                  </label>
                </div>
                <label>
                  सोर्स
                  <input value={newsForm.source} onChange={(e) => setNewsForm((prev) => ({ ...prev, source: e.target.value }))} />
                </label>
              </div>

              {/* SEO */}
              <div className="form-section">
                <h4>🔍 SEO</h4>
                <label>
                  SEO Title
                  <input value={newsForm.seo_title} onChange={(e) => setNewsForm((prev) => ({ ...prev, seo_title: e.target.value }))} />
                </label>
                <label>
                  Meta Description
                  <textarea rows="2" value={newsForm.meta_description} onChange={(e) => setNewsForm((prev) => ({ ...prev, meta_description: e.target.value }))} />
                </label>
                <label>
                  Meta Keywords
                  <input value={newsForm.meta_keywords} onChange={(e) => setNewsForm((prev) => ({ ...prev, meta_keywords: e.target.value }))} />
                </label>
                <label>
                  सारांश
                  <textarea rows="2" value={newsForm.ai_summary} onChange={(e) => setNewsForm((prev) => ({ ...prev, ai_summary: e.target.value }))} />
                </label>
              </div>

              {/* LOCATION */}
              <div className="form-section">
                <h4>📍 स्थान</h4>
                <div className="form-row">
                  <label style={{ flex: 1 }}>
                    Location
                    <input value={newsForm.location} onChange={(e) => setNewsForm((prev) => ({ ...prev, location: e.target.value }))} />
                  </label>
                  <label style={{ flex: 1 }}>
                    Coordinates
                    <input value={newsForm.coordinates} onChange={(e) => setNewsForm((prev) => ({ ...prev, coordinates: e.target.value }))} />
                  </label>
                </div>
              </div>

              {/* SOCIAL */}
              <div className="form-section">
                <h4>🔗 सोशल मीडिया</h4>
                <label>
                  🐦 Twitter URL
                  <input value={newsForm.twitter_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, twitter_url: e.target.value }))} />
                </label>
                <label>
                  📘 Facebook URL
                  <input value={newsForm.facebook_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, facebook_url: e.target.value }))} />
                </label>
                <label>
                  📷 Instagram URL
                  <input value={newsForm.instagram_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, instagram_url: e.target.value }))} />
                </label>
                <label>
                  📺 YouTube URL
                  <input value={newsForm.youtube_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, youtube_url: e.target.value }))} />
                </label>
              </div>

              {/* PUBLISHING */}
              <div className="form-section">
                <h4>⚙️ पब्लिशिंग</h4>
                {!canPublishNews && (
                  <p className="permission-note">Author mode: edit कर सकते हैं, लेकिन final save हमेशा draft रहेगा।</p>
                )}
                <div className="form-row">
                  <label style={{ flex: 1 }}>
                    स्टेटस
                    <select value={newsForm.status} onChange={(e) => setNewsForm((prev) => ({ ...prev, status: e.target.value }))} disabled={!canPublishNews}>
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="archived">Archived</option>
                    </select>
                  </label>
                  <label style={{ flex: 1 }}>
                    प्राथमिकता
                    <select value={newsForm.priority} onChange={(e) => setNewsForm((prev) => ({ ...prev, priority: e.target.value }))}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </label>
                </div>
                <div className="form-row">
                  <label style={{ flex: 1 }}>
                    पब्लिश टाइम
                    <input type="datetime-local" value={newsForm.published_at ? newsForm.published_at.slice(0, 16) : ''} onChange={(e) => setNewsForm((prev) => ({ ...prev, published_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))} />
                  </label>
                  <label style={{ flex: 1 }}>
                    एक्सपायरी टाइम
                    <input type="datetime-local" value={newsForm.expire_at ? newsForm.expire_at.slice(0, 16) : ''} onChange={(e) => setNewsForm((prev) => ({ ...prev, expire_at: e.target.value ? new Date(e.target.value).toISOString() : '' }))} />
                  </label>
                </div>
                <div className="form-row" style={{ gap: '16px' }}>
                  <label className="switch">
                    <input type="checkbox" checked={newsForm.is_featured} onChange={(e) => setNewsForm((prev) => ({ ...prev, is_featured: e.target.checked }))} disabled={!canPublishNews} />
                    <span>फ़ीचर्ड रखें</span>
                  </label>
                  <label className="switch">
                    <input type="checkbox" checked={newsForm.is_breaking} onChange={(e) => setNewsForm((prev) => ({ ...prev, is_breaking: e.target.checked }))} disabled={!canPublishNews} />
                    <span>🔴 Breaking News रखें</span>
                  </label>
                </div>
              </div>

                  </div>
                  {renderEditorRail()}
                </div>

              <div className="editor-submit-row editor-submit-row-modal" style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-primary" type="submit">
                  सेव करें
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => setShowEditModal(false)}
                >
                  रद्द करें
                </button>
              </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit/Create Reel Modal */}
      {showReelModal && (
        <div className="modal-overlay" onClick={() => setShowReelModal(false)}>
          <div className="modal-content edit-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowReelModal(false)}>✕</button>
            <h2>{editingReel?.id === 'new-reel' ? '🎥 नई वीडियो स्टोरी (Reel) बनाएं' : '🎬 रील संपादित करें'}</h2>
            <form className="editor-form" onSubmit={handleSaveReel}>
              <div className="editor-shell editor-shell-modal">
                <div className="editor-main">
                  <div className="form-section form-section-highlight">
                    <h4>📝 वीडियो डिटेल्स</h4>
                    <label>
                      शीर्षक / टाइटल *
                      <input required value={reelForm.title} onChange={(e) => setReelForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="वीडियो का नाम..." />
                    </label>
                    <label>
                      कैप्शन *
                      <textarea required rows="2" value={reelForm.caption} onChange={(e) => setReelForm((prev) => ({ ...prev, caption: e.target.value }))} placeholder="#tags और डिस्क्रिप्शन..." />
                    </label>
                    <label>
                      टैग्स (कॉमा से अलग)
                      <input value={reelForm.tags} onChange={(e) => setReelForm((prev) => ({ ...prev, tags: e.target.value }))} placeholder="news, viral, update" />
                    </label>
                  </div>

                  <div className="form-section">
                    <h4>🎬 वीडियो सोर्स</h4>
                    <label>
                      डायरेक्ट वीडियो अपलोड या YouTube Link *
                      <div className="video-input-row" style={{ marginTop: '8px' }}>
                        <input
                          type="url"
                          required
                          value={reelForm.video_url}
                          onChange={(e) => setReelForm((prev) => ({ ...prev, video_url: e.target.value }))}
                          placeholder="YouTube iframe src / link paste करें"
                        />
                        <button
                          type="button"
                          className="btn-secondary video-file-pick-btn"
                          onClick={() => videoFileInputRef.current?.click()}
                          title="Video file upload करें"
                          disabled={videoUploadState.state === 'loading'}
                        >
                          {videoUploadState.state === 'loading' ? 'Uploading...' : '📤 Upload'}
                        </button>
                        <input
                          ref={videoFileInputRef}
                          type="file"
                          accept="video/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const maxSize = 120 * 1024 * 1024;
                            if (file.size > maxSize) {
                              setVideoUploadState({ state: 'error', message: 'Max 120MB allowed.' });
                              e.target.value = '';
                              return;
                            }
                            const url = await uploadVideoAsset(file, { assignToForm: false });
                            if (url) {
                              setReelForm((prev) => ({ ...prev, video_url: url }));
                            }
                            e.target.value = '';
                          }}
                        />
                      </div>
                      {videoUploadState.message && (
                        <p style={{ fontSize: '11px', color: videoUploadState.state === 'error' ? 'red' : 'green', marginTop: '4px' }}>
                          {videoUploadState.message}
                        </p>
                      )}
                    </label>
                    {reelForm.video_url && !reelForm.video_url.includes('youtube') && !reelForm.video_url.includes('youtu.be') ? (
                      <video
                        src={reelForm.video_url}
                        muted
                        controls
                        style={{ width: '100%', maxHeight: '200px', borderRadius: '8px', marginTop: '8px', background: '#000' }}
                      />
                    ) : reelForm.video_url && (
                      <div style={{ width: '100%', height: '200px', marginTop: '8px', background: '#000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        YouTube Video Preview Enabled
                      </div>
                    )}
                  </div>

                  <div className="form-section">
                    <h4>⚙️ सेटिंग्स</h4>
                    <label>
                      स्टेटस
                      <select value={reelForm.status} onChange={(e) => setReelForm((prev) => ({ ...prev, status: e.target.value }))}>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="editor-submit-row editor-submit-row-modal" style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-primary" type="submit" disabled={videoUploadState.state === 'loading'}>
                    सेव वीडियो
                  </button>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => setShowReelModal(false)}
                  >
                    रद्द करें
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {cropper.open && (
        <div className="modal-overlay" onClick={() => setCropper({ open: false, src: '', target: 'avatar', aspect: 1 })}>
          <div className="modal-content crop-modal" onClick={(event) => event.stopPropagation()}>
            <button className="close-btn" onClick={() => setCropper({ open: false, src: '', target: 'avatar', aspect: 1 })}>✕</button>
            <h2>{cropper.target === 'avatar' ? 'प्रोफाइल फोटो क्रॉप करें' : 'कवर इमेज क्रॉप करें'}</h2>
            <div className="crop-stage" style={{ aspectRatio: `${cropper.aspect}` }}>
              <img src={cropper.src} alt="Crop preview" style={{ transform: `scale(${cropZoom})` }} />
            </div>
            <div className="crop-controls">
              <label>
                ज़ूम
                <input
                  type="range"
                  min="1"
                  max="2.4"
                  step="0.05"
                  value={cropZoom}
                  onChange={(event) => setCropZoom(Number(event.target.value))}
                />
              </label>
              <div className="crop-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCropper({ open: false, src: '', target: 'avatar', aspect: 1 })}
                >
                  कैंसल
                </button>
                <button type="button" className="btn-primary" disabled={isApplyingCrop} onClick={applyCroppedImage}>
                  {isApplyingCrop ? 'सेव हो रहा है...' : 'क्रॉप सेव करें'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Site Settings Modal */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => setShowSettingsModal(false)}>
          <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowSettingsModal(false)}>✕</button>
            <h2>साइट सेटिंग्स</h2>
            <form onSubmit={handleUpdateSettings}>
              <label>
                साइट का नाम *
                <input
                  required
                  value={siteSettings.site_name}
                  onChange={(e) => setSiteSettings((prev) => ({ ...prev, site_name: e.target.value }))}
                />
              </label>
              <label>
                साइट उपशीर्षक *
                <input
                  required
                  value={siteSettings.site_subtitle}
                  onChange={(e) => setSiteSettings((prev) => ({ ...prev, site_subtitle: e.target.value }))}
                />
              </label>
              <label>
                साइट शीर्षक (Browser Tab) *
                <input
                  required
                  value={siteSettings.site_title}
                  onChange={(e) => setSiteSettings((prev) => ({ ...prev, site_title: e.target.value }))}
                />
              </label>
              <label>
                साइट विवरण *
                <textarea
                  required
                  rows="3"
                  value={siteSettings.site_description}
                  onChange={(e) => setSiteSettings((prev) => ({ ...prev, site_description: e.target.value }))}
                />
              </label>

              <div className="campaign-settings-grid">
                <h3>Campaign Control</h3>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={campaignConfig.enabled}
                    onChange={(e) => updateCampaignField('enabled', e.target.checked)}
                  />
                  <span>Enable campaign page/banner</span>
                </label>

                <div className="form-row">
                  <label style={{ flex: 1 }}>
                    Display mode
                    <select
                      value={campaignConfig.mode}
                      onChange={(e) => updateCampaignField('mode', e.target.value)}
                    >
                      <option value="banner">Top Banner</option>
                      <option value="fullpage">Full Page Takeover</option>
                    </select>
                  </label>
                  <label style={{ flex: 1 }}>
                    Media type
                    <select
                      value={campaignConfig.mediaType}
                      onChange={(e) => updateCampaignField('mediaType', e.target.value)}
                    >
                      <option value="none">None</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </label>
                </div>

                <label>
                  Campaign title
                  <input
                    value={campaignConfig.title}
                    onChange={(e) => updateCampaignField('title', e.target.value)}
                    placeholder="Exam Festival 2026"
                  />
                </label>

                <label>
                  Campaign subtitle
                  <input
                    value={campaignConfig.subtitle}
                    onChange={(e) => updateCampaignField('subtitle', e.target.value)}
                    placeholder="Limited time special"
                  />
                </label>

                <label>
                  Campaign description
                  <textarea
                    rows="2"
                    value={campaignConfig.description}
                    onChange={(e) => updateCampaignField('description', e.target.value)}
                    placeholder="Share event updates, admission notices, or important announcements."
                  />
                </label>

                <label>
                  Media URL
                  <input
                    value={campaignConfig.mediaUrl}
                    onChange={(e) => updateCampaignField('mediaUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </label>

                <div className="form-row">
                  <label style={{ flex: 1 }}>
                    CTA text
                    <input
                      value={campaignConfig.ctaText}
                      onChange={(e) => updateCampaignField('ctaText', e.target.value)}
                      placeholder="Register Now"
                    />
                  </label>
                  <label style={{ flex: 1 }}>
                    CTA URL
                    <input
                      value={campaignConfig.ctaUrl}
                      onChange={(e) => updateCampaignField('ctaUrl', e.target.value)}
                      placeholder="https://example.com/event"
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label style={{ flex: 1 }}>
                    Start time
                    <input
                      type="datetime-local"
                      value={campaignConfig.startAt ? campaignConfig.startAt.slice(0, 16) : ''}
                      onChange={(e) => updateCampaignField('startAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
                    />
                  </label>
                  <label style={{ flex: 1 }}>
                    End time
                    <input
                      type="datetime-local"
                      value={campaignConfig.endAt ? campaignConfig.endAt.slice(0, 16) : ''}
                      onChange={(e) => updateCampaignField('endAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label style={{ flex: 1 }}>
                    Dismiss cooldown (hours)
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={campaignConfig.dismissHours}
                      onChange={(e) => updateCampaignField('dismissHours', Number(e.target.value) || 24)}
                    />
                  </label>
                  <label className="switch" style={{ flex: 1 }}>
                    <input
                      type="checkbox"
                      checked={campaignConfig.allowDismiss}
                      onChange={(e) => updateCampaignField('allowDismiss', e.target.checked)}
                    />
                    <span>Allow dismiss</span>
                  </label>
                </div>

                <label className="switch">
                  <input
                    type="checkbox"
                    checked={campaignConfig.openInNewTab}
                    onChange={(e) => updateCampaignField('openInNewTab', e.target.checked)}
                  />
                  <span>Open CTA in new tab</span>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-primary" type="submit">
                  सेटिंग्स सेव करें
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                >
                  रद्द करें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Translation Tool */}
      <TranslationTool
        isOpen={showTranslationTool}
        onClose={() => setShowTranslationTool(false)}
        language={language}
      />

      {/* Terms & Cookies Banner */}
      {showTermsBanner && (
        <div className="terms-banner">
          <div className="terms-banner-content">
            <p>
              <strong>Terms & Privacy:</strong> Parent Company: VIPNO1 EMPIRE. Developer: Preetam Yadav. This platform is for everyone and does not share your data.
            </p>
            <button className="btn-primary" onClick={handleAcceptTerms}>
              I Agree
            </button>
          </div>
        </div>
      )}

      {/* Live Stats Floating Footer */}
      <div className="live-stats-bar">
        <span className="live-pill"><span className="pulse-dot"></span> <span style={{ fontWeight: 'bold' }}>{liveVisitors}</span> {t('activeNow', language) || 'Live'}</span>
        <span className="views-pill">👁 <span style={{ fontWeight: 'bold' }}>{(totalSiteViews + liveVisitors).toLocaleString()}</span> {t('views', language) || 'Total Views'}</span>
      </div>

      {/* Onboarding Modal */}
      {showOnboardingModal && (!showTermsBanner) && (
        <div className="modal-overlay">
          <div className="modal onboarding-modal">
            <h2>Welcome to {siteSettings.site_name || 'ALOK'}</h2>
            <p>Please enter your name/username to continue.</p>
            <form onSubmit={handleSaveVisitorName}>
              <input
                type="text"
                autoFocus
                placeholder="Your Name"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                required
              />
              <button className="btn-primary" type="submit" style={{ marginTop: '12px', width: '100%' }}>
                Enter
              </button>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default App;
