/**
 * 两套主题的语义色 token。需求见 PRD 6.5。
 * 组件只通过 useTheme() 取色，不写死色值。
 */

export type ThemeName = 'plain' | 'rose';

export type Palette = {
  name: ThemeName;
  label: string;
  primary: string;
  onPrimary: string;
  secondary: string;
  onSecondary: string;
  accent: string;
  onAccent: string;
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  destructive: string;
  onDestructive: string;
  ring: string;
  /** 衣物图片底色，两套主题都用中性灰，避免影响判断衣服颜色 */
  imageSurface: string;
  /** 图片上的浅色遮罩/骨架 */
  skeleton: string;
  /** 成功、提示等辅助色 */
  success: string;
  warning: string;
  overlay: string;
};

const plain: Palette = {
  name: 'plain',
  label: '素雅',
  primary: '#18181B',
  onPrimary: '#FFFFFF',
  secondary: '#3F3F46',
  onSecondary: '#FFFFFF',
  accent: '#A16207',
  onAccent: '#FFFFFF',
  background: '#FAFAF7',
  foreground: '#09090B',
  card: '#FFFFFF',
  cardForeground: '#09090B',
  muted: '#F0EFEA',
  mutedForeground: '#52525B',
  border: '#E4E4E7',
  destructive: '#DC2626',
  onDestructive: '#FFFFFF',
  ring: '#18181B',
  imageSurface: '#F4F4F5',
  skeleton: '#E7E5E4',
  success: '#15803D',
  warning: '#B45309',
  overlay: 'rgba(9, 9, 11, 0.55)',
};

const rose: Palette = {
  name: 'rose',
  label: '玫瑰',
  primary: '#BE185D',
  onPrimary: '#FFFFFF',
  secondary: '#EC4899',
  onSecondary: '#000000',
  accent: '#D97706',
  onAccent: '#000000',
  background: '#FDF2F8',
  foreground: '#0F172A',
  card: '#FFFFFF',
  cardForeground: '#0F172A',
  muted: '#FBF1F5',
  mutedForeground: '#475569',
  border: '#F7E3EB',
  destructive: '#DC2626',
  onDestructive: '#FFFFFF',
  ring: '#BE185D',
  imageSurface: '#F4F4F5',
  skeleton: '#F3E1E8',
  success: '#15803D',
  warning: '#B45309',
  overlay: 'rgba(15, 23, 42, 0.55)',
};

export const palettes: Record<ThemeName, Palette> = { plain, rose };

/** 间距、圆角、字号。两套主题共用。 */
export const tokens = {
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, '2xl': 24, '3xl': 32, '4xl': 48 },
  radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 },
  fontSize: { xs: 12, sm: 13, md: 15, lg: 17, xl: 20, '2xl': 24, '3xl': 30 },
  lineHeight: { xs: 16, sm: 18, md: 22, lg: 24, xl: 28, '2xl': 32, '3xl': 38 },
  control: { sm: 36, md: 44, lg: 48 },
  tap: 44,
  fontHeading: 'Outfit_700Bold',
  fontNumbers: 'Outfit_600SemiBold',
} as const;

export const themeNames: ThemeName[] = ['plain', 'rose'];
