export interface Theme {
  mode: 'light' | 'dark';
  colors: {
    primary: string;
    background: string;
    cardBackground: string;
    text: string;
    textSecondary: string;
    border: string;
    notification: string;
  };
  fontSizes: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    h6: string;
    body1: string;
    body2: string;
    caption: string;
    label: string;
  };
}
