// Bill'em Invoice — Design Tokens
export const Colors = {
  primary: '#3B82F6',       // Sky blue
  primaryLight: '#EFF6FF',
  primaryDark: '#1D4ED8',
  accent: '#F472B6',        // Soft pink
  accentLight: '#FDF2F8',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  error: '#EF4444',
  errorLight: '#FEF2F2',

  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  surfaceTertiary: '#F1F5F9',

  text: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  textInverse: '#FFFFFF',

  border: '#E2E8F0',
  borderFocus: '#3B82F6',
  divider: '#F1F5F9',

  gradientBlue: ['#3B82F6', '#6366F1'],
  gradientPink: ['#F472B6', '#FB7185'],
  gradientHero: ['#3B82F6', '#818CF8', '#F472B6'],
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
};

export const Shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const Typography = {
  hero: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36 },
  title: { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },
  heading: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
  subheading: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 24 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
  label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 22 },
  button: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  buttonSm: { fontSize: 13, fontWeight: '600' as const, lineHeight: 20 },
};
