import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useGlobalStore, useThemeStore } from '@/services';

export const SplashScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useThemeStore((state) => state.theme);

  const words = [
    'decentralized',
    'encrypted',
    'private',
    'secure',
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 1000);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.foreground }]}>Hugin</Text>

        <View style={styles.wordWrapper}>
            <Animated.Text
                key={index} // Key change triggers enter/exit
                entering={FadeInDown.duration(200)}
                exiting={FadeOutUp.duration(150)}
                style={styles.word}
            >
                {words[index]}
            </Animated.Text>
        </View>
        
        <Text style={[styles.version, { color: theme.mutedForeground }]}>v0.0.1</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 48,
    fontFamily: 'Montserrat-Regular',
    marginBottom: 10,
  },
  wordWrapper: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 40,
  },
  word: {
    color: 'white', 
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    position: 'relative',
  },
  status: {
    color: 'white',
    opacity: 0.7,
    marginTop: 20,
    fontSize: 14,
    fontFamily: 'Montserrat-Regular',
  },
  version: {
    position: 'absolute',
    bottom: 40,
    opacity: 0.3,
    fontSize: 12,
    fontFamily: 'Montserrat-Regular',
  }
});
