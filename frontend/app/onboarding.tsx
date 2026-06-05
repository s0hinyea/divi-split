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
	Image,
} from "react-native";

const ZelleLogo = require('@/assets/images/zelle.png');
const CashAppLogo = require('@/assets/images/cashapp.png');
const VenmoLogo = require('@/assets/images/venmo.png');
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/utils/ProfileContext";
import { useSession } from "@/utils/SessionContext";
import { colors, fonts, fontSizes, spacing, radii } from "@/styles/theme";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// ── Types ──────────────────────────────────────────────────────────────────────
type Frequency = 'rarely' | 'monthly' | 'weekly' | 'daily';
type WhoWith = 'friends' | 'roommates' | 'partner' | 'coworkers' | 'groups';
type PainPoint = 'chasing' | 'calculating' | 'unequal' | 'awkward';

const TOTAL_STEPS = 9;

// ── Content data ──────────────────────────────────────────────────────────────
const PROFILES: Record<PainPoint, { name: string; emoji: string; stat: string; description: string }> = {
	chasing: {
		name: "The Generous One",
		emoji: "💸",
		stat: "91% of people like you are owed money right now",
		description: "You always step up and cover the bill, but tracking who owes you is a full-time job no one signed up for.",
	},
	calculating: {
		name: "The Detail Person",
		emoji: "🧮",
		stat: "84% of group bills are split incorrectly at least once",
		description: "You care about getting it exactly right. The problem is the math never cooperates.",
	},
	unequal: {
		name: "The Fair Splitter",
		emoji: "⚖️",
		stat: "78% of people have paid more than their fair share",
		description: "You believe in paying for what you ordered. Not everyone splits that logic.",
	},
	awkward: {
		name: "The Nice One",
		emoji: "😬",
		stat: "3 in 4 people avoid asking for money to keep the peace",
		description: "You value the vibe over the dollars. But that adds up, and you know it.",
	},
};

const SYMPTOMS: Record<PainPoint, string[]> = {
	chasing: [
		"Sending the 'hey just a reminder' text that gets left on read",
		"Mentally tracking who owes you money days after the fact",
		"Writing it off because asking again feels more embarrassing than the amount",
	],
	calculating: [
		"Receipt out, calculator open, still not confident in the number",
		"Someone questions your math right after you've already sent it",
		"Group dinners where settling up takes longer than the meal itself",
	],
	unequal: [
		"You ordered the salad. They got the steak, two drinks, and dessert. You split evenly.",
		"Quietly covering someone else's add-ons without mentioning it",
		"Being too polite to say what everyone at the table is actually thinking",
	],
	awkward: [
		"The energy shifting the second someone has to bring up money",
		"Saying 'don't worry about it' when you kind of really do worry about it",
		"Skipping the follow-up because making it a thing feels worse than the loss",
	],
};

const HOW_IT_HELPS: Record<PainPoint, { headline: string; body: string; points: string[] }> = {
	chasing: {
		headline: "Stop chasing. Start receiving.",
		body: "Divi sends payment links automatically. You split the receipt, it handles everything after.",
		points: [
			"Scan the receipt and split it in under 60 seconds",
			"Each person gets their own pay link, no group chat math",
			"See who's paid in real time, without asking anyone",
		],
	},
	calculating: {
		headline: "The math should be the easy part.",
		body: "Divi reads your receipt and calculates exact amounts for each person, tax and tip included.",
		points: [
			"OCR scanning reads line items automatically",
			"Tax split proportionally, not just evenly",
			"Exact numbers you can send with full confidence",
		],
	},
	unequal: {
		headline: "You pay for what you ordered. Full stop.",
		body: "Divi lets you assign items to people. Everyone sees exactly what they owe and why.",
		points: [
			"Assign items to whoever ordered them",
			"No more silent resentment over the 'just split it evenly'",
			"Transparent breakdown every person can verify themselves",
		],
	},
	awkward: {
		headline: "Make it a link, not a conversation.",
		body: "Divi removes you from the ask. Your contacts get a payment link, not a text from you.",
		points: [
			"They pay through a link, not a direct Venmo request",
			"You're notified when they pay, without saying a word",
			"The money gets handled. The vibe stays intact.",
		],
	},
};

