import { Image, StyleSheet, View } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { TouchableOpacity } from '../_elements';

import { Styles } from '@/styles';
import { getAvatar } from '@/utils';
import { useGlobalStore } from '@/services/zustand';

interface Props {
  base64?: string;
  address?: string | null;
  size?: number;
  onPress?: () => void;
}

export const Avatar: React.FC<Props> = ({ base64, address, size = 70, onPress }) => {
  const style = { height: size, width: size };
  const uriFromBase64 = `data:image/png;base64,${base64}`;
  const [imageUri, setImageUri] = useState<string>('');

  const avatarFromStore = useGlobalStore((state) => state.avatars[address]);
 

  useEffect(() => {
    if (base64) setImageUri(uriFromBase64);
    if (avatarFromStore) setImageUri(`data:image/png;base64,${avatarFromStore}`);
    if (address) setImageUri(`data:image/png;base64,${getAvatar(address, size)}`);
  }, [avatarFromStore]);

  return (
    <TouchableOpacity onPress={onPress}>
    <View style={[styles.container, style]}>
      {imageUri && <Image source={{ uri: imageUri }} style={{borderRadius: Styles.borderRadius.small, height: avatarFromStore || base64 ? size*0.7 : size, width: avatarFromStore || base64 ? size*0.7 : size}} />}
    </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});
