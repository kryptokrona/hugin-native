import React, { useMemo, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  View,
} from 'react-native';

import { Styles } from '@/styles';
import { TextField } from './text-field';
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
      {}
    );

    return Object.entries(emojiCountMap).map(([emoji, count]) => ({
      count,
      emoji,
    }));
  }, [items]);

  function AnimatedReactionItem({ item }: { item: Item }) {
    const scale = useRef(new Animated.Value(1)).current;
    const bgFlash = useRef(new Animated.Value(0)).current;

    const handlePress = () => {
      if (item.emoji !== '💬') onReact(item.emoji);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.17,
            duration: 170,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            friction: 2,
            delay: 20,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(bgFlash, {
            toValue: 1,
            duration: 170,
            useNativeDriver: true,
          }),
          Animated.timing(bgFlash, {
            toValue: 0.2,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    };

    const animatedBg = bgFlash.interpolate({
      inputRange: [0, 1],
      outputRange: [theme.background,'rgb(37, 102, 231)'],
    });

    const borderColor = theme.mutedForeground;

    return (
      <TouchableOpacity onPress={handlePress}>
        <Animated.View
          style={[
            styles.item,
            {
              transform: [{ scale }],
              backgroundColor: animatedBg,
              borderColor,
            },
          ]}
        >
          <Text style={styles.emojiText}>{item.emoji}</Text>
          <TextField size="small">{item.count.toString()}</TextField>
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <FlatList
      numColumns={8}
      data={sortedItems}
      renderItem={({ item }) => <AnimatedReactionItem item={item} />}
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
    paddingVertical: 2,
  },
});
