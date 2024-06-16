import type {
  CommonThemeProperties,
  Theme,
  ThemeMode,
  ThemeColor,
} from '@/types';

const colors = {
  dark: '#18181B',
  error: '#E53935',
  grey_100: '#F4F4F5',
  grey_200: '#E5E5E5',
  grey_300: '#828283',
  grey_400: '#39393B',
  light: '#FFFFFF',
};

export const colorfulColors: ThemeColor[] = [
  { colorCode: '#2463EB', name: 'Blue' },
  { colorCode: '#F97315', name: 'Orange' },
  { colorCode: '#E11D48', name: 'Red' },
  { colorCode: '#7C3AED', name: 'Violet' },
  { colorCode: '#FACB16', name: 'Yellow' },
];

const commonProperties: CommonThemeProperties = {
  boxShadow: {
    elevation: 3,
    shadowColor: colors.light,
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4, // default color
  },
  error: colors.error,
};

// Define the base themes
export const baseThemes: { dark: Theme; light: Theme } = {
  dark: {
    ...commonProperties,
    background: colors.dark,
    backgroundSecondary: colors.light,
    backgroundTertiary: colors.grey_400,
    border: colors.light,
    borderAccent: colors.grey_400,
    borderSecondary: colors.grey_400,
    boxShadow: {
      ...commonProperties.boxShadow,
      shadowColor: colors.light,
    },
    inverted: colors.dark,
    mode: 'dark',
    primary: colors.light,
    secondary: colors.grey_300,
  },
  light: {
    ...commonProperties,
    background: colors.light,
    backgroundSecondary: colors.dark,
    backgroundTertiary: colors.grey_200,
    border: colors.dark,
    borderAccent: colors.grey_100,
    borderSecondary: colors.grey_200,
    boxShadow: {
      ...commonProperties.boxShadow,
      shadowColor: colors.dark,
      shadowOpacity: 0.1,
    },
    inverted: colors.light,
    mode: 'light',
    primary: colors.dark,
    secondary: colors.grey_300,
  },
};

export const createTheme = (mode: ThemeMode, accent?: string): Theme => {
  const base = baseThemes[mode];
  return {
    ...base,
    ...(accent && { backgroundSecondary: accent, orderAccent: accent }),
  };
};

export const defaultTheme = createTheme('dark');
