export const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const ensureUniqueSlug = async (db, baseSlug) => {
  const safeBase = baseSlug || 'story';
  let slug = safeBase;
  let suffix = 1;
  while (true) {
    const existing = await db.get('SELECT id FROM news WHERE slug = ?', [slug]);
    if (!existing) return slug;
    slug = `${safeBase}-${suffix}`;
    suffix += 1;
  }
};
