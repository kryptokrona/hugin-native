import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { CustomIcon } from './_elements';
import { useThemeStore } from '@/services';

interface Props {
  path: string;
}

export const VideoPlayer: React.FC<Props> = ({ path }) => {
  const theme = useThemeStore((state) => state.theme);
  const [isPlaying, setIsPlaying] = useState(false);
  const ref = useRef(null);

  const player = useVideoPlayer('file://' + path, (p) => {
    p.loop = false;
    p.pause();
  });

  const handlePlayPause = () => {
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      player.play();
      setIsPlaying(true);
    }
  };

  player.addListener('playToEnd', () => {
    setIsPlaying(false);
  });

  return (
    <View style={styles.container}>
      <VideoView
        ref={ref}
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="contain"
      />
      <Pressable style={styles.overlay} onPress={handlePlayPause}>
        {!isPlaying && (
          <View style={styles.playButton}>
            <CustomIcon type="FI" name="play" size={28} color="#fff" />
          </View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '92%',
    aspectRatio: 16 / 9,
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 8,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 32,
    padding: 12,
  },
});
