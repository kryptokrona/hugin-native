import { View } from 'react-native';

import { resetPinCodeInternalStates } from '@haskkor/react-native-pincode';
import { RouteProp, useNavigation } from '@react-navigation/native';

import { Button, ScreenLayout, TextField } from '@/components';
import { globals } from '@/config';
import {
  AuthStackParamList,
  AuthScreens,
  AuthStackNavigationType,
} from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.ForgotPinScreen>;
}

export const ForgotPinScreen: React.FC<Props> = () => {
  const navigation = useNavigation<AuthStackNavigationType>();
  const onPress = async () => {
    globals.reset();
    await resetPinCodeInternalStates();

    navigation.navigate(AuthScreens.SplashScreen);
    navigation.reset({
      index: 0,
      routes: [{ name: AuthScreens.SplashScreen }],
    });

    // this.props.navigation.navigate('Splash'); // TODO

    /* Can't use navigateWithDisabledBack between routes, but don't
       want to be able to go back to previous screen...
       Navigate to splash, then once on that route, reset the
      stack. */
    // this.props.navigation.dispatch(navigateWithDisabledBack('Splash'));
  };

  return (
    <ScreenLayout>
      <View
        style={{
          alignItems: 'flex-start',
          flex: 1,
          justifyContent: 'flex-start',
          marginTop: 60,
          // backgroundColor: this.props.screenProps.theme.backgroundColour,
        }}>
        <TextField
          size="large"
          // style={{
          // color: this.props.screenProps.theme.primaryColour,
          // fontSize: 25,
          // marginLeft: 30,
          // marginBottom: 20,
          // }}
        >
          Your account is encrypted with your pin, so unfortunately, if you have
          forgotten your pin, it cannot be recovered.
        </TextField>
        <TextField
          size="large"
          // style={{
          //   color: this.props.screenProps.theme.primaryColour,
          //   fontSize: 25,
          //   marginLeft: 30,
          // }}
        >
          However, you can delete your account if you wish to create a new one.
        </TextField>
      </View>

      <Button onPress={onPress} type="error">
        Delete Account
      </Button>
    </ScreenLayout>
  );
};
