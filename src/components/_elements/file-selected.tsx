import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useGlobalStore } from '@/services';
import { Styles } from '@/styles';
import { SelectedFile } from '@/types';
import { formatFileSize } from '@/utils';

import { CustomIcon } from './custom-icon';
import { TextField } from './text-field';

interface Props extends SelectedFile {
  removeFile: () => void;
}

export const FileSelected: React.FC<Props> = ({
  fileName,
  type,
  size,
  removeFile,
}) => {
  const theme = useGlobalStore((state) => state.theme);
  const backgroundColor = theme.backgroundTertiary;
  const sizeStr = formatFileSize(size);

  function onPress() {
    removeFile();
  }

  return (
    <View>
      <TouchableOpacity onPress={onPress} style={styles.btn}>
        <CustomIcon name="close-circle" type="IO" />
      </TouchableOpacity>
      <View style={[styles.container, { backgroundColor }]}>
        <CustomIcon name="file-outline" type="MCI" size={40} />
        <View style={styles.info}>
          <TextField size="xsmall">{fileName}</TextField>
          <View style={styles.spec}>
            <TextField style={{ marginRight: 10 }} size="xsmall">
              {sizeStr}
            </TextField>
            {type && (
              <TextField maxLength={20} size="xsmall">
                {type}
              </TextField>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  btn: {
    position: 'absolute',
    right: -10,
    top: -10,
    zIndex: 1,
  },
  container: {
    borderRadius: Styles.borderRadius.small,
    flexDirection: 'row',
    padding: 6,
    paddingBottom: 4,
  },
  info: {
    marginLeft: 6,
  },
  spec: {
    flexDirection: 'row',
  },
});
