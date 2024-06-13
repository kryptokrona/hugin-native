import { Theme } from '@/types';

const colors = {
  dark: '#18181B',
  error: '#F2CB5F',
  grey_100: '#F4F4F5',
  grey_200: '#E5E5E5',
  grey_300: '#828283',
  grey_400: '#39393B',
  light: '#FFFFFF',
};

export const Themes: {
  dark: Theme;
  light: Theme;
} = {
  dark: {
    background: colors.dark,
    backgroundSecondary: colors.light,
    backgroundTertiary: colors.grey_400,
    border: colors.light,
    borderAccent: colors.grey_400,
    borderSecondary: colors.grey_400,
    boxShadow: {
      elevation: 3,
      shadowColor: colors.light,
      shadowOffset: {
        height: 2,
        width: 0,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    error: colors.error,
    inverted: colors.dark,
    mode: 'dark',
    primary: colors.light,
    secondary: colors.grey_300,
  },
  light: {
    background: colors.light,
    backgroundSecondary: colors.dark,
    backgroundTertiary: colors.grey_200,
    border: colors.dark,
    borderAccent: colors.grey_100,
    borderSecondary: colors.grey_200,
    boxShadow: {
      elevation: 3,
      shadowColor: colors.dark,
      shadowOffset: {
        height: 2,
        width: 0,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    error: colors.error,
    inverted: colors.light,
    mode: 'light',
    primary: colors.dark,
    secondary: colors.grey_300,
  },
};
