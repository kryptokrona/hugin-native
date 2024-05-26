import { StyleSheet, View } from 'react-native';

import { RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Button, ScreenHeader, ScreenLayout } from '@/components';
import {
  AuthStackParamList,
  AuthScreens,
  AuthStackNavigationType,
} from '@/types';

interface Props {
  route: RouteProp<
    AuthStackParamList,
    typeof AuthScreens.ImportKeysOrSeedScreen
  >;
}

export const ImportKeysOrSeedScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationType>();
  const scanHeight = route.params?.scanHeight ?? 0;

  return (
    <ScreenLayout>
      <ScreenHeader text={t('howToImport')} />
      <View style={styles.buttonsContainer}>
        <View style={styles.buttonWrapper}>
          <Button
            type="primary"
            onPress={() =>
              navigation.navigate(AuthScreens.ImportSeedScreen, { scanHeight })
            }>
            {t('mnemonic')}
          </Button>
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            type="primary"
            onPress={() =>
              navigation.navigate(AuthScreens.ImportKeysScreen, { scanHeight })
            }>
            {t('privateKeys')}
          </Button>
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    marginBottom: 5,
    marginTop: 5,
    width: '100%',
  },
  buttonsContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 30,
    marginRight: 10,
    marginTop: 60,
    width: '100%',
  },
});
