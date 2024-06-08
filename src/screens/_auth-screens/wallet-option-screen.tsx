import { View } from 'react-native';

import { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { TextButton, ScreenLayout, TextField, XKRLogo } from '@/components';
import type { AuthStackParamList, AuthScreens } from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.WalletOptionScreen>;
}

export const WalletOptionScreen: React.FC<Props> = () => {
  const { t } = useTranslation();

  const onDisclaimerPress = () => {
    // onPress={() => this.props.navigation.navigate('Disclaimer', { nextRoute: 'CreateWallet' })}
    // TODO
  };

  const onRestorePress = () => {
    //  onPress={() => this.props.navigation.navigate('Disclaimer', { nextRoute: 'ImportWallet' })}
    // TODO
  };

  return (
    <ScreenLayout>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 50,
        }}>
        <XKRLogo />
        <TextField size="large" type="primary">
          Hugin Messenger
        </TextField>
        <TextField type="secondary">{t('welcomeMessage')}</TextField>
      </View>

      <View
        style={[
          // Styles.buttonContainer,
          {
            alignItems: 'stretch',
            bottom: 160,
            // fontFamily: 'Montserrat-Regular',
            justifyContent: 'center',
            position: 'absolute',
            width: '100%',
          },
        ]}>
        <TextButton
          // title={}
          /* Request a pin for the new wallet */
          onPress={onDisclaimerPress}>
          {t('createNewAccount')}
        </TextButton>
      </View>

      <View
        style={[
          // Styles.buttonContainer,
          {
            alignItems: 'stretch',
            bottom: 100,
            justifyContent: 'center',
            position: 'absolute',
            width: '100%',
          },
        ]}>
        <TextButton
          // title={}
          /* Request a pin for the new wallet */
          onPress={onRestorePress}>
          {t('restoreAccount')}
        </TextButton>
      </View>
    </ScreenLayout>
  );
};
