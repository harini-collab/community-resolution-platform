export function dashboardPathForRole(role) {
  if (role === 'admin') return '/admin';
  if (role === 'officer') return '/officer';
  return '/citizen';
}
