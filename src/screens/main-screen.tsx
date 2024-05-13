import { useState } from 'react';

import { RefreshControl, ScrollView, Text } from 'react-native';

import { type RouteProp } from '@react-navigation/native';

import { ScreenLayout } from '@/components';
import { useGlobalStore } from '@/services';
import type { MainScreens, MainStackParamList } from '@/types';

interface Props {
  route: RouteProp<MainStackParamList, typeof MainScreens.Main.name>;
}

export const MainScreen: React.FC<Props> = ({ route: _route }) => {
  const { theme } = useGlobalStore();
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
