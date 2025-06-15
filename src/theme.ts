// Minimalistic Dark Design System for Skibidi Wallet
// Inspired by modern fintech apps with graffiti aesthetics

export const COLORS = {
  // Dark theme palette
  BACKGROUND: '#0D0D0D', // Deep black
  SURFACE: '#1A1A1A', // Dark gray for cards
  SURFACE_ELEVATED: '#2A2A2A', // Slightly lighter for elevated elements
  OVERLAY: 'rgba(0, 0, 0, 0.8)',
  
  // Text colors
  TEXT_PRIMARY: '#FFFFFF', // Pure white
  TEXT_SECONDARY: '#A0A0A0', // Medium gray
  TEXT_TERTIARY: '#666666', // Darker gray
  TEXT_INVERSE: '#0D0D0D', // Black text for light backgrounds
  
  // Accent colors - Inspired by the reference app
  PRIMARY: '#FF3B82', // Bright pink/magenta
  SECONDARY: '#8B5CF6', // Purple
  ACCENT: '#06FFA5', // Bright mint green
  ACCENT_SECONDARY: '#FDE047', // Bright yellow
  
  // Status colors
  SUCCESS: '#22C55E',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  
  // Interactive elements
  BUTTON_PRIMARY: '#FF3B82',
  BUTTON_SECONDARY: '#2A2A2A',
  BUTTON_SUCCESS: '#22C55E',
  BUTTON_DANGER: '#EF4444',
  
  // Borders
  BORDER_LIGHT: '#333333',
  BORDER_MEDIUM: '#555555',
  BORDER_ACCENT: '#FF3B82',
  
  // Gradients
  GRADIENT_PINK: ['#FF3B82', '#EC4899'],
  GRADIENT_PURPLE: ['#8B5CF6', '#7C3AED'],
  GRADIENT_GREEN: ['#06FFA5', '#22C55E'],
  GRADIENT_DARK: ['#1A1A1A', '#0D0D0D'],
};

export const GRADIENTS = {
  PRIMARY: ['#FF3B82', '#EC4899'] as const,
  SECONDARY: ['#8B5CF6', '#7C3AED'] as const,
  ACCENT: ['#06FFA5', '#22C55E'] as const,
  BACKGROUND: ['#0D0D0D', '#1A1A1A'] as const,
  CARD: ['#1A1A1A', '#2A2A2A'] as const,
};

export const TYPOGRAPHY = {
  // Font families
  FONT_FAMILY: 'System',
  FONT_FAMILY_MONO: 'Courier', // For addresses and hashes
  
  // Font weights
  LIGHT: '300' as const,
  REGULAR: '400' as const,
  MEDIUM: '500' as const,
  SEMIBOLD: '600' as const,
  BOLD: '700' as const,
  EXTRABOLD: '800' as const,
  BLACK: '900' as const,
  
  // Font sizes - Minimal scale
  MICRO: 10,
  SMALL: 12,
  BODY: 14,
  BODY_LARGE: 16,
  SUBTITLE: 18,
  TITLE: 22,
  HEADING: 28,
  DISPLAY: 36,
  HERO: 48,
  MEGA: 64,
};

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
  XXXL: 64,
};

export const RADIUS = {
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  FULL: 9999,
};

export const SHADOWS = {
  GLOW_PINK: {
    shadowColor: '#FF3B82',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  GLOW_GREEN: {
    shadowColor: '#06FFA5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  SUBTLE: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  NONE: {},
};

export const BUTTON_STYLES = {
  base: {
    borderRadius: RADIUS.MD,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 56,
  },
  
  primary: {
    backgroundColor: COLORS.BUTTON_PRIMARY,
    ...SHADOWS.GLOW_PINK,
  },
  
  secondary: {
    backgroundColor: COLORS.BUTTON_SECONDARY,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  success: {
    backgroundColor: COLORS.BUTTON_SUCCESS,
    ...SHADOWS.GLOW_GREEN,
  },
  
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  
  ghost: {
    backgroundColor: 'transparent',
  },
};

export const CARD_STYLES = {
  base: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    ...SHADOWS.SUBTLE,
  },
  
  elevated: {
    backgroundColor: COLORS.SURFACE_ELEVATED,
    borderRadius: RADIUS.LG,
    padding: SPACING.XL,
    ...SHADOWS.SUBTLE,
  },
  
  minimal: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.MD,
    padding: SPACING.LG,
    borderWidth: 1,
    borderColor: COLORS.BORDER_LIGHT,
  },
  
  glow: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: RADIUS.LG,
    padding: SPACING.LG,
    borderWidth: 1,
    borderColor: COLORS.PRIMARY,
    ...SHADOWS.GLOW_PINK,
  },
};

