import { useRef } from 'react';

import { Alert, Dimensions, StyleSheet, View } from 'react-native';

import {
  Camera,
  CameraRuntimeError,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';

import { Styles } from '@/styles';

interface Props {
  onGotQrCode: (code: string) => void;
  visible: boolean;
}

const windowWidth = Dimensions.get('window').width;
const exactWidth = windowWidth - 100;

export const QrScanner: React.FC<Props> = ({ onGotQrCode, visible }) => {
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (codes.length > 0) {
        if (codes[0].value) {
          setTimeout(() => onGotQrCode(codes[0].value!), 500);
        }
      }
    },
  });

  const onError = (error: CameraRuntimeError) => {
    Alert.alert('Error!', error.message);
  };

  return (
    device && (
      <View style={styles.qrScanner}>
        <Camera
          ref={camera}
          onError={onError}
          photo={false}
          style={styles.cameraFill}
          device={device}
          codeScanner={codeScanner}
          isActive={visible}
        />
      </View>
    )
  );
};

const styles = StyleSheet.create({
  cameraFill: {
    ...StyleSheet.absoluteFillObject,
  },
  qrScanner: {
    alignSelf: 'center',
    borderRadius: Styles.borderRadius.medium,
    height: 300,
    overflow: 'hidden',
    width: exactWidth,
  },
});
