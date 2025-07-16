import { FlatList, Linking, Text, View } from 'react-native';

import { CustomIcon, ScreenLayout, TextField, TouchableOpacity } from '@/components';
import { useThemeStore } from '@/services';

interface Props {}

export const BuyXKRScreen: React.FC<Props> = () => {

  const exchanges = [
    {name: 'NonKYC', url: 'https://nonkyc.io/market/XKR_USDT', pair: 'XKR/USDT'},
    {name: 'NonKYC', url: 'https://nonkyc.io/market/XKR_XMR', pair: 'XKR/XMR'},
    {name: 'CoinEx', url: 'https://www.coinex.com/en/exchange/XKR-USDT', pair: 'XKR/USDT'},
    {name: 'Exbitron', url: 'https://app.exbitron.com/exchange/?market=XKR-USDT', pair: 'XKR/USDT'},
    {name: 'Exbitron', url: 'https://app.exbitron.com/exchange/?market=XKR-XMR', pair: 'XKR/XMR'},
    {name: 'Exbitron', url: 'https://app.exbitron.com/exchange/?market=XKR-BTC', pair: 'XKR/BTC'},
    {name: 'FreiExchange', url: 'https://freiexchange.com/market/XKR/BTC', pair: 'XKR/BTC'},
  ];

  const color = useThemeStore((state) => state.theme)?.foreground;

  return (
    <ScreenLayout>
      <FlatList
        data={exchanges}
        keyExtractor={(item, i) => `${item.address}-${i}`}
        renderItem={({ item }) => (
          <TouchableOpacity
          style={{marginBottom: 10}}
          onPress={ () => {
            Linking.openURL(
              item.url,
            ).catch((err) => console.error('Failed to open URL:', err));
          }
          }>
            <TextField bold size='large'>
              {item.name}
            </TextField>
            <TextField size='small'>
              {item.pair}
            </TextField>
            <View style={{position: 'absolute', right: 0, top: 15}}>
            <CustomIcon
              color={color}
              name="external-link"
              type="FI"
              size={24}
            />
            </View>
          </TouchableOpacity>
        )}
      />
    </ScreenLayout>
  );
};
