import React, { useState, useRef, useEffect } from 'react';

import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';

import { useTranslation } from 'react-i18next';
import DocumentPicker, { types } from 'react-native-document-picker';
import { CameraOptions, launchCamera } from 'react-native-image-picker';

import { useThemeStore } from '@/services';
import { Styles, commonInputProps } from '@/styles';
import type { SelectedFile } from '@/types';

import { CustomIcon, FileSelected, ReplyIndicator } from './_elements';

interface Props {
  onSend: (text: string, file: SelectedFile | null) => void;
  replyToName: string | null;
  onCloseReplyPress: () => void;
}

export const MessageInput: React.FC<Props> = ({
  onSend,
  replyToName,
  onCloseReplyPress,
}) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const [text, setText] = useState('');
  const [focus, setFocus] = useState(false);
  const [displayActions, setDisplayActions] = useState(true);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const color = focus ? theme.accentForeground : theme.mutedForeground;
  const backgroundColor = theme.background;
  const [height, setHeight] = useState(40);
  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (replyToName?.length) {
      focusInput();
    }
  }, [replyToName]);

  const focusInput = () => {
    if (textInputRef.current) {
      setTimeout(() => textInputRef.current.focus(), 100)
    }
  };
  async function onCameraPress() {
    const options: CameraOptions = {
      mediaType: 'photo',
      quality: 0.5,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.error('ImagePicker Error: ', response.errorMessage);
      } else {
        const asset = response?.assets?.[0];
        if (asset) {
          const { fileSize, uri, fileName, type, originalPath } = asset;
          if (!uri || !fileName || !fileSize) {
            return;
          }
          const fileInfo: SelectedFile = {
            fileName: fileName,
            path: originalPath?.slice(7, originalPath.length),
            size: fileSize,
            time: new Date().getTime(),
            type: type ?? 'image',
            uri: uri,
          };
          setSelectedFile(fileInfo);
        }
      }
    });
  }

  async function onFilePress() {
    try {
      const res = await DocumentPicker.pickSingle({
        copyTo: 'documentDirectory',
        type: [types.allFiles],
      });

      const { size, name, uri, type, fileCopyUri } = res;
      if (!uri || !name || !size) {
        return;
      }

      const fileInfo: SelectedFile = {
        fileName: name,
        path: fileCopyUri?.slice(7, fileCopyUri.length),
        size,
        time: new Date().getTime(),
        type,
        uri: uri,
      };

      setSelectedFile(fileInfo);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('User cancelled file picker');
      } else {
        console.error('DocumentPicker Error: ', err);
      }
    }
  }

  function handleSend() {
    if (text.trim() || selectedFile) {
      const trimmedText = text.trim() || '';
      onSend(trimmedText, selectedFile);
      setHeight(40);
      setText('');
      setSelectedFile(null);
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

  function onCloseReply() {
    onCloseReplyPress();
  }

  return (
    <View style={styles.container}>
      {selectedFile && (
        <View style={[styles.indicator, { backgroundColor }]}>
          <FileSelected {...selectedFile} removeFile={onRemoveFile} />
        </View>
      )}
      {replyToName && (
        <View style={[styles.indicator, { backgroundColor }]}>
          <ReplyIndicator toName={replyToName} onCloseReply={onCloseReply} />
        </View>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor,
            borderColor: color,
          },
        ]}>
        {focus && !displayActions && (
          <TouchableOpacity onPress={onDisplayActions} style={styles.btn}>
            <CustomIcon
              name="arrow-forward-ios"
              type="MI"
              size={20}
              color={theme.primary}
            />
          </TouchableOpacity>
        )}
        {displayActions &&
          Actions(onCameraPress, onFilePress, theme.primary, styles)}
        <TextInput
          style={[
            styles.inputField,
            { borderColor: theme.input, color, height: Math.min(height, 60) },
          ]}
          value={text}
          onChangeText={onChange}
          onBlur={onBlur}
          ref={textInputRef}
          onFocus={onFocus}
          placeholder="  Aa..."
          placeholderTextColor={theme.mutedForeground}
          multiline
          autoCapitalize="sentences"
          autoCorrect
          returnKeyLabel={t('send')}
          returnKeyType="send"
          onContentSizeChange={(event) => {
            setHeight(event.nativeEvent.contentSize.height);
          }}
          {...commonInputProps}
        />
        
          <TouchableOpacity
            onPress={handleSend}
            style={styles.btn}
            hitSlop={{ bottom: 8, left: 8, right: 8, top: 8 }}>
            <CustomIcon name="send" type="IO" size={24} color={theme.primary} />
          </TouchableOpacity>
        
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
  indicator: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
    paddingBottom: 0,
  },
  inputContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    maxHeight: 80,
    padding: 10,
  },
  inputField: {
    borderRadius: Styles.borderRadius.medium,
    borderWidth: 1,
    flex: 1,
    marginHorizontal: 6,
  },
});
