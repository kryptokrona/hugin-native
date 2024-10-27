This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

Make sure you have installed on your system:

- `CMake` >= 3.25.
- For Android, installing Android Studio is recommended (you can follow [React Native docs](https://reactnative.dev/docs/0.72/environment-setup?platform=android)), also make sure Android NDK version `25.1.8937393` is installed and set the `ANDROID_HOME` environment variable (see `Configure the ANDROID_HOME environment variable` section on React Native docs).

## Install Bare

Clone this repo follow these steps:

```sh
git submodule update --init --recursive
```

> [!NOTE]

<!-- > From now on, you should run `npx bare-dev vendor sync` after updating `bare` git submodule. -->

```sh
npm i -g bare-make
```

## Install node modules:

```sh
yarn install
```

```sh
yarn link
```

## Enable Expo plugin:

```sh
npx install-expo-modules@latest
```

> [!IMPORTANT]
> The first time you build bare, you need to append the `--configure` flag:
>
> ```sh
> npx hello-pear --configure
> ```

## Patch node modules:

```sh
yarn run patch
```

### Good to know

After linking assets with **npx react-native-asset** you need to run npx hello-pear configure again.
As well as when updating anything regarding bare.

### iOS simulator only

npx hello-pear --configure --ios-sim

### iOS simulator only with x64 architecture

npx hello-pear --configure --ios-sim x64

### iOS and iOS simulator

npx hello-pear --configure --ios --ios-sim arm64

### Android only arm archs

npx hello-pear --configure --android arm64 arm

### Android only arm64

npx hello-pear --configure --android arm64

### Android only x86 archs

npx hello-pear --configure --android x64 ia32

### help

hello-pear --help

> **Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
yarn android
```

### For iOS

Strongly suggest running through xcode

```bash
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Step 3: Modifying your App

Now that you have successfully run the app, let's modify it.

1. Open `App.tsx` in your text editor of choice and edit some lines.
2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

   For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

## Resolved problems iOS

Changing react-native-vector-icons to v 10.0.0. Carefully update this package in the future,
Duplicate symbols fix: pod 'Flipper-DoubleConversion', :podspec => '<https://github.com/facebook/flipper.git>' (?)
Duplicate symbols fix: gem "cocoapods-fix-react-native" (?)
**Duplicate symbols fix: Remove link to GDASYNC in pods -> TcpSockets -> Build phases -> Compile sources (Need to be done every time you run pod install) Awaiting permanent fix.**

Your Princess is in Another Castle!

Please consider installing 'jetifier' package before running 'jetify' command!

Fix by adding npx jetifier in postinstall
