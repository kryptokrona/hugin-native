import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback, useWindowDimensions } from 'react-native';
import { CustomIcon } from './_elements';
import { MediaStream, RTCView } from 'react-native-webrtc';

interface FullScreenVideoViewerProps {
  stream: MediaStream;
  onClose: () => void;
}

export const FullScreenVideoViewer: React.FC<FullScreenVideoViewerProps> = ({ stream, onClose }) => {
  const { width, height } = useWindowDimensions(); // Automatically updates on rotation

  return (
    <Modal supportedOrientations={['portrait', 'landscape']} transparent={true} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlayContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <CustomIcon name="arrow-back-ios" type="MI" size={30} />
          </TouchableOpacity>

          {/* Full-Screen Video */}
          <RTCView
            streamURL={stream.toURL()}
            style={{ width, height }} // Dynamically adjust size
            mirror={false}
            objectFit="contain" // Prevent cropping/zooming
          />
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
