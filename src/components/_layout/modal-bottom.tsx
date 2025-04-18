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
                borderColor: theme.mutedForeground,
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
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    padding: 6,
    width: '100%',
  },

  modal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flex: 1,
    justifyContent: 'flex-end',
  },
  top: {
    borderRadius: Styles.borderRadius.small,
    height: 5,
    marginBottom: 6,
    width: 40,
  },
});
