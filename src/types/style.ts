export interface Theme {
  mode: 'light' | 'dark';
  backgroundAccent: string;
  background: string;
  border: string;
  primary: string; // Text
  secondary: string; // Text
  error: string;
}

export type IconType = 'MCI' | 'MI' | 'FA' | 'FA6' | 'IO';
