import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { Styles } from '@/styles';
import { TextField } from './text-field';
import { useMemo } from 'react';
import { useThemeStore } from '@/services';

interface Props {
  items: string[];
  onReact: (val: string) => void;
}

interface Item {
  emoji: string;
  count: number;
}
export const Reactions: React.FC<Props> = ({ items, onReact }) => {
  const theme = useThemeStore((state) => state.theme);
  const sortedItems: Item[] = useMemo(() => {
    const emojiCountMap: { [key: string]: number } = items.reduce(
      (acc: { [key: string]: number }, emoji: string) => {
        acc[emoji] = (acc[emoji] || 0) + 1;
        return acc;
      },
      {},
    );

    return Object.entries(emojiCountMap).map(([emoji, count]) => ({
      count,
      emoji,
    }));
  }, [items]);

  function ItemMapper({ item }: { item: Item }) {
    function onPress() {
      if (item.emoji != '💬') onReact(item.emoji);
    }

    // const byMe = Math.floor(Math.random() * 2) === 1;
    // const borderColor = byMe ? theme.primary : theme.input;
    const borderColor = theme.mutedForeground;
    return (
      <TouchableOpacity
        style={[
          styles.item,
          { backgroundColor: theme.background, borderColor },
        ]}
        onPress={onPress}>
        <Text style={styles.emojiText}>{item.emoji}</Text>
        <TextField size="small">{item.count.toString()}</TextField>
      </TouchableOpacity>
    );
  }

  return (
    <FlatList
      numColumns={8}
      data={sortedItems}
      renderItem={ItemMapper}
      keyExtractor={(item) => item.emoji}
    />
  );
};

const styles = StyleSheet.create({
  emojiText: {
    color: '#000000',
    fontFamily: 'AppleColorEmoji',
    fontSize: 12,
    marginRight: 2,
  },

  item: {
    alignItems: 'center',
    borderRadius: Styles.borderRadius.small,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 4,
    marginRight: 4,
    paddingHorizontal: 6,
  },
});
