import { View, TouchableOpacity, StyleSheet } from 'react-native';

import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useGlobalStore } from '@/services';
import { TabBar, type IconType } from '@/types';

import { CustomIcon } from '../_elements';

export const MyTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const theme = useGlobalStore((state) => state.theme);
  return (
    <View
      style={{
        backgroundColor: theme.backgroundAccent,
        flexDirection: 'row',
        height: 50,
      }}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  tab: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
