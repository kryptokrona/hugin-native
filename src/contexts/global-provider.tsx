import { createContext, useContext, useMemo } from 'react';

// import { useNetInfo } from '@react-native-community/netinfo';
import { Theme } from '../types';

import { defaultTheme } from '../styles/theme';

interface Props {
  children: React.ReactNode;
}

interface BloablContextValue {
  theme: Theme;
}

const GlobalContext = createContext<BloablContextValue>({
  theme: defaultTheme,
});

export const GlobalProvider: React.FC<Props> = ({ children }) => {
  // const netinfo = useNetInfo();

  // useEffect(() => {
  //   console.log('netinfo', netinfo);
  // }, [netinfo]);

  const memoedValue = useMemo(() => {
    return {
      theme: defaultTheme,
    };
  }, []);

  return (
    <GlobalContext.Provider value={memoedValue}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal must be used within a GlobalContext');
  }
  return context;
};
