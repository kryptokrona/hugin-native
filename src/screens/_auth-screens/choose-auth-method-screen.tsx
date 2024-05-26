import { useState } from 'react';

import { StyleSheet, Switch, View } from 'react-native';

import {
  deleteUserPinCode,
  hasUserSetPinCode,
} from '@haskkor/react-native-pincode';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Button, ScreenLayout, TextField } from '@/components';
import { globals } from '@/config';
import { savePreferencesToDatabase } from '@/services';
import {
  AuthScreens,
  AuthStackNavigationType,
  AuthStackParamList,
} from '@/types';

interface Props {
  route: RouteProp<
    AuthStackParamList,
    typeof AuthScreens.ChooseAuthMethodScreen
  >;
}
export const ChooseAuthMethodScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationType>();

  const [hardwareAuth, setHardwareAuth] = useState(
    globals.preferences.authenticationMethod === 'hardware-auth',
  );
  const [pinCode, setPinCode] = useState(
    globals.preferences.authenticationMethod === 'pincode',
  );
  const [noAuth, setNoAuth] = useState(
    globals.preferences.authenticationMethod === 'none',
  );

  const handleContinue = async () => {
    let method: 'none' | 'hardware-auth' | 'pincode' = 'none';

    if (hardwareAuth) {
      method = 'hardware-auth';
    } else if (pinCode) {
      method = 'pincode';
    }

    const havePincode = await hasUserSetPinCode();
    globals.preferences.authenticationMethod = method;

    const nextRoute = route?.params?.nextRoute;

    if (method === 'none') {
      await deleteUserPinCode();
      await savePreferencesToDatabase(globals.preferences);

      if (nextRoute) {
        navigation.navigate(nextRoute as keyof AuthStackParamList);
      }
    } else if (method === 'hardware-auth' && havePincode) {
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
            value={hardwareAuth}
            onValueChange={(value) => {
              setHardwareAuth(value);
              setPinCode(value ? false : pinCode);
              setNoAuth(value ? false : noAuth);
            }}
            style={styles.switch}
          />
          <TextField type="secondary">{t('useHardware')}</TextField>
        </View>

        <View style={styles.optionContainer}>
          <Switch
            value={pinCode}
            onValueChange={(value) => {
              setHardwareAuth(value ? false : hardwareAuth);
              setPinCode(value);
              setNoAuth(value ? false : noAuth);
            }}
            style={styles.switch}
          />
          <TextField type="secondary">{t('usePinCode')}</TextField>
        </View>

        <View style={styles.optionContainer}>
          <Switch
            value={noAuth}
            onValueChange={(value) => {
              setHardwareAuth(value ? false : hardwareAuth);
              setPinCode(value ? false : pinCode);
              setNoAuth(value);
            }}
            style={styles.switch}
          />
          <TextField>{t('noAuth')}</TextField>
        </View>

        <Button
          onPress={handleContinue}
          disabled={!(noAuth || pinCode || hardwareAuth)}
          // screenProps={screenProps}
        >
          {t('continue')}
        </Button>
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
