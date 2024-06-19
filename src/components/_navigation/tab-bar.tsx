import { useEffect, useState } from 'react';

import { TouchableOpacity, StyleSheet, Animated, Keyboard } from 'react-native';

import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { TabBar } from '@/config';
import { useGlobalStore } from '@/services';
import type { IconType } from '@/types';

import { CustomIcon } from '../_elements';

export const MyTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const theme = useGlobalStore((state) => state.theme);
  const [keyboardShow, setKeyboardShow] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardShow(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardShow(false);
      },
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.tabBar,
        keyboardShow && styles.hideTabNavigation,
        {
          backgroundColor: theme.background,
          borderColor: theme.muted,
        },
      ]}>
      {state.routes.map((route, index) => {
        const icon = TabBar[route.name as keyof typeof TabBar];
        const { options } = descriptors[route.key];

        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            canPreventDefault: true,
            target: route.key,
            type: 'tabPress',
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            target: route.key,
            type: 'tabLongPress',
          });
        };
        return (
          <TouchableOpacity
            key={`TabBar-${index}`}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.tab]}>
            <CustomIcon name={icon.iconName} type={icon.iconType as IconType} />
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  hideTabNavigation: {
    display: 'none',
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tabBar: {
    borderTopWidth: 1,
    flexDirection: 'row',
    height: 50,
  },
});
