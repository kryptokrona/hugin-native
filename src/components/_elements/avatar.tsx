import { Image } from 'react-native';

import { getAvatar } from '@/utils';

interface Props {
  hash: string;
  size?: number;
}

export const Avatar: React.FC<Props> = ({ hash, size }) => {
  const uri = getAvatar(hash);
  return (
    <Image
      source={{ uri }}
      style={[
        {
          height: size,
          width: size,
        },
      ]}
    />
  );
};
