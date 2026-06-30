const LOCAL_KEYS = {
  anonymous: 'dwAnonymousCreatorId',
  developer: 'dwDeveloperCreatorId',
};

const safeStorage = {
  get(key) {
    try {
      return localStorage.getItem(key) || '';
    } catch {
      return '';
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore storage errors
    }
  },
};

const stableHash = (input = '') => {
  const text = String(input || 'creator');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

const slugify = (value = '', fallback = 'creator') => {
  const slug = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9_.]+/g, '') // Remove anything that isn't alphanumeric, underscore, or dot (no hyphens for spaces)
    .replace(/^-+|-+$/g, '');
  return slug || fallback;
};

const getOrCreatePersistentId = (storageKey, prefix, seed) => {
  const existing = safeStorage.get(storageKey);
  if (existing) return existing;
  const nextId = `${prefix}_${stableHash(seed || `${prefix}-${Date.now()}`).slice(0, 10)}`;
  safeStorage.set(storageKey, nextId);
  return nextId;
};

export const buildCreatorIdentity = ({
  mode = 'official',
  seed = '',
  name = '',
  handle = '',
  avatar = '',
  followerCount = 0,
} = {}) => {
  const normalizedMode = String(mode || 'anonymous').toLowerCase();
  const adminToken = safeStorage.get('adminToken');
  const adminId = safeStorage.get('adminId');
  const activeUploader = safeStorage.get('activeUploader');
  const anonymousId = getOrCreatePersistentId(LOCAL_KEYS.anonymous, 'anon', seed);
  const developerId = getOrCreatePersistentId(LOCAL_KEYS.developer, 'dev', seed);
  const genericId = `creator_${stableHash(seed || name || handle || Date.now()).slice(0, 10)}`;
  
  const stableName = name ? name.trim() : '';
  const customId = stableName ? `custom_${stableHash(stableName).slice(0, 10)}` : '';

  const officialId = activeUploader || adminId || (adminToken ? adminId : '') || genericId;
  const developerIdentityId = stableName ? customId : (activeUploader || developerId || genericId);
  const anonymousIdentityId = stableName ? customId : (anonymousId || genericId);

  const base = {
    creator_avatar: avatar || '',
    follower_count: Number(followerCount) > 0 ? Number(followerCount) : 0,
    is_official_creator: false,
    is_demo_creator: false,
  };

  if (normalizedMode === 'official') {
    if (!adminToken && !adminId && !activeUploader) {
      const displayName = name || 'Anonymous Creator';
      return {
        ...base,
        creator_mode: 'anonymous',
        creator_id: stableName ? customId : anonymousIdentityId,
        creator_name: displayName,
        creator_handle: handle || `anon-${stableHash(seed || displayName).slice(0, 8)}`,
      };
    }

    const displayName = name || safeStorage.get('userName') || 'Seen.Ly Demo';
    const displayAvatar = avatar || safeStorage.get('userAvatar') || '';
    const displayHandle = handle || safeStorage.get('userHandle') || slugify(displayName, 'seen.ly-demo');
    return {
      ...base,
      creator_avatar: displayAvatar,
      creator_mode: 'official',
      creator_id: officialId,
      creator_name: displayName,
      creator_handle: displayHandle,
      is_official_creator: true,
    };
  }

  if (normalizedMode === 'developer') {
    const displayName = name || 'Developer';
    return {
      ...base,
      creator_mode: 'developer',
      creator_id: stableName ? customId : developerIdentityId,
      creator_name: displayName,
      creator_handle: handle || slugify(displayName, 'developer'),
    };
  }

  if (normalizedMode === 'male') {
    const displayName = name || 'Seen.Ly Boy';
    return {
      ...base,
      creator_mode: 'male',
      creator_id: stableName ? customId : genericId,
      creator_name: displayName,
      creator_handle: handle || slugify(displayName, 'denceboy'),
      creator_avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
    };
  }

  if (normalizedMode === 'female') {
    const displayName = name || 'Seen.Ly Girl';
    return {
      ...base,
      creator_mode: 'female',
      creator_id: stableName ? customId : genericId,
      creator_name: displayName,
      creator_handle: handle || slugify(displayName, 'dencegirl'),
      creator_avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
    };
  }

  const displayName = name || 'Anonymous Creator';
  return {
    ...base,
    creator_mode: 'anonymous',
    creator_id: stableName ? customId : anonymousIdentityId,
    creator_name: displayName,
    creator_handle: handle || `anon-${stableHash(seed || displayName).slice(0, 8)}`,
  };
};

export const getPreferredCreatorMode = () => {
  const activeUploader = safeStorage.get('activeUploader');
  if (!safeStorage.get('adminToken')) return 'anonymous';
  if (activeUploader) return 'developer';
  return 'official';
};

export const getAnonymousCreatorId = (seed = '') => getOrCreatePersistentId(LOCAL_KEYS.anonymous, 'anon', seed);
