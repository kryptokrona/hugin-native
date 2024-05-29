import { StyleSheet, View } from 'react-native';

import { RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Button, ScreenHeader, ScreenLayout, TextField } from '@/components';
import {
  type AuthStackParamList,
  AuthScreens,
  AuthStackNavigationType,
} from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.ImportWalletScreen>;
}

export const ImportWalletScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationType>();

  return (
    <ScreenLayout>
      <ScreenHeader text={t('whenCreated')} />
      <TextField>{t('whenCreatedSubtitle')}</TextField>

      <View style={styles.buttonsContainer}>
        <View style={styles.buttonWrapper}>
          <Button
            type="primary"
            onPress={() => navigation.navigate(AuthScreens.PickMonthScreen)}>
            {t('pickMonth')}
          </Button>
        </View>

        <View style={styles.buttonWrapper}>
          <Button
            type="primary"
            onPress={() =>
              navigation.navigate(AuthScreens.PickBlockHeightScreen)
            }>
            {t('pickApproxBlockHeight')}
          </Button>
        </View>

        <View style={styles.buttonWrapper}>
          <Button
            type="primary"
            onPress={() =>
              navigation.navigate(AuthScreens.PickExactBlockHeightScreen)
            }>
            {t('pickExactBlockHeight')}
          </Button>
        </View>

        <View style={styles.buttonWrapper}>
          <Button
            type="primary"
            onPress={() =>
              navigation.navigate(AuthScreens.ImportKeysOrSeedScreen, {
                scanHeight: 0,
              })
            }>
            {t('idk')}
          </Button>
        </View>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    alignItems: 'stretch',
    marginBottom: 5,
    marginTop: 5,
    width: '100%',
  },
  buttonsContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    width: '100%',
  },
});
