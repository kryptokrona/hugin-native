import FI from 'react-native-vector-icons/Feather';
import FA from 'react-native-vector-icons/FontAwesome';
import FA5 from 'react-native-vector-icons/FontAwesome5';
import FA6 from 'react-native-vector-icons/FontAwesome6';
import IO from 'react-native-vector-icons/Ionicons';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import MI from 'react-native-vector-icons/MaterialIcons';
import SLI from 'react-native-vector-icons/SimpleLineIcons';

import { useGlobalStore } from '@/services';
import type { CustomIconProps } from '@/types';

// Search from here
//  https://oblador.github.io/react-native-vector-icons

export const CustomIcon: React.FC<CustomIconProps> = ({
  name,
  type,
  size = 24,
}) => {
  const theme = useGlobalStore((state) => state.theme);

  switch (type) {
    case 'MI':
      return <MI name={name} size={size} color={theme.primary} />;

    case 'FA':
      return <FA name={name} size={size} color={theme.primary} />;

    case 'FA5':
      return <FA5 name={name} size={size} color={theme.primary} />;

    case 'FA6':
      return <FA6 name={name} size={size} color={theme.primary} />;

    case 'IO':
      return <IO name={name} size={size} color={theme.primary} />;

    case 'MCI':
      return <MCI name={name} size={size} color={theme.primary} />;

    case 'FI':
      return <FI name={name} size={size} color={theme.primary} />;

    case 'SLI':
      return <SLI name={name} size={size} color={theme.primary} />;

    default:
      return null;
  }
};
