import React, { useState } from 'react';

import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import DocumentPicker, { types } from 'react-native-document-picker';
import { CameraOptions, launchCamera } from 'react-native-image-picker';

import { useGlobalStore } from '@/services';
import { commonInputProps, Styles } from '@/styles';

import { CustomIcon } from './_elements';

interface Props {
  onSend: (text: string) => void;
}

export const MessageInput: React.FC<Props> = ({ onSend }) => {
  const { t } = useTranslation();
  const theme = useGlobalStore((state) => state.theme);
  const [text, setText] = useState('');
  const [focus, setFocus] = useState(false);
  const [displayActions, setDisplayActions] = useState(true);

  const color = focus ? theme.primary : theme.secondary;

  function handleSend() {
    if (text.trim()) {
      onSend(text);
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
      const res = await DocumentPicker.pick({
        type: [types.allFiles],
      });
      console.log(res); // TODO send file
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

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.background,
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
        {displayActions && Actions(onCameraPress, onFilePress, color, styles)}

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
