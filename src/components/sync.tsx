import React, { useCallback, useEffect, useRef, useState } from 'react';

import { StyleSheet, View } from 'react-native';

import * as Animatable from 'react-native-animatable';

import { globals } from '@/config';
import { useThemeStore } from '@/services';

import { ProgressBar } from './progressbar';

export const SyncComponent: React.FC<any> = (props) => {
  const theme = useThemeStore((state) => state.theme);

  const [syncStatus, setSyncStatus] = useState({
    localHeight: 0,
    networkHeight: 0,
    percent: '0.00',
    progress: 0,
    walletHeight: 0,
  });

  const syncRef = useRef<any>(null);

  const updateSyncStatus = useCallback(
    (walletHeight: number, localHeight: number, networkHeight: number) => {
      if (
        walletHeight > networkHeight &&
        networkHeight !== 0 &&
        networkHeight + 10 > walletHeight
      ) {
        networkHeight = walletHeight;
      }

      let progress = networkHeight === 0 ? 100 : walletHeight / networkHeight;
      if (progress > 1) {
        progress = 1;
      }

      let percent = 100 * progress;
      if (progress > 0.97 && progress < 1) {
        progress = 0.97;
      }
      if (percent > 99.99 && percent < 100) {
        percent = 99.99;
      } else if (percent > 100) {
        percent = 100;
      }

      const justSynced = progress === 1 && syncStatus.progress !== 1;

      setSyncStatus({
        localHeight,
        networkHeight,
        percent: percent.toFixed(2),
        progress,
        walletHeight,
      });

      if (justSynced && syncRef.current) {
        syncRef.current.bounce(800);
      }
    },
    [syncStatus.progress],
  );

  useEffect(() => {
    // const handleHeightChange = Globals.wallet.on(
    //   'heightchange',
    //   updateSyncStatus,
    // );

    return () => {
      if (globals.wallet) {
        globals.wallet.removeListener('heightchange', updateSyncStatus);
      }
    };
  }, [updateSyncStatus]);

  return (
    <View style={styles.container}>
      <Animatable.Text
        ref={syncRef}
        style={[styles.text, { color: theme.primary }]}>
        {syncStatus.walletHeight} / {syncStatus.networkHeight} -{' '}
        {syncStatus.percent}%
      </Animatable.Text>
      <ProgressBar
        progress={syncStatus.progress}
        style={styles.progressBar}
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    bottom: 0,
    flex: 1,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
  },
  progressBar: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    width: 300,
  },
  text: {
    fontFamily: 'Montserrat-Regular',
  },
});
