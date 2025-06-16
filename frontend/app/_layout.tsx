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

	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
		TanMeringue: require("../assets/fonts/TanMeringue.otf"),
		OptimaRoman: require("../assets/fonts/OptimaRoman.otf"),
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

	return (
		<SessionContext.Provider value={{ session, isLoading }}>
			<ReceiptProvider>
				<ChangeProvider>
					<OCRProvider>
						<ContactsProvider>
							<GestureHandlerRootView style={{ flex: 1 }}>
								<PaperProvider>
									<ThemeProvider
										value={
											colorScheme === "dark"
												? DarkTheme
												: DefaultTheme
										}
									>
										<Stack
											screenOptions={{
												headerShown: false,
												animation: "default", // Basic animation
												// Options: 'default', 'fade', 'slide_from_right', 'slide_from_left', 'slide_from_bottom', 'none'
											}}
										>
											<Stack.Screen name="index" />
											<Stack.Screen name="home" />
											<Stack.Screen name="expense-splitter" />
											<Stack.Screen name="auth" />
											<Stack.Screen name="+not-found" />
										</Stack>
										<StatusBar style="inverted" />
									</ThemeProvider>
								</PaperProvider>
							</GestureHandlerRootView>
						</ContactsProvider>
					</OCRProvider>
				</ChangeProvider>
			</ReceiptProvider>
		</SessionContext.Provider>
	);
}
