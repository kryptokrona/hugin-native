import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useGlobalStore } from '@/services';
import { Styles } from '@/styles';
import type { SelectedFile } from '@/types';
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
  // path,
  uri,
}) => {
  const theme = useGlobalStore((state) => state.theme);
  const backgroundColor = theme.accent;
  const color = theme.accentForeground;
  const sizeStr = formatFileSize(size);
  const isImage = type?.startsWith('image');

  function onPress() {
    removeFile();
  }

  return (
    <View>
      <TouchableOpacity onPress={onPress} style={styles.btn}>
        <CustomIcon name="close-circle" type="IO" />
      </TouchableOpacity>
      <View style={[styles.container, { backgroundColor }]}>
        {!isImage && <CustomIcon name="file-outline" type="MCI" size={40} />}
        {isImage && (
          <View style={styles.imageContainer}>
            <Image source={{ uri }} style={styles.image} />
          </View>
        )}
        <View style={styles.info}>
          <TextField style={{ color }} maxLength={40} size="xsmall">
            {fileName}
          </TextField>
          <View style={styles.spec}>
            <TextField type="muted" style={{ marginRight: 10 }} size="xsmall">
              {sizeStr}
            </TextField>
            {type && (
              <TextField type="muted" maxLength={20} size="xsmall">
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
  image: {
    height: 40,
    width: 40,
  },
  imageContainer: {
    borderRadius: Styles.borderRadius.small,
    height: 40,
    overflow: 'hidden',
    width: 40,
  },
  info: {
    marginLeft: 6,
  },
  spec: {
    flexDirection: 'row',
  },
});
