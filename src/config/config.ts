// Copyright (C) 2018, Zpalmtree
//
// Please see the included LICENSE file for more information.

import { Platform } from 'react-native';

import { MixinLimit, MixinLimits, Daemon } from 'kryptokrona-wallet-backend-js';

import {
  derivePublicKey,
  generateKeyDerivation,
  generateRingSignatures,
  deriveSecretKey,
  generateKeyImage,
  checkRingSignature,
} from '@/services';

interface PriceApiLink {
  url: string;
  path: string[];
}

class Config {
  coinName: string;
  uriPrefix: string;
  walletSaveFrequency: number;
  decimalPlaces: number;
  addressPrefix: number;
  requestTimeout: number;
  blockTargetTime: number;
  syncThreadInterval: number;
  daemonUpdateInterval: number;
  maxLastFetchedBlockInterval: number;
  lockedTransactionsCheckInterval: number;
  blocksPerTick: number;
  ticker: string;
  scanCoinbaseTransactions: boolean;
  minimumFee: number;
  mixinLimits: MixinLimits;
  standardAddressLength: number;
  integratedAddressLength: number;
  derivePublicKey?: typeof derivePublicKey;
  generateKeyDerivation?: typeof generateKeyDerivation;
  generateRingSignatures?: typeof generateRingSignatures;
  deriveSecretKey?: typeof deriveSecretKey;
  generateKeyImage?: typeof generateKeyImage;
  checkRingSignatures?: typeof checkRingSignature;
  blockStoreMemoryLimit: number;
  blocksPerDaemonRequest: number;
  chainLaunchTimestamp: Date;
  devFeePercentage: number;
  devFeeAddress: string;
  priceApiLinks: PriceApiLink[];
  defaultDaemon: Daemon;
  defaultCache: string;
  repoLink: string;
  appName: string;
  sloganCreateScreen: string;
  appVersion: string;
  explorerBaseURL: string;
  appStoreLink: string;
  googlePlayLink: string;
  nodeListURL: string;
  nodeListURLs: string[];
  groupsListURL: string;

  constructor() {
    this.coinName = 'kryptokrona';
    this.uriPrefix = 'xkr://';
    this.walletSaveFrequency = 60 * 1000;
    this.decimalPlaces = 5;
    this.addressPrefix = 2239254;
    this.requestTimeout = 10 * 1000;
    this.blockTargetTime = 90;
    this.syncThreadInterval = 1000;
    this.daemonUpdateInterval = 10 * 1000;
    this.maxLastFetchedBlockInterval = 60 * 10;
    this.lockedTransactionsCheckInterval = 10 * 1000;
    this.blocksPerTick = 100;
    this.ticker = 'XKR';
    this.scanCoinbaseTransactions = false;
    this.minimumFee = 10;

    this.mixinLimits = new MixinLimits(
      [
        new MixinLimit(440000, 0, 100, 3),
        new MixinLimit(620000, 7),
        new MixinLimit(800000, 3),
      ],
      3,
    );

    this.standardAddressLength = 99;
    this.integratedAddressLength = 99 + (64 * 11) / 8;

    if (Platform.OS !== 'ios') {
      this.derivePublicKey = derivePublicKey;
      this.generateKeyDerivation = generateKeyDerivation;
      this.generateRingSignatures = generateRingSignatures;
      this.deriveSecretKey = deriveSecretKey;
      this.generateKeyImage = generateKeyImage;
      this.checkRingSignatures = checkRingSignature;
    }

    this.blockStoreMemoryLimit = 1024 * 1024 * 3;
    this.blocksPerDaemonRequest = 100;
    this.chainLaunchTimestamp = new Date(1557530788000);
    this.devFeePercentage = 0;
    this.devFeeAddress =
      'SEKReZ4pekEQHXy6iNMfy5EpurwrVNKgJHuokcyPbdTgQ7UwPanewoC1PmoGDUiYrDB1yLemoLEjTR5yueGXN67TKFXYYhtRgBM';

    this.priceApiLinks = [
      {
        path: ['quotes', 'USD', 'price'],
        url: 'https://api.coinpaprika.com/v1/tickers/xkr-kryptokrona',
      },
      {
        path: ['kryptokrona', 'usd'],
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=kryptokrona&vs_currencies=usd',
      },
    ];

    this.defaultDaemon = new Daemon('blocksum.org', 11898, false);
    this.defaultCache = 'https://techy.ddns.net';
    this.repoLink = 'https://github.com/kryptokrona/hugin-mobile/issues';
    this.appName = 'Hugin Messenger';
    this.sloganCreateScreen = 'A nordic cryptocurrency';
    this.appVersion = 'v1.5.0';
    this.explorerBaseURL =
      'https://explorer.kryptokrona.se/transaction.html?hash=';
    this.appStoreLink = '';
    this.googlePlayLink =
      'https://play.google.com/store/apps/details?id=com.hugin';
    this.nodeListURL =
      'https://raw.githubusercontent.com/kryptokrona/kryptokrona-public-nodes/master/nodes.json';
    this.nodeListURLs = [
      'https://raw.githubusercontent.com/kryptokrona/kryptokrona-public-nodes/master/nodes.json',
      'https://kryptokrona.se/nodes.json',
    ];
    this.groupsListURL =
      'https://raw.githubusercontent.com/kryptokrona/hugin-groups/main/groups.json';
  }
}

export const config = new Config();
