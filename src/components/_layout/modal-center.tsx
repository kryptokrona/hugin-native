import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { useGlobalStore } from '@/services';
import { Styles } from '@/styles';

interface Props {
  visible: boolean;
  closeModal: () => void;
  children: React.ReactNode;
}

export const ModalCenter: React.FC<Props> = ({
  visible,
  closeModal,
  children,
}) => {
  const theme = useGlobalStore((state) => state.theme);
  function onClose() {
    closeModal();
  }

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
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
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.borderAccent,
              },
            ]}>
            {children}
          </View>
        </TouchableWithoutFeedback>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  inner: {
    alignItems: 'center',
    borderBottomWidth: 0,
    borderRadius: Styles.borderRadius.large,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 300,
    paddingHorizontal: 30,
    paddingVertical: 30,
  },

  modal: {
    alignItems: 'center',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flex: 1,
    justifyContent: 'center',
  },
});
