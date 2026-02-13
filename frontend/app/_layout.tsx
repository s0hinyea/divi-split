import {
  DarkTheme,
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
import { useColorScheme } from "@/hooks/useColorScheme";
import { ReceiptProvider } from "../utils/ReceiptContext";
import { ChangeProvider } from "@/utils/ChangesContext";
import { OCRProvider } from "@/utils/OCRContext";
import { ContactsProvider } from "@/utils/ContactsContext";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import AnimatedSplash from "@/components/AnimatedSplash";

// Create a session context
export const SessionContext = createContext<{
  session: Session | null;
  isLoading: boolean;
}>({
  session: null,
  isLoading: true,
});

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [splashComplete, setSplashComplete] = useState(false);

  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
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
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Set up auth subscription
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
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
      <ContactsProvider>
        <ReceiptProvider>
          <ChangeProvider>
            <OCRProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <PaperProvider>
                  <ThemeProvider
                    value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
                  >
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        animation: "fade",
                      }}
                    >
                      <Stack.Screen name="index" />
                      <Stack.Screen name="home" />
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="auth" />
                      <Stack.Screen name="scan" />
                      <Stack.Screen name="library" />
                      <Stack.Screen name="result" />
                      <Stack.Screen name="assign" />
                      <Stack.Screen name="contacts" />
                      <Stack.Screen name="review" />
                      <Stack.Screen name="+not-found" />
                    </Stack>
                    <StatusBar style="dark" />
                  </ThemeProvider>
                </PaperProvider>
              </GestureHandlerRootView>
            </OCRProvider>
          </ChangeProvider>
        </ReceiptProvider>
      </ContactsProvider>
    </SessionContext.Provider>
  );
}
