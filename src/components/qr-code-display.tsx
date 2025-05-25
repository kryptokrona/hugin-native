import { Dimensions, StyleSheet, View } from 'react-native';

import QRCode from 'react-native-qrcode-svg';

interface Props {
  code: string | undefined;
}

const exactWidth = Dimensions.get('window').width - 100;

export const QrCodeDisplay: React.FC<Props> = ({ code }) => {
  return (
    code && (
      <View style={styles.qrCode}>
        <QRCode value={code} size={exactWidth - 20} />
      </View>
    )
  );
};

const styles = StyleSheet.create({
  qrCode: {
    alignSelf: 'center',
    aspectRatio: 1,
    backgroundColor: 'white',
    padding: 10,
  },
});
