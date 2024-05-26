import { useCallback, useLayoutEffect } from 'react';

import PINCode from '@haskkor/react-native-pincode';
import { RouteProp, useNavigation } from '@react-navigation/native';

import { ScreenLayout } from '@/components';
import { config, globals } from '@/config';
import { savePreferencesToDatabase, useGlobalStore } from '@/services';
import {
  AuthStackNavigationType,
  AuthStackParamList,
  AuthScreens,
} from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.SetPinScreen>;
}

export const SetPinScreen: React.FC<Props> = ({ route }) => {
  const theme = useGlobalStore((state) => state.theme);
  const navigation = useNavigation<AuthStackNavigationType>();

  const continueFunction = useCallback(
    (_pinCode?: string) => {
      savePreferencesToDatabase(globals.preferences);
      if (route?.params?.nextRoute) {
        navigation.navigate(route.params.nextRoute as keyof AuthStackParamList);
      }
    },
    [navigation, route?.params?.nextRoute],
  );

  useLayoutEffect(() => {
    navigation.setOptions({ title: '' }); // TODO Figure out
  }, [navigation]);

  const subtitle = `to keep your ${config.coinName} secure`;
  return (
    <ScreenLayout>
      <PINCode
        status="choose"
        finishProcess={continueFunction}
        subtitleChoose={subtitle}
        passwordLength={6}
        touchIDDisabled
        colorPassword={theme.primary}
        stylePinCodeColorSubtitle={theme.primary}
        stylePinCodeColorTitle={theme.primary}
        stylePinCodeButtonNumber={theme.secondary}
        numbersButtonOverlayColor={theme.secondary}
        stylePinCodeDeleteButtonColorShowUnderlay={theme.primary}
        stylePinCodeDeleteButtonColorHideUnderlay={theme.primary}
        colorCircleButtons={theme.background}
      />
    </ScreenLayout>
  );
};
