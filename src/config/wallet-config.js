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
  cnFastHash,
  secretKeyToPublicKey,
  scReduce32,
  checkKey,
  hashToEllipticCurve,
  generateSignature,
  checkSignature,
  hashToScalar,
  underivePublicKey,
  generateKeys,
} from '../services/NativeTest';

class walletConfig {
  constructor() {
    /**
     * If you can't figure this one out, I don't have high hopes
     */
    this.coinName = 'kryptokrona';

    /**
     * Prefix for URI encoded addresses
     */
    this.uriPrefix = 'xkr://';

    /**
     * How often to save the wallet, in milliseconds
     */
    this.walletSaveFrequency = 60 * 1000;

    /**
     * The amount of decimal places your coin has, e.g. TurtleCoin has two
     * decimals
     */
    this.decimalPlaces = 5;

    /**
     * The address prefix your coin uses - you can find this in CryptoNoteConfig.h.
     * In TurtleCoin, this converts to TRTL
     */
    this.addressPrefix = 2239254;

    /**
     * Request timeout for daemon operations in milliseconds
     */
    this.requestTimeout = 2 * 1000;

    /**
     * The block time of your coin, in seconds
     */
    this.blockTargetTime = 90;

    /**
     * How often to process blocks, in millseconds
     */
    this.syncThreadInterval = 1000;

    /**
     * How often to update the daemon info, in milliseconds
     */
    this.daemonUpdateInterval = 10 * 1000;

    /**
     * After how long the "deadnode" event will be emitted
     */
    this.maxLastFetchedBlockInterval = 60 * 10;

    /**
     * How often to check on locked transactions
     */
    this.lockedTransactionsCheckInterval = 10 * 1000;

    /**
     * The amount of blocks to process per 'tick' of the mainloop. Note: too
     * high a value will cause the event loop to be blocked, and your interaction
     * to be laggy.
     */
    this.blocksPerTick = 100;

    /**
     * Your coins 'ticker', generally used to refer to the coin, i.e. 123 TRTL
     */
    this.ticker = 'XKR';

    /**
     * Most people haven't mined any blocks, so lets not waste time scanning
     * them
     */
    this.scanCoinbaseTransactions = false;

    /**
     * The minimum fee allowed for transactions, in ATOMIC units
     */
    this.minimumFee = 10;

    /**
     * Mapping of height to mixin maximum and mixin minimum
     */
    this.mixinLimits = new MixinLimits(
      [
        /* Height: 440,000, minMixin: 0, maxMixin: 100, defaultMixin: 3 */
        new MixinLimit(440000, 0, 100, 3),

        /* At height of 620000, static mixin of 7 */
        new MixinLimit(620000, 7),

        /* At height of 800000, static mixin of 3 */
        new MixinLimit(800000, 3),
      ],
      3 /* Default mixin of 3 before block 440,000 */,
    );

    /**
     * The length of a standard address for your coin
     */
    this.standardAddressLength = 99;

    /**
     * The length of an integrated address for your coin - It's the same as
     * a normal address, but there is a paymentID included in there - since
     * payment ID's are 64 chars, and base58 encoding is done by encoding
     * chunks of 8 chars at once into blocks of 11 chars, we can calculate
     * this automatically
     */
    this.integratedAddressLength = 99 + (64 * 11) / 8;

    /**
     * Use our native func instead of JS slowness
     */
    this.derivePublicKey = derivePublicKey;
    this.generateKeyDerivation = generateKeyDerivation;
    this.generateRingSignatures = generateRingSignatures;
    this.deriveSecretKey = deriveSecretKey;
    this.generateKeyImage = generateKeyImage;
    this.checkRingSignature = checkRingSignature;
    this.derivePublicKey = derivePublicKey;
    this.generateKeyDerivation = generateKeyDerivation;
    this.generateRingSignatures = generateRingSignatures;
    this.deriveSecretKey = deriveSecretKey;
    this.generateKeyImage = generateKeyImage;
    this.cnFastHash = cnFastHash;
    this.secretKeyToPublicKey = secretKeyToPublicKey;
    this.scReduce32 = scReduce32;
    this.checkKey = checkKey;
    this.hashToEllipticCurve = hashToEllipticCurve;
    this.generateSignature = generateSignature;
    this.checkSignature = checkSignature;
    this.hashToScalar = hashToScalar;
    this.underivePublicKey = underivePublicKey;
    this.generateKeys = generateKeys;
    /**
     * Memory to use for storing downloaded blocks - 3MB
     */
    this.blockStoreMemoryLimit = 1024 * 1024 * 3;

    /**
     * Amount of blocks to request from the daemon at once
     */
    this.blocksPerDaemonRequest = 100;

    /**
     * Unix timestamp of the time your chain was launched.
     *
     * Note - you may want to manually adjust this. Take the current timestamp,
     * take away the launch timestamp, divide by block time, and that value
     * should be equal to your current block count. If it's significantly different,
     * you can offset your timestamp to fix the discrepancy
     */
    this.chainLaunchTimestamp = new Date(1557530788000);

    /**
     * Fee to take on all transactions, in percentage
     */
    this.devFeePercentage = 0;

    /**
     * Address to send dev fee to
     */
    this.devFeeAddress =
      'SEKReZ4pekEQHXy6iNMfy5EpurwrVNKgJHuokcyPbdTgQ7UwPanewoC1PmoGDUiYrDB1yLemoLEjTR5yueGXN67TKFXYYhtRgBM';

    /**
     * Base url for price API
     *
     * The program *should* fail gracefully if your coin is not supported, or
     * you just set this to an empty string. If you have another API you want
     * it to support, you're going to have to modify the code in Currency.
     */
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

    /**
     * Default daemon to use. Can either be a BlockchainCacheApi(baseURL, SSL),
     * or a ConventionalDaemon(url, port).
     */
    this.defaultDaemon = new Daemon('blocksum.org', 11898, false);

    /**
     * Default Hugin Cache to use.
     */
    this.defaultCache = 'https://techy.ddns.net';

    /**
     * A link to where a bug can be reported for your wallet. Please update
     * this if you are forking, so we don't get reported bugs for your wallet...
     *
     */
    this.repoLink = 'https://github.com/kryptokrona/hugin-mobile/issues';

    /**
     * This only controls the name in the settings screen.
     */
    this.appName = 'Hugin';

    /**
     * Slogan phrase during wallet CreateScreen
     */
    this.sloganCreateScreen = 'A nordic cryptocurrency';

    /**
     * Displayed in the settings screen
     */
    this.appVersion = 'v1.5.0';

    /**
     * Base URL for us to chuck a hash on the end, and find a transaction
     */
    this.explorerBaseURL =
      'https://explorer.kryptokrona.se/transaction.html?hash=';

    /**
     * A link to your app on the Apple app store. Currently blank because we
     * haven't released for iOS yet...
     */
    this.appStoreLink = '';

    /**
     * A url to fetch node info from. Should follow the turtlepay format
     * detailed here: https://docs.turtlepay.io/blockapi/
     */
    this.nodeListURL =
      'https://raw.githubusercontent.com/kryptokrona/kryptokrona-public-nodes/refs/heads/main/nodes.json';
    this.nodeListURLs = [
      'https://raw.githubusercontent.com/kryptokrona/kryptokrona-public-nodes/refs/heads/main/nodes.json',
      'https://kryptokrona.se/nodes.json',
    ];

    /**
     * A Url to fetch Hugin Caches from.
     */
    this.groupsListURL =
      'https://raw.githubusercontent.com/kryptokrona/hugin-groups/main/groups.json';
  }
}

export const WalletConfig = new walletConfig();
