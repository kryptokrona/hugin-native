import { useState } from 'react';

import { StyleSheet, Text, View } from 'react-native';

import { RouteProp, useNavigation } from '@react-navigation/native';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import MonthSelectorCalendar from 'react-native-month-selector';

import { TextButton, ScreenLayout } from '@/components';
import { config } from '@/config';
import { dateToScanHeight, useGlobalStore } from '@/services';
import {
  AuthStackParamList,
  AuthScreens,
  AuthStackNavigationType,
} from '@/types';

interface Props {
  route: RouteProp<AuthStackParamList, typeof AuthScreens.PickMonthScreen>;
}

export const PickMonthScreen: React.FC<Props> = () => {
  const { t } = useTranslation();
  const theme = useGlobalStore((state) => state.theme);
  const [month, setMonth] = useState(moment().startOf('month'));
  const navigation = useNavigation<AuthStackNavigationType>();

  const onPress = () =>
    navigation.navigate(AuthScreens.ImportKeysOrSeedScreen, {
      scanHeight: dateToScanHeight(month),
    });

  return (
    <ScreenLayout>
      {/* <ScreenHeader text={t('whichMonth')} /> */}

      <View style={styles.calendarContainer}>
        <MonthSelectorCalendar
          minDate={moment(config.chainLaunchTimestamp)}
          selectedBackgroundColor={theme.primary}
          monthTextStyle={{ color: theme.primary }}
          monthDisabledStyle={{ color: theme.secondary }}
          currentMonthTextStyle={{ color: theme.primary }}
          seperatorColor={theme.primary}
          nextIcon={
            <Text style={[styles.navText, { color: theme.primary }]}>
              {t('next')}
            </Text>
          }
          prevIcon={
            <Text style={[styles.navText, { color: theme.primary }]}>
              {t('previous')}
            </Text>
          }
          yearTextStyle={{ color: theme.primary }}
          selectedDate={month}
          onMonthTapped={(date: any) => setMonth(date)}
          containerStyle={{
            backgroundColor: theme.background,
          }}
        />
      </View>

      <TextButton onPress={onPress}>{t('continue')}</TextButton>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    alignItems: 'stretch',
    justifyContent: 'center',
  },

  navText: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: 16,
    marginRight: 10,
  },
});
