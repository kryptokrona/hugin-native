import { Theme } from '@/types';

const colors = {
  alert: '#F2CB5F',
  dark: '#121212',
  darkAccent: '#1F1F1F',
  darkBorder: '##474747',
  darkText: '#C2C2C2',
  darkTextSecondary: '#8F8F8F',

  error: '#FF190C',

  light: '#F2F2F2',
  lightAccent: '#E5E5E5',
  lightBorder: '#DCDCDC',
  lightText: '#121212',

  lightTextSecondary: '#474747',
};

export const Themes: {
  dark: Theme;
  light: Theme;
} = {
  dark: {
    background: colors.dark,
    backgroundAccent: colors.darkAccent,
    border: colors.darkBorder,
    error: colors.error,
    mode: 'dark',
    primary: colors.darkText,
    secondary: colors.darkTextSecondary,
  },
  light: {
    background: colors.light,
    backgroundAccent: colors.lightAccent,
    border: colors.lightBorder,
    error: colors.error,
    mode: 'light',
    primary: colors.lightText,
    secondary: colors.lightTextSecondary,
  },
};
