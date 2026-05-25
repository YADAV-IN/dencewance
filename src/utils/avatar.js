export const getAvatarUrl = (id, name) => {
  const seedName = name || 'User';
  // Return a super clean, professional initial-based avatar
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seedName)}&background=3A125E&color=fff&bold=true&size=128`;
};
