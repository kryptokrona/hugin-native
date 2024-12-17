import React from 'react';

import {
  View,
  Modal,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';

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
      <View style={styles.overlayContainer}>
        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>X</Text>
        </TouchableOpacity>

        {/* Full-Screen Image */}
        <Image
          source={{ uri: imagePath }}
          style={styles.fullScreenImage}
          resizeMode="contain"
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 40,
    zIndex: 10,
  },
  closeText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
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
