// const request = require('request-promise-native');

import { WalletConfig } from 'config/wallet-config';
// import Constants from './Constants';

// import { Globals } from './Globals';

const currencies = [
    {
        ticker: 'btc',
        coinName: 'Bitcoin',
        symbol: '₿',
        symbolLocation: 'prefix',
    },
    {
        ticker: 'eth',
        coinName: 'Ethereum',
        symbol: 'Ξ',
        symbolLocation: 'prefix',
    },
    {
        ticker: 'ltc',
        coinName: 'Litecoin',
        symbol: 'Ł',
        symbolLocation: 'prefix',
    },
    {
        ticker: 'aud',
        coinName: 'Australian Dollar',
        symbol: '$',
        symbolLocation: 'prefix',
    },
    {
        ticker: 'cad',
        coinName: 'Canadian Dollar',
        symbol: '$',
        symbolLocation: 'prefix',
    },
    {
        ticker: 'cny',
        coinName: 'Chinese Yuan Renminbi',
        symbol: '¥',
        symbolLocation: 'prefix',
    },
    {
        ticker: 'chf',
        coinName: 'Swiss Franc',
        symbol: 'Fr',
        symbolLocation: 'postfix',
    },
    {
        ticker: 'eur',
        coinName: 'Euro',
        symbol: '€',
        symbolLocation: 'prefix',
    },
    {
        ticker: 'gbp',
        coinName: 'Great British Pound',
        symbol: '£',
        symbolLocation: 'prefix',
    },
    {
        ticker: 'inr',
        coinName: 'Indian Rupee',
        symbol: '₹',
        symbolLocation: 'prefix',
    },
    {
        ticker: 'jpy',
        coinName: 'Japanese Yen',
        symbol: '¥',
        symbolLocation: 'prefix',
    },
    {
        ticker: 'mxn',
        coinName: 'Mexican Peso',
        symbol: '$',
        symbolLocation: 'prefix',
    },
    {
        ticker: 'nzd',
        coinName: 'New Zealand Dollar',
        symbol: '$',
        symbolLocation: 'prefix',
    },
    {
        ticker: 'rub',
        coinName: 'Russian Ruble',
        symbol: '₽',
        symbolLocation: 'postfix',
    },
    {
        ticker: 'sek',
        coinName: 'Swedish Kronor',
        symbol: 'kr',
        symbolLocation: 'postfix',
    },
    {
        ticker: 'usd',
        coinName: 'United States Dollar',
        symbol: '$',
        symbolLocation: 'prefix',
    },
];

export async function getCoinPriceFromAPI() {
    console.log('Getting fiat..');

    let fiatPrice = 0;
    let i = 0;

    while (!fiatPrice && i < WalletConfig.priceApiLinks.length) {
        const uri = WalletConfig.priceApiLinks[i].url; 
        console.log('Testing fiat solver..', uri);

        try {
            const response = await fetch(uri, {
                method: 'GET',
                timeout: WalletConfig.requestTimeout
            });

            if (!response.ok) {
                throw new Error(`Error fetching data: ${response.statusText}`);
            }

            const data = await response.json();
            let currentLevel = data;

            console.log('data', data);

            for (const path of WalletConfig.priceApiLinks[i].path) {
                if (currentLevel[path] === undefined) {
                    throw new Error(`Invalid path: ${path}`);
                }
                currentLevel = currentLevel[path];
            }

            const coinData = currentLevel;
            console.log('Updated coin price from API', coinData);

            if (coinData) {
                return coinData;
            }
        } catch (error) {
            console.error('Failed to fetch price from', uri, error);
        }

        i++;
    }

    console.log('Failed to get price from API.');
    return undefined;
}


function getCurrencyTickers() {
    return currencies.map((currency) => currency.ticker).join('%2C');
}

export async function coinsToFiat(amount, currencyTicker) {
    /* Coingecko returns price with decimal places, not atomic */
    let nonAtomic = amount / (10 ** Config.decimalPlaces);

    let prices = 0;

    // for (const currency of Constants.currencies) {
        // if (currencyTicker === currency.ticker) {
            let converted = prices * nonAtomic;

            if (converted === undefined || isNaN(converted)) {
                return '';
            }

            let convertedString = converted.toString();

            /* Only show two decimal places if we've got more than '1' unit */
            if (converted > 1) {
                convertedString = converted.toFixed(2);
            } else {
                convertedString = converted.toFixed(8);
            }

            return "$" + convertedString

}