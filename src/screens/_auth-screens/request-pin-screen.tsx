import { useLayoutEffect } from 'react';

import PINCode from '@haskkor/react-native-pincode';
import { type RouteProp, useNavigation } from '@react-navigation/native';
import RNExitApp from 'react-native-exit-app';

import { Button, ScreenLayout } from '@/components';
import { useGlobalStore } from '@/services';
import {
  type AuthStackParamList,
  AuthScreens,
  type AuthStackNavigationType,
} from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.RequestPinScreen>;
}

export const RequestPinScreen: React.FC<Props> = ({ route }) => {
  const theme = useGlobalStore((state) => state.theme);

  const navigation = useNavigation<AuthStackNavigationType>();

  useLayoutEffect(() => {
    navigation.setOptions({ title: '' });
  }, [navigation]);

  const finishProcess = () => {
    route.params?.finishFunction(navigation);
  };

  const handleForgotPin = () => {
    navigation.navigate(AuthScreens.ForgotPinScreen);
  };

  return (
    <ScreenLayout>
      <PINCode
        status="enter"
        finishProcess={finishProcess}
        subtitleEnter={route.params?.subtitle}
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
        onClickButtonLockedPage={() => RNExitApp.exitApp()}
      />
      <Button
        onPress={handleForgotPin}

        // type="clear"
      >
        Forgon PIN?
      </Button>
    </ScreenLayout>
  );
};
