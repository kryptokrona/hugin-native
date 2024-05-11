import { createIconSetFromIcoMoon } from 'react-native-vector-icons';

import icoMoonConfig from '../../config/selection-icons.json';

interface Props {
  icon: string;
  size?: number;
}

export const CustomIcon: React.FC<Props> = ({ icon, size = 24 }) => {
  const Icon = createIconSetFromIcoMoon(
    icoMoonConfig,
    'IcoMoon',
    'icomoon.ttf',
  );

  return <Icon name={icon} size={size} />;
};