const REVIEWS = [
	{
		name: "Mia T.",
		rating: 5,
		text: "My roommates finally stopped pretending they forgot. Everyone can see exactly what they ordered.",
	},
	{
		name: "Jordan K.",
		rating: 5,
		text: "Used to spend 20 minutes after every group dinner doing the math. Now it's done in under a minute.",
	},
	{
		name: "Alex R.",
		rating: 5,
		text: "I hate asking people for money. Divi sends a link and I never have to say anything.",
	},
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function FadeInView({ children, style }: { children: React.ReactNode; style?: object }) {
	const opacity = useRef(new Animated.Value(0)).current;
	useEffect(() => {
		Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
	}, []);
	return <Animated.View style={[style, { opacity }]}>{children}</Animated.View>;
}

function StarRow({ count }: { count: number }) {
	return (
		<View style={{ flexDirection: 'row', gap: 2 }}>
			{Array.from({ length: count }).map((_, i) => (
				<MaterialIcons key={i} name="star" size={14} color="#F5A623" />
			))}
		</View>
	);
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Onboarding() {
	const router = useRouter();
	const { session } = useSession();
	const { updateProfile } = useProfile();

	const [step, setStep] = useState(1);
	const [frequency, setFrequency] = useState<Frequency | null>(null);
	const [whoWith, setWhoWith] = useState<WhoWith | null>(null);
	const [painPoint, setPainPoint] = useState<PainPoint | null>(null);

	// Account creation (step 10)
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [signUpLoading, setSignUpLoading] = useState(false);

	// Profile setup (steps 11-12)
	const [username, setUsername] = useState("");
	const [venmo, setVenmo] = useState("");
	const [cashapp, setCashapp] = useState("");
	const [zelle, setZelle] = useState("");
	const [checkingUsername, setCheckingUsername] = useState(false);
	const [isUsernameTaken, setIsUsernameTaken] = useState(false);
	const [loading, setLoading] = useState(false);

	const progressAnim = useRef(new Animated.Value(1 / TOTAL_STEPS)).current;

	const displayName =
		session?.user?.user_metadata?.full_name ??
		session?.user?.email?.split("@")[0] ??
		"there";
	const firstName = displayName.split(" ")[0];

	const profile = painPoint ? PROFILES[painPoint] : null;
	const symptoms = painPoint ? SYMPTOMS[painPoint] : [];
	const howItHelps = painPoint ? HOW_IT_HELPS[painPoint] : null;

	const isUsernameValid =
		username.length >= 3 &&
		username.length <= 20 &&
		/^[a-z0-9_.]+$/.test(username) &&
		!isUsernameTaken;

	useEffect(() => {
		Animated.timing(progressAnim, {
			toValue: step / TOTAL_STEPS,
			duration: 200,
			useNativeDriver: false,
		}).start();
	}, [step]);

	useEffect(() => {
		if (username.length < 3) { setIsUsernameTaken(false); return; }
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

	const advance = () => setStep(s => s + 1);
	const back = () => setStep(s => Math.max(1, s - 1));

	function pickFrequency(val: Frequency) {
		setFrequency(val);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setTimeout(advance, 350);
	}

	function pickWhoWith(val: WhoWith) {
		setWhoWith(val);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setTimeout(advance, 350);
	}

	function pickPainPoint(val: PainPoint) {
		setPainPoint(val);
		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		setTimeout(advance, 350);
	}

	function getCustomPlanBullets(): string[] {
		const freqLabel =
			frequency === 'daily' ? 'daily splits' :
			frequency === 'weekly' ? 'weekly bills' : 'every group bill';
		const whoLabel =
			whoWith === 'friends' ? 'friend group' :
			whoWith === 'roommates' ? 'roommates' :
			whoWith === 'partner' ? 'shared expenses' :
			whoWith === 'coworkers' ? 'work lunches' : 'multiple groups';
		return [
			`Scan and split receipts in under 60 seconds, built for ${freqLabel}`,
			`Assign items across your ${whoLabel} without the group chat math`,
			painPoint === 'chasing' ? 'Auto-send payment requests the moment you finish splitting' :
			painPoint === 'calculating' ? 'Tax and tip calculated proportionally, no effort required' :
			painPoint === 'unequal' ? 'Item-level assignment so everyone pays exactly their share' :
			'Send payment links, not awkward follow-up texts',
			'Track pending and settled amounts across all your receipts',
		];
	}

	const performSignUp = async () => {
		if (!fullName.trim() || !email.trim() || password.length < 6) return;
		setSignUpLoading(true);
		try {
			const { data: { user }, error } = await supabase.auth.signUp({
				email: email.trim().toLowerCase(),
				password,
				options: { data: { full_name: fullName.trim() } },
			});
			if (error) {
				if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already exists")) {
					Alert.alert(
						"Email already registered",
						"An account with this email already exists.",
						[
							{ text: "Log In", onPress: () => router.replace({ pathname: "/auth", params: { mode: "login" } }) },
							{ text: "Cancel", style: "cancel" },
						]
					);
				} else {
					Alert.alert("Error", error.message);
				}
				return;
			}
			if (user) {
				await supabase.from('profiles').upsert({
					id: user.id,
					email: email.trim().toLowerCase(),
					full_name: fullName.trim(),
					updated_at: new Date().toISOString(),
				});
				Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
				advance();
			}
		} catch (e: any) {
			Alert.alert("Error", e?.message ?? "Could not create account.");
		} finally {
			setSignUpLoading(false);
		}
	};

	const sanitizeHandle = (handle: string, prefix: string) => {
		if (!handle.trim()) return null;
		const cleaned = handle.replace(/[^a-zA-Z0-9_-]/g, "");
		return cleaned ? `${prefix}${cleaned}` : null;
	};

	const handleFinish = async () => {
		setLoading(true);
		try {
			const err = await updateProfile({
				username: username.toLowerCase().trim(),
				venmo_handle: sanitizeHandle(venmo, "@"),
				cashapp_handle: sanitizeHandle(cashapp, "$"),
				zelle_number: zelle.trim() || null,
			});
			if (err) { Alert.alert("Error", err); return; }
			Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			router.replace("/(tabs)");
		} finally {
			setLoading(false);
		}
	};

	// ── Step renderer ──────────────────────────────────────────────────────────
	const renderStep = () => {
		switch (step) {

			// Step 1: Frequency
			case 1:
				return (
					<>
						<Text style={styles.eyebrow}>QUICK QUESTION</Text>
						<Text style={styles.title}>How often do you split bills with others?</Text>
						<View style={styles.optionList}>
							{(
								[
									{ value: 'rarely' as Frequency, label: 'Rarely', sub: 'Only on special occasions' },
									{ value: 'monthly' as Frequency, label: 'A few times a month', sub: 'Dinners, trips, group hangs' },
									{ value: 'weekly' as Frequency, label: 'Pretty much every week', sub: "It's a regular thing" },
									{ value: 'daily' as Frequency, label: 'Almost daily', sub: "Splitting is just part of my life" },
								]
							).map(opt => (
								<TouchableOpacity
									key={opt.value}
									style={[styles.optionCard, frequency === opt.value && styles.optionCardSelected]}
									onPress={() => pickFrequency(opt.value)}
									activeOpacity={0.7}
								>
									<View style={{ flex: 1 }}>
										<Text style={[styles.optionLabel, frequency === opt.value && styles.optionLabelSelected]}>
											{opt.label}
										</Text>
										<Text style={styles.optionSub}>{opt.sub}</Text>
									</View>
									{frequency === opt.value && (
										<MaterialIcons name="check-circle" size={22} color={colors.green} />
									)}
								</TouchableOpacity>
							))}
						</View>
					</>
				);

			// Step 2: Who with
			case 2:
				return (
					<>
						<Text style={styles.eyebrow}>QUICK QUESTION</Text>
						<Text style={styles.title}>Who do you usually split with?</Text>
						<View style={styles.optionList}>
							{(
								[
									{ value: 'friends' as WhoWith, label: 'Friends', sub: 'Dinners, outings, group trips' },
									{ value: 'roommates' as WhoWith, label: 'Roommates', sub: 'Groceries, utilities, shared costs' },
									{ value: 'partner' as WhoWith, label: 'Partner', sub: 'Dates, travel, shared expenses' },
									{ value: 'coworkers' as WhoWith, label: 'Coworkers', sub: 'Lunches, team events' },
									{ value: 'groups' as WhoWith, label: 'Multiple groups', sub: 'All of the above, honestly' },
								]
							).map(opt => (
								<TouchableOpacity
									key={opt.value}
									style={[styles.optionCard, whoWith === opt.value && styles.optionCardSelected]}
									onPress={() => pickWhoWith(opt.value)}
									activeOpacity={0.7}
								>
									<View style={{ flex: 1 }}>
										<Text style={[styles.optionLabel, whoWith === opt.value && styles.optionLabelSelected]}>
											{opt.label}
										</Text>
										<Text style={styles.optionSub}>{opt.sub}</Text>
									</View>
									{whoWith === opt.value && (
										<MaterialIcons name="check-circle" size={22} color={colors.green} />
									)}
								</TouchableOpacity>
							))}
						</View>
					</>
				);

			// Step 3: Pain point
			case 3:
				return (
					<>
						<Text style={styles.eyebrow}>LAST ONE</Text>
						<Text style={styles.title}>What's your biggest headache when splitting?</Text>
						<View style={styles.optionList}>
							{(
								[
									{
										value: 'chasing' as PainPoint,
										label: 'Chasing people to pay me back',
										sub: "The money part is fine. The follow-up isn't.",
									},
									{
										value: 'calculating' as PainPoint,
										label: 'Getting the math right',
										sub: 'Tax, tip, who ordered what...',
									},
									{
										value: 'unequal' as PainPoint,
										label: "Everyone splitting evenly when orders weren't",
										sub: 'I had the salad. Just saying.',
									},
									{
										value: 'awkward' as PainPoint,
										label: 'It just feels awkward to ask',
										sub: 'Money conversations kill the vibe.',
									},
								]
							).map(opt => (
								<TouchableOpacity
									key={opt.value}
									style={[styles.optionCard, painPoint === opt.value && styles.optionCardSelected]}
									onPress={() => pickPainPoint(opt.value)}
									activeOpacity={0.7}
								>
									<View style={{ flex: 1 }}>
										<Text style={[styles.optionLabel, painPoint === opt.value && styles.optionLabelSelected]}>
											{opt.label}
										</Text>
										<Text style={styles.optionSub}>{opt.sub}</Text>
									</View>
									{painPoint === opt.value && (
										<MaterialIcons name="check-circle" size={22} color={colors.green} />
									)}
								</TouchableOpacity>
							))}
						</View>
					</>
				);

			// Step 4: Profile result
			case 4:
				if (!profile) return null;
				return (
					<>
						<Text style={styles.eyebrow}>YOUR PROFILE</Text>
						<View style={styles.profileCard}>
							<Text style={styles.profileEmoji}>{profile.emoji}</Text>
							<Text style={styles.profileName}>{profile.name}</Text>
							<View style={styles.statBadge}>
								<Text style={styles.statText}>{profile.stat}</Text>
							</View>
							<Text style={styles.profileDescription}>{profile.description}</Text>
						</View>
						<TouchableOpacity style={styles.btn} onPress={advance} activeOpacity={0.8}>
							<Text style={styles.btnText}>That's me</Text>
						</TouchableOpacity>
					</>
				);

			// Step 5: How Divi helps
			case 5:
				if (!howItHelps) return null;
				return (
					<>
						<Text style={styles.eyebrow}>HERE'S THE FIX</Text>
						<Text style={styles.subtitle}>{howItHelps.body}</Text>
						<View style={styles.checkList}>
							{howItHelps.points.map((p, i) => (
								<View key={i} style={styles.checkRow}>
									<MaterialIcons name="check-circle" size={18} color={colors.green} style={{ marginTop: 2 }} />
									<Text style={styles.checkText}>{p}</Text>
								</View>
							))}
						</View>
						<TouchableOpacity style={styles.btn} onPress={advance} activeOpacity={0.8}>
							<Text style={styles.btnText}>Got it</Text>
						</TouchableOpacity>
					</>
				);

			// Step 6: Custom plan
			case 6:
				return (
					<>
						<Text style={styles.eyebrow}>YOUR PLAN</Text>
						<Text style={styles.title}>We built this for you, {firstName}.</Text>
						<Text style={styles.subtitle}>
							Based on your answers, here's exactly how Divi fits your situation.
						</Text>
						<View style={styles.planCard}>
							{getCustomPlanBullets().map((b, i) => (
								<View key={i} style={styles.checkRow}>
									<MaterialIcons name="check-circle" size={18} color={colors.green} style={{ marginTop: 2 }} />
									<Text style={styles.checkText}>{b}</Text>
								</View>
							))}
						</View>
						<TouchableOpacity style={styles.btn} onPress={advance} activeOpacity={0.8}>
							<Text style={styles.btnText}>Let's do this</Text>
						</TouchableOpacity>
					</>
				);

			// Step 7: Create account
			case 7: {
				const nameValid = fullName.trim().length >= 2;
				const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
				const passValid = password.length >= 6;
				const canSubmit = nameValid && emailValid && passValid;
				return (
					<>
						<Text style={styles.eyebrow}>ALMOST THERE</Text>
						<Text style={styles.title}>Create your account</Text>
						<Text style={styles.subtitle}>
							Your personalized Divi plan is ready. Just need an account to save it.
						</Text>
						<View style={[styles.inputGroup, { marginBottom: 12 }]}>
							<MaterialIcons name="person" size={20} color={colors.gray400} style={{ marginLeft: 15 }} />
							<TextInput
								style={[styles.input, { flex: 1, backgroundColor: 'transparent' }]}
								placeholder="Full name"
								value={fullName}
								onChangeText={setFullName}
								autoCapitalize="words"
								textContentType="name"
							/>
						</View>
						<View style={[styles.inputGroup, { marginBottom: 12 }]}>
							<MaterialIcons name="email" size={20} color={colors.gray400} style={{ marginLeft: 15 }} />
							<TextInput
								style={[styles.input, { flex: 1, backgroundColor: 'transparent' }]}
								placeholder="Email address"
								value={email}
								onChangeText={setEmail}
								autoCapitalize="none"
								keyboardType="email-address"
								textContentType="emailAddress"
							/>
						</View>
						<View style={styles.inputGroup}>
							<MaterialIcons name="lock" size={20} color={colors.gray400} style={{ marginLeft: 15 }} />
							<TextInput
								style={[styles.input, { flex: 1, backgroundColor: 'transparent' }]}
								placeholder="Password (min 6 characters)"
								value={password}
								onChangeText={setPassword}
								secureTextEntry={!showPassword}
								textContentType="newPassword"
							/>
							<TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ paddingRight: 15 }}>
								<MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color={colors.gray400} />
							</TouchableOpacity>
						</View>
						<TouchableOpacity
							style={[styles.btn, !canSubmit && styles.btnDisabled]}
							onPress={performSignUp}
							disabled={!canSubmit || signUpLoading}
							activeOpacity={0.8}
						>
							{signUpLoading
								? <ActivityIndicator color={colors.white} />
								: <Text style={styles.btnText}>Create Account</Text>
							}
						</TouchableOpacity>
					</>
				);
			}

			// Step 8: Username
			case 8:
				return (
					<>
						<Text style={styles.greeting}>Hey {firstName}!</Text>
						<Text style={styles.title}>Pick your handle</Text>
						<Text style={styles.subtitle}>
							Your @id for bill splitting. 3-20 characters, letters, numbers, dots, underscores.
						</Text>
						<View style={styles.inputGroup}>
							<Text style={styles.prefix}>@</Text>
							<TextInput
								style={styles.input}
								placeholder="username"
								value={username}
								onChangeText={(t) => setUsername(t.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
								autoCapitalize="none"
								maxLength={20}
								onSubmitEditing={() => {
									if (isUsernameValid && !checkingUsername) advance();
									else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
								}}
							/>
							{checkingUsername && (
								<ActivityIndicator style={styles.inputIcon} size="small" color={colors.gray400} />
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
							<Text style={styles.errorText}>Username must be at least 3 characters.</Text>
						)}
						{username.length >= 3 && !checkingUsername && (
							<Text style={[styles.statusText, { color: isUsernameTaken ? colors.error : colors.green }]}>
								{isUsernameTaken ? "This handle is taken." : "Handle available!"}
							</Text>
						)}
						<TouchableOpacity
							style={[styles.btn, (!isUsernameValid || checkingUsername) && styles.btnDisabled]}
							onPress={() => {
								if (isUsernameValid && !checkingUsername) {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									advance();
								} else {
									Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
								}
							}}
							disabled={!isUsernameValid || checkingUsername}
						>
							<Text style={styles.btnText}>Continue</Text>
						</TouchableOpacity>
					</>
				);

			// Step 9: Payment handles
			case 9:
				return (
					<>
						<Text style={styles.title}>Connect your handles</Text>
						<Text style={styles.subtitle}>
							Speed up settlement. You can skip this and add them later in Settings.
						</Text>
						<View style={styles.inputGroup}>
							<Image source={VenmoLogo} style={{ width: 22, height: 22, marginLeft: 15 }} resizeMode="contain" />
							<TextInput
								style={[styles.input, { flex: 1, backgroundColor: "transparent" }]}
								placeholder="Venmo @id"
								value={venmo}
								onChangeText={setVenmo}
								autoCapitalize="none"
								maxLength={30}
							/>
						</View>
						<View style={[styles.inputGroup, { marginTop: 12 }]}>
							<Image source={CashAppLogo} style={{ width: 22, height: 22, marginLeft: 15 }} resizeMode="contain" />
							<TextInput
								style={[styles.input, { flex: 1, backgroundColor: "transparent" }]}
								placeholder="CashApp $id"
								value={cashapp}
								onChangeText={setCashapp}
								autoCapitalize="none"
								maxLength={30}
							/>
						</View>
						<View style={[styles.inputGroup, { marginTop: 12 }]}>
							<Image source={ZelleLogo} style={{ width: 22, height: 22, marginLeft: 15 }} resizeMode="contain" />
							<TextInput
								style={[styles.input, { flex: 1, backgroundColor: "transparent" }]}
								placeholder="Zelle phone or email"
								value={zelle}
								onChangeText={setZelle}
								autoCapitalize="none"
								maxLength={50}
							/>
						</View>
						<TouchableOpacity
							style={[styles.btn, { marginTop: spacing.xl }, loading && styles.btnDisabled]}
							onPress={handleFinish}
							disabled={loading}
						>
							{loading
								? <ActivityIndicator color={colors.white} />
								: <Text style={styles.btnText}>Start splitting</Text>
							}
						</TouchableOpacity>
						<TouchableOpacity style={styles.skipBtn} onPress={handleFinish} disabled={loading}>
							<Text style={styles.skipText}>Skip for now</Text>
						</TouchableOpacity>
					</>
				);

			default:
				return null;
		}
	};

	// ── Render ─────────────────────────────────────────────────────────────────
	return (
		<SafeAreaView style={styles.container} edges={["top", "bottom"]}>
			<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
				<ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

					{/* Header row: back + progress + step count */}
					<View style={styles.headerRow}>
						{step > 1 ? (
							<TouchableOpacity
								onPress={back}
								hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
							>
								<MaterialIcons name="arrow-back" size={24} color={colors.gray600} />
							</TouchableOpacity>
						) : (
							<View style={{ width: 24 }} />
						)}
						<View style={styles.progressTrack}>
							<Animated.View
								style={[
									styles.progressBar,
									{
										width: progressAnim.interpolate({
											inputRange: [0, 1],
											outputRange: ["0%", "100%"],
										}),
										backgroundColor: step === 8 && isUsernameTaken ? colors.error : colors.green,
									},
								]}
							/>
						</View>
						<Text style={styles.stepCount}>{step}/{TOTAL_STEPS}</Text>
					</View>

					<FadeInView key={step} style={styles.content}>
						{renderStep()}
					</FadeInView>

				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	scroll: {
		flexGrow: 1,
		paddingTop: spacing.lg,
		paddingHorizontal: spacing.xl,
		paddingBottom: spacing.xxl,
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: spacing.md,
		marginBottom: spacing.xl,
	},
	progressTrack: {
		flex: 1,
		height: 5,
		backgroundColor: colors.gray200,
		borderRadius: radii.full,
	},
	progressBar: {
		height: '100%',
		borderRadius: radii.full,
	},
	stepCount: {
		fontFamily: fonts.body,
		fontSize: fontSizes.xs,
		color: colors.gray400,
		width: 32,
		textAlign: 'right',
	},
	content: {
		flex: 1,
	},

	// Text hierarchy
	eyebrow: {
		fontFamily: fonts.bodySemiBold,
		fontSize: fontSizes.xs,
		color: colors.green,
		letterSpacing: 1.2,
		marginBottom: spacing.sm,
	},
	greeting: {
		fontSize: fontSizes.lg,
		color: colors.gray500,
		fontFamily: fonts.body,
		marginBottom: spacing.xs,
	},
	title: {
		fontSize: fontSizes.xxl,
		fontFamily: fonts.bodyBold,
		color: colors.black,
		marginBottom: spacing.lg,
		letterSpacing: -0.4,
		lineHeight: 38,
	},
	subtitle: {
		fontSize: fontSizes.md,
		color: colors.gray600,
		marginBottom: spacing.xl,
		lineHeight: 24,
		fontFamily: fonts.body,
	},

	// Quiz option cards
	optionList: {
		gap: spacing.sm,
	},
	optionCard: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: colors.white,
		borderRadius: radii.md,
		padding: spacing.md,
		borderWidth: 1.5,
		borderColor: colors.gray200,
	},
	optionCardSelected: {
		borderColor: colors.green,
		backgroundColor: colors.greenLight,
	},
	optionLabel: {
		fontFamily: fonts.bodySemiBold,
		fontSize: fontSizes.md,
		color: colors.black,
		marginBottom: 2,
	},
	optionLabelSelected: {
		color: colors.green,
	},
	optionSub: {
		fontFamily: fonts.body,
		fontSize: fontSizes.xs,
		color: colors.gray500,
	},

	// Profile result
	profileCard: {
		backgroundColor: colors.white,
		borderRadius: radii.lg,
		padding: spacing.xl,
		alignItems: 'center',
		borderWidth: 1,
		borderColor: colors.gray200,
		marginBottom: spacing.xl,
	},
	profileEmoji: {
		fontSize: 56,
		marginBottom: spacing.md,
	},
	profileName: {
		fontFamily: fonts.bodyBold,
		fontSize: fontSizes.xl,
		color: colors.black,
		marginBottom: spacing.md,
		textAlign: 'center',
	},
	statBadge: {
		backgroundColor: colors.greenLight,
		borderRadius: radii.full,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
		marginBottom: spacing.md,
	},
	statText: {
		fontFamily: fonts.bodySemiBold,
		fontSize: fontSizes.xs,
		color: colors.green,
		textAlign: 'center',
	},
	profileDescription: {
		fontFamily: fonts.body,
		fontSize: fontSizes.md,
		color: colors.gray600,
		textAlign: 'center',
		lineHeight: 24,
	},

	// Symptoms
	symptomList: {
		gap: spacing.md,
		marginBottom: spacing.xl,
	},
	symptomRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: spacing.sm,
	},
	symptomDot: {
		width: 8,
		height: 8,
		borderRadius: radii.full,
		backgroundColor: colors.green,
		marginTop: 7,
		flexShrink: 0,
	},
	symptomText: {
		fontFamily: fonts.body,
		fontSize: fontSizes.md,
		color: colors.black,
		flex: 1,
		lineHeight: 24,
	},

	// Shared check list (How it helps + Custom plan)
	checkList: {
		gap: spacing.md,
		marginBottom: spacing.xl,
	},
	checkRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: spacing.sm,
	},
	checkText: {
		fontFamily: fonts.body,
		fontSize: fontSizes.md,
		color: colors.black,
		flex: 1,
		lineHeight: 24,
	},

	// Reviews
	reviewList: {
		gap: spacing.md,
		marginBottom: spacing.xl,
	},
	reviewCard: {
		backgroundColor: colors.white,
		borderRadius: radii.md,
		padding: spacing.md,
		borderWidth: 1,
		borderColor: colors.gray200,
	},
	reviewHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: spacing.xs,
	},
	reviewName: {
		fontFamily: fonts.bodySemiBold,
		fontSize: fontSizes.sm,
		color: colors.black,
	},
	reviewText: {
		fontFamily: fonts.body,
		fontSize: fontSizes.sm,
		color: colors.gray600,
		lineHeight: 20,
	},

	// Features
	featureList: {
		gap: spacing.lg,
		marginBottom: spacing.xl,
	},
	featureRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: spacing.md,
	},
	featureIconBox: {
		width: 46,
		height: 46,
		borderRadius: radii.md,
		backgroundColor: colors.greenLight,
		justifyContent: 'center',
		alignItems: 'center',
		flexShrink: 0,
	},
	featureLabel: {
		fontFamily: fonts.bodySemiBold,
		fontSize: fontSizes.md,
		color: colors.black,
		marginBottom: 3,
	},
	featureDesc: {
		fontFamily: fonts.body,
		fontSize: fontSizes.sm,
		color: colors.gray500,
		lineHeight: 20,
	},

	// Custom plan
	planCard: {
		backgroundColor: colors.white,
		borderRadius: radii.lg,
		padding: spacing.lg,
		gap: spacing.md,
		borderWidth: 1.5,
		borderColor: `${colors.green}40`,
		marginBottom: spacing.xl,
	},

	// Setup inputs
	inputGroup: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.gray100,
		borderRadius: radii.lg,
		height: 60,
	},
	input: {
		flex: 1,
		paddingLeft: 35,
		fontSize: fontSizes.md,
		fontFamily: fonts.body,
		color: colors.black,
	},
	prefix: {
		position: "absolute",
		left: 20,
		fontSize: fontSizes.md,
		color: colors.gray400,
		zIndex: 1,
	},
	inputIcon: {
		position: "absolute",
		right: 18,
	},
	errorText: {
		fontSize: fontSizes.xs,
		color: colors.error,
		fontFamily: fonts.bodyMedium,
		marginTop: spacing.sm,
		marginLeft: spacing.xs,
	},
	statusText: {
		fontSize: fontSizes.xs,
		fontFamily: fonts.bodyMedium,
		marginTop: 10,
		marginLeft: spacing.xs,
	},

	// Shared CTA
	btn: {
		marginTop: spacing.xl,
		backgroundColor: colors.black,
		borderRadius: radii.lg,
		height: 64,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.12,
		shadowRadius: 10,
		elevation: 5,
	},
	btnDisabled: {
		opacity: 0.45,
	},
	btnText: {
		color: colors.white,
		fontSize: fontSizes.lg,
		fontFamily: fonts.bodyBold,
	},
	skipBtn: {
		marginTop: spacing.md,
		alignSelf: "center",
		paddingVertical: 10,
	},
	skipText: {
		fontSize: fontSizes.md,
		color: colors.gray500,
		fontFamily: fonts.bodyMedium,
	},
});
