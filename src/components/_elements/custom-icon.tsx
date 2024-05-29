// import { createIconSetFromIcoMoon } from 'react-native-vector-icons';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';

import { useGlobalStore } from '@/services';
// import icoMoonConfig from '../../config/selection-icons.json';

interface Props {
  name: string;
  size?: number;
}

export const CustomIcon: React.FC<Props> = ({ name, size = 24 }) => {
  const theme = useGlobalStore((state) => state.theme);
  return <MCI name={name} size={size} color={theme.primary} />;
};
