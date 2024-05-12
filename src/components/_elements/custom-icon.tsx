import { createIconSetFromIcoMoon } from 'react-native-vector-icons';

import icoMoonConfig from '../../config/selection-icons.json';

interface Props {
  name: string;
  size?: number;
}

export const CustomIcon: React.FC<Props> = ({ name, size = 24 }) => {
  const Icon = createIconSetFromIcoMoon(
    icoMoonConfig,
    'IcoMoon',
    'icomoon.ttf',
  );

  return <Icon name={name} size={size} />;
};
