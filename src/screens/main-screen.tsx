import React from 'react';

import { ScrollView } from 'react-native';

import { ScreenLayout } from '@/components';

export const MainScreen: React.FC = () => {
  // const [refreshing, setRefreshing] = useState(false);

  return (
    <ScreenLayout>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        // refreshControl={
        // <RefreshControl
        // refreshing={refreshing}
        // onRefresh={refresh}
        // title="Updating coin price..."
        // />
        // }
      />
    </ScreenLayout>
  );
};
