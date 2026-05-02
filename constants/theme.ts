// Medical Billing App – Design System
export const Colors = {
  // Brand
  primary: '#1A56DB',
  primaryLight: '#E8F0FE',
  primaryDark: '#1240A8',

  // Semantic
  success: '#0E9F6E',
  successLight: '#E6F9F3',
  warning: '#FF8800',
  warningLight: '#FFF3E0',
  danger: '#E02424',
  dangerLight: '#FEF2F2',
  info: '#0694A2',
  infoLight: '#E0F5F5',

  // Surfaces
  background: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F8FAFC',
  border: '#E2E8F0',
  divider: '#F0F4F8',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Nav
  navBg: '#0F172A',
  navActive: '#3B82F6',
  navInactive: '#64748B',

  // Status chips
  statusPending: '#FF8800',
  statusSubmitted: '#1A56DB',
  statusPaid: '#0E9F6E',
  statusDenied: '#E02424',
  statusPartial: '#0694A2',
  statusDraft: '#94A3B8',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  hero: 28,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
};
