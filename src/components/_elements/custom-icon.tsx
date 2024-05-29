// import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import MI from 'react-native-vector-icons/MaterialIcons';

import { useGlobalStore } from '@/services';
// import icoMoonConfig from '../../config/selection-icons.json';

interface Props {
  name: string;
  size?: number;
  type?: 'MCI' | 'MI';
}

export const CustomIcon: React.FC<Props> = ({ name, type, size = 24 }) => {
  const theme = useGlobalStore((state) => state.theme);

  switch (type) {
    case 'MI':
      return <MI name={name} size={size} color={theme.primary} />;
    default:
      return <MCI name={name} size={size} color={theme.primary} />;
  }
};
