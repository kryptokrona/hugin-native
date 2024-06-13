export interface Theme {
  border: string;
  borderSecondary: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  background: string;
  error: string;
  mode: 'light' | 'dark';
  primary: string; // Text
  secondary: string; // Text
  inverted: string; // Text
  borderAccent: string;
  boxShadow: {
    elevation: number;
    shadowColor: string;
    shadowOffset: {
      height: number;
      width: number;
    };
    shadowOpacity: number;
    shadowRadius: number;
  };
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
