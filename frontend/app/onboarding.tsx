import React, { useState, useEffect, useRef } from "react";
import {
	View,
	Text,
	TextInput,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
	Alert,
	Animated,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/utils/ProfileContext";
import { useSession } from "@/utils/SessionContext";
import { colors, fonts, fontSizes, spacing } from "@/styles/theme";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

function FadeInView({ children, style }: { children: React.ReactNode; style?: object }) {
	const opacity = useRef(new Animated.Value(0)).current;
	useEffect(() => {
		Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
	}, []);
	return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

export default function Onboarding() {
	const router = useRouter();
	const { session } = useSession();
	const { updateProfile } = useProfile();

	const [step, setStep] = useState(1); // 1: username, 2: payment handles
	const [username, setUsername] = useState("");
	const [venmo, setVenmo] = useState("");
	const [cashapp, setCashapp] = useState("");
	const [checkingUsername, setCheckingUsername] = useState(false);
	const [isUsernameTaken, setIsUsernameTaken] = useState(false);
	const [loading, setLoading] = useState(false);

	const progressAnim = useRef(new Animated.Value(0.5)).current;

	const isUsernameValid =
		username.length >= 3 &&
		username.length <= 20 &&
		/^[a-z0-9_.]+$/.test(username) &&
		!isUsernameTaken;

	useEffect(() => {
		Animated.timing(progressAnim, {
			toValue: step === 1 ? 0.5 : 1,
			duration: 200,
			useNativeDriver: false,
		}).start();
	}, [step]);

	// Username availability check
	useEffect(() => {
		if (username.length < 3) {
			setIsUsernameTaken(false);
			return;
		}
		setCheckingUsername(true);
		const timer = setTimeout(async () => {
			try {
				const { data } = await supabase
					.from("profiles")
					.select("id")
					.eq("username", username.toLowerCase())
					.maybeSingle();
				setIsUsernameTaken(!!data);
			} catch {
				setIsUsernameTaken(false);
			} finally {
				setCheckingUsername(false);
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [username]);

	const sanitizeHandle = (handle: string, prefix: string) => {
		if (!handle.trim()) return null;
		const cleaned = handle.replace(/[^a-zA-Z0-9_-]/g, "");
		return cleaned ? `${prefix}${cleaned}` : null;
	};

	const handleContinue = () => {
		if (!isUsernameValid || checkingUsername) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
			return;
		}
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setStep(2);
	};

	const handleFinish = async () => {
		setLoading(true);
		try {
			const err = await updateProfile({
				username: username.toLowerCase().trim(),
				venmo_handle: sanitizeHandle(venmo, "@"),
				cashapp_handle: sanitizeHandle(cashapp, "$"),
			});

			if (err) {
				Alert.alert("Error", err);
				return;
			}

			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			router.replace("/(tabs)");
		} finally {
			setLoading(false);
		}
	};

	const displayName =
		session?.user?.user_metadata?.full_name ??
		session?.user?.email?.split("@")[0] ??
		"there";
	const firstName = displayName.split(" ")[0];

	return (
		<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.OS === "ios" ? "padding" : "height"}
			>
				<ScrollView
					contentContainerStyle={styles.scroll}
					keyboardShouldPersistTaps="handled"
				>
					{/* Progress */}
					<View style={styles.progressTrack}>
						<Animated.View
							style={[
								styles.progressBar,
								{
									width: progressAnim.interpolate({
										inputRange: [0, 1],
										outputRange: ["0%", "100%"],
									}),
									backgroundColor: isUsernameTaken ? colors.error : colors.green,
								},
							]}
						/>
					</View>

					<FadeInView key={step} style={styles.content}>
						{step === 1 ? (
							<>
								<Text style={styles.greeting}>Hey {firstName}! 👋</Text>
								<Text style={styles.title}>Pick your handle</Text>
								<Text style={styles.subtitle}>
									Your @id for bill splitting. 3-20 characters, letters, numbers,
									dots, underscores.
								</Text>

								<View style={styles.inputGroup}>
									<Text style={styles.prefix}>@</Text>
									<TextInput
										style={styles.input}
										placeholder="username"
										value={username}
										onChangeText={(t) =>
											setUsername(t.toLowerCase().replace(/[^a-z0-9_.]/g, ""))
										}
										autoFocus
										autoCapitalize="none"
										maxLength={20}
										onSubmitEditing={handleContinue}
									/>
									{checkingUsername && (
										<ActivityIndicator
											style={styles.inputIcon}
											size="small"
											color={colors.gray400}
										/>
									)}
									{!checkingUsername && username.length >= 3 && (
										<MaterialIcons
											name={isUsernameTaken ? "close" : "check-circle"}
											size={20}
											color={isUsernameTaken ? colors.error : colors.green}
											style={styles.inputIcon}
										/>
									)}
								</View>

								{username.length > 0 && username.length < 3 && (
									<Text style={styles.errorText}>
										Username must be at least 3 characters.
									</Text>
								)}
								{username.length >= 3 && !checkingUsername && (
									<Text
										style={[
											styles.statusText,
											{ color: isUsernameTaken ? colors.error : colors.green },
										]}
									>
										{isUsernameTaken ? "This handle is taken." : "Handle available!"}
									</Text>
								)}

								<TouchableOpacity
									style={[
										styles.btn,
										(!isUsernameValid || checkingUsername) && styles.btnDisabled,
									]}
									onPress={handleContinue}
									disabled={!isUsernameValid || checkingUsername}
								>
									<Text style={styles.btnText}>Continue</Text>
								</TouchableOpacity>
							</>
						) : (
							<>
								<Text style={styles.title}>Connect handles</Text>
								<Text style={styles.subtitle}>
									Speed up bill settlement. You can skip this and add them later in
									Settings.
								</Text>

								<View style={styles.inputGroup}>
									<MaterialIcons
										name="payment"
										size={20}
										color={colors.gray400}
										style={{ marginLeft: 15 }}
									/>
									<TextInput
										style={[styles.input, { flex: 1, backgroundColor: "transparent" }]}
										placeholder="Venmo @id"
										value={venmo}
										onChangeText={setVenmo}
										autoCapitalize="none"
										maxLength={30}
										autoFocus
									/>
								</View>

								<View style={[styles.inputGroup, { marginTop: 16 }]}>
									<Feather
										name="dollar-sign"
										size={20}
										color={colors.gray400}
										style={{ marginLeft: 15 }}
									/>
									<TextInput
										style={[styles.input, { flex: 1, backgroundColor: "transparent" }]}
										placeholder="CashApp $id"
										value={cashapp}
										onChangeText={setCashapp}
										autoCapitalize="none"
										maxLength={30}
									/>
								</View>

								<TouchableOpacity
									style={[styles.btn, loading && styles.btnDisabled]}
									onPress={handleFinish}
									disabled={loading}
								>
									{loading ? (
										<ActivityIndicator color="#FFF" />
									) : (
										<Text style={styles.btnText}>Finish Setup</Text>
									)}
								</TouchableOpacity>

								<TouchableOpacity
									style={styles.skipBtn}
									onPress={handleFinish}
									disabled={loading}
								>
									<Text style={styles.skipText}>Skip for now</Text>
								</TouchableOpacity>
							</>
						)}
					</FadeInView>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	scroll: {
		flexGrow: 1,
		paddingTop: spacing.xl,
		paddingHorizontal: spacing.xl,
		paddingBottom: 40,
	},
	progressTrack: {
		height: 6,
		backgroundColor: colors.gray100,
		borderRadius: 3,
		marginBottom: spacing.xl * 1.5,
	},
	progressBar: {
		height: "100%",
		borderRadius: 3,
	},
	content: {
		flex: 1,
	},
	greeting: {
		fontSize: fontSizes.lg,
		color: colors.gray500,
		fontFamily: fonts.body,
		marginBottom: 4,
	},
	title: {
		fontSize: 32,
		fontFamily: fonts.bodyBold,
		color: colors.black,
		marginBottom: 8,
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 16,
		color: colors.gray600,
		marginBottom: spacing.xl,
		lineHeight: 22,
		fontFamily: fonts.body,
	},
	inputGroup: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.gray100,
		borderRadius: 16,
		height: 60,
	},
	input: {
		flex: 1,
		paddingLeft: 35,
		fontSize: 16,
		fontFamily: fonts.body,
		color: colors.black,
	},
	prefix: {
		position: "absolute",
		left: 20,
		fontSize: 16,
		color: colors.gray400,
		zIndex: 1,
	},
	inputIcon: {
		position: "absolute",
		right: 18,
	},
	errorText: {
		fontSize: 13,
		color: colors.error,
		fontFamily: fonts.bodyMedium,
		marginTop: 8,
		marginLeft: 4,
	},
	statusText: {
		fontSize: 13,
		fontFamily: fonts.bodyMedium,
		marginTop: 10,
		marginLeft: 4,
	},
	btn: {
		marginTop: spacing.xl,
		backgroundColor: colors.black,
		borderRadius: 16,
		height: 64,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 10,
		elevation: 5,
	},
	btnDisabled: {
		opacity: 0.5,
	},
	btnText: {
		color: "#FFF",
		fontSize: 18,
		fontFamily: fonts.bodyBold,
	},
	skipBtn: {
		marginTop: 16,
		alignSelf: "center",
		paddingVertical: 10,
	},
	skipText: {
		fontSize: 15,
		color: colors.gray500,
		fontFamily: fonts.bodyMedium,
	},
});
