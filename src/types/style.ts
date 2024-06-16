export interface CommonThemeProperties {
  error: string;
  boxShadow: {
    elevation: number;
    shadowOffset: {
      height: number;
      width: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
    shadowColor: string;
  };
}

export interface Theme extends CommonThemeProperties {
  border: string;
  borderSecondary: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  background: string;
  mode: ThemeMode;
  primary: string; // Text
  secondary: string; // Text
  inverted: string; // Text
  borderAccent: string;
}

export type ThemeMode = 'dark' | 'light';

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

// export type ThemeMode = 'dark' | 'light';

export interface CustomIconProps {
  name: string;
  size?: number;
  type?: IconType;
  color?: string;
}
