import React, { useState } from 'react';

import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import DocumentPicker, { types } from 'react-native-document-picker';
import { CameraOptions, launchCamera } from 'react-native-image-picker';

import { useGlobalStore } from '@/services';
import { commonInputProps, Styles } from '@/styles';
import type { SelectedFile } from '@/types';

import { CustomIcon, FileSelected } from './_elements';

interface Props {
  onSend: (text: string, file: SelectedFile | null) => void;
}

export const MessageInput: React.FC<Props> = ({ onSend }) => {
  const { t } = useTranslation();
  const theme = useGlobalStore((state) => state.theme);
  const [text, setText] = useState('');
  const [focus, setFocus] = useState(false);
  const [displayActions, setDisplayActions] = useState(true);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const color = focus ? theme.primary : theme.secondary;
  const backgroundColor = theme.background;

  function handleSend() {
    if (text.trim()) {
      onSend(text, selectedFile);
      setText('');
    }
  }

  async function onCameraPress() {
    const options: CameraOptions = {
      mediaType: 'photo',
      quality: 0.5,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        const uri = response?.assets?.[0].uri;
        console.log(uri); // TODO: handle the image URI
      }
    });
  }

  async function onFilePress() {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [types.allFiles],
      });

      const { size, name, uri, type } = res;
      if (!uri || !name || !size) {
        return;
      }

      const fileInfo: SelectedFile = {
        fileName: name,
        path: uri,
        size,
        time: new Date().getTime(),
        type,
      };

      setSelectedFile(fileInfo);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled file picker');
      } else {
        console.log('DocumentPicker Error: ', err);
      }
    }
  }

  function onChange(text: string) {
    setText(text);
  }

  function onBlur() {
    setFocus(false);
    setDisplayActions(true);
  }

  function onFocus() {
    setFocus(true);
    setDisplayActions(false);
  }

  function onDisplayActions() {
    setDisplayActions(true);
  }

  function onRemoveFile() {
    setSelectedFile(null);
  }

  return (
    <View style={styles.container}>
      {selectedFile && (
        <View style={[styles.files, { backgroundColor }]}>
          <FileSelected {...selectedFile} removeFile={onRemoveFile} />
        </View>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor,
            borderColor: theme.border,
          },
        ]}>
        {focus && !displayActions && (
          <TouchableOpacity onPress={onDisplayActions} style={styles.btn}>
            <CustomIcon
              name="arrow-forward-ios"
              type="MI"
              size={20}
              color={focus ? theme.primary : theme.secondary}
            />
          </TouchableOpacity>
        )}
        {displayActions &&
          Actions(onCameraPress, onFilePress, theme.primary, styles)}
        {/* // TODO display selected file together with input */}
        <TextInput
          style={[styles.inputField, { borderColor: color, color: color }]}
          value={text}
          onChangeText={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder="  Aa..."
          placeholderTextColor={theme.secondary}
          multiline
          autoCapitalize="sentences"
          autoCorrect
          returnKeyLabel={t('send')}
          returnKeyType="send"
          {...commonInputProps}
        />
        {focus && (
          <TouchableOpacity onPress={handleSend} style={styles.btn}>
            <CustomIcon
              name="send"
              type="IO"
              size={24}
              color={focus ? theme.primary : theme.secondary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

function Actions(
  onCameraPress: any,
  onFilePress: any,
  color: string,
  styles: any,
) {
  return (
    <>
      <TouchableOpacity onPress={onCameraPress} style={styles.btn}>
        <CustomIcon name="camera" type="IO" size={24} color={color} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onFilePress} style={styles.btn}>
        <CustomIcon
          name="document-attach-sharp"
          type="IO"
          size={24}
          color={color}
        />
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 10,
  },
  container: {
    width: '100%',
  },
  files: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
  },
  inputContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    maxHeight: 60,
    padding: 10,
  },
  inputField: {
    borderRadius: Styles.borderRadius.medium,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 6,
  },
});
