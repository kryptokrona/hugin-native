import React, { useEffect } from 'react';

import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useGlobalStore } from '@/services';

import HuginSvg from '../../assets/hugin.svg';
import { Avatar, CustomIcon, TextField } from '../_elements';

interface Props {
  title?: string;
  backButton?: boolean;
  right?: React.ReactNode;
}

export const Header: React.FC<Props> = ({ title, backButton, right }) => {
  const navigation = useNavigation();
  const theme = useGlobalStore((state) => state.theme);
  const avatar = useGlobalStore((state) => state.user?.avatar);
  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (_e) => {});
    return unsubscribe;
  }, [navigation]);

  const backgroundColor = theme.background;
  const borderColor = theme.borderAccent;

  function onBackPress() {
    navigation.goBack();
  }

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <View style={styles.side}>
        {backButton && (
          <TouchableOpacity onPress={onBackPress}>
            <CustomIcon name={'arrow-back-ios'} type={'MI'} />
          </TouchableOpacity>
        )}
        {!backButton && (
          <>
            {avatar && <Avatar base64={avatar} size={30} />}
            {!avatar && <HuginSvg style={styles.logo} />}
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
