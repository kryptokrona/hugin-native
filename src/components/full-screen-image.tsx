import React from 'react';
import { Platform, PermissionsAndroid, View, Modal, Image, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { CustomIcon } from './_elements';
import { t } from 'i18next';
import Toast from 'react-native-toast-message';


interface FullScreenImageViewerProps {
  imagePath: string; // Path to the image file
  onClose: () => void; // Callback to close the viewer
}

export const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  imagePath,
  onClose,
}) => {

  const saveFileToCameraRoll = async () => {
    try {
      // Android: Request permission
      if (Platform.OS === 'android') {
        const permission = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
        ]);
        console.log('permission', permission)
        if (permission["android.permission.READ_MEDIA_IMAGES"] !== "granted" && permission["android.permission.READ_MEDIA_VIDEO"] !== "granted") {
          console.warn('Storage permission denied');
          return;
        }
      }
  
      // Make sure the file is a supported media type (image / video) for CameraRoll
      const savedUri = await CameraRoll.save(imagePath, { type: 'photo' });
      console.log('Saved to camera roll:', savedUri);
            Toast.show({
              text1: t('saveComplete'),
              type: 'success',
            });
    } catch (error) {
      console.error('Error saving to camera roll:', error);
    }
  };

  return (
    <Modal transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlayContainer}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <CustomIcon name={'arrow-back-ios'} type={'MI'} size={30} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.downloadButton} onPress={saveFileToCameraRoll}>
          <CustomIcon name={'download'} type={'FI'} size={30} />
        </TouchableOpacity>

        {/* Full-Screen Image */}
        <Image
          source={{ uri: imagePath }}
          style={styles.fullScreenImage}
          resizeMode="contain"
        />
      </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    left: 20,
    position: 'absolute',
    top: 40,
    zIndex: 10,
  },
  downloadButton: {
    right: 20,
    position: 'absolute',
    top: 40,
    zIndex: 10,
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
