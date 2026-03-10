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
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors, fonts, spacing } from '@/styles/theme';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
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
	const [confirmPassword, setConfirmPassword] = useState("");
	const [cooldown, setCooldown] = useState(0);
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [checkingUsername, setCheckingUsername] = useState(false);
	const [isUsernameTaken, setIsUsernameTaken] = useState(false);
	const [checkingEmail, setCheckingEmail] = useState(false);
	const [isEmailTaken, setIsEmailTaken] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	
	const router = useRouter();
	const { mode: paramMode } = useLocalSearchParams<{ mode: string }>();
	const mode = paramMode || initialMode;
	
	const isSignUp = mode === "signup";
	const isForgotPassword = mode === "forgot-password";
	const isResetPassword = mode === "reset-password";
	const progress = useSharedValue(0.2);

	useEffect(() => {
		if (cooldown > 0) {
			const timer = setInterval(() => setCooldown(c => c - 1), 1000);
			return () => clearInterval(timer);
		}
	}, [cooldown]);

	useEffect(() => {
		if (isSignUp) progress.value = withTiming(step / 5, { duration: 150 });
		else progress.value = withTiming(1, { duration: 150 });
	}, [step, isSignUp]);

	// ──── Validation Helpers ────────────────────────────────

	const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
	const isValidName = (n: string) => /^[a-zA-Z\s'-]{2,50}$/.test(n.trim());

	const passwordChecks = {
		length: password.length >= 8,
		uppercase: /[A-Z]/.test(password),
		number: /[0-9]/.test(password),
		special: /[^A-Za-z0-9]/.test(password),
	};
	const isPasswordValid = passwordChecks.length && passwordChecks.uppercase && passwordChecks.number;
	const isUsernameValid = username.length >= 3 && username.length <= 20 && /^[a-z0-9_.]+$/.test(username) && !isUsernameTaken;

	// Mark a field as touched (show errors after first interaction)
	const touch = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

	const requestPasswordReset = async () => {
		if (!isValidEmail(email)) {
			Alert.alert("Invalid Email", "Please enter a valid email address.");
			return;
		}
		setLoading(true);
		const resetUrl = Linking.createURL('/auth', { queryParams: { mode: 'reset-password' } });
		
		const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
			redirectTo: resetUrl,
		});
		setLoading(false);
		if (error) {
			Alert.alert("Error", error.message);
		} else {
			setCooldown(60);
			Alert.alert("Reset Email Sent ✉️", "Check your inbox for a link to reset your password.");
			router.replace({ pathname: "/auth", params: { mode: "login" } });
		}
	};

	const updatePassword = async () => {
		if (!isPasswordValid) {
			Alert.alert("Invalid Password", "Password does not meet requirements.");
			return;
		}
		if (password !== confirmPassword) {
			Alert.alert("Mismatch", "Passwords do not match.");
			return;
		}
		setLoading(true);
		const { error } = await supabase.auth.updateUser({ password });
		setLoading(false);
		if (error) {
			Alert.alert("Error", error.message);
		} else {
			Alert.alert("Success! 🎉", "Your password has been updated. You can now log in.");
			router.replace({ pathname: "/auth", params: { mode: "login" } });
		}
	};

	// ──── Real-time Validation Effects ──────────────────────

	// Name validation
	useEffect(() => {
		if (!touched.name) return;
		if (!fullName.trim()) setErrors(p => ({ ...p, name: 'Name is required.' }));
		else if (fullName.trim().length < 2) setErrors(p => ({ ...p, name: 'Name must be at least 2 characters.' }));
		else if (!isValidName(fullName)) setErrors(p => ({ ...p, name: 'Only letters, spaces, hyphens, and apostrophes.' }));
		else setErrors(p => { const { name, ...rest } = p; return rest; });
	}, [fullName, touched.name]);

	// Email validation + duplicate check
	useEffect(() => {
		if (!touched.email) return;
		if (!email.trim()) { setErrors(p => ({ ...p, email: 'Email is required.' })); return; }
		if (!isValidEmail(email)) { setErrors(p => ({ ...p, email: 'Enter a valid email address.' })); return; }
		setErrors(p => { const { email: _, ...rest } = p; return rest; });

		// Check if email is already registered (debounced)
		if (!isSignUp) return;
		const timer = setTimeout(async () => {
			setCheckingEmail(true);
			// Use signInWithOtp dry-run approach: try to sign up and check for "already registered"
			// Actually, we'll just let the final signup handle this — remove the check here
			setCheckingEmail(false);
		}, 600);
		return () => clearTimeout(timer);
	}, [email, touched.email]);

	// Password validation
	useEffect(() => {
		if (!touched.password) return;
		if (!password) setErrors(p => ({ ...p, password: 'Password is required.' }));
		else if (password.length < 8) setErrors(p => ({ ...p, password: 'Must be at least 8 characters.' }));
		else setErrors(p => { const { password: _, ...rest } = p; return rest; });
	}, [password, touched.password]);

	// Username availability check
	useEffect(() => {
		if (username.length < 3) { setIsUsernameTaken(false); return; }
		setCheckingUsername(true);
		const timer = setTimeout(async () => {
			const { data } = await supabase
				.from('profiles')
				.select('id')
				.eq('username', username.toLowerCase())
				.maybeSingle();
			setIsUsernameTaken(!!data);
			setCheckingUsername(false);
		}, 500);
		return () => clearTimeout(timer);
	}, [username]);

	// ──── Step Navigation ───────────────────────────────────

	const nextStep = () => {
		// Validate current step
		if (step === 1) {
			touch('name');
			if (!fullName.trim() || !isValidName(fullName)) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
				if (!fullName.trim()) setErrors(p => ({ ...p, name: 'Name is required.' }));
				else if (!isValidName(fullName)) setErrors(p => ({ ...p, name: 'Only letters, spaces, hyphens, and apostrophes.' }));
				return;
			}
		}
		if (step === 2) {
			touch('email');
			if (!isValidEmail(email)) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
				setErrors(p => ({ ...p, email: 'Enter a valid email address.' }));
				return;
			}
		}
		if (step === 3) {
			touch('password');
			if (!isPasswordValid) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
				setErrors(p => ({ ...p, password: 'Password does not meet requirements.' }));
				return;
			}
		}
		if (step === 4) {
			if (!isUsernameValid || checkingUsername) {
				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
				return;
			}
		}
		
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setStep(s => s + 1);
	};

	const prevStep = () => {
		if (isSignUp && step > 1) {
			setStep(s => s - 1);
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		} else if (isForgotPassword || isResetPassword) {
			router.replace({ pathname: "/auth", params: { mode: "login" } });
		} else {
			router.back();
		}
	};

	// ──── Auth Actions ──────────────────────────────────────

	const sanitizeHandle = (handle: string, prefix: string) => {
		if (!handle.trim()) return null;
		const cleaned = handle.replace(/[^a-zA-Z0-9_-]/g, '');
		return cleaned ? `${prefix}${cleaned}` : null;
	};

	const performSignUp = async () => {
		setLoading(true);
		const { data: { user }, error } = await supabase.auth.signUp({
			email: email.trim().toLowerCase(),
			password,
			options: {
				data: {
					full_name: fullName.trim(),
					username: username.toLowerCase().trim(),
					venmo_handle: sanitizeHandle(venmo, '@'),
					cashapp_handle: sanitizeHandle(cashapp, '$'),
				}
			}
		});

		if (error) {
			if (error.message.includes("already registered")) {
				Alert.alert("Account Exists", "This email is already registered. Try logging in instead.", [
					{ text: "Go to Login", onPress: () => router.replace({ pathname: "/auth", params: { mode: "login" } }) },
					{ text: "Cancel", style: "cancel" },
				]);
			} else if (error.message.includes("unique") || error.message.includes("duplicate")) {
				Alert.alert("Username Taken", "This username was just claimed. Please go back and pick another.");
			} else {
				Alert.alert("Error", error.message);
			}
		} else if (user) {
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			if (user.email_confirmed_at) {
				router.replace("/(tabs)");
			} else {
				Alert.alert(
					"Check Your Email ✉️",
					"We sent a verification link to your inbox. Once verified, come back and log in!",
					[{ text: "Go to Login", onPress: () => router.replace({ pathname: "/auth", params: { mode: "login" } }) }]
				);
			}
		}
		setLoading(false);
	};

	const resendVerification = async () => {
		const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
		if (error) Alert.alert("Error", error.message);
		else Alert.alert("Email Sent ✉️", "Check your inbox for a new verification link.");
	};

	const performLogin = async () => {
		// Login validation
		if (!email.trim()) { Alert.alert("Missing Email", "Please enter your email."); return; }
		if (!isValidEmail(email)) { Alert.alert("Invalid Email", "Please enter a valid email address."); return; }
		if (!password) { Alert.alert("Missing Password", "Please enter your password."); return; }

		setLoading(true);
		const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
		
		if (error) {
			if (error.message.includes("Email not confirmed")) {
				Alert.alert(
					"Email Not Verified",
					"You need to verify your email before logging in. Check your inbox or resend the link.",
					[
						{ text: "Resend Email", onPress: resendVerification },
						{ text: "OK", style: "cancel" },
					]
				);
			} else if (error.message.includes("Invalid login")) {
				Alert.alert("Login Failed", "Incorrect email or password. Please try again.");
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

	// Determines if the Continue button should be disabled
	const isContinueDisabled = () => {
		if (loading) return true;
		if (step === 1) return !fullName.trim() || !isValidName(fullName);
		if (step === 2) return !isValidEmail(email);
		if (step === 3) return !isPasswordValid;
		if (step === 4) return !isUsernameValid || checkingUsername;
		return false;
	};

	// ──── Render ────────────────────────────────────────────

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
					<Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.stepContainer} key={step}>
						{/* Step 1: Name */}
						{step === 1 && (
							<>
								<Text style={styles.title}>Who are you?</Text>
								<Text style={styles.subtitle}>Enter your name as it appears to friends.</Text>
								<TextInput
									style={[styles.input, touched.name && errors.name ? styles.inputError : null]}
									placeholder="e.g. John Doe"
									value={fullName}
									onChangeText={setFullName}
									onBlur={() => touch('name')}
									autoFocus
									returnKeyType="next"
									onSubmitEditing={nextStep}
									maxLength={50}
								/>
								{touched.name && errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
								{touched.name && !errors.name && fullName.trim().length >= 2 && (
									<Text style={styles.successText}>Looks good! ✓</Text>
								)}
							</>
						)}

						{/* Step 2: Email */}
						{step === 2 && (
							<>
								<Text style={styles.title}>What's your email?</Text>
								<Text style={styles.subtitle}>Used for logging in and account recovery.</Text>
								<TextInput
									style={[styles.input, touched.email && errors.email ? styles.inputError : null]}
									placeholder="email@address.com"
									value={email}
									onChangeText={setEmail}
									onBlur={() => touch('email')}
									autoFocus
									autoCapitalize="none"
									keyboardType="email-address"
									textContentType="emailAddress"
									onSubmitEditing={nextStep}
								/>
								{touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
								{touched.email && !errors.email && isValidEmail(email) && (
									<Text style={styles.successText}>Valid email ✓</Text>
								)}
							</>
						)}

						{/* Step 3: Password */}
						{step === 3 && (
							<>
								<Text style={styles.title}>Secure your account</Text>
								<Text style={styles.subtitle}>Create a strong password.</Text>
								<View style={[styles.inputGroup, touched.password && errors.password ? styles.inputGroupError : null]}>
									<TextInput
										style={[styles.input, { flex: 1 }]}
										placeholder="Password"
										value={password}
										onChangeText={setPassword}
										onBlur={() => touch('password')}
										secureTextEntry={!showPassword}
										autoFocus
										textContentType="newPassword"
										onSubmitEditing={nextStep}
									/>
									<TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
										<Feather name={showPassword ? "eye" : "eye-off"} size={20} color={colors.gray400} />
									</TouchableOpacity>
								</View>
								{/* Strength Meter */}
								<View style={styles.strengthMeter}>
									{[1, 2, 3, 4].map(l => (
										<View key={l} style={[styles.strengthBar, { backgroundColor: getPasswordStrength(password).level >= l ? getPasswordStrength(password).color : colors.gray200 }]} />
									))}
								</View>
								{/* Requirements Checklist */}
								{password.length > 0 && (
									<View style={styles.checklistContainer}>
										<Text style={[styles.checkItem, passwordChecks.length ? styles.checkPass : styles.checkFail]}>
											{passwordChecks.length ? '✓' : '✗'} At least 8 characters
										</Text>
										<Text style={[styles.checkItem, passwordChecks.uppercase ? styles.checkPass : styles.checkFail]}>
											{passwordChecks.uppercase ? '✓' : '✗'} One uppercase letter
										</Text>
										<Text style={[styles.checkItem, passwordChecks.number ? styles.checkPass : styles.checkFail]}>
											{passwordChecks.number ? '✓' : '✗'} One number
										</Text>
										<Text style={[styles.checkItem, passwordChecks.special ? styles.checkPass : styles.checkFail]}>
											{passwordChecks.special ? '✓' : '✗'} One special character (recommended)
										</Text>
									</View>
								)}
							</>
						)}

						{/* Step 4: Username */}
						{step === 4 && (
							<>
								<Text style={styles.title}>Unique handle</Text>
								<Text style={styles.subtitle}>Your @id for bill splitting. 3-20 characters, letters, numbers, dots, underscores.</Text>
								<View style={styles.inputGroup}>
									<Text style={styles.prefix}>@</Text>
									<TextInput
										style={[styles.input, { flex: 1, paddingLeft: 35 }]}
										placeholder="username"
										value={username}
										onChangeText={t => setUsername(t.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
										autoFocus
										autoCapitalize="none"
										maxLength={20}
										onSubmitEditing={nextStep}
									/>
									{checkingUsername && <ActivityIndicator style={styles.spinner} size="small" color={colors.gray400} />}
									{!checkingUsername && username.length >= 3 && (
										<MaterialIcons
											name={isUsernameTaken ? "close" : "check-circle"}
											size={20}
											color={isUsernameTaken ? colors.error : colors.green}
											style={styles.spinner}
										/>
									)}
								</View>
								{username.length > 0 && username.length < 3 && (
									<Text style={styles.errorText}>Username must be at least 3 characters.</Text>
								)}
								{username.length >= 3 && !checkingUsername && (
									<Text style={[styles.status, { color: isUsernameTaken ? colors.error : colors.green }]}>
										{isUsernameTaken ? "This handle is taken." : "Handle available!"}
									</Text>
								)}
							</>
						)}

						{/* Step 5: Payment Handles */}
						{step === 5 && (
							<>
								<Text style={styles.title}>Connect handles</Text>
								<Text style={styles.subtitle}>Speed up bill settlement. You can skip this and add them later in Settings.</Text>
								<View style={styles.inputGroup}>
									<MaterialIcons name="payment" size={20} color={colors.gray400} style={{ marginLeft: 15 }} />
									<TextInput
										style={[styles.input, { flex: 1, backgroundColor: 'transparent' }]}
										placeholder="Venmo @id"
										value={venmo}
										onChangeText={setVenmo}
										autoCapitalize="none"
										maxLength={30}
									/>
								</View>
								<View style={[styles.inputGroup, { marginTop: 15 }]}>
									<Feather name="dollar-sign" size={20} color={colors.gray400} style={{ marginLeft: 15 }} />
									<TextInput
										style={[styles.input, { flex: 1, backgroundColor: 'transparent' }]}
										placeholder="CashApp $id"
										value={cashapp}
										onChangeText={setCashapp}
										autoCapitalize="none"
										maxLength={30}
									/>
								</View>
							</>
						)}

						{/* Continue / Create Account Button */}
						<TouchableOpacity 
							style={[styles.btn, isContinueDisabled() && styles.btnDisabled]} 
							onPress={step === 5 ? performSignUp : nextStep}
							disabled={isContinueDisabled()}
						>
							{loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>{step === 5 ? "Create Account" : "Continue"}</Text>}
						</TouchableOpacity>

						{step === 5 && (
							<TouchableOpacity style={styles.skipBtn} onPress={performSignUp} disabled={loading}>
								<Text style={styles.skipText}>Skip for now</Text>
							</TouchableOpacity>
						)}
						
						{step === 1 && (
							<View style={styles.toggleRow}>
								<Text style={styles.smallText}>Already have an account? </Text>
								<TouchableOpacity onPress={() => router.replace({ pathname: "/auth", params: { mode: "login" } })}>
									<Text style={styles.toggleLink}>Log In</Text>
								</TouchableOpacity>
							</View>
						)}
					</Animated.View>
				) : (!isForgotPassword && !isResetPassword) ? (
					<Animated.View entering={FadeIn.duration(150)} style={styles.stepContainer}>
						<Text style={styles.title}>Log In</Text>
						<Text style={styles.subtitle}>Enter your credentials to continue.</Text>
						<TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
						<TextInput style={[styles.input, { marginTop: 15 }]} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry textContentType="password" />
						<TouchableOpacity style={styles.forgotBtn} onPress={() => router.replace({ pathname: "/auth", params: { mode: "forgot-password" } })}>
							<Text style={styles.forgotText}>Forgot password?</Text>
						</TouchableOpacity>
						<TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={performLogin} disabled={loading}>
							{loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Log In</Text>}
						</TouchableOpacity>
						<View style={styles.toggleRow}>
							<Text style={styles.smallText}>New here? </Text>
							<TouchableOpacity onPress={() => router.replace({ pathname: "/auth", params: { mode: "signup" } })}>
								<Text style={styles.toggleLink}>Join Divi</Text>
							</TouchableOpacity>
						</View>
					</Animated.View>
				) : null}

				{(isForgotPassword || isResetPassword) && (
					<Animated.View entering={FadeIn.duration(150)} style={styles.stepContainer}>
						<Text style={styles.title}>{isForgotPassword ? "Reset Password" : "Set New Password"}</Text>
						<Text style={styles.subtitle}>
							{isForgotPassword 
								? "Enter your email to receive a password reset link." 
								: "Choose a new strong password for your account."}
						</Text>
						
						{isForgotPassword ? (
							<TextInput 
								style={styles.input} 
								placeholder="Email" 
								value={email} 
								onChangeText={setEmail} 
								autoCapitalize="none" 
								keyboardType="email-address" 
								textContentType="emailAddress" 
							/>
						) : (
							<>
								<View style={[styles.inputGroup, touched.password && errors.password ? styles.inputGroupError : null]}>
									<TextInput
										style={[styles.input, { flex: 1 }]}
										placeholder="New Password"
										value={password}
										onChangeText={setPassword}
										onBlur={() => touch('password')}
										secureTextEntry={!showPassword}
										autoFocus
										textContentType="newPassword"
									/>
									<TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
										<Feather name={showPassword ? "eye" : "eye-off"} size={20} color={colors.gray400} />
									</TouchableOpacity>
								</View>
								<View style={styles.strengthMeter}>
									{[1, 2, 3, 4].map(l => (
										<View key={l} style={[styles.strengthBar, { backgroundColor: getPasswordStrength(password).level >= l ? getPasswordStrength(password).color : colors.gray200 }]} />
									))}
								</View>
								{password.length > 0 && (
									<View style={styles.checklistContainer}>
										<Text style={[styles.checkItem, passwordChecks.length ? styles.checkPass : styles.checkFail]}>
											{passwordChecks.length ? '✓' : '✗'} At least 8 characters
										</Text>
										<Text style={[styles.checkItem, passwordChecks.uppercase ? styles.checkPass : styles.checkFail]}>
											{passwordChecks.uppercase ? '✓' : '✗'} One uppercase letter
										</Text>
										<Text style={[styles.checkItem, passwordChecks.number ? styles.checkPass : styles.checkFail]}>
											{passwordChecks.number ? '✓' : '✗'} One number
										</Text>
										<Text style={[styles.checkItem, passwordChecks.special ? styles.checkPass : styles.checkFail]}>
											{passwordChecks.special ? '✓' : '✗'} One special character (recommended)
										</Text>
									</View>
								)}
								{isResetPassword && isPasswordValid && (
									<TextInput
										style={[styles.input, { marginTop: 15 }, confirmPassword && password !== confirmPassword ? styles.inputError : null]}
										placeholder="Confirm New Password"
										value={confirmPassword}
										onChangeText={setConfirmPassword}
										secureTextEntry
										textContentType="newPassword"
									/>
								)}
								{confirmPassword && password !== confirmPassword && <Text style={styles.errorText}>Passwords do not match.</Text>}
							</>
						)}

						<TouchableOpacity 
							style={[styles.btn, (isResetPassword && (!isPasswordValid || password !== confirmPassword)) && styles.btnDisabled, (isForgotPassword && cooldown > 0) && styles.btnDisabled]} 
							onPress={isForgotPassword ? requestPasswordReset : updatePassword} 
							disabled={loading || (isResetPassword && (!isPasswordValid || password !== confirmPassword)) || (isForgotPassword && cooldown > 0)}
						>
							{loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>
								{isForgotPassword ? (cooldown > 0 ? `Wait ${cooldown}s` : "Send Link") : "Update Password"}
							</Text>}
						</TouchableOpacity>
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
	inputError: { borderWidth: 1.5, borderColor: colors.error },
	inputGroupError: { borderWidth: 1.5, borderColor: colors.error },
	errorText: { fontSize: 13, color: colors.error, fontFamily: fonts.bodyMedium, marginTop: 8, marginLeft: 4 },
	successText: { fontSize: 13, color: colors.green, fontFamily: fonts.bodyMedium, marginTop: 8, marginLeft: 4 },
	checklistContainer: { marginTop: 16, paddingLeft: 4, gap: 6 },
	checkItem: { fontSize: 13, fontFamily: fonts.body },
	checkPass: { color: colors.green },
	checkFail: { color: colors.gray400 },
	skipBtn: { marginTop: 16, alignSelf: 'center', paddingVertical: 10 },
	skipText: { fontSize: 15, color: colors.gray500, fontFamily: fonts.bodyMedium },
	forgotBtn: { alignSelf: 'flex-end', marginTop: 10, paddingVertical: 5 },
	forgotText: { color: colors.green, fontSize: 14, fontFamily: fonts.bodyMedium },
});
