import { useEffect, useState } from 'react';

import {
  StyleSheet,
  Animated,
  Keyboard,
  View,
  Platform,
} from 'react-native';

import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { MainScreens, TabBar } from '@/config';
import { useGlobalStore, useThemeStore, lightenHexColor } from '@/services';
import { IconType } from '@/types';

import { CustomIcon, Unreads, TouchableOpacity } from '../_elements';
import { Styles } from '@/styles';

const tabbarButtons = [
  MainScreens.GroupStack,
  MainScreens.MessageStack,
  MainScreens.FeedStack,
  MainScreens.WalletStack,
  MainScreens.SettingsStack,
];

export const MyTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const theme = useThemeStore((state) => state.theme);
  const [keyboardShow, setKeyboardShow] = useState(false);
  const rooms = useGlobalStore((state) => state.rooms);
  const contacts = useGlobalStore((state) => state.contacts);

  const totalUnreads = rooms.reduce(
    (sum, room) => sum + (room.unreads || 0),
    0,
  );

  const contactsUnreads = contacts.reduce(
    (sum, contact) => sum + (contact.unreads || 0),
    0,
  );

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
    <View style={{backgroundColor: theme.background}}>
    <View
      style={[
        styles.tabBar,
        keyboardShow && styles.hideTabNavigation,
        {
          backgroundColor: theme.card,
          borderColor: theme.muted,
        },
      ]}>
      {state.routes.map((route, index) => {
        const icon = TabBar[route.name as keyof typeof TabBar];
        const { options } = descriptors[route.key];

        if (!tabbarButtons.includes(route.name as MainScreens)) {
          return null;
        }

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
            key={`TabBar-${route.name}`}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={[styles.tab]}>
            {route.name === MainScreens.GroupStack && (
              <Unreads
                unreads={totalUnreads}
                style={{ bottom: 10, right: 20 }}
              />
            )}
            {route.name === MainScreens.MessageStack && (
              <Unreads
                unreads={contactsUnreads}
                style={{ bottom: 10, right: 20 }}
              />
            )}
            <View
              style={[
                isFocused && {
                  borderBottomWidth: 1,
                  borderColor: theme.primary,
                  padding: 5,
                },
              ]}>
              <CustomIcon
                name={icon?.iconName}
                type={icon.iconType as IconType}
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hideTabNavigation: {
   display: Platform.OS === 'android' ? 'none' : 'flex'
  },
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tabBar: {
    borderWidth: 0,
    flexDirection: 'row',
    height: 50,
    borderRadius: Styles.borderRadius.round,
    width: '90%',
    marginLeft: '5%'
  },
});
