import { useEffect, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import { RouteProp, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Button, ScreenHeader, ScreenLayout } from '@/components';
import { getApproximateBlockHeight } from '@/services';
import {
  AuthStackParamList,
  AuthScreens,
  AuthStackNavigationType,
} from '@/types';

interface Props {
  route: RouteProp<
    AuthStackParamList,
    typeof AuthScreens.PickBlockHeightScreen
  >;
}

export const PickBlockHeightScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<AuthStackNavigationType>();
  const [jumps, setJumps] = useState([[0, 0]]);

  useEffect(() => {
    const height = getApproximateBlockHeight(new Date());
    const jumps = Math.floor(height / 6);
    const nearestMultiple = 10 ** (jumps.toString().length - 1);
    const remainder = jumps % nearestMultiple;
    const roundedJumps = jumps - remainder + nearestMultiple;
    const actualJumps = [];

    for (let i = 0; i < height; i += roundedJumps) {
      actualJumps.push([i, i + roundedJumps]);
    }

    setJumps(actualJumps);
  }, []);

  return (
    <ScreenLayout>
      <ScreenHeader text={t('betweenWhichBlocks')} />
      <View style={styles.buttonsContainer}>
        {jumps.map(([startHeight, endHeight]) => (
          <View key={startHeight} style={styles.buttonWrapper}>
            <Button
              type="primary"
              onPress={() =>
                navigation.navigate(AuthScreens.ImportKeysOrSeedScreen, {
                  scanHeight: startHeight,
                })
              }>
              {`${startHeight} - ${endHeight}`}
            </Button>
          </View>
        ))}
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
    width: '100%',
  },
});
