import React from 'react';

import { View, Modal, Image, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';

import { CustomIcon } from './_elements';

interface FullScreenImageViewerProps {
  imagePath: string; // Path to the image file
  onClose: () => void; // Callback to close the viewer
}

export const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  imagePath,
  onClose,
}) => {
  return (
    <Modal transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
      <View style={styles.overlayContainer}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <CustomIcon name={'arrow-back-ios'} type={'MI'} size={30} />
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
