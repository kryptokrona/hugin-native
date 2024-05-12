import { View, TouchableOpacity } from 'react-native';

import { type BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { CustomIcon } from '../_elements';

const tabIcons = {
  Main: 'profile',
  Profile: 'user',
  Settings: 'cog',
};

export const MyTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  return (
    <View style={{ flexDirection: 'row' }}>
      {state.routes.map((route, index) => {
        console.log({ descriptors, index, route });
        console.log({ route });
        const iconName = tabIcons[route.name as keyof typeof tabIcons];
        const { options } = descriptors[route.key];
        // const label = ' defsault';
        //   options.tabBarLabel !== undefined
        //     ? options.tabBarLabel
        //     : options.title !== undefined
        //     ? options.title
        //     : route.name;

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
            style={{ flex: 1 }}>
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

// ...
