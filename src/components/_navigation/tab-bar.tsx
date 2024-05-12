import { View, TouchableOpacity, StyleSheet } from 'react-native';

import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useGlobalStore } from '@/services';

import { CustomIcon } from '../_elements';

const tabIcons = {
  Groups: 'account-group-outline',
  Main: 'account-outline',
  Recipients: 'message-outline',
  Settings: 'cog-outline',
  Transactions: 'wallet-outline',
  Transfer: 'cash-fast',
};

export const MyTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { theme } = useGlobalStore();
  return (
    <View
      style={{
        backgroundColor: theme.backgroundAccent,
        flexDirection: 'row',
        height: 50,
      }}>
      {state.routes.map((route, index) => {
        const iconName = tabIcons[route.name as keyof typeof tabIcons];
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
            style={styles.tab}>
            <CustomIcon name={iconName} size={24} />
            {/* <Text style={{ color: isFocused ? '#673ab7' : '#222' }}>
              {label}
            </Text> */}
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
