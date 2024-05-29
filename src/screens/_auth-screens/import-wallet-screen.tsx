import { StyleSheet, View } from 'react-native';

import { RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { TextButton, ScreenLayout, TextField } from '@/components';
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
      {/* <ScreenHeader text={t('whenCreated')} /> */}
      <TextField>{t('whenCreatedSubtitle')}</TextField>

      <View style={styles.buttonsContainer}>
        <View style={styles.buttonWrapper}>
          <TextButton
            type="primary"
            onPress={() => navigation.navigate(AuthScreens.PickMonthScreen)}>
            {t('pickMonth')}
          </TextButton>
        </View>

        <View style={styles.buttonWrapper}>
          <TextButton
            type="primary"
            onPress={() =>
              navigation.navigate(AuthScreens.PickBlockHeightScreen)
            }>
            {t('pickApproxBlockHeight')}
          </TextButton>
        </View>

        <View style={styles.buttonWrapper}>
          <TextButton
            type="primary"
            onPress={() =>
              navigation.navigate(AuthScreens.PickExactBlockHeightScreen)
            }>
            {t('pickExactBlockHeight')}
          </TextButton>
        </View>

        <View style={styles.buttonWrapper}>
          <TextButton
            type="primary"
            onPress={() =>
              navigation.navigate(AuthScreens.ImportKeysOrSeedScreen, {
                scanHeight: 0,
              })
            }>
            {t('idk')}
          </TextButton>
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
