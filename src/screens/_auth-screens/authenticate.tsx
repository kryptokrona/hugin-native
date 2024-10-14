// export async function Authenticate(
//   navigation: any,
//   subtitle: string,
//   finishFunction: any,
//   disableBack = false,
// ) {
//   // No auth, just go straight to the finish function
//   if (globals.preferences.authenticationMethod === 'none') {
//     finishFunction(navigation);
//     return;
//   }

//   let route = 'RequestPin';

//   try {
//     // const sensorType = await FingerprintScanner.isSensorAvailable();

//     // User wants to use hardware authentication, and we have it available
//     if (globals.preferences.authenticationMethod === 'hardware-auth') {
//       route = 'RequestHardwareAuth';
//     }
//   } catch (err) {
//     // No fingerprint sensor
//   }

//   if (disableBack) {
//     navigation.dispatch(
//       CommonActions.reset({
//         index: 0,
//         routes: [{ name: route, params: { finishFunction, subtitle } }],
//       }),
//     );

//     // navigation.dispatch(
//     //   navigateWithDisabledBack(route, {
//     //     finishFunction,
//     //     subtitle,
//     //   }),
//     // );
//   } else {
//     navigation.navigate(route, {
//       finishFunction,
//       subtitle,
//     });
//   }
// }
