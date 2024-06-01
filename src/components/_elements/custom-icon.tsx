import FA from 'react-native-vector-icons/FontAwesome';
import FA6 from 'react-native-vector-icons/FontAwesome6';
import IO from 'react-native-vector-icons/Ionicons';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import MI from 'react-native-vector-icons/MaterialIcons';

import { useGlobalStore } from '@/services';
import type { IconType } from '@/types';

// Search from here
//  https://oblador.github.io/react-native-vector-icons

interface Props {
  name: string;
  size?: number;
  type?: IconType;
}

export const CustomIcon: React.FC<Props> = ({ name, type, size = 24 }) => {
  const theme = useGlobalStore((state) => state.theme);

  switch (type) {
    case 'MI':
      return <MI name={name} size={size} color={theme.primary} />;

    case 'FA':
      return <FA name={name} size={size} color={theme.primary} />;

    case 'FA6':
      return <FA6 name={name} size={size} color={theme.primary} />;

    case 'IO':
      return <IO name={name} size={size} color={theme.primary} />;

    case 'MCI':
      return <MCI name={name} size={size} color={theme.primary} />;

    default:
      return null;
  }
};
