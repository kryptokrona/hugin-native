// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

export const Constants = {
  /* Note: It falls back to USD, so I suggest not removing that */
  currencies: [
    {
      coinName: 'Bitcoin',
      symbol: '₿',
      symbolLocation: 'prefix',
      ticker: 'btc',
    },
    {
      coinName: 'Ethereum',
      symbol: 'Ξ',
      symbolLocation: 'prefix',
      ticker: 'eth',
    },
    {
      coinName: 'Litecoin',
      symbol: 'Ł',
      symbolLocation: 'prefix',
      ticker: 'ltc',
    },
    {
      coinName: 'Australian Dollar',
      symbol: '$',
      symbolLocation: 'prefix',
      ticker: 'aud',
    },
    {
      coinName: 'Canadian Dollar',
      symbol: '$',
      symbolLocation: 'prefix',
      ticker: 'cad',
    },
    {
      coinName: 'Chinese Yuan Renminbi',
      symbol: '¥',
      symbolLocation: 'prefix',
      ticker: 'cny',
    },
    {
      coinName: 'Swiss Franc',
      symbol: 'Fr',
      symbolLocation: 'postfix',
      ticker: 'chf',
    },
    {
      coinName: 'Euro',
      symbol: '€',
      symbolLocation: 'prefix',
      ticker: 'eur',
    },
    {
      coinName: 'Great British Pound',
      symbol: '£',
      symbolLocation: 'prefix',
      ticker: 'gbp',
    },
    {
      coinName: 'Indian Rupee',
      symbol: '₹',
      symbolLocation: 'prefix',
      ticker: 'inr',
    },
    {
      coinName: 'Japanese Yen',
      symbol: '¥',
      symbolLocation: 'prefix',
      ticker: 'jpy',
    },
    {
      coinName: 'Mexican Peso',
      symbol: '$',
      symbolLocation: 'prefix',
      ticker: 'mxn',
    },
    {
      coinName: 'New Zealand Dollar',
      symbol: '$',
      symbolLocation: 'prefix',
      ticker: 'nzd',
    },
    {
      coinName: 'Russian Ruble',
      symbol: '₽',
      symbolLocation: 'postfix',
      ticker: 'rub',
    },
    {
      coinName: 'Swedish Kronor',
      symbol: 'kr',
      symbolLocation: 'postfix',
      ticker: 'sek',
    },
    {
      coinName: 'United States Dollar',
      symbol: '$',
      symbolLocation: 'prefix',
      ticker: 'usd',
    },
  ],

  languages: [
    {
      flag: '🇸🇪',
      langCode: 'sv',
      language: 'Svenska',
    },
    {
      flag: '🇬🇧',
      langCode: 'en',
      language: 'English',
    },
  ],

  numTransactionsPerPage: 20,

  walletFileFormatVersion: 0,
};
