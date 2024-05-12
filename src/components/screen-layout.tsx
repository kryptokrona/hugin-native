import { StyleSheet, View } from 'react-native';

import { useGlobalStore } from '@/services';

interface Props {
  children: React.ReactNode;
}

export const ScreenLayout: React.FC<Props> = ({ children }) => {
  const isArray = Array.isArray(children);
  const { theme } = useGlobalStore();
  const backgroundColor = theme.backgroundAccent;
  if (!children) {
    return null;
  }

  function itemMapper(item: React.ReactNode, index: number) {
    return (
      <View style={styles.divider} key={index}>
        {item}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {isArray && children.map(itemMapper)}
      {!isArray && children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    backgroundColor: 'red',
    flex: 1,
    height: '100%',
    padding: 12,
  },
  divider: {
    marginBottom: 12,
  },
});
