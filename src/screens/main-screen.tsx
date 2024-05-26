import { useState } from 'react';

import { RefreshControl, ScrollView, Text } from 'react-native';

import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { ScreenLayout } from '@/components';
import { useGlobalStore } from '@/services';
import type { MainScreens, MainStackParamList } from '@/types';

type Props = NativeStackScreenProps<
  MainStackParamList,
  typeof MainScreens.MainScreen
>;

export const MainScreen: React.FC<Props> = ({ route: _route }) => {
  const theme = useGlobalStore((state) => state.theme);
  const [refreshing, setRefreshing] = useState(false);

  function onRefresh() {
    setRefreshing(true);
    setRefreshing(false);
  }

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          title="Updating coin price..."
        />
      }
      style={{
        backgroundColor: theme.background,
      }}>
      <ScreenLayout>
        <Text>Main Screen</Text>
        <Text>Main Screen</Text>
      </ScreenLayout>
    </ScrollView>
  );
};
