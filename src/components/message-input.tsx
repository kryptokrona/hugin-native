import React, { useEffect, useRef, useState } from 'react';

import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

import { useTranslation } from 'react-i18next';
import DocumentPicker, { types } from 'react-native-document-picker';
import {
  CameraOptions,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import { useCameraPermission } from 'react-native-vision-camera';

import { Camera } from 'services/bare/globals';

import { useThemeStore } from '@/services';
import { Styles, commonInputProps } from '@/styles';
import type { SelectedFile, SelectedRecording } from '@/types';
import { sleep } from '@/utils';

import { CustomIcon, FileSelected, ReplyIndicator } from './_elements';

import {
  FinishMode,
  IWaveformRef,
  PermissionStatus,
  PlaybackSpeedType,
  PlayerState,
  RecorderState,
  UpdateFrequency,
  Waveform,
  useAudioPermission,
  useAudioPlayer,
} from '@simform_solutions/react-native-audio-waveform';

interface Props {
  onSend: (text: string, file: SelectedFile | null) => void;
  replyToName: string | null;
  onCloseReplyPress: () => void;
  dm?: boolean;
}

export const MessageInput: React.FC<Props> = ({
  onSend,
  replyToName,
  onCloseReplyPress,
  dm = false,
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
  const { hasPermission, requestPermission } = useCameraPermission();
  const waveformRef = useRef<IWaveformRef>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recorderState, setRecorderState] = useState(RecorderState.stopped);
  const { checkHasAudioRecorderPermission, getAudioRecorderPermission } =
    useAudioPermission();
  const [selectedRecording, setselectedRecording] = useState<SelectedFile | null>(null);


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
    if (Platform.OS === 'android') {
      Camera.on();
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

        await sleep(300);
        Camera.off();
      } catch (err) {
        if (DocumentPicker.isCancel(err)) {
          console.log('User cancelled file picker');
          await sleep(300);
          Camera.off();
        } else {
          console.error('DocumentPicker Error: ', err);
        }
      }
    } else {
      const options: CameraOptions = {
        mediaType: 'photo',
        quality: 0.5,
        saveToPhotos: true,
      };

      launchImageLibrary(options, async (response) => {
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
            await sleep(300);
            Camera.off();
          }
        }
      });
    }
  }

  const startRecording = () => {
    console.log('Starting recording..')
    waveformRef.current
      ?.startRecord({
        updateFrequency: UpdateFrequency.high,
        sampleRate: 8000,
        bitRate: 24000,

      })
      .then((recording) => {
        console.log('Recording..', recording);
      })
      .catch((e) => {console.log('Audio error: ', e)});
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
      setHeight(40);
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
        {focus && !dm && !displayActions && (
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
          !dm &&
          Actions(onCameraPress, onFilePress, onRecordAudio, onStopRecordAudio, theme.primary, styles)}
          {!isRecording ? 
        (<TextInput
        style={[
          styles.inputField,
          { borderColor: theme.input, color, height: Math.min(height, 60) },
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
          setHeight(event.nativeEvent.contentSize.height);
        }}
        {...commonInputProps}
        />)
        : 

        (        
          <Waveform
          mode="live"
          containerStyle={styles.liveWaveformView}
          ref={waveformRef}
          candleSpace={2}
          candleWidth={4}
          waveColor={color}
          // onRecorderStateChange={setRecorderState}
          onRecorderStateChange={recorderState => console.log('recorderState', recorderState)}

        />
      )

        
        }

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
      <TouchableOpacity onPressIn={onRecordAudio} onPressOut={onStopRecordAudio} style={styles.btn}>
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
  liveWaveformView: {
    flex: 1,
    height: 40,
    padding: 10,
  },
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
    fontFamily: 'Montserrat',
    fontSize: 15,
    lineHeight: 25,
    marginHorizontal: 6,
    minHeight: 40,
    paddingHorizontal: 10,
    textAlignVertical: 'center',
  },
});
