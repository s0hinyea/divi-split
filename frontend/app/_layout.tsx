import {
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, createContext } from "react";
import "react-native-reanimated";
import { PaperProvider } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ChangeProvider } from "@/utils/ChangesContext";
import { OCRProvider } from "@/utils/OCRContext";
import { ProfileProvider } from "@/utils/ProfileContext";
import { HistoryProvider } from "@/utils/HistoryContext";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import AnimatedSplash from "@/components/AnimatedSplash";
import CompletionOverlay from "@/components/CompletionOverlay";


export const SessionContext = createContext<{
  session: Session | null;
  isLoading: boolean;
}>({
  session: null,
  isLoading: true,
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* Ignore — native splash screen may not be registered yet in Expo Go */
});

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);

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

  useEffect(() => {

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Set up auth subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      if (event === 'PASSWORD_RECOVERY') {
        // Redirection handled by the router once it's ready, 
        // but often we need a small delay or to check if we're on the auth page
        console.log('Password recovery event detected');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {
        /* Ignore — native splash screen may not be registered yet in Expo Go */
      });
    }
  }, [loaded]);

  if (!loaded || isLoading) {
    return null;
  }

  if (!splashComplete) {
    return (
      <AnimatedSplash
        appReady={loaded && !isLoading}
        onComplete={() => setSplashComplete(true)}
      />
    );
  }

  return (
    <SessionContext.Provider value={{ session, isLoading }}>
      <ChangeProvider>
        <OCRProvider>
          <HistoryProvider>
            <ProfileProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <PaperProvider>
                  <ThemeProvider
                    value={DefaultTheme}
                  >
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        animation: "fade",
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
                      <Stack.Screen name="+not-found" />
                    </Stack>
                    <StatusBar style="dark" />
                    <CompletionOverlay />
                  </ThemeProvider>
                </PaperProvider>
              </GestureHandlerRootView>
            </ProfileProvider>
          </HistoryProvider>
        </OCRProvider>
      </ChangeProvider>
    </SessionContext.Provider>
  );
}
