export function getAvatarUrl(user) {
  if (user?.avatar) return user.avatar;
  const name = user?.displayName || user?.email || "U";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F59B1D&color=fff&bold=true`;
}

export function getAvatarFallback(name) {
  return name?.charAt(0).toUpperCase() || "U";
}
