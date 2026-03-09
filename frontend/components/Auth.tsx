import React, { useState, useRef, useEffect } from "react";
import {
	Alert,
	StyleSheet,
	View,
	AppState,
	TouchableOpacity,
	Text,
	TextInput,
	ActivityIndicator,
	Dimensions,
	Keyboard,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter } from "expo-router";
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { 
	useSharedValue, 
	useAnimatedStyle, 
	withTiming, 
	FadeIn, 
	FadeOut,
} from 'react-native-reanimated';

const { width: SCREEN_W } = Dimensions.get('window');

// Automatically refresh if foreground
AppState.addEventListener("change", (state) => {
	if (state === "active") supabase.auth.startAutoRefresh();
	else supabase.auth.stopAutoRefresh();
});

interface AuthProps {
	initialMode?: string;
}

// Password Strength Logic
function getPasswordStrength(p: string) {
	if (!p) return { level: 0, label: '', color: colors.gray300 };
	let s = 0;
	if (p.length >= 8) s++;
	if (/[A-Z]/.test(p)) s++;
	if (/[0-9]/.test(p)) s++;
	if (/[^A-Za-z0-9]/.test(p)) s++;
	if (s <= 1) return { level: 1, label: 'Weak', color: colors.error };
	if (s <= 2) return { level: 2, label: 'Fair', color: colors.warning };
	if (s <= 3) return { level: 3, label: 'Good', color: '#4CAF50' };
	return { level: 4, label: 'Strong', color: colors.green };
}

