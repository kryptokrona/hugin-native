import { AppNavigator } from './components/_navigation';
import { AppProvider } from './contexts';
// import SplashScreen from 'react-native-splash-screen';
// import { useEffect } from 'react';
const App = () => {
  // useEffect(() => {
  //   setTimeout(() => {
  //     SplashScreen.hide();
  //   }, 1500);
  // }, []);

  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  );
};

export default App;
