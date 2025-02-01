export type ImageType = 'logoWhiteText';

export type ElementType =
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'muted'
  | 'accent';

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
