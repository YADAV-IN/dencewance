import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { useDevice } from './hooks/useDevice';
import { MobileBottomNav } from './components/MobileBottomNav';
import { DesktopSidebar } from './components/DesktopSidebar';
import { TranslationTool } from './components/TranslationTool';
import { t, detectLanguage } from './translations';

const API_URL = import.meta.env.VITE_API_URL || 'https://server-tan-iota-18.vercel.app';

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

const extractYouTubeId = (url) => {
  if (!url) return '';
  const match = url.match(/(?:embed\/|v=)([a-zA-Z0-9_-]{6,})/);
  return match ? match[1] : '';
};

const resolveMediaUrl = (value) => {
  if (!value) return '';
  if (value.startsWith('http')) return value;
  return `${API_URL}${value}`;
};

function App() {
  const device = useDevice();
  const [news, setNews] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('alok_token') || '');
  const [adminProfile, setAdminProfile] = useState(null);
  const [adminList, setAdminList] = useState([]);
  const [adminPasswords, setAdminPasswords] = useState({});
  const [showAdmin, setShowAdmin] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'author', bio: '' });
  const [editingUser, setEditingUser] = useState(null);
  const [activePage, setActivePage] = useState('होम');
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
    author_name: 'ALOK Team',
    author_email: '',
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
  const [siteSettings, setSiteSettings] = useState({
    site_name: 'ALOK',
    site_subtitle: 'बीजेएमसी न्यूज़',
    site_title: 'ALOK - बीजेएमसी न्यूज़',
    site_description: 'बीजेएमसी न्यूज़रूम - आपकी खबरों का भरोसेमंद स्रोत'
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('alok_language');
    if (saved) return saved;
    return detectLanguage();
  });
  const [languageOverride, setLanguageOverride] = useState(() => {
    return localStorage.getItem('alok_language_override') === 'true';
  });
  const [showTranslationTool, setShowTranslationTool] = useState(false);

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

  const videoNews = useMemo(() => {
    return news.filter((item) => item.video_url);
  }, [news]);

  const imageNews = useMemo(() => {
    return news.filter((item) => item.cover_image_url);
  }, [news]);

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
        setSelectedStory(null);
        setStatus({ state: 'online', message: 'डेटा कनेक्शन स्थिर है।' });
      } catch (error) {
        setNews(demoNews);
        setFeatured(demoNews.filter((item) => item.is_featured));
        setSelectedStory(null);
        setStatus({ state: 'offline', message: 'लोकल डेमो डेटा चल रहा है।' });
      }
    };

    loadNews();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!adminToken) return;
      try {
        const response = await fetch(`${API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (response.status === 401) {
          // Token expired or invalid — clear it so the login form is shown
          setAdminToken('');
          setAdminProfile(null);
          localStorage.removeItem('alok_token');
          return;
        }
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
    localStorage.removeItem('alok_token');
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
    const payload = {
      ...newsForm,
      tags: newsForm.tags.split(',').map((tag) => tag.trim()),
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

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !adminToken) return;

    setStatus({ state: 'loading', message: 'इमेज अपलोड हो रही है...' });

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Image = reader.result;

        // Update profile with new avatar
        const response = await fetch(`${API_URL}/api/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: adminProfile?.name,
            email: adminProfile?.email,
            bio: adminProfile?.bio,
            avatar_url: base64Image,
          }),
        });

        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Upload failed');

        setAdminProfile((prev) => ({ ...prev, avatar_url: base64Image }));
        setStatus({ state: 'online', message: 'प्रोफाइल फोटो अपडेट हो गई!' });
      };

      reader.onerror = () => {
        setStatus({ state: 'error', message: 'इमेज पढ़ने में त्रुटि।' });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setStatus({ state: 'error', message: 'अपलोड असफल रहा।' });
    }
  };

  const handleMediaUpload = async (event, field) => {
    const file = event.target.files?.[0];
    if (!file || !adminToken) return;

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

  // Load site settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/settings`);
        if (response.ok) {
          const payload = await response.json();
          if (payload.data) {
            setSiteSettings(payload.data);
            document.title = payload.data.site_title || 'ALOK - बीजेएमसी न्यूज़';
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    loadSettings();
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

  // Breaking news: Manual (is_breaking) या Automatic (latest 5)
  const breakingNews = news.filter((item) => item.is_breaking);
  const tickerItems = breakingNews.length > 0 ? breakingNews.slice(0, 5) : news.slice(0, 5);

  const heroStory = featured[0] || news[0];
  const videoStory = news.find((item) => item.video_url) || demoNews[0];
  const videoId = extractYouTubeId(videoStory.video_url);

  return (
    <div className="App">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
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
            <button className="btn-secondary" onClick={() => setShowAdmin((prev) => !prev)}>
              {adminToken ? `⚙️ ${t('admin', language)}` : `🔐 ${t('login', language)}`}
            </button>
          </div>
        </div>
      </header>

      {/* Breaking News Ticker */}
      {tickerItems.length > 0 && (
        <section className="breaking-news">
          <span className="breaking-label">{t('breakingNews', language)}</span>
          <div className="ticker-track">
            <div className="ticker-content">
              {tickerItems.concat(tickerItems).map((item, index) => (
                <span
                  key={`${item.id}-${index}`}
                  onClick={() => setSelectedStory(item)}
                  className="ticker-item"
                >
                  {item.title}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      <div style={{ display: device.isDesktop ? 'grid' : 'block', gridTemplateColumns: device.isDesktop ? '1fr 320px' : '1fr', gap: '24px' }}>
        {/* Main Content */}
        <main className="main-content">
          {/* Featured Story */}
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
                  <button className="btn-primary" onClick={() => setSelectedStory(heroStory)}>
                    {t('readFullStory', language)}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Latest Stories Grid */}
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
                  <div className="card-content" onClick={() => setSelectedStory(item)}>
                    <span className="card-category">{item.category}</span>
                    <h3>{item.title}</h3>
                    <p>{item.excerpt}</p>
                    <div className="card-meta">
                      <span>{item.reading_time} {t('min', language)}</span>
                      <span>{item.views} {t('views', language)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Categories */}
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
                    onClick={() => {
                      setActiveCategory(cat);
                      setActivePage(t('featured', language));
                    }}
                  >
                    <span>{cat}</span>
                    <small>{news.filter((n) => n.category === cat).length} {t('stories', language)}</small>
                  </button>
                ))}
            </div>
          </section>

          {/* Videos */}
          {videoNews.length > 0 && (
            <section className="videos-section">
              <div className="section-header">
                <h2>{t('videoStories', language)}</h2>
              </div>
              <div className="videos-grid">
                {videoNews.slice(0, 3).map((item) => (
                  <div key={item.id} className="video-card" onClick={() => setSelectedStory(item)}>
                    <div className="video-thumbnail" style={{ backgroundImage: `url(${resolveMediaUrl(item.cover_image_url)})` }}>
                      <span className="play-icon">▶️</span>
                    </div>
                    <div className="video-info">
                      <h4>{item.title}</h4>
                      <small>{item.category}</small>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Story Detail Modal */}
          {selectedStory && (
            <section className="story-detail">
              <button className="close-btn" onClick={() => setSelectedStory(null)}>✕</button>
              <div className="detail-scroll-area">
                <div className="detail-content">
                  <span className="detail-category">{selectedStory.category}</span>
                  <h2>{selectedStory.title}</h2>
                  <div className="detail-meta">
                    <span>{formatDate(selectedStory.published_at)}</span>
                    <span>•</span>
                    <span>{selectedStory.reading_time} मिन पढ़ें</span>
                  </div>
                  {selectedStory.cover_image_url && !selectedStory.video_url && (
                    <div className="detail-image" style={{ backgroundImage: `url(${resolveMediaUrl(selectedStory.cover_image_url)})` }}></div>
                  )}
                  {selectedStory.video_url && (
                    <div className="detail-video-container" style={{ marginBottom: '32px' }}>
                      {selectedStory.video_url.includes('youtube.com') || selectedStory.video_url.includes('youtu.be') ? (
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
                    <p>{selectedStory.content}</p>
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
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Sidebar */}
        {device.isDesktop && (
          <aside className="sidebar">
            <div className="sidebar-section">
              <h3>🔥 {t('trending', language)}</h3>
              {trendingNews.slice(0, 5).map((item) => (
                <div key={item.id} className="sidebar-item">
                  <div onClick={() => setSelectedStory(item)} style={{ flex: 1, cursor: 'pointer' }}>
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
                    onClick={() => {
                      setActiveCategory(cat);
                      setActivePage('फ़ीचर्ड');
                    }}
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
                  <button className="ghost" onClick={() => setShowAdmin(false)}>
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
                        <div className="avatar-wrapper">
                          <img
                            src={
                              resolveMediaUrl(adminProfile?.avatar_url) ||
                              'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=300&auto=format&fit=crop'
                            }
                            alt="Admin"
                          />
                          <label className="avatar-change-btn" title={t('changePhoto', language)}>
                            📷
                            <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
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
                  </div>
                )}
              </div>
            )}
          </aside>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      {device.isMobile && <MobileBottomNav activePage={activePage} setActivePage={setActivePage} showAdmin={showAdmin} setShowAdmin={setShowAdmin} adminToken={adminToken} />}

      {showAdmin && !device.isDesktop && (
        <aside className="admin-panel mobile-view">
          <div className="admin-header">
            <h2>{t('adminPanel', language)}</h2>
            <button className="ghost" onClick={() => setShowAdmin(false)}>
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
                  <div className="avatar-wrapper">
                    <img
                      src={
                        resolveMediaUrl(adminProfile?.avatar_url) ||
                        'https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=300&auto=format&fit=crop'
                      }
                      alt="Admin"
                    />
                    <label className="avatar-change-btn" title={t('changePhoto', language)}>
                      📷
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
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

              <form className="admin-form advanced-form" onSubmit={handleNewsCreate}>
                <h3>📰 नई खबर बनाएं (Advanced)</h3>

                {/* BASIC INFORMATION */}
                <div className="form-section">
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
                    <textarea rows="6" value={newsForm.content} onChange={(e) => setNewsForm((prev) => ({ ...prev, content: e.target.value }))} required placeholder="पूरी खबर यहां लिखें..." />
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
                    <div className="upload-input-group" style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleMediaUpload(e, 'cover_image_url')}
                        style={{ padding: '8px' }}
                      />
                    </div>
                    <input
                      value={newsForm.cover_image_url}
                      onChange={(e) => setNewsForm((prev) => ({ ...prev, cover_image_url: e.target.value }))}
                      placeholder="या फिर इमेज URL पेस्ट करें (https://...)"
                      style={{ marginTop: '8px' }}
                    />
                  </label>
                  <label>
                    गैलरी URLs (comma separated)
                    <textarea rows="2" value={newsForm.gallery_urls} onChange={(e) => setNewsForm((prev) => ({ ...prev, gallery_urls: e.target.value }))} placeholder="https://img1.jpg, https://img2.jpg" />
                  </label>
                  <label>
                    वीडियो (Upload MP4 or URL)
                    <div className="upload-input-group" style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        onChange={(e) => handleMediaUpload(e, 'video_url')}
                        style={{ padding: '8px' }}
                      />
                    </div>
                    <input
                      value={newsForm.video_url}
                      onChange={(e) => setNewsForm((prev) => ({ ...prev, video_url: e.target.value }))}
                      placeholder="या फिर YouTube/Vimeo URL पेस्ट करें"
                      style={{ marginTop: '8px' }}
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
                  <div className="form-row">
                    <label style={{ flex: 1 }}>
                      स्टेटस
                      <select value={newsForm.status} onChange={(e) => setNewsForm((prev) => ({ ...prev, status: e.target.value }))}>
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
                      <input type="checkbox" checked={newsForm.is_featured} onChange={(e) => setNewsForm((prev) => ({ ...prev, is_featured: e.target.checked }))} />
                      <span>⭐ फ़ीचर्ड रखें</span>
                    </label>
                    <label className="switch">
                      <input type="checkbox" checked={newsForm.is_breaking} onChange={(e) => setNewsForm((prev) => ({ ...prev, is_breaking: e.target.checked }))} />
                      <span>🔴 Breaking News रखें</span>
                    </label>
                  </div>
                </div>

                <button className="primary" type="submit" style={{ width: '100%', padding: '14px', fontSize: '16px', fontWeight: '600' }}>
                  ✅ खबर सेव करें
                </button>
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
            <h2>📝 खबर संपादित करें (Advanced)</h2>
            <form onSubmit={handleSaveNews}>
              {/* BASIC INFO */}
              <div className="form-section">
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
                  <textarea required rows="6" value={newsForm.content} onChange={(e) => setNewsForm((prev) => ({ ...prev, content: e.target.value }))} />
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
                  कवर इमेज URL
                  <input type="url" value={newsForm.cover_image_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, cover_image_url: e.target.value }))} />
                </label>
                <label>
                  गैलरी URLs (comma separated)
                  <textarea rows="2" value={newsForm.gallery_urls} onChange={(e) => setNewsForm((prev) => ({ ...prev, gallery_urls: e.target.value }))} placeholder="https://img1.jpg, https://img2.jpg" />
                </label>
                <label>
                  वीडियो URL
                  <input type="url" value={newsForm.video_url} onChange={(e) => setNewsForm((prev) => ({ ...prev, video_url: e.target.value }))} />
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
                <div className="form-row">
                  <label style={{ flex: 1 }}>
                    स्टेटस
                    <select value={newsForm.status} onChange={(e) => setNewsForm((prev) => ({ ...prev, status: e.target.value }))}>
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
                    <input type="checkbox" checked={newsForm.is_featured} onChange={(e) => setNewsForm((prev) => ({ ...prev, is_featured: e.target.checked }))} />
                    <span>फ़ीचर्ड रखें</span>
                  </label>
                  <label className="switch">
                    <input type="checkbox" checked={newsForm.is_breaking} onChange={(e) => setNewsForm((prev) => ({ ...prev, is_breaking: e.target.checked }))} />
                    <span>🔴 Breaking News रखें</span>
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
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
            </form>
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
    </div>
  );
}

export default App;
