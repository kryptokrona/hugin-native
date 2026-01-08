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

export const Avatar: React.FC<Props> = ({
  base64,
  address,
  size = 70,
  onPress,
}) => {
  const [imageUri, setImageUri] = useState<string>('');

  const avatarFromStore = useGlobalStore(
    (state) => state.avatars[address]
  );

  useEffect(() => {
    if (base64) {
      setImageUri(`data:image/png;base64,${base64}`);
    } else if (avatarFromStore) {
      setImageUri(`data:image/png;base64,${avatarFromStore}`);
    } else if (address) {
      setImageUri(`data:image/png;base64,${getAvatar(address, size)}`);
    }
  }, [base64, avatarFromStore, address, size]);

  return (
    <TouchableOpacity onPress={onPress}>
      <View
        style={[
          styles.container,
          {
            width: size,
            height: size,
            borderRadius: Styles.borderRadius.small,
          },
        ]}
      >
        {!!imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="cover"
          />
        )}
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
  image: {
    width: '100%',
    height: '100%',
  },
});
