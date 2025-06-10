import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { PaperProvider } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ReceiptProvider } from "../utils/ReceiptContext";
import { ChangeProvider } from "@/utils/ChangesContext";
import { OCRProvider } from "@/utils/OCRContext";
import { ContactsProvider } from "@/utils/ContactsContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const [loaded] = useFonts({
		SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
	});

	useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) {
		return null;
	}

	return (
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
								<Stack screenOptions={{ headerShown: false }}>
									<Stack.Screen name="home" />
									<Stack.Screen name="expense-splitter" />
									<Stack.Screen name="+not-found" />
								</Stack>
								<StatusBar style="auto" />
							</ThemeProvider>
						</PaperProvider>
					</GestureHandlerRootView>
					</ContactsProvider>
				</OCRProvider>
			</ChangeProvider>
		</ReceiptProvider>
	);
}
