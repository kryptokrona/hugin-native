import React, { useEffect, useMemo } from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useThemeStore, useUserStore } from '@/services';
import { getAvatar } from '@/utils';

import { Avatar, CustomIcon, TextField } from '../_elements';
import { MainScreens } from '@/config';

interface Props {
  title?: string;
  backButton?: boolean;
  right?: React.ReactNode;
  onBackPress?: () => void;
}

export const Header: React.FC<Props> = ({
  title,
  backButton,
  right,
  onBackPress,
}) => {
  const navigation = useNavigation();
  const theme = useThemeStore((state) => state.theme);
  const avatar = useUserStore((state) => state.user?.avatar);
  const address = useUserStore((state) => state.user?.address);

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
  
  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <View style={styles.side}>
        {backButton && (
          <TouchableOpacity hitSlop={{ bottom: 16, left: 16, right: 16, top: 16 }} onPress={onPress}>
            <CustomIcon name={'arrow-back-ios'} type={'MI'} />
          </TouchableOpacity>
        )}
        {!backButton && (
          <>
            {address && avatar?.length === 0 && (
              <Avatar onPress={() => gotoProfile()} address={address} size={30} />
            )}

            {avatar?.length > 15 && (
              <Avatar onPress={() => gotoProfile()} key={avatar} base64={avatar} size={30} />
            )}
            {/* <HuginSvg style={styles.logo} /> */}
          </>
        )}
      </View>
      <View style={styles.center}>
        {title && <TextField maxLength={24}>{title}</TextField>}
      </View>
      <View style={styles.side}>{right}</View>
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
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
    paddingBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
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
