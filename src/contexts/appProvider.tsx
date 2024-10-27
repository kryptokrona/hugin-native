import { SafeAreaView } from 'react-native';

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // const isHydrated = useAppStoreState((state) => state._hasHydrated);

  // useEffect(() => {
  //   // async function _init() {
  //   //   await init();
  //   // }
  //   if (isHydrated.preferences && isHydrated.user && isHydrated.theme) {
  //     // _init();
  //   }
  // }, [isHydrated]);

  // Hydration moved to splash screen, probably working

  return <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>;
};
