import { useMemo } from 'react';

import { Image, StyleSheet, View } from 'react-native';

import { Styles } from '@/styles';
import { getAvatar } from '@/utils';

interface Props {
  base64?: string;
  address?: string;
  size?: number;
}

export const Avatar: React.FC<Props> = ({ base64, address, size = 70 }) => {
  const uri = `data:image/png;base64,${base64}`;
  const style = {
    height: size,
    width: size,
  };

  const imageUri = useMemo(() => {
    if (base64) {
      return uri;
    } else {
      return getAvatar(address!);
    }
  }, [uri]);

  return (
    <View style={[styles.container, style]}>
      <Image source={{ uri: imageUri }} style={[style]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderRadius: Styles.borderRadius.small,
    overflow: 'hidden',
  },
});
