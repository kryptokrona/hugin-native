import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { Styles } from '@/styles';
import { useThemeStore } from '@/services';

interface Props {
  visible: boolean;
  closeModal: () => void;
  children?: React.ReactNode;
}

export const ModalBottom: React.FC<Props> = ({
  visible,
  closeModal,
  children,
}) => {
  const theme = useThemeStore((state) => state.theme);
  function onClose() {
    closeModal();
  }

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
      presentationStyle="overFullScreen" // iOS only
    >
      <TouchableOpacity
        style={styles.modal}
        activeOpacity={1}
        onPressOut={onClose}>
        <TouchableWithoutFeedback>
          <View
            style={[
              styles.inner,
              {
                backgroundColor: theme.popover,
                borderColor: theme.border,
              },
            ]}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <View
                style={[styles.top, { backgroundColor: theme.mutedForeground }]}
              />
            </TouchableOpacity>
            {children}
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  inner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    paddingTop: 6,
    width: '90%',
    marginLeft: '5%',
  },

  modal: {
    borderRadius: 16,
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 40
  },
  top: {
    borderRadius: Styles.borderRadius.small,
    height: 5,
    marginBottom: 6,
    width: 40,
    position: 'absolute',
    top: -20
  },
});
