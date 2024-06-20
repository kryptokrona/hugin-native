import { useMemo } from 'react';

import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';

import { useGlobalStore } from '@/services';
import { Styles } from '@/styles';

import { TextField } from './text-field';

interface Props {
  items: string[];
}

interface Item {
  emoji: string;
  count: number;
}
export const Reactions: React.FC<Props> = ({ items }) => {
  const theme = useGlobalStore((state) => state.theme);
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
      console.log('onPress', item);
    }

    const byMe = Math.floor(Math.random() * 2) === 1;
    const borderColor = byMe ? theme.primary : theme.input;

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
