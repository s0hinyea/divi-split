import { View, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from "react-native";
import Auth from "../components/Auth";
import { useLocalSearchParams } from "expo-router";
import { colors, spacing } from '@/styles/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function AccountPage() {
	const { mode } = useLocalSearchParams();

	// Default to signup if no mode is provided
	const authMode = (mode as string) || "signup";

	return (
		<View style={styles.container}>
			<LinearGradient
				colors={['#FFFFFF', '#F8FFF8', '#F2F9F2']}
				style={StyleSheet.absoluteFillObject}
			/>

			<SafeAreaView style={styles.safeArea}>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
					style={styles.keyboardView}
				>
					<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
						<View style={styles.inner}>
							{/* 
								The Auth component now manages its own steps, 
								titles, headers, and navigation between steps.
							*/}
							<Auth initialMode={authMode} />
						</View>
					</TouchableWithoutFeedback>
				</KeyboardAvoidingView>
			</SafeAreaView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
	},
	safeArea: {
		flex: 1,
	},
	keyboardView: {
		flex: 1,
	},
	inner: {
		flex: 1,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.md,
	},
});
