import { useState } from 'react';

import { Switch, View } from 'react-native';

import { type RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { ScreenLayout, TextButton, TextField } from '@/components';
import { config } from '@/config';
import {
  AuthScreens,
  AuthStackNavigationType,
  AuthStackParamList,
} from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.DisclaimerScreen>;
}
export const DisclaimerScreen: React.FC<Props> = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationType>();

  const [feeAccepted, setFeeAccepted] = useState(
    config.devFeePercentage > 0 ? false : true,
  );
  const [keyOwnershipAccepted, setKeyOwnershipAccepted] = useState(false);
  const [warrantyAccepted, setWarrantyAccepted] = useState(false);

  // const confirm = () => {
  //   navigation.navigate(AuthScreens.WalletOptionScreen);
  // };

  const onPress = () => {
    navigation.navigate(AuthScreens.ChooseAuthMethodScreen, {
      nextRoute: route?.params?.nextRoute,
    });
  };

  return (
    <ScreenLayout>
      {/* <ScreenHeader text={t('disclaimer')} /> */}
      <View
        style={{
          alignItems: 'flex-start',
          flex: 1,
          justifyContent: 'flex-start',
          marginTop: 60,
          // backgroundColor: this.props.screenProps.theme.backgroundColour,
        }}>
        {config.devFeePercentage > 0 && (
          <View
            style={{
              flexDirection: 'row',
              marginBottom: 20,
              marginLeft: 25,
              marginRight: 20,
            }}>
            <Switch
              value={feeAccepted}
              onValueChange={(value) => {
                setFeeAccepted(value);
              }}
              style={{ marginRight: 15 }}
            />

            <View style={{ flex: 1 }}>
              <TextField type="secondary">
                {`
                 I understand that the fee for sending transactions is{' '}
                  ${config.devFeePercentage.toString()}%.
                `}
                {/* {config.devFeePercentage.toString()}%. */}
              </TextField>
            </View>
          </View>
        )}

        <View
          style={{
            flexDirection: 'row',
            marginBottom: 20,
            marginLeft: 25,
            marginRight: 20,
          }}>
          <Switch
            value={keyOwnershipAccepted}
            onValueChange={(value) => {
              setKeyOwnershipAccepted(value);
            }}
            style={{ marginRight: 15 }}
          />

          <View style={{ flex: 1 }}>
            <TextField type="secondary">{t('privateKeyWarning')}</TextField>
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            marginBottom: 20,
            marginLeft: 25,
            marginRight: 20,
          }}>
          <Switch
            value={warrantyAccepted}
            onValueChange={(value) => {
              setWarrantyAccepted(value);
            }}
            style={{ marginRight: 15 }}
          />

          <View style={{ flex: 1 }}>
            <TextField type="secondary">{t('warrantyWarning')}</TextField>
          </View>
        </View>

        <TextButton
          onPress={onPress}
          disabled={!feeAccepted || !keyOwnershipAccepted || !warrantyAccepted}>
          {t('continue')}
        </TextButton>
      </View>
    </ScreenLayout>
  );
};
