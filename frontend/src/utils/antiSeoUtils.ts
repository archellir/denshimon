// Anti-SEO utilities for internal services
// Generates generic, non-descriptive names to avoid detection by crawlers/bots

export const GENERIC_NAMES = [
  'System',
  'Dashboard', 
  'Console',
  'Interface',
  'Panel',
  'Monitor',
  'Viewer',
  'Manager',
  'Controller',
  'Admin',
] as const;

export const GENERIC_DESCRIPTIONS = [
  'Internal system interface',
  'Administrative dashboard',
  'System monitoring console', 
  'Management interface',
  'Control panel',
  'Status viewer',
  'System console',
  'Operations dashboard',
  'Administrative panel',
  'Internal tools',
] as const;

export const GENERIC_SECTIONS = [
  'Overview',
  'System',
  'Status',
  'Resources',
  'Services',
  'Network',
  'Logs',
  'Settings',
  'Tools',
  'Management',
] as const;

// Generate random generic name
export const getRandomGenericName = (): string => {
  const names = GENERIC_NAMES;
  return names[Math.floor(Math.random() * names.length)];
};

// Generate random generic description  
export const getRandomGenericDescription = (): string => {
  const descriptions = GENERIC_DESCRIPTIONS;
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

// Anti-SEO site constants
export const ANTI_SEO_CONFIG = {
  SITE_NAME: 'System Console',
  SITE_DESCRIPTION: 'Internal administrative interface',
  PAGE_TITLE_PREFIX: 'Console',
  GENERIC_ERROR_MESSAGE: 'System temporarily unavailable',
  ROBOTS_CONTENT: 'noindex, nofollow, noarchive, nosnippet, noimageindex',
  META_DESCRIPTION: 'Internal system interface - authorized access only',
} as const;