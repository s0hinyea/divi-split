import {
  DefaultTheme,
  DarkTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { PaperProvider } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ChangeProvider } from "@/utils/ChangesContext";
import { OCRProvider } from "@/utils/OCRContext";
import { ProfileProvider, useProfile } from "@/utils/ProfileContext";
import { HistoryProvider, useHistory } from "@/utils/HistoryContext";
import AnimatedSplash from "@/components/AnimatedSplash";
import CompletionOverlay from "@/components/CompletionOverlay";
import NetworkBanner from "@/components/NetworkBanner";
import { SessionProvider, useSession } from "@/utils/SessionContext";
import { AppThemeProvider, useIsDark } from "@/utils/ThemeContext";
import { ToastProvider } from "@/components/ToastProvider";
import { CustomAlertProvider } from "@/components/CustomAlert";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Ignore — native splash screen may not be registered yet in Expo Go */
});

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    // Inter - modern UI font
    'Inter-Regular': require("../assets/fonts/Inter-Regular.otf"),
    'Inter-Medium': require("../assets/fonts/Inter-Medium.otf"),
    'Inter-SemiBold': require("../assets/fonts/Inter-SemiBold.otf"),
    'Inter-Bold': require("../assets/fonts/Inter-Bold.otf"),
    // Legacy fonts (keeping for gradual migration)
    TanMeringue: require("../assets/fonts/TanMeringue.otf"),
    OptimaRoman: require("../assets/fonts/OptimaRoman.otf"),
    Outfit: require("../assets/fonts/Outfit-VariableFont_wght.ttf"),
    WorkSans: require("../assets/fonts/WorkSans-Regular.ttf"),
    "WorkSans-Regular": require("../assets/fonts/WorkSans-Regular.ttf"),
    "WorkSans-Bold": require("../assets/fonts/WorkSans-Bold.ttf"),
    "WorkSans-SemiBold": require("../assets/fonts/WorkSans-SemiBold.ttf"),
    "WorkSans-Medium": require("../assets/fonts/WorkSans-Medium.ttf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <AppThemeProvider>
      <SessionProvider>
        <HistoryProvider>
          <ProfileProvider>
            <AppReadyGate loaded={loaded} />
          </ProfileProvider>
        </HistoryProvider>
      </SessionProvider>
    </AppThemeProvider>
  );
}

/**
 * Gates the splash screen until fonts, auth, profile, AND history data are all
 * loaded. A 5-second safety timeout ensures the app never gets stuck if the
 * network is slow or Supabase is unreachable.
 */
function AppReadyGate({ loaded }: { loaded: boolean }) {
  const { isLoading: sessionLoading } = useSession();
  const { loading: profileLoading } = useProfile();
  const { loading: historyLoading } = useHistory();
  const [splashComplete, setSplashComplete] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // Safety timeout — dismiss splash after 5s no matter what
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  // App is "ready" when everything loads OR when the timeout fires
  const appReady = timedOut || (loaded && !sessionLoading && !profileLoading && !historyLoading);

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync().catch(() => {
        /* Ignore — native splash screen may not be registered yet in Expo Go */
      });
    }
  }, [appReady]);

  if (!splashComplete) {
    return (
      <AnimatedSplash
        appReady={appReady}
        onComplete={() => setSplashComplete(true)}
      />
    );
  }

  if (sessionLoading && !timedOut) {
    return null;
  }

  return <RootShell />;
}

function RootShell() {
  const isDark = useIsDark();

  return (
    <ChangeProvider>
      <OCRProvider>
        <ToastProvider>
          <CustomAlertProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PaperProvider>
            <ThemeProvider
              value={isDark ? DarkTheme : DefaultTheme}
            >
              <Stack
                screenOptions={{
                  headerShown: false,
                  animation: "fade",
                  animationDuration: 150,
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="home" />
                <Stack.Screen
                  name="(tabs)"
                  options={{
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen name="auth" />
                <Stack.Screen name="scan" />
                <Stack.Screen name="library" />
                <Stack.Screen
                  name="result"
                  options={{ gestureEnabled: false }}
                />
                <Stack.Screen
                  name="assign"
                  options={{ gestureEnabled: false }}
                />
                <Stack.Screen name="contacts" />
                <Stack.Screen
                  name="review"
                  options={{ gestureEnabled: false }}
                />
                <Stack.Screen name="receipt/[id]" />
                <Stack.Screen name="+not-found" />
              </Stack>
              <StatusBar style={isDark ? "light" : "dark"} />
              <NetworkBanner />
              <CompletionOverlay />
            </ThemeProvider>
          </PaperProvider>
        </GestureHandlerRootView>
          </CustomAlertProvider>
        </ToastProvider>
      </OCRProvider>
    </ChangeProvider>
  );
}
