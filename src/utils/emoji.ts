// import emojiData from 'emoji-datasource';

import emojiDataByGroup from 'unicode-emoji-json/data-by-group.json';

// export const getFilteredEmojis = () => {
//   const uniqueEmojis: any[] = [];
//   const seen = new Set();

//   emojiData.forEach((emoji) => {
//     if (emoji.category === 'Smileys & Emotion' && !seen.has(emoji.short_name)) {
//       uniqueEmojis.push(emoji);
//       seen.add(emoji.short_name);
//     }
//   });

//   return uniqueEmojis;
// };

// export const getFilteredEmojisCategories = (): EmojiCategory[] => {
//   const categorizedEmojis: { [key: string]: EmojiCategory } = {};

//   emojiData.forEach((emoji: Emoji) => {
//     if (!categorizedEmojis[emoji.category]) {
//       categorizedEmojis[emoji.category] = {
//         category: emoji.category,
//         emojis: [],
//       };
//     }
//     categorizedEmojis[emoji.category].emojis.push(emoji);
//   });

//   return Object.values(categorizedEmojis);
// };

export const getEmojisByGroup = () => {
  return emojiDataByGroup;
};
