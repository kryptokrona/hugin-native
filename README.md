This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

Make sure you have installed on your system:

- `CMake` >= 3.25.
- For Android, installing Android Studio is recommended (you can follow [React Native docs](https://reactnative.dev/docs/0.72/environment-setup?platform=android)), also make sure Android NDK version `25.1.8937393` is installed and set the `ANDROID_HOME` environment variable (see `Configure the ANDROID_HOME environment variable` section on React Native docs).

## Install node modules:

The Bare worklet (`bare/`) depends on `hugin-network` (formerly published as hugin-p2p 2.x, a
different code base) and its proof of work `hugin-pow`, which are not published yet: check them
out next to this repository as `../xkr-work/hugin-p2p` (the hugin-network checkout) and
`../xkr-work/hugin-pow` before installing (`.npmrc` sets `install-links=true`, so they are
installed as copies, not symlinks; after changing either, `rm -rf node_modules/hugin-network
node_modules/hugin-pow` and install again).

The wallet libraries `kryptokrona-crypto` 2.0, `kryptokrona-utils` 1.5 and
`kryptokrona-wallet-backend-js` 2.7 are not published yet either: check out their `xkr-v2`
branches as `../kryptokrona-crypto`, `../kryptokrona-utils` and
`../kryptokrona-wallet-backend-js` and build them before installing. After changing one, run
`rm -rf node_modules/<package>` and install again (they are copies too). The `overrides` entries
make every package in the tree use the same copy. `hugin-crypto` 1.1 comes from
`../xkr-work/hugin-crypto` the same way (run `npm run build` there first).

Before a release, switch these checkouts to the published packages and make a fresh
`package-lock.json`: kryptokrona-crypto `^2.0.0`, kryptokrona-utils `^1.5.0`,
kryptokrona-wallet-backend-js `^2.7.0`, hugin-network `^3.0.0`, hugin-pow `^1.0.0` and
hugin-crypto `^1.1.0` (keep the `overrides` entries).

```sh
npm install
```

```sh
npm link
```

## Patch node modules:

```sh
npm run patch
```

## Get nodes

```sh
npm run getnodes
```

### Good to know

# Bundle

> [!NOTE]
> From now on, you should run `npx bundle <--release-android | --release-ios` after updating any files in `/bare` folder.
> TODO: Add more options in bin/bundle.js

### Wallet cryptography

The wallet libraries (`kryptokrona-wallet-backend-js`, `kryptokrona-utils`) use
`kryptokrona-crypto`. Metro resolves that package through its `react-native` field to
`dist/react-native.js`, which never loads the Node.js addon or the asm.js/WASM builds: every
primitive comes from kryptokrona-crypto's native module
`KryptokronaCrypto` (Rust crypto core behind a C++ Turbo Native Module, autolinked), wrapped in
`src/services/NativeTest.js`. The functions are listed in `src/config/wallet-config.js`;
the wallet backend hands them to `kryptokrona-crypto` (`new CryptoNote(..., cryptoConfig)` →
`Crypto.userCryptoFunctions`) when a wallet is created or opened. A primitive that is not
registered rejects with an error that names it. No patch of `kryptokrona-crypto` (or of
`bindings`, which only its addon loader used) is needed any more.

### P2P networking

Rooms, DMs and the hugin-node connection use upstream
[`hyperswarm`](https://github.com/holepunchto/hyperswarm) and
[`hyperdht`](https://github.com/holepunchto/hyperdht) with `hugin-network/swarm`, which adds the Hugin
`mid` (the local DHT public key signed with the topic base key, verified in both directions) to
the Noise handshake. The swarms run inside one `HuginP2P` from `hugin-network`; `bare/host.js`
is the host it talks to and `bare/main.js` routes React Native's requests into it.

The worklet and its host use these modules of `hugin-network` (`bare/adapter.js`, `bare/host.js`):

- `hugin-network/keys`: room invites (`group_random_key`), swarm keys and topics, admin signatures,
  the `idSig` identity signature and its (awaited) verification, the hugin-node firewall.
- `hugin-network/wire` and `hugin-network/sanitize`: every message on the `hugin-messages` channel is
  built with the library's builders (only what old hugin-desktop and hugin-native peers both
  accept is sent) and decoded and validated with `wire.decode` (what either old app sends is
  accepted; the library's `ban` flag decides when a peer is banned). Received message text and
  names go through `sanitizeText` (markup removed, entities decoded; other text unchanged).
- `hugin-network/pow` (on hugin-pow): the job tracker, the `powsig:v2` auth and the retry
  policy. The worklet's PoW backend is two host hooks in `bare/host.js`: `findShare` (one slice of
  the share search, answered by the React Native native module through `pow-find-share`,
  kryptokrona-crypto `findPowShare`) and `powHash` (`cn-turtle-lite-slow-hash-v2`, which hugin-pow
  uses to check the module against its reference vector and to check every share).
- `hugin-network/push`: hugin-node packets (sync, job requests, posts, push registrations; packets
  the node would refuse or ban for are not sent) and the room push / registration payloads.

A DM swarm keeps one connection (`maxPeers: 1`) and admits only the contact: the peer's identity
is known once its `joined` arrives and its `idSig` has been verified; a verified peer with another
address (for example the user's own other device, which derives the same topic) is closed and its
DHT key refused by the swarm's firewall from then on. Until the contact is verified nothing but
`joined` is taken from a DM connection.

The bare-rpc events to React Native are unchanged.

### Tests for the worklet glue

`bare/test/` holds [brittle](https://github.com/holepunchto/brittle) tests for the worklet's
adapter, host, request routing and event table (no device needed):

```sh
npm run test:bare                 # needs `bare` on PATH
npx brittle bare/test/*.test.js   # the same tests on Node
```

`node test/dm-crypto.js` (Node.js 22.5 or later) runs direct messages between two and three users
through the app's wallet, sync, push and database code, and hugin-crypto's message API between
two wallets (create, then open with the recipient's own address); `npm run test:native-crypto` checks
`src/services/NativeTest.js` against kryptokrona-crypto's Node-API addon.

> **Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

Strongly suggest running through xcode

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Step 3: Modifying your App

Now that you have successfully run the app, let's modify it.

1. Open `App.tsx` in your text editor of choice and edit some lines.
2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

   For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [Introduction to React Native](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

## Resolved problems iOS

Changing react-native-vector-icons to v 10.0.0. Carefully update this package in the future,
Duplicate symbols fix: pod 'Flipper-DoubleConversion', :podspec => '<https://github.com/facebook/flipper.git>' (?)
Duplicate symbols fix: gem "cocoapods-fix-react-native" (?)
**Duplicate symbols fix: Remove link to GDASYNC in pods -> TcpSockets -> Build phases -> Compile sources (Need to be done every time you run pod install) Awaiting permanent fix.**

Fix issue with iOS: node_modules/@supersami

let eventEmitter
if (Platform.OS === 'android') {
eventEmitter = new NativeEventEmitter(ForegroundServiceModule);
}
export function setupServiceErrorListener({onServiceFailToStart, alert}) {
// const listener = eventEmitter.addListener('onServiceError', message => {
// alert && Alert.alert('Service Error', message);
// if (onServiceFailToStart) {
// onServiceFailToStart();
// }
// stop();
// });

// return () => {
// listener.remove();
// };
return false;
}
