import { View, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { SessionContext } from "./_layout";
import Auth from "../components/Auth";
import { Button, Icon, Text } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors, fonts, fontSizes } from '@/styles/theme';

export default function AccountPage() {
	const { session } = useContext(SessionContext);
	const router = useRouter();
	const { mode } = useLocalSearchParams();

	// Default to signup if no mode is provided
	const authMode = (mode as string) || "signup";
	const isSignUp = authMode === "signup";
	const isLogin = authMode === "login";

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.header}>
				<TouchableOpacity
					onPress={() => router.back()}
					style={styles.backButton}
				>
					<Icon source="arrow-left" size={24} color="#101010" />
				</TouchableOpacity>
				<Text style={styles.headerTitle}>
					{isLogin ? "Log In" : "Sign Up"}
				</Text>
			</View>

			<View style={styles.content}>
				<Auth initialMode={authMode} />
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		padding: 20,
	},
	backButton: {
		marginRight: 20,
	},
	headerTitle: {
		fontSize: fontSizes.lg,
		fontFamily: fonts.bodyBold,
		color: colors.black,
	},
	content: {
		flex: 1,
		padding: 20,
	},
});
