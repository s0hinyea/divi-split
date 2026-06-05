import React, { useState, useRef, useEffect } from "react";
import {
	StyleSheet,
	View,
	AppState,
	TouchableOpacity,
	Text,
	TextInput,
	ActivityIndicator,
	Animated,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useRouter, useLocalSearchParams } from "expo-router";
import { colors, fonts, spacing } from '@/styles/theme';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getUserFacingErrorMessage, hasInternetConnection } from '@/utils/network';
import { useCustomAlert } from '@/components/CustomAlert';

function FadeInView({ children, style }: { children: React.ReactNode; style?: object }) {
	const opacity = useRef(new Animated.Value(0)).current;
	useEffect(() => {
		Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
	}, []);
	return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

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
	const { showAlert } = useCustomAlert();
	// Sign-up Steps: 1: Name, 2: Email, 3: Password
	const [step, setStep] = useState(1);
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [confirmPassword, setConfirmPassword] = useState("");
	const [otpCode, setOtpCode] = useState("");
	const [isAwaitingOtp, setIsAwaitingOtp] = useState(false);
	const [cooldown, setCooldown] = useState(0);
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const [loginError, setLoginError] = useState("");
	
	const router = useRouter();
	const { mode: paramMode } = useLocalSearchParams<{ mode: string }>();
	const mode = paramMode || initialMode;
	
	const isSignUp = mode === "signup";
	const isForgotPassword = mode === "forgot-password";
	const isResetPassword = mode === "reset-password";
	const progressAnim = useRef(new Animated.Value(0.2)).current;

	useEffect(() => {
		if (cooldown > 0) {
			const timer = setInterval(() => setCooldown(c => c - 1), 1000);
			return () => clearInterval(timer);
		}
	}, [cooldown]);

	useEffect(() => {
		const target = isSignUp ? step / 3 : 1;
		Animated.timing(progressAnim, { toValue: target, duration: 150, useNativeDriver: false }).start();
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

	// Mark a field as touched (show errors after first interaction)
	const touch = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

	const requestPasswordReset = async () => {
		if (!isValidEmail(email)) {
			showAlert({ title: "Invalid Email", message: "Please enter a valid email address." });
			return;
		}
		setLoading(true);

		try {
			const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
			if (error) {
				showAlert({ title: "Error", message: error.message });
				return;
			}

			setCooldown(60);
			setIsAwaitingOtp(true);
			showAlert({ title: "Reset Code Sent ✉️", message: "Check your inbox for your reset code." });
		} catch (error) {
			showAlert({ title: "Error", message: getUserFacingErrorMessage(error, "We couldn't send a reset code right now.") });
		} finally {
			setLoading(false);
		}
	};

	const verifyResetOtp = async () => {
		if (!otpCode || otpCode.length < 6) {
			showAlert({ title: "Invalid Code", message: "Please enter the code sent to your email." });
			return;
		}
		setLoading(true);

		try {
			const { error } = await supabase.auth.verifyOtp({
				email: email.trim().toLowerCase(),
				token: otpCode.trim(),
				type: 'recovery' // This signs them in securely
			});

			if (error) {
				showAlert({ title: "Error", message: error.message });
				return;
			}

			setIsAwaitingOtp(false);
			router.replace({ pathname: "/auth", params: { mode: "reset-password" } });
		} catch (error) {
			showAlert({ title: "Error", message: getUserFacingErrorMessage(error, "We couldn't verify that code right now.") });
		} finally {
			setLoading(false);
		}
	};

	const updatePassword = async () => {
		if (!isPasswordValid) {
			showAlert({ title: "Invalid Password", message: "Password does not meet requirements." });
			return;
		}
		if (password !== confirmPassword) {
			showAlert({ title: "Mismatch", message: "Passwords do not match." });
			return;
		}
		setLoading(true);

		try {
			const { error } = await supabase.auth.updateUser({ password });
			if (error) {
				showAlert({ title: "Error", message: error.message });
				return;
			}

			showAlert({ title: "Success!", message: "Your password has been updated. You can now log in." });
			router.replace({ pathname: "/auth", params: { mode: "login" } });
		} catch (error) {
			showAlert({ title: "Error", message: getUserFacingErrorMessage(error, "We couldn't update your password right now.") });
		} finally {
			setLoading(false);
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
	}, [email, touched.email]);

	// Password validation
	useEffect(() => {
		if (!touched.password) return;
		if (!password) setErrors(p => ({ ...p, password: 'Password is required.' }));
		else if (password.length < 8) setErrors(p => ({ ...p, password: 'Must be at least 8 characters.' }));
		else setErrors(p => { const { password: _, ...rest } = p; return rest; });
	}, [password, touched.password]);


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

	const performSignUp = async () => {
		setLoading(true);
		try {
			const { data: { user }, error } = await supabase.auth.signUp({
				email: email.trim().toLowerCase(),
				password,
				options: {
					data: {
						full_name: fullName.trim(),
					}
				}
			});

			if (error) {
				if (error.message.includes("already registered")) {
					showAlert({
						title: "Account Exists",
						message: "This email is already registered. Try logging in instead.",
						buttons: [
							{ text: "Go to Login", onPress: () => router.replace({ pathname: "/auth", params: { mode: "login" } }) },
							{ text: "Cancel", style: "cancel" },
						],
					});
				} else {
					showAlert({ title: "Error", message: error.message });
				}
			} else if (user) {
				// Seed profile row with just name + email (onboarding collects username + handles)
				await supabase
					.from('profiles')
					.upsert({
						id: user.id,
						email: email.trim().toLowerCase(),
						full_name: fullName.trim(),
						updated_at: new Date().toISOString(),
					})
					.then(({ error: e }) => e && console.warn('Profile seed failed:', e));

				Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
				// Route to / — index.tsx will redirect to /onboarding (no username yet)
				router.replace("/");
			}
		} catch (error) {
			showAlert({ title: "Error", message: getUserFacingErrorMessage(error, "We couldn't create your account right now.") });
		} finally {
			setLoading(false);
		}
	};

	const resendVerification = async () => {
		try {
			const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
			if (error) {
				showAlert({ title: "Error", message: error.message });
				return;
			}

			showAlert({ title: "Email Sent ✉️", message: "Check your inbox for a new verification link." });
		} catch (error) {
			showAlert({ title: "Error", message: getUserFacingErrorMessage(error, "We couldn't resend the verification email right now.") });
		}
	};

	const performLogin = async () => {
		const identifier = email.trim();
		if (!identifier) { setLoginError("Please enter your email or username."); return; }
		if (!password) { setLoginError("Please enter your password."); return; }

		setLoginError("");
		setLoading(true);
		try {
			let loginEmail = identifier.toLowerCase();

			// If the input doesn't look like an email, treat it as a username
			if (!isValidEmail(identifier)) {
				const cleanUsername = identifier.replace(/^@/, '').toLowerCase();
				if (cleanUsername.length < 3) {
					setLoginError("Username must be at least 3 characters.");
					setLoading(false);
					return;
				}
				const { data: lookedUpEmail, error: lookupError } = await supabase
					.rpc('get_email_by_username', { p_username: cleanUsername });

				if (lookupError || !lookedUpEmail) {
					setLoginError("No account found with that username.");
					setLoading(false);
					return;
				}
				loginEmail = lookedUpEmail;
			}

			const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });

			if (error) {
				if (error.message.includes("Email not confirmed")) {
					setLoginError("Email not verified. Check your inbox or tap 'Forgot password?' to resend.");
				} else if (error.message.includes("Invalid login")) {
					setLoginError("Incorrect email or password. Please try again.");
				} else {
					setLoginError(error.message);
				}
			} else {
				router.replace("/(tabs)");
			}
		} catch (error) {
			setLoginError(getUserFacingErrorMessage(error, "We couldn't sign you in right now."));
		} finally {
			setLoading(false);
		}
	};

	// Determines if the Continue button should be disabled
	const isContinueDisabled = () => {
		if (loading) return true;
		if (step === 1) return !fullName.trim() || !isValidName(fullName);
		if (step === 2) return !isValidEmail(email);
		if (step === 3) return !isPasswordValid;
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
						<Text style={styles.stepText}>Step {step} of 3</Text>
					</View>
				)}
			</View>

			{/* Progress Bar */}
			{isSignUp && (
				<View style={styles.progressTrack}>
					<Animated.View style={[styles.progressBar, {
						width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
						backgroundColor: colors.green,
					}]} />
				</View>
			)}

			<View style={styles.content}>
				{isSignUp ? (
					<FadeInView style={styles.stepContainer} key={step}>
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
										style={[styles.input, { flex: 1, backgroundColor: 'transparent' }]}
										placeholder="Password"
										value={password}
										onChangeText={setPassword}
										onBlur={() => touch('password')}
										secureTextEntry={!showPassword}
										textContentType="newPassword"
										onSubmitEditing={performSignUp}
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

						{/* Continue / Create Account Button */}
						<TouchableOpacity 
							style={[styles.btn, isContinueDisabled() && styles.btnDisabled]} 
							onPress={step === 3 ? performSignUp : nextStep}
							disabled={isContinueDisabled()}
						>
							{loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>{step === 3 ? "Create Account" : "Continue"}</Text>}
						</TouchableOpacity>
						
						{step === 1 && (
							<View style={styles.toggleRow}>
								<Text style={styles.smallText}>Already have an account? </Text>
								<TouchableOpacity onPress={() => router.replace({ pathname: "/auth", params: { mode: "login" } })}>
									<Text style={styles.toggleLink}>Log In</Text>
								</TouchableOpacity>
							</View>
						)}
					</FadeInView>
				) : (!isForgotPassword && !isResetPassword) ? (
					<FadeInView style={styles.stepContainer}>
						<Text style={styles.title}>Log In</Text>
						<Text style={styles.subtitle}>Enter your credentials to continue.</Text>
						<TextInput style={styles.input} placeholder="Email or @username" value={email} onChangeText={(t) => { setEmail(t); setLoginError(""); }} autoCapitalize="none" textContentType="emailAddress" />
						<TextInput style={[styles.input, { marginTop: 16 }, !!loginError && styles.inputError]} placeholder="Password" value={password} onChangeText={(t) => { setPassword(t); setLoginError(""); }} secureTextEntry textContentType="password" />
						{!!loginError && <Text style={styles.loginErrorText}>{loginError}</Text>}
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
					</FadeInView>
				) : null}

				{(isForgotPassword || isResetPassword) && (
					<FadeInView style={styles.stepContainer}>
						<Text style={styles.title}>{isForgotPassword ? "Reset Password" : "Set New Password"}</Text>
						<Text style={styles.subtitle}>
							{isForgotPassword 
								? "Enter your email to receive a password reset link." 
								: "Choose a new strong password for your account."}
						</Text>
						
						{isForgotPassword ? (
							<>
								<TextInput 
									style={styles.input} 
									placeholder="Email" 
									value={email} 
									onChangeText={setEmail} 
									autoCapitalize="none" 
									keyboardType="email-address" 
									textContentType="emailAddress"
									editable={!isAwaitingOtp} 
								/>
								{isAwaitingOtp && (
									<TextInput 
										style={[styles.input, { marginTop: 16, letterSpacing: 8, fontSize: 24, textAlign: 'center' }]} 
										placeholder="00000000" 
										value={otpCode} 
										onChangeText={setOtpCode}
										keyboardType="number-pad" 
										maxLength={8}
									/>
								)}
							</>
						) : (
							<>
								<View style={[styles.inputGroup, touched.password && errors.password ? styles.inputGroupError : null]}>
									<TextInput
										style={[styles.input, { flex: 1, backgroundColor: 'transparent' }]}
										placeholder="New Password"
										value={password}
										onChangeText={setPassword}
										onBlur={() => touch('password')}
										secureTextEntry={!showPassword}
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
										style={[styles.input, { marginTop: 16 }, confirmPassword && password !== confirmPassword ? styles.inputError : null]}
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
							style={[styles.btn, (isResetPassword && (!isPasswordValid || password !== confirmPassword)) && styles.btnDisabled, (isForgotPassword && !isAwaitingOtp && cooldown > 0) && styles.btnDisabled]} 
							onPress={isForgotPassword ? (isAwaitingOtp ? verifyResetOtp : requestPasswordReset) : updatePassword} 
							disabled={loading || (isResetPassword && (!isPasswordValid || password !== confirmPassword)) || (isForgotPassword && !isAwaitingOtp && cooldown > 0)}
						>
							{loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>
								{isForgotPassword 
									? (isAwaitingOtp 
										? "Verify Code" 
										: (cooldown > 0 ? `Wait ${cooldown}s` : "Send Code")) 
									: "Update Password"}
							</Text>}
						</TouchableOpacity>
					</FadeInView>
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
	input: { backgroundColor: colors.gray100, borderRadius: 16, height: 60, paddingHorizontal: 20, fontSize: 16, fontFamily: fonts.body, color: colors.black },
	inputGroup: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gray100, borderRadius: 16, height: 60 },
	eyeIcon: { paddingRight: 20 },
	prefix: { position: 'absolute', left: 20, fontSize: 16, color: colors.gray400, zIndex: 1 },
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
	loginErrorText: { fontSize: 13, color: colors.error, fontFamily: fonts.bodyMedium, marginTop: 8, marginLeft: 4 },
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
