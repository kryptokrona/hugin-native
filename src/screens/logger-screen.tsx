import { FlatList, ScrollView, StyleSheet, View } from 'react-native';

import { useNavigation, type RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { CopyButton, ScreenLayout, TextButton, TextField, TouchableOpacity } from '@/components';
import { MainScreens } from '@/config';
import { updateLanguage, useThemeStore } from '@/services';
import type { MainNavigationParamList } from '@/types';

import { languages } from '../i18n';
import { useEffect, useState } from 'react';
import { getLogs, clearLogs } from '@/utils';



export const LoggerScreen: React.FC = () => {
  const [logs, setLogs] = useState([]);

  const refreshLogs = () => setLogs([...getLogs()]);
  const { t } = useTranslation();

  useEffect(() => {
    refreshLogs();
  }, []);

  return (
    <ScreenLayout>
      <View style={{flex: 1}}>
      <TextButton onPress={refreshLogs}>Refresh Logs</TextButton>
      <TextButton onPress={() => { clearLogs(); refreshLogs(); }}>Clear Logs</TextButton>
      <CopyButton
        small
        type="secondary"
        data={logs.join('\n')}
        text={t('copyText')}
      />
      <ScrollView style={{ marginTop: 10 }}>
        {logs.map((log, idx) => (
          <TextField key={idx} style={{ fontFamily: 'monospace', fontSize: 10 }}>{log}</TextField>
        ))}
        </ScrollView>
    </View>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    padding: 16,
  },
  itemTitle: {
    alignSelf: 'center',
  },
});
