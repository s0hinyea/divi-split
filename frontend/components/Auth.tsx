import React, { useState } from "react";
import {
	Alert,
	StyleSheet,
	View,
	AppState,
	TouchableOpacity,
	Text,
	TextInput,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";
import Colors from "../constants/Colors";

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` or `SIGNED_OUT` event
// if the user's session is terminated. This should only be registered once.
AppState.addEventListener("change", (state) => {
	if (state === "active") {
		supabase.auth.startAutoRefresh();
	} else {
		supabase.auth.stopAutoRefresh();
	}
});

interface AuthProps {
	initialMode?: string;
}

export default function Auth({ initialMode }: AuthProps) {
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const router = useRouter();
	const isSignUp = initialMode === "signup";

	async function signInWithEmail() {
		setLoading(true);

		const { error } = await supabase.auth.signInWithPassword({
			email: email,
			password: password,
		});

		if (error) {
			Alert.alert("Error", error.message);
		} else {
			// Successfully signed in, navigate to expense splitter
			router.replace("/(tabs)");
		}

		setLoading(false);
	}

	async function signUpWithEmail() {
		setLoading(true);

		// Validate required fields for signup
		if (!fullName.trim()) {
			Alert.alert("Error", "Please enter your full name");
			setLoading(false);
			return;
		}

		if (!email.trim()) {
			Alert.alert("Error", "Please enter your email");
			setLoading(false);
			return;
		}

		if (!password.trim()) {
			Alert.alert("Error", "Please enter your password");
			setLoading(false);
			return;
		}

		const {
			data: { user },
			error,
		} = await supabase.auth.signUp({
			email: email,
			password: password,
			options: {
				data: {
					full_name: fullName.trim(),
				},
			},
		});

		if (error) {
			Alert.alert("Error", error.message);
		} else if (user) {
			// Check if email confirmation is required
			if (user.email_confirmed_at) {
				// Email is already confirmed, navigate to expense splitter
				router.replace("/(tabs)");
			} else {
				Alert.alert(
					"Success",
					"Please check your inbox for email verification!"
				);
			}
		}

		setLoading(false);
	}

	return (
		<View style={styles.container}>
			{isSignUp && (
				<View style={[styles.verticallySpaced]}>
					<Text style={styles.label}>Full Name</Text>
					<TextInput
						style={styles.input}
						onChangeText={(text) => setFullName(text)}
						value={fullName}
						placeholder="John Doe"
						placeholderTextColor="#a0a0a0"
					/>
				</View>
			)}
			<View style={[styles.verticallySpaced]}>
				<Text style={styles.label}>Email</Text>
				<TextInput
					style={styles.input}
					onChangeText={(text) => setEmail(text)}
					value={email}
					placeholder="email@address.com"
					placeholderTextColor="#a0a0a0"
					autoCapitalize="none"
				/>
			</View>
			<View style={styles.verticallySpaced}>
				<Text style={styles.label}>Password</Text>
				<TextInput
					style={styles.input}
					onChangeText={(text) => setPassword(text)}
					value={password}
					secureTextEntry={true}
					placeholder="Password"
					placeholderTextColor="#a0a0a0"
					autoCapitalize="none"
				/>
			</View>
			{!isSignUp && (
				<View style={[styles.verticallySpaced]}>
					<TouchableOpacity
						style={styles.button}
						onPress={() => signInWithEmail()}
						disabled={loading}
					>
						<Text style={styles.buttonText}>Log In</Text>
					</TouchableOpacity>
				</View>
			)}
			{isSignUp && (
				<View style={styles.verticallySpaced}>
					<TouchableOpacity
						style={styles.button}
						onPress={() => signUpWithEmail()}
						disabled={loading}
					>
						<Text style={styles.buttonText}>Sign Up</Text>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	verticallySpaced: {
		paddingTop: 4,
		paddingBottom: 4,
		alignSelf: "stretch",
	},
	label: {
		fontSize: 16,
		fontFamily: "OptimaRoman",
		color: Colors.black,
		marginBottom: 8,
		fontWeight: "bold",
		marginTop: 10,
	},
	input: {
		backgroundColor: "#fafafa",
		borderRadius: 20,
		borderWidth: 1,
		borderColor: "#dddddd",
		padding: 16,
		fontSize: 16,
		fontFamily: "OptimaRoman",
		color: "#0a0a0a",
	},
	button: {
		marginTop: 40,
		width: "100%",
		height: 50,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f66b00",
		borderRadius: 20,
	},
	buttonText: {
		color: "#f0f0f0",
		fontSize: 20,
		fontFamily: "OptimaRoman",
		fontWeight: "bold",
	},
});
