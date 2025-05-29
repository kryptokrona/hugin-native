import React from 'react';

import { View, Modal, Image, StyleSheet, TouchableWithoutFeedback, Platform, PermissionsAndroid } from 'react-native';

import { CustomIcon, TouchableOpacity } from './_elements';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { Camera } from 'services/bare/globals';
import { useThemeStore } from '@/services';
import Toast from 'react-native-toast-message';
import { getToastConfig } from '@/utils';

interface FullScreenImageViewerProps {
  imagePath: string; // Path to the image file
  onClose: () => void; // Callback to close the viewer
}

export const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  imagePath,
  onClose,
}) => {

  const theme = useThemeStore((state) => state.theme);
  const toastConfig = getToastConfig(theme);

  const saveToGallery = async (uri: string) => {
    Camera.on();
  try {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        {
          title: 'Storage Permission Required',
          message: 'App needs access to your storage to save photos',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Storage permission denied');
        return;
      }
    }

    const savedUri = await CameraRoll.save(uri, { type: 'photo' });
    console.log('Saved to gallery:', savedUri);
    Toast.show({
      text1: 'Image saved',
      type: 'success'
    });
  } catch (error) {
    console.log('Error saving image:', error);
    Toast.show({
      text1: 'Failed to save image',
      type: 'error'
    });
  }
  Camera.off();
};

  return (
    <Modal transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlayContainer}>
        <Image
          source={{ uri: imagePath }}
          style={styles.fullScreenImage}
          resizeMode="contain"
        />
      </View>
      </TouchableWithoutFeedback>
      <Toast config={toastConfig} />
      <View style={styles.buttonContainer} >
        <TouchableOpacity style={[styles.closeButton, {backgroundColor: theme.card, borderColor: theme.border}]} onPress={onClose}>
          <CustomIcon name={'close'} type={'MI'} size={30} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.closeButton, {backgroundColor: theme.card, borderColor: theme.border}]} onPress={() => saveToGallery(imagePath)}>
          <CustomIcon name={'download'} type={'MI'} size={30} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    bottom: '15%',
    gap: 50,
    flexDirection: 'row',
    justifyContent: 'center', // centers children horizontally
    width: '100%', // full width to allow centering
  },
  closeButton: {
    zIndex: 10,
    borderRadius: '50%',
    borderWidth: 1,
    padding: 7
  },
  fullScreenImage: {
    height: '100%',
    width: '100%',
  },
  overlayContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    flex: 1,
    justifyContent: 'center',
  },
});
