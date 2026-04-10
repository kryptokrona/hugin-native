import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useEffect
} from 'react';

import {
  FlatList,
  StyleSheet,
  View,
} from 'react-native';

import {
  type RouteProp,
  useNavigation,
} from '@react-navigation/native';
import { t } from 'i18next';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


import {
  ScreenLayout,
  FullScreenImageViewer,
  CallUserItem,
} from '@/components';

import { MainScreens } from '@/config';
import {
  useGlobalStore,
  useThemeStore,
} from '@/services';
import type {
  MainStackNavigationType,
  MainNavigationParamList,
  User,
} from '@/types';

import { Header } from '../components/_navigation/header';

interface Props {
  route: RouteProp<MainNavigationParamList, typeof MainScreens.CallScreen>;
}

export const CallScreen: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<MainStackNavigationType>();
  const flatListRef = useRef<FlatList>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const users = useGlobalStore(state => state.currentCall.users);
  const talkingUsers = useGlobalStore(state => state.talkingUsers);
  const room = useGlobalStore(state => state.currentCall.room);

  console.log('[call-screen.tsx] users:', users)

  function OnlineUserMapper({ item }: { item: User }) {
    return <CallUserItem 
    {...item} 
    isTalking={!!talkingUsers[item.address]}
    />;
  }

  useEffect(() => {
    if (!room) {
      navigation.goBack();
    }
  }, [room, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <Header
          backButton
          title={t('currentCall')}
        />
      ),
    });
  }, []);

  const numColumns = users.length > 2 ? 2 : 2;

  return (
    <ScreenLayout>
      <GestureHandlerRootView>
        {/* Full-Screen Image Viewer */}
        {imagePath && (
          <FullScreenImageViewer
            imagePath={imagePath}
            onClose={() => setImagePath(null)}
          />
        )}

            <View style={{ flex: 1, width: '100%' }}>
              <View style={styles.flatListContainer}>
                <View style={styles.flatListWrapper}>
                  <FlatList
                    key={`flatlist-${numColumns}`}
                    nestedScrollEnabled={true}
                    columnWrapperStyle={numColumns > 1 ? { gap: 10 } : undefined}
                    contentContainerStyle={{ gap: 10 }}
                    numColumns={numColumns}
                    data={users}
                    renderItem={OnlineUserMapper}
                    keyExtractor={(item, i) => `${item.name}-${i}`}
                    style={{ flex: 1, gap: 5 }}
                  />
                </View>
              </View>
            </View>
      </GestureHandlerRootView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'grey',
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    flex: 1,
    padding: 36,
  },
  flatListContainer: {
    flex: 1,
    marginVertical: 12,
  },
  flatListContent: {
    flexDirection: 'column-reverse',
    paddingTop: 60
  },
  flatListWrapper: {
    flex: 1,
  },
  inputWrapper: {
    bottom: 0,
    left: 0,
    // marginBottom: 10,
    paddingBottom: 10,
    position: 'absolute',
    right: 0,
  },
});
