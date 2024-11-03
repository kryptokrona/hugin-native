import { Avatar, CustomIcon, TextField } from '../_elements';
import React, { useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useThemeStore, useUserStore } from '@/services';

import HuginSvg from '../../assets/hugin.svg';
import { useNavigation } from '@react-navigation/native';

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

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <View style={styles.side}>
        {backButton && (
          <TouchableOpacity onPress={onPress}>
            <CustomIcon name={'arrow-back-ios'} type={'MI'} />
          </TouchableOpacity>
        )}
        {!backButton && (
          <>
            {/* {address && <Avatar base64={avatar} address={address} size={30} />} */}
            <HuginSvg style={styles.logo} />
          </>
        )}
      </View>
      <View style={styles.center}>
        {title && <TextField>{title}</TextField>}
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
