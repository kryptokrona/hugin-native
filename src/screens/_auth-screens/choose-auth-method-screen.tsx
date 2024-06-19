import React, { useState } from 'react';

import { StyleSheet, Switch, View } from 'react-native';

import { RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as Keychain from 'react-native-keychain';

import { TextButton, ScreenLayout, TextField } from '@/components';
import { AuthScreens, globals } from '@/config';
import { deletePinCode, savePreferencesToDatabase } from '@/services';
import type { AuthStackNavigationType, AuthStackParamList } from '@/types';

interface Props {
  route: RouteProp<
    AuthStackParamList,
    typeof AuthScreens.ChooseAuthMethodScreen
  >;
}

// Helper functions for Keychain operations
// const savePinCode = async (pinCode: string) => {
//   await Keychain.setGenericPassword('userPin', pinCode);
// };

const getPinCode = async () => {
  const credentials = await Keychain.getGenericPassword();
  return credentials ? credentials.password : null;
};

export const ChooseAuthMethodScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationType>();
  const [authMethod, setAuthMethod] = useState<
    'none' | 'hardware-auth' | 'pincode'
  >(globals.preferences.authenticationMethod);

  const handleContinue = async () => {
    const pinCode = await getPinCode();

    globals.preferences.authenticationMethod = authMethod;

    const nextRoute = route?.params?.nextRoute;

    if (authMethod === 'none') {
      await deletePinCode();
      await savePreferencesToDatabase(globals.preferences);

      if (nextRoute) {
        navigation.navigate(nextRoute as keyof AuthStackParamList);
      }
    } else if (authMethod === 'hardware-auth' && pinCode) {
      if (nextRoute) {
        navigation.navigate(nextRoute as keyof AuthStackParamList);
      }
      await savePreferencesToDatabase(globals.preferences);
    } else {
      navigation.navigate(AuthScreens.SetPinScreen);
    }
  };

  return (
    <ScreenLayout>
      <View style={styles.innerContainer}>
        <TextField>{t('authenticateHow')}</TextField>
        <View style={styles.optionContainer}>
          <Switch
            value={authMethod === 'hardware-auth'}
            onValueChange={(value) => {
              setAuthMethod(value ? 'hardware-auth' : 'none');
            }}
            style={styles.switch}
          />
          <TextField type="inverted">{t('useHardware')}</TextField>
        </View>
        <View style={styles.optionContainer}>
          <Switch
            value={authMethod === 'pincode'}
            onValueChange={(value) => {
              setAuthMethod(value ? 'pincode' : 'hardware-auth');
            }}
            style={styles.switch}
          />
          <TextField type="inverted">{t('usePinCode')}</TextField>
        </View>
        <View style={styles.optionContainer}>
          <Switch
            value={authMethod === 'none'}
            onValueChange={(value) => {
              setAuthMethod(value ? 'none' : 'hardware-auth');
            }}
            style={styles.switch}
          />
          <TextField>{t('noAuth')}</TextField>
        </View>
        <TextButton onPress={handleContinue}>{t('continue')}</TextButton>
      </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  innerContainer: {
    alignItems: 'flex-start',
    flex: 1,
    justifyContent: 'flex-start',
    marginTop: 60,
  },
  optionContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    marginLeft: 25,
    marginRight: 20,
  },
  switch: {
    marginRight: 15,
  },
});