export default function Auth({ initialMode }: AuthProps) {
	// Sign-up Steps: 1: Name, 2: Email, 3: Password, 4: Username, 5: Payment Handles
	const [step, setStep] = useState(1);
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [username, setUsername] = useState("");
	const [venmo, setVenmo] = useState("");
	const [cashapp, setCashapp] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [checkingUsername, setCheckingUsername] = useState(false);
	const [isUsernameTaken, setIsUsernameTaken] = useState(false);
	
	const router = useRouter();
	const isSignUp = initialMode === "signup";
	const progress = useSharedValue(0.2); // Start at 20%

	useEffect(() => {
		if (isSignUp) progress.value = withTiming(step / 5, { duration: 300 });
		else progress.value = withTiming(1, { duration: 300 });
	}, [step, isSignUp]);

	// Username Availability Check
	useEffect(() => {
		const checkUsername = async () => {
			if (username.length < 3) return;
			setCheckingUsername(true);
			const { data } = await supabase
				.from('profiles')
				.select('id')
				.eq('username', username.toLowerCase())
				.maybeSingle();
			setIsUsernameTaken(!!data);
			setCheckingUsername(false);
		};
		const timer = setTimeout(checkUsername, 500);
		return () => clearTimeout(timer);
	}, [username]);

	const nextStep = () => {
		if (step === 1 && !fullName.trim()) return Alert.alert("Wait!", "What's your full name?");
		if (step === 2 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Alert.alert("Wait!", "Please enter a valid email.");
		if (step === 3 && password.length < 6) return Alert.alert("Wait!", "Password must be at least 6 characters.");
		if (step === 4 && (username.length < 3 || isUsernameTaken)) return; 
		
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setStep(s => s + 1);
	};

	const prevStep = () => {
		if (step > 1) {
			setStep(s => s - 1);
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		} else {
			router.back();
		}
	};

	const performSignUp = async () => {
		setLoading(true);
		const { data: { user }, error } = await supabase.auth.signUp({
			email: email.trim(),
			password,
			options: {
				data: {
					full_name: fullName.trim(),
					username: username.toLowerCase().trim(),
					venmo_handle: venmo ? (venmo.startsWith('@') ? venmo : `@${venmo}`) : null,
					cashapp_handle: cashapp ? (cashapp.startsWith('$') ? cashapp : `$${cashapp}`) : null,
				}
			}
		});

		if (error) {
			Alert.alert("Error", error.message);
		} else if (user) {
			if (user.email_confirmed_at) {
				// Already confirmed (e.g. confirmations disabled), go straight in
				router.replace("/(tabs)");
			} else {
				// Account created but not verified — send to login
				Alert.alert(
					"Check Your Email ✉️",
					"We sent a verification link to your inbox. Once verified, come back and log in!",
					[{
						text: "Go to Login",
						onPress: () => router.replace({ pathname: "/auth", params: { mode: "login" } }),
					}]
				);
			}
		}
		setLoading(false);
	};

	const resendVerification = async () => {
		const { error } = await supabase.auth.resend({
			type: 'signup',
			email: email.trim(),
		});
		if (error) Alert.alert("Error", error.message);
		else Alert.alert("Email Sent ✉️", "Check your inbox for a new verification link.");
	};

	const performLogin = async () => {
		setLoading(true);
		const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
		
		if (error) {
			if (error.message.includes("Email not confirmed")) {
				// State 2: Account exists but not verified
				Alert.alert(
					"Email Not Verified",
					"You need to verify your email before logging in. Check your inbox or resend the link.",
					[
						{ text: "Resend Email", onPress: resendVerification },
						{ text: "OK", style: "cancel" },
					]
				);
			} else {
				Alert.alert("Login Failed", error.message);
			}
		} else {
			router.replace("/(tabs)");
		}
		setLoading(false);
	};

	const progressStyle = useAnimatedStyle(() => ({
		width: `${progress.value * 100}%`,
		backgroundColor: isUsernameTaken && step === 4 ? colors.error : colors.green,
	}));

	return (
		<View style={styles.container}>
			{/* Persistent Header */}
			<View style={styles.header}>
				<TouchableOpacity onPress={prevStep} style={styles.backBtn}>
					<MaterialIcons name="arrow-back" size={24} color={colors.black} />
				</TouchableOpacity>
				{isSignUp && (
					<View style={styles.stepIndicator}>
						<Text style={styles.stepText}>Step {step} of 5</Text>
					</View>
				)}
			</View>

			{/* Progress Bar */}
			{isSignUp && (
				<View style={styles.progressTrack}>
					<Animated.View style={[styles.progressBar, progressStyle]} />
				</View>
			)}

			<View style={styles.content}>
				{isSignUp ? (
					<Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stepContainer} key={step}>
						{step === 1 && (
							<>
								<Text style={styles.title}>Who are you?</Text>
								<Text style={styles.subtitle}>Enter your name as it appears to friends.</Text>
								<TextInput style={styles.input} placeholder="e.g. John Doe" value={fullName} onChangeText={setFullName} autoFocus returnKeyType="next" onSubmitEditing={nextStep} />
							</>
						)}

						{step === 2 && (
							<>
								<Text style={styles.title}>What's your email?</Text>
								<Text style={styles.subtitle}>Let's link your account together.</Text>
								<TextInput style={styles.input} placeholder="email@address.com" value={email} onChangeText={setEmail} autoFocus autoCapitalize="none" keyboardType="email-address" onSubmitEditing={nextStep} />
							</>
						)}

						{step === 3 && (
							<>
								<Text style={styles.title}>Secure your account</Text>
								<Text style={styles.subtitle}>Use at least 8 characters for better safety.</Text>
								<View style={styles.inputGroup}>
									<TextInput style={[styles.input, { flex: 1 }]} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoFocus onSubmitEditing={nextStep} />
									<TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
										<Feather name={showPassword ? "eye" : "eye-off"} size={20} color={colors.gray400} />
									</TouchableOpacity>
								</View>
								<View style={styles.strengthMeter}>
									{[1, 2, 3, 4].map(l => (
										<View key={l} style={[styles.strengthBar, { backgroundColor: getPasswordStrength(password).level >= l ? getPasswordStrength(password).color : colors.gray200 }]} />
									))}
								</View>
							</>
						)}

						{step === 4 && (
							<>
								<Text style={styles.title}>Unique handle</Text>
								<Text style={styles.subtitle}>Your @id for bill splitting.</Text>
								<View style={styles.inputGroup}>
									<Text style={styles.prefix}>@</Text>
									<TextInput style={[styles.input, { flex: 1, paddingLeft: 35 }]} placeholder="username" value={username} onChangeText={t => setUsername(t.toLowerCase().replace(/[^a-z0-9_.]/g, ''))} autoFocus autoCapitalize="none" maxLength={20} onSubmitEditing={nextStep} />
									{checkingUsername && <ActivityIndicator style={styles.spinner} size="small" color={colors.gray400} />}
								</View>
								{username.length >= 3 && <Text style={[styles.status, { color: isUsernameTaken ? colors.error : colors.green }]}>{isUsernameTaken ? "This handle is taken." : "Handle available!"}</Text>}
							</>
						)}

						{step === 5 && (
							<>
								<Text style={styles.title}>Connect handles</Text>
								<Text style={styles.subtitle}>Speed up bill settlement (optional).</Text>
								<View style={styles.inputGroup}>
									<MaterialIcons name="payment" size={20} color={colors.gray400}  style={{marginLeft: 15}}/>
									<TextInput style={[styles.input, { flex: 1, backgroundColor: 'transparent' }]} placeholder="Venmo @id" value={venmo} onChangeText={setVenmo} autoCapitalize="none" />
								</View>
								<View style={[styles.inputGroup, { marginTop: 15 }]}>
									<Feather name="dollar-sign" size={20} color={colors.gray400} style={{marginLeft: 15}}/>
									<TextInput style={[styles.input, { flex: 1, backgroundColor: 'transparent' }]} placeholder="CashApp $id" value={cashapp} onChangeText={setCashapp} autoCapitalize="none" />
								</View>
							</>
						)}

						<TouchableOpacity 
							style={[styles.btn, (loading || (step === 4 && (username.length < 3 || isUsernameTaken))) && styles.btnDisabled]} 
							onPress={step === 5 ? performSignUp : nextStep}
							disabled={loading || (step === 4 && (username.length < 3 || isUsernameTaken))}
						>
							{loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>{step === 5 ? "Create Account" : "Continue"}</Text>}
						</TouchableOpacity>
						
						{step === 1 && (
							<View style={styles.toggleRow}>
								<Text style={styles.smallText}>Already have an account? </Text>
								<TouchableOpacity onPress={() => router.replace({ pathname: "/auth", params: { mode: "login" } })}>
									<Text style={styles.toggleLink}>Log In</Text>
								</TouchableOpacity>
							</View>
						)}
					</Animated.View>
				) : (
					<Animated.View entering={FadeIn} style={styles.stepContainer}>
						<Text style={styles.title}>Log In</Text>
						<Text style={styles.subtitle}>Enter your credentials to continue.</Text>
						<TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
						<TextInput style={[styles.input, { marginTop: 15 }]} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
						<TouchableOpacity style={styles.btn} onPress={performLogin} disabled={loading}>
							{loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Log In</Text>}
						</TouchableOpacity>
						<View style={styles.toggleRow}>
							<Text style={styles.smallText}>New here? </Text>
							<TouchableOpacity onPress={() => router.replace({ pathname: "/auth", params: { mode: "signup" } })}>
								<Text style={styles.toggleLink}>Join Divi</Text>
							</TouchableOpacity>
						</View>
					</Animated.View>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: spacing.md },
	backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.gray100, justifyContent: 'center', alignItems: 'center' },
	stepIndicator: { paddingRight: 4 },
	stepText: { fontSize: 13, color: colors.gray500, fontFamily: fonts.bodyMedium },
	progressTrack: { height: 6, backgroundColor: colors.gray100, borderRadius: 3, marginBottom: spacing.xl },
	progressBar: { height: '100%', borderRadius: 3 },
	content: { flex: 1 },
	stepContainer: { flex: 1 },
	title: { fontSize: 32, fontFamily: fonts.bodyBold, color: colors.black, marginBottom: 8, letterSpacing: -0.5 },
	subtitle: { fontSize: 16, color: colors.gray600, marginBottom: spacing.xl, lineHeight: 22 },
	input: { backgroundColor: colors.gray100, borderRadius: 12, padding: 18, fontSize: 17, fontFamily: fonts.body, color: colors.black },
	inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gray100, borderRadius: 12 },
	eyeIcon: { paddingRight: 18 },
	prefix: { position: 'absolute', left: 18, fontSize: 17, color: colors.gray400, zIndex: 1 },
	spinner: { position: 'absolute', right: 18 },
	status: { fontSize: 13, fontFamily: fonts.bodyMedium, marginTop: 10, marginLeft: 4 },
	strengthMeter: { flexDirection: 'row', gap: 4, marginTop: 12, paddingHorizontal: 4 },
	strengthBar: { flex: 1, height: 4, borderRadius: 2 },
	btn: {
		marginTop: spacing.xl,
		backgroundColor: colors.black,
		borderRadius: 16,
		height: 64,
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 10,
		elevation: 5,
	},
	btnDisabled: { opacity: 0.5 },
	btnText: { color: '#FFF', fontSize: 18, fontFamily: fonts.bodyBold },
	toggleRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 30 },
	smallText: { fontSize: 15, color: colors.gray500, fontFamily: fonts.body },
	toggleLink: { fontSize: 15, color: colors.green, fontFamily: fonts.bodyBold },
});
