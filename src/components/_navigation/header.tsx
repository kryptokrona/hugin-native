import React, { useEffect } from 'react';

import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { useGlobalStore } from '@/services';

import HuginSvg from '../../assets/hugin.svg';
import { CustomIcon, TextField } from '../_elements';

interface Props {
  title?: string;
}

export const Header: React.FC<Props> = ({ title }) => {
  const navigation = useNavigation();
  const theme = useGlobalStore((state) => state.theme);

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (_e) => {});
    return unsubscribe;
  }, [navigation]);

  const backgroundColor = theme?.background;
  const borderColor = theme?.border;

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <View style={styles.left}>
        <TouchableOpacity>
          <CustomIcon name={'arrow-back-ios'} type={'MI'} />
        </TouchableOpacity>
      </View>
      <View style={styles.center}>
        {title && <TextField>{title}</TextField>}
      </View>
      <View style={styles.right}>
        <HuginSvg style={styles.logo} />
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
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 44 : 56,
    justifyContent: 'space-between',
    paddingBottom: Platform.OS === 'ios' ? 0 : 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  left: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  logo: {
    height: 30,
    width: 30,
  },
  right: {
    width: 50,
  },
});
