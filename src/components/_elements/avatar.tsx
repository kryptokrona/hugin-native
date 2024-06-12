import { Image, StyleSheet, View } from 'react-native';

import { Styles } from '@/styles';

interface Props {
  base64: string;
  size?: number;
}

export const Avatar: React.FC<Props> = ({ base64, size = 70 }) => {
  const uri = `data:image/png;base64,${base64}`;
  const style = {
    height: size,
    width: size,
  };
  return (
    <View style={[styles.container, style]}>
      <Image source={{ uri }} style={[style]} />
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
