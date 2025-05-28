import { Avatar, TextButton, TextField, Unreads } from './_elements';
import { StyleSheet, View } from 'react-native';

import { getAvatar } from '@/utils';
import { useThemeStore } from '@/services';
import { t } from 'i18next';

interface Props {
  text: string;
}

export const EmptyPlaceholder: React.FC<Props> = ({
  text
}) => {

  const theme = useThemeStore((state) => state.theme);
  const borderColor = theme.border;
  const color = theme.background;

  return (
    <View style={styles.container}>
      <TextField centered>{text}</TextField>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: '10%',
    alignItems: 'center',
    justifyContent: 'center'
  }
});
