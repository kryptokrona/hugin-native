export type ImageType = 'logoWhiteText';

export type TextColor =
  | 'base'
  | 'dark'
  | 'disabled'
  | 'grey'
  | 'greyLight'
  | 'greyDark'
  | 'highlight'
  | 'light'
  | 'link'
  | 'primary'
  | 'warning';

export type ElementType = 'primary' | 'secondary' | 'error';

export interface Emoji {
  emoji: string;
  name: string;
  slug: string;
  unicode_version: string;
  emoji_version: string;
  skin_tone_support: boolean;
}

export interface EmojiCategory {
  category: string;
  emojis: Emoji[];
}
