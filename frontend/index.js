/*
 * TEMPORARY TESTFLIGHT STARTUP DIAGNOSTIC
 *
 * This must run before expo-router imports the route tree. Errors thrown while
 * that tree is being evaluated happen too early for Sentry or _layout.tsx to
 * observe them, which is why the iOS crash report only shows
 * RCTExceptionsManager without the original JavaScript message.
 */
const { Alert } = require('react-native');

const previousGlobalHandler = global.ErrorUtils?.getGlobalHandler?.();
let isShowingStartupError = false;

if (previousGlobalHandler) {
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    if (!isFatal || isShowingStartupError) {
      previousGlobalHandler(error, isFatal);
      return;
    }

    isShowingStartupError = true;
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    const diagnostic = `${message}\n\n${stack ?? 'No JavaScript stack was available.'}`;

    console.error('[startup diagnostic]', diagnostic);
    Alert.alert(
      'Divi startup error',
      diagnostic.slice(0, 3500),
      [
        {
          text: 'Close Divi',
          onPress: () => previousGlobalHandler(error, isFatal),
        },
      ],
      { cancelable: false }
    );
  });
}

require('expo-router/entry');
