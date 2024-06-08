This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

Make sure you have installed on your system:

- `CMake` >= 3.25.
- For Android, installing Android Studio is recommended (you can follow [React Native docs](https://reactnative.dev/docs/0.72/environment-setup?platform=android)), also make sure Android NDK version `25.1.8937393` is installed and set the `ANDROID_HOME` environment variable (see `Configure the ANDROID_HOME environment variable` section on React Native docs).

# Install Bare

Clone this repo follow these steps:

```sh
git submodule update --init --recursive
```

Enable Expo plugin:

```sh
npx install-expo-modules@latest
```

> [!NOTE]
> From now on, you should run `npx bare-dev vendor sync` after updating `bare` git submodule.

Now install all the dependencies running `npm install` or your package manager of preference.

For ease we added a helper script you can simply install running `npm link` in the project's root -or `bin/hello-pear.js` or npx `hello-pear`-.

> [!IMPORTANT]
> The first time you run it you need to append the `--configure` flag:
>
> ```sh
> npx hello-pear --configure
> ```

> **Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Updating hello pear stuff

# iOS simulator only

npx hello-pear --configure --ios-sim

# iOS simulator only with x64 architecture

npx hello-pear --configure --ios-sim x64

# iOS and iOS simulator

npx hello-pear --configure --ios --ios-sim arm64

# Android only arm archs

npx hello-pear --configure --android arm64 arm

# Android only arm64

npx hello-pear --configure --android arm64

# Android only x86 archs

npx hello-pear --configure --android x64 ia32

# help

hello-pear --help

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