export const TEXT_STYLES = {
  // Headers
  hero: {
    fontSize: TYPOGRAPHY.HERO,
    fontWeight: TYPOGRAPHY.BLACK,
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: -1,
  },
  
  display: {
    fontSize: TYPOGRAPHY.DISPLAY,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: -0.5,
  },
  
  heading: {
    fontSize: TYPOGRAPHY.HEADING,
    fontWeight: TYPOGRAPHY.BOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  
  title: {
    fontSize: TYPOGRAPHY.TITLE,
    fontWeight: TYPOGRAPHY.SEMIBOLD,
    color: COLORS.TEXT_PRIMARY,
  },
  
  subtitle: {
    fontSize: TYPOGRAPHY.SUBTITLE,
    fontWeight: TYPOGRAPHY.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
  },
  
  // Body text
  body: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.REGULAR,
    color: COLORS.TEXT_PRIMARY,
    lineHeight: TYPOGRAPHY.BODY * 1.5,
  },
  
  bodySecondary: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.REGULAR,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: TYPOGRAPHY.BODY * 1.5,
  },
  
  caption: {
    fontSize: TYPOGRAPHY.SMALL,
    fontWeight: TYPOGRAPHY.REGULAR,
    color: COLORS.TEXT_TERTIARY,
  },
  
  // Special styles
  mono: {
    fontSize: TYPOGRAPHY.SMALL,
    fontFamily: TYPOGRAPHY.FONT_FAMILY_MONO,
    color: COLORS.TEXT_SECONDARY,
  },
  
  balance: {
    fontSize: TYPOGRAPHY.MEGA,
    fontWeight: TYPOGRAPHY.BLACK,
    color: COLORS.TEXT_PRIMARY,
    letterSpacing: -2,
  },
  
  currency: {
    fontSize: TYPOGRAPHY.BODY,
    fontWeight: TYPOGRAPHY.MEDIUM,
    color: COLORS.TEXT_SECONDARY,
  },
};

export const ANIMATIONS = {
  FAST: 200,
  MEDIUM: 400,
  SLOW: 600,
  VERY_SLOW: 1000,
};

// Minimal icon system
export const ICONS = {
  SEND: '↗',
  RECEIVE: '↙',
  BACKUP: '🔒',
  SCAN: '📷',
  COPY: '📋',
  SETTINGS: '⚙️',
  BACK: '←',
  CLOSE: '✕',
  CHECK: '✓',
  WALLET: '💳',
  MONEY: '💰',
  TRANSACTION: '💸',
  SECURITY: '🛡️',
  REFRESH: '↻',
};

// Pixel art style cash bundle (as text art)
export const PIXEL_ART = {
  CASH_BUNDLE: `
    ██████████
    ██      ██
    ██  $$  ██
    ██      ██
    ██████████
  `,
  COIN: `
    ████
    █$$█
    █$$█
    ████
  `,
};

// Modern layout constants
export const LAYOUT = {
  HEADER_HEIGHT: 120,
  TAB_HEIGHT: 80,
  CARD_MIN_HEIGHT: 120,
  BUTTON_HEIGHT: 56,
  INPUT_HEIGHT: 56,
  SAFE_AREA_TOP: 44,
  SAFE_AREA_BOTTOM: 34,
};

// Animation presets
export const ANIMATION_PRESETS = {
  FADE_IN: {
    from: { opacity: 0 },
    to: { opacity: 1 },
    duration: ANIMATIONS.MEDIUM,
  },
  SLIDE_UP: {
    from: { opacity: 0, translateY: 30 },
    to: { opacity: 1, translateY: 0 },
    duration: ANIMATIONS.MEDIUM,
  },
  SCALE_IN: {
    from: { opacity: 0, scale: 0.9 },
    to: { opacity: 1, scale: 1 },
    duration: ANIMATIONS.MEDIUM,
  },
  GLOW: {
    from: { shadowOpacity: 0.1 },
    to: { shadowOpacity: 0.4 },
    duration: ANIMATIONS.SLOW,
  },
};

// Emojis for various states
export const EMOJIS = {
  MONEY: ['💰', '💸', '💵', '💴', '💶', '💷', '🤑'],
  CRYPTO: ['₿', '⚡', '🚀', '💎', '🔥', '⭐'],
  SUCCESS: ['✅', '🎉', '🎊', '✨', '🌟', '💫'],
  SECURITY: ['🔒', '🛡️', '🔐', '🗝️', '🔑', '🔓'],
  TRANSACTION: ['📊', '📈', '📉', '💹', '🔄', '⚡'],
  CELEBRATION: ['🎉', '🎊', '✨', '🌟', '💫', '🎆'],
}; 