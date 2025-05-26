import React, { useEffect, useRef, useState } from 'react';

import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

import {
  IWaveformRef,
  PermissionStatus,
  RecorderState,
  UpdateFrequency,
  Waveform,
  useAudioPermission,
} from '@simform_solutions/react-native-audio-waveform';
import { useTranslation } from 'react-i18next';
import { pick, types, keepLocalCopy, errorCodes, isErrorWithCode } from '@react-native-documents/picker';

import RNFS from 'react-native-fs';
import {
  CameraOptions,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import { useCameraPermission } from 'react-native-vision-camera';

import { Camera } from 'services/bare/globals';

import { useThemeStore } from '@/services';
import { Styles, commonInputProps } from '@/styles';
import type { SelectedFile } from '@/types';
import { sleep } from '@/utils';

import { CustomIcon, FileSelected, ReplyIndicator } from './_elements';

interface Props {
  onSend: (text: string, file: SelectedFile | null) => void;
  replyToName: string | null;
  onCloseReplyPress: () => void;
  dm?: boolean;
  large?: boolean;
  hideExtras?: boolean;
}

export const MessageInput: React.FC<Props> = ({
  onSend,
  replyToName,
  onCloseReplyPress,
  dm = false,
  large = false,
  hideExtras = false
}) => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);
  const [text, setText] = useState('');
  const [focus, setFocus] = useState(large ? true : false);
  const [displayActions, setDisplayActions] = useState(large ? false : true);
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const color = focus ? theme.accentForeground : theme.mutedForeground;
  const backgroundColor = theme.background;
  const [height, setHeight] = useState(large ? 200 : 40);
  const textInputRef = useRef<TextInput>(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const waveformRef = useRef<IWaveformRef>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recorderState, setRecorderState] = useState(RecorderState.stopped);
  const { checkHasAudioRecorderPermission, getAudioRecorderPermission } =
    useAudioPermission();
  const [selectedRecording, setselectedRecording] =
    useState<SelectedFile | null>(null);

  useEffect(() => {
    if (replyToName?.length) {
      focusInput();
    }
  }, [replyToName]);

  const focusInput = () => {
    Camera.off();
    if (textInputRef.current) {
      setTimeout(() => textInputRef.current.focus(), 100);
    }
  };
  async function onCameraPress() {
    const options: CameraOptions = {
      mediaType: 'photo',
      quality: 0.5,
      saveToPhotos: true,
    };
    Camera.on();
    if (!hasPermission) {
      await requestPermission();
    }

    launchCamera(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
        await sleep(300);
        Camera.off();
      } else if (response.errorCode) {
        console.error('ImagePicker Error: ', response);
      } else {
        const asset = response?.assets?.[0];
        if (asset) {
          const { fileSize, uri, fileName, type } = asset;
          if (!uri || !fileName || !fileSize) {
            return;
          }
          const fileInfo: SelectedFile = {
            fileName: fileName,
            path: uri?.slice(7, uri.length),
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
  Camera.on(); // TODO: Change to global state
  if (Platform.OS === 'android') {
    try {
      const res = await pick({
        type: [types.allFiles],
        allowVirtualFiles: true,
        mode: 'open',
        requestLongTermAccess: false,
      });

      const { name, uri, size, type } = res[0];

      if (!uri || !name || !size) {
        return;
      }

      const localCopies = await keepLocalCopy({
        destination: 'documentDirectory',
        files: [{
          uri,
          fileName: name,
          convertVirtualFileToType: type || 'application/octet-stream',
        }]
      });

      const localUri = localCopies[0]?.status === 'success' ? localCopies[0].localUri : null;
      if (!localUri) {
        console.error('Failed to create local copy of file');
        return;
      }

      const fileInfo: SelectedFile = {
        fileName: name,
        path: localUri.replace('file://', ''),
        size,
        time: new Date().getTime(),
        type,
        uri: uri,
      };

      setSelectedFile(fileInfo);

      await sleep(300);
      Camera.off();
    } catch (err) {
      if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
        console.log('User cancelled file picker');
        await sleep(1000);
        Camera.off();
      } else {
        console.error('DocumentPicker Error:', err);
      }
    }
  } else {
    const options: CameraOptions = {
        mediaType: 'photo',
        quality: 0.5,
        saveToPhotos: true,
      };
     launchImageLibrary(options, async (response) => {
        Camera.on();
        if (response.didCancel) {
          console.log('User cancelled image picker');
          await sleep(300);
          Camera.off();
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
              path: uri?.slice(7, uri.length),
              size: fileSize,
              time: new Date().getTime(),
              type: type ?? 'image',
              uri: uri,
            };
            setSelectedFile(fileInfo);
            await sleep(1000);
            Camera.off();
          }
        }
      });
    }
  }

  const startRecording = () => {
    console.log('Starting recording..');
    waveformRef.current
      ?.startRecord({
        bitRate: 55000,
        sampleRate: 44100,
        updateFrequency: UpdateFrequency.high,
      })
      .then((recording) => {
        console.log('Recording..', recording);
      })
      .catch((e) => {
        console.log('Audio error: ', e);
      });
  };

  async function onRecordAudio() {
    setIsRecording(true);

    const hasPermission = await checkHasAudioRecorderPermission();

    if (hasPermission === PermissionStatus.granted) {
      startRecording();
    } else if (hasPermission === PermissionStatus.undetermined) {
      const permissionStatus = await getAudioRecorderPermission();
      if (permissionStatus === PermissionStatus.granted) {
        startRecording();
      }
    } else {
      // todo: Linking.openSettings();
    }
  }

  async function onStopRecordAudio() {
    setIsRecording(false);
    const recording = await waveformRef.current?.stopRecord();
    console.log('Recording complete: ', recording);
    const path = recording?.slice(7, recording.length);
    const file = await RNFS.stat(path);

    const fileInfo: SelectedFile = {
      fileName: recording?.split('/').at(-1),
      path: path,
      size: file.size,
      time: new Date().getTime(),
      type: 'audio',
      uri: recording,
    };

    setSelectedFile(fileInfo);
  }

  function handleSend() {
    if (text.trim() || selectedFile) {
      const trimmedText = text.trim() || '';
      onSend(trimmedText, selectedFile);
      setHeight(large ? 200 : 40);
      setText('');
      setSelectedFile(null);
      Camera.off();
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
    Camera.off();
  }

  function onCloseReply() {
    onCloseReplyPress();
  }

  return (
    <View style={[styles.container]}>
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
            maxHeight: large ? undefined : 80,
            height: large ? 300 : undefined,
            backgroundColor,
            borderColor: color,
          },
        ]}>
        {focus && !displayActions && !hideExtras && (
          <TouchableOpacity onPress={onDisplayActions} style={styles.btn}>
            <CustomIcon
              name="arrow-forward-ios"
              type="MI"
              size={20}
              color={theme.primary}
            />
          </TouchableOpacity>
        )}
        {displayActions && !hideExtras &&
          Actions(
            onCameraPress,
            onFilePress,
            onRecordAudio,
            onStopRecordAudio,
            theme.primary,
            styles,
          )}
        {!isRecording ? (
          <TextInput
            style={[
              styles.inputField,
              { borderColor: theme.input, color, height: large ? 200 : Math.min(height, 60) },
            ]}
            value={text}
            onChangeText={onChange}
            onBlur={onBlur}
            ref={textInputRef}
            onFocus={onFocus}
            placeholder=" "
            placeholderTextColor={theme.mutedForeground}
            multiline
            autoCapitalize="sentences"
            autoCorrect
            returnKeyLabel={t('send')}
            returnKeyType="send"
            onContentSizeChange={(event) => {
              if (large) return;
              setHeight(event.nativeEvent.contentSize.height);
            }}
            {...commonInputProps}
          />
        ) : (
          <Waveform
            mode="live"
            containerStyle={styles.liveWaveformView}
            ref={waveformRef}
            candleSpace={2}
            candleWidth={4}
            waveColor={color}
            // onRecorderStateChange={setRecorderState}
            onRecorderStateChange={(recorderState) =>
              console.log('recorderState', recorderState)
            }
          />
        )}

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
  onRecordAudio: any,
  onStopRecordAudio: any,
  color: string,
  styles: any,
) {
  return (
    <>
      <TouchableOpacity onPress={onCameraPress} style={styles.btn}>
        <CustomIcon name="camera" type="IO" size={24} color={color} />
      </TouchableOpacity>
      <TouchableOpacity
        onPressIn={onRecordAudio}
        onPressOut={onStopRecordAudio}
        style={styles.btn}>
        <CustomIcon name="microphone" type="FA6" size={24} color={color} />
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
    flex: 1,
    width: '100%',
  },
  indicator: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
    paddingBottom: 0,
  },
  inputContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    maxHeight: 80,
    padding: 10
  },
  inputField: {
    borderRadius: Styles.borderRadius.medium,
    borderWidth: 1,
    flex: 1,
    fontFamily: 'Montserrat',
    fontSize: 15,
    lineHeight: 25,
    marginHorizontal: 6,
    minHeight: 40,
    paddingHorizontal: 10,
    textAlignVertical: 'center',
  },
  liveWaveformView: {
    flex: 1,
    height: 40,
    padding: 10,
  },
});
