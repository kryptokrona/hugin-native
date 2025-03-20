import FI from 'react-native-vector-icons/Feather';
import FA from 'react-native-vector-icons/FontAwesome';
import FA5 from 'react-native-vector-icons/FontAwesome5';
import FA6 from 'react-native-vector-icons/FontAwesome6';
import IO from 'react-native-vector-icons/Ionicons';
import MCI from 'react-native-vector-icons/MaterialCommunityIcons';
import MI from 'react-native-vector-icons/MaterialIcons';
import SLI from 'react-native-vector-icons/SimpleLineIcons';
import ENT from 'react-native-vector-icons/Entypo';

import { useThemeStore } from '@/services';
import type { CustomIconProps } from '@/types';

// Search from here
//  https://oblador.github.io/react-native-vector-icons

export const CustomIcon: React.FC<CustomIconProps> = ({
  name,
  type,
  color,
  size = 24,
}) => {
  const theme = useThemeStore((state) => state.theme);
  const mColor = color ?? theme.foreground;
  switch (type) {
    case 'MI':
      return <MI name={name} size={size} color={mColor} />;

    case 'ENT':
      return <ENT name={name} size={size} color={mColor} />;

    case 'FA':
      return <FA name={name} size={size} color={mColor} />;

    case 'FA5':
      return <FA5 name={name} size={size} color={mColor} />;

    case 'FA6':
      return <FA6 name={name} size={size} color={mColor} />;

    case 'IO':
      return <IO name={name} size={size} color={mColor} />;

    case 'MCI':
      return <MCI name={name} size={size} color={mColor} />;

    case 'FI':
      return <FI name={name} size={size} color={mColor} />;

    case 'SLI':
      return <SLI name={name} size={size} color={mColor} />;

    default:
      return null;
  }
};
