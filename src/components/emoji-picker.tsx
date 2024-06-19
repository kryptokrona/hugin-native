import { useMemo, useState } from 'react';

import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';

import emojiDataByGroup from 'unicode-emoji-json/data-by-group.json'; // Importing the grouped emoji data

import { useGlobalStore } from '@/services';
import { Styles } from '@/styles';
import { Emoji, EmojiCategory } from '@/types';

import { CustomIcon } from './_elements/custom-icon';

interface Props {
  hideActions: () => void;
  emojiPressed: (emoji: string) => void;
}

const commonEmojis = ['👍', '❤️', '😂', '😭', '🙏', '🔥', '💩'];

export const EmojiPicker: React.FC<Props> = ({ hideActions, emojiPressed }) => {
  const theme = useGlobalStore((state) => state.theme);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<string>('Smileys & Emotion');
  const backgroundColor = theme.background;
  const { width } = Dimensions.get('window');
  const columns = Math.floor(width / 36);

  const filteredEmojis = useMemo(() => {
    return emojiDataByGroup.map((group: { name: string; emojis: Emoji[] }) => ({
      category: group.name,
      emojis: group.emojis,
    }));
  }, []);

  const currentCategoryEmojis = useMemo(() => {
    return (
      filteredEmojis.find((item) => item.category === category)?.emojis || []
    );
  }, [category, filteredEmojis]);

  function onEmojiPress() {
    setOpen(true);
  }

  function InitialEmojiMapper({ item }: { item: string }) {
    return (
      <TouchableOpacity
        onPress={onEmojiPress}
        style={[styles.initialEmojiItem, { backgroundColor }]}>
        <Text style={[styles.emojiText, { fontSize: 20 }]}>{item}</Text>
      </TouchableOpacity>
    );
  }

  function CategoryMapper({ item }: { item: EmojiCategory }) {
    let icon: any | null = null;
    switch (item.category) {
      case 'Smileys & Emotion':
        icon = emojiCategories.smileys;
        break;
      case 'Objects':
        icon = emojiCategories.objects;
        break;
      case 'People & Body':
        icon = emojiCategories.people;
        break;
      case 'Animals & Nature':
        icon = emojiCategories.animals;
        break;
      case 'Food & Drink':
        icon = emojiCategories.food;
        break;
      case 'Travel & Places':
        icon = emojiCategories.travel;
        break;
      case 'Flags':
        icon = emojiCategories.flags;
        break;
      case 'Activities':
        icon = emojiCategories.activities;
        break;
      case 'Symbols':
        break;
      default:
        break;
    }

    function onCategoryPress() {
      setCategory(item.category);
    }

    const selected = item.category === category;
    const name = selected ? icon?.selectedIconName : icon?.iconName;
    return (
      icon && (
        <TouchableOpacity
          onPress={onCategoryPress}
          style={[styles.categoryItem]}>
          <CustomIcon name={name} type={icon.iconType} />
        </TouchableOpacity>
      )
    );
  }

  function EmojiMapper({ item }: { item: Emoji }) {
    function onEmojiPress() {
      emojiPressed(item.emoji);
    }
    return (
      <TouchableOpacity onPress={onEmojiPress} style={[styles.emojiItem]}>
        <Text style={styles.emojiText}>{item.emoji}</Text>
      </TouchableOpacity>
    );
  }

  function onDisplayEmojiPress() {
    setOpen(true);
    hideActions();
  }

  return (
    <View>
      {!open && (
        <View style={styles.initial}>
          <FlatList
            horizontal
            data={commonEmojis}
            keyExtractor={(item) => item}
            renderItem={InitialEmojiMapper}
            contentContainerStyle={{ marginRight: 0, paddingRight: 0 }}
          />
          <TouchableOpacity
            style={[styles.initialEmojiItem, { backgroundColor }]}
            onPress={onDisplayEmojiPress}>
            <CustomIcon type="MI" name="emoji-emotions" size={30} />
          </TouchableOpacity>
        </View>
      )}

      {open && (
        <ScrollView style={styles.scrollView}>
          <View style={styles.emojiListContainer}>
            <FlatList
              scrollEnabled={false}
              data={currentCategoryEmojis}
              keyExtractor={(item) => item.slug}
              numColumns={columns}
              renderItem={EmojiMapper}
              contentContainerStyle={{
                alignItems: 'center',
                flexGrow: 1,
              }}
            />
          </View>
        </ScrollView>
      )}

      {open && (
        <View style={styles.categoryContainer}>
          <FlatList
            horizontal
            data={filteredEmojis}
            keyExtractor={(item) => item.category}
            renderItem={CategoryMapper}
            contentContainerStyle={[styles.emojisContainer]}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  categoryContainer: {
    paddingTop: 6,
  },
  categoryItem: {
    alignItems: 'center',
    borderRadius: Styles.borderRadius.round,
    justifyContent: 'center',
    marginHorizontal: 2,
    padding: 4,
  },
  emojiItem: {
    borderRadius: Styles.borderRadius.round,
    height: 34,
    margin: 1,
    width: 34,
  },
  emojiListContainer: {
    flex: 1,
  },
  emojiText: {
    color: '#000000',
    fontFamily: 'AppleColorEmoji',
    fontSize: 26,
  },
  emojisContainer: {
    alignContent: 'center',
    alignSelf: 'center',
    flexGrow: 1,
    justifyContent: 'space-evenly',
    padding: 2,
  },
  initial: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  initialEmojiItem: {
    alignItems: 'center',
    borderRadius: Styles.borderRadius.round,
    height: 40,
    justifyContent: 'center',
    marginHorizontal: 4,
    width: 40,
  },
  scrollView: {
    height: 200,
  },
});

const emojiCategories = {
  activities: {
    iconName: 'baseball-outline',
    iconType: 'IO',
    selectedIconName: 'baseball',
  },
  animals: {
    iconName: 'paw-outline',
    iconType: 'IO',
    selectedIconName: 'paw',
  },
  flags: {
    iconName: 'flag-outline',
    iconType: 'IO',
    selectedIconName: 'flag',
  },
  food: {
    iconName: 'fast-food-outline',
    iconType: 'IO',
    selectedIconName: 'fast-food',
  },
  objects: {
    iconName: 'musical-notes-outline',
    iconType: 'IO',
    selectedIconName: 'musical-notes',
  },
  people: {
    iconName: 'person-outline',
    iconType: 'IO',
    selectedIconName: 'person',
  },
  smileys: {
    iconName: 'happy-outline',
    iconType: 'IO',
    selectedIconName: 'happy',
  },
  // symbols: {
  //   iconName: 'flag',
  //   iconType: 'IO',
  // },
  travel: {
    iconName: 'airplane-outline',
    iconType: 'IO',
    selectedIconName: 'airplane',
  },
};
