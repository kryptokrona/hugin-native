// // Copyright (C) 2018, Zpalmtree
// //
// // Please see the included LICENSE file for more information.

// import { config, Constants, globals } from '@/config';

// export async function getCoinPriceFromAPI() {
//   const fiatPrice = 0;
//   let i = 0;

//   while (!fiatPrice && i < config.priceApiLinks.length) {
//     const uri = `${config.priceApiLinks[i].url}`;
//     try {
//       const response = await fetch(uri, {
//         method: 'GET',
//         timeout: config.requestTimeout,
//       });
//       const data = await response.json();

//       let j = 0;
//       let currentLevel = data;
//       while (j < config.priceApiLinks[i].path.length) {
//         currentLevel = currentLevel[config.priceApiLinks[i].path[j]];
//         j++;
//       }
//       const coinData = currentLevel;
//       globals.logger.addLogMessage('Updated coin price from API');
//       globals.logger.addLogMessage('PRICE:' + coinData);
//       if (coinData) {
//         return coinData;
//       }
//     } catch (error) {
//       // return undefined;
//     }
//     i++;
//   }
//   globals.logger.addLogMessage('Failed to get price from API.');
// }

// // TODO is this used
// export function getCurrencyTickers() {
//   return Constants.currencies.map((currency) => currency.ticker).join('%2C');
// }

// export async function coinsToFiat(amount: number, _currencyTicker: any) {
//   /* Coingecko returns price with decimal places, not atomic */
//   const nonAtomic = amount / 10 ** config.decimalPlaces;

//   const prices = globals.coinPrice || 0;

//   // for (const currency of Constants.currencies) {
//   // if (currencyTicker === currency.ticker) {
//   const converted = prices * nonAtomic;

//   if (converted === undefined || isNaN(converted)) {
//     return '';
//   }

//   let convertedString = converted.toString();

//   /* Only show two decimal places if we've got more than '1' unit */
//   if (converted > 1) {
//     convertedString = converted.toFixed(2);
//   } else {
//     convertedString = converted.toFixed(8);
//   }

//   return '$' + convertedString;

//   // if (currency.symbolLocation === 'prefix') {
//   //     return currency.symbol + convertedString;
//   // } else {
//   //     return convertedString + ' ' + currency.symbol;
//   // }
//   //     }
//   // }

//   //   globals.logger.addLogMessage('Failed to find currency: ' + currencyTicker);

//   //   return '';
// }
