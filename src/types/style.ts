export type Theme = {
  accent: string;
  accentForeground: string;
  background: string;
  border: string;
  card: string;
  cardForeground: string;
  destructive: string;
  destructiveForeground: string;
  foreground: string;
  input: string;
  mode: ThemeMode;
  muted: string;
  mutedForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  radius?: string;
  ring?: string;
  secondary: string;
  secondaryForeground: string;
  name: string;
};

export type ThemeBase = {
  light: Theme;
  dark: Theme;
  color: Theme;
};

export type ThemeName = 
'aesir' | 
'navy' | 
'mist' | 
'neutral' | 
'frost' | 
'steel' | 
'stonks' | 
'blush' | 
'amethyst' | 
'forest' | 
'crimson' | 
'military' | 
'evergreen' | 
'blonde' | 
'watermelon';

export type ThemeMode = 'dark' | 'light' | 'color';

export interface ThemeColor {
  colorCode: string;
  name: string;
}

export type IconType =
  | 'MCI'
  | 'MI'
  | 'FA'
  | 'FA6'
  | 'FA5'
  | 'IO'
  | 'FI'
  | 'SLI';

export interface CustomIconProps {
  name: string;
  size?: number;
  type?: IconType;
  color?: string;
}
