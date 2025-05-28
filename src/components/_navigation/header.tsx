import React, { useEffect, useMemo, useState } from 'react';

import { Animated, Easing, StyleSheet, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useGlobalStore, useThemeStore, useUserStore } from '@/services';
import { getAvatar } from '@/utils';

import { Avatar, CustomIcon, TextField, TouchableOpacity } from '../_elements';
import { MainScreens } from '@/config';
import { opacity } from 'react-native-reanimated/lib/typescript/Colors';
import { Styles } from '@/styles';

interface Props {
  title?: string;
  backButton?: boolean;
  right?: React.ReactNode;
  noLeft?: boolean;
  onBackPress?: () => void;
}

export const Header: React.FC<Props> = ({
  title,
  backButton,
  right,
  onBackPress,
  noLeft = false
}) => {
  const navigation = useNavigation();
  const theme = useThemeStore((state) => state.theme);
  const avatar = useUserStore((state) => state.user?.avatar);
  const address = useUserStore((state) => state.user?.address);
  const online = useGlobalStore((state) => state.huginNode.connected);
  const [blinkAnim] = useState(new Animated.Value(1));

useEffect(() => {
  let animation: Animated.CompositeAnimation | null = null;

  if (!online) {
    animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.2,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
  } else {
    blinkAnim.setValue(1); // Reset to visible when online
  }

  return () => {
    animation?.stop();
  };
}, [online]);

  // const [online, setOnline] = useState(false);

  // useEffect(() => {
  //   setOnline(huginNode.connected);
  //   console.log('Updating onlnie', huginNode)
  // }, [huginNode])

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (_e) => {});
    return unsubscribe;
  }, [navigation]);

  const backgroundColor = theme.background;
  const borderColor = theme.muted;

  function onPress() {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  }

  function gotoProfile() {
      navigation.navigate('SettingsStack', {
        screen: MainScreens.SettingsScreen,
      });
      navigation.navigate('SettingsStack', {
        screen: MainScreens.UpdateProfileScreen,
      });
  }

  console.log('card color: ', theme.card)
  
  return (
    <View style={{backgroundColor}}>
    <View style={[styles.container, { backgroundColor: theme.card, borderColor }]}>
      <View style={styles.side}>
        {backButton && !noLeft && (
          <TouchableOpacity hitSlop={{ bottom: 16, left: 16, right: 16, top: 16 }} onPress={onPress}>
            <CustomIcon name={'arrow-back-ios'} type={'MI'} />
          </TouchableOpacity>
        )}
        {!backButton && !noLeft && address && (
          <>
            {address && avatar?.length === 0 && (
              <Avatar onPress={() => gotoProfile()} address={address} size={30} />
            )}

            {avatar?.length > 15 && (
              <Avatar onPress={() => gotoProfile()} key={avatar} base64={avatar} size={30} />
            )}
            {/* <HuginSvg style={styles.logo} /> */}
            <View style={{ position: 'absolute', right: 5, top: -3 }}>
              <Animated.View style={{ opacity: blinkAnim }}>
                <CustomIcon
                  name={'lens'}
                  size={10}
                  type={'MI'}
                  color={'green'}
                />
              </Animated.View>
            </View>

          </>
        )}
      </View>
      <View style={styles.center}>
        {title && <TextField maxLength={24}>{title}</TextField>}
      </View>
      <View style={styles.side}>{right}</View>
    </View>
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    borderBottomWidth: 0,
    flexDirection: 'row',
    height: 50,
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    width: '90%',
    marginLeft: '5%',
    borderRadius: Styles.borderRadius.round,
  },
  logo: {
    height: 30,
    width: 30,
  },
  side: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
});
