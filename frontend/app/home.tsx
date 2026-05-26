import { View, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, fontSizes, spacing } from '@/styles/theme';
import Svg, { Path } from "react-native-svg";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import DiviLogo from "@/components/DiviLogo";
import { useState } from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import { supabase } from "@/lib/supabase";

// Google Sign-In is a native module that doesn't exist in Expo Go.
// Lazy-load it so the app doesn't crash in dev mode.
let GoogleSignin: any = null;
let statusCodes: any = {};
try {
	const gsi = require("@react-native-google-signin/google-signin");
	GoogleSignin = gsi.GoogleSignin;
	statusCodes = gsi.statusCodes;
	GoogleSignin.configure({
		iosClientId: "944876518323-9jj4llibmjk07dk10qa2l1beuk1bcdtd.apps.googleusercontent.com",
		iosUrlScheme: "com.googleusercontent.apps.944876518323-9jj4llibmjk07dk10qa2l1beuk1bcdtd",
		scopes: ["profile", "email"],
	});
} catch {
	// Running in Expo Go - Google Sign-In not available
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GREEN = colors.green;
const BLACK = colors.black;
const ZIGZAG_H = 12;
const ZIGZAG_W = 18;

function ZigzagEdge({ width }: { width: number }) {
	const numZigzags = Math.floor(width / ZIGZAG_W);
	let path = `M 0,${ZIGZAG_H}`;
	for (let i = 0; i < numZigzags; i++) {
		const x1 = i * ZIGZAG_W + ZIGZAG_W / 2;
		const x2 = (i + 1) * ZIGZAG_W;
		path += ` L ${x1},0 L ${x2},${ZIGZAG_H}`;
	}
	path += ` L ${width},${ZIGZAG_H} L ${width},${ZIGZAG_H * 3} L 0,${ZIGZAG_H * 3} Z`;
	return (
		<Svg width={width} height={ZIGZAG_H * 3}>
			<Path d={path} fill={colors.white} stroke={BLACK} strokeWidth={1} />
		</Svg>
	);
}

export default function Home() {
	const router = useRouter();
	const [loadingApple, setLoadingApple] = useState(false);
	const [loadingGoogle, setLoadingGoogle] = useState(false);

	const logos = [
		{ top: 8,   left: 12,  size: 64, rotate: "-12deg", opacity: 0.9  },
		{ top: 12,  left: 190, size: 56, rotate: "14deg",  opacity: 0.88 },
		{ top: 18,  left: 310, size: 52, rotate: "-6deg",  opacity: 0.85 },
		{ top: 72,  left: 70,  size: 50, rotate: "20deg",  opacity: 0.75 },
		{ top: 62,  left: 248, size: 58, rotate: "-22deg", opacity: 0.72 },
		{ top: 58,  left: 358, size: 44, rotate: "9deg",   opacity: 0.68 },
		{ top: 128, left: 18,  size: 54, rotate: "-16deg", opacity: 0.60 },
		{ top: 118, left: 162, size: 46, rotate: "26deg",  opacity: 0.56 },
		{ top: 136, left: 318, size: 52, rotate: "-9deg",  opacity: 0.52 },
		{ top: 188, left: 98,  size: 48, rotate: "15deg",  opacity: 0.44 },
		{ top: 198, left: 268, size: 54, rotate: "-24deg", opacity: 0.40 },
		{ top: 185, left: 20,  size: 44, rotate: "-8deg",  opacity: 0.38 },
		{ top: 255, left: 150, size: 50, rotate: "18deg",  opacity: 0.28 },
		{ top: 265, left: 330, size: 48, rotate: "-14deg", opacity: 0.24 },
		{ top: 258, left: 40,  size: 46, rotate: "10deg",  opacity: 0.20 },
		{ top: 325, left: 200, size: 52, rotate: "-20deg", opacity: 0.13 },
		{ top: 330, left: 50,  size: 44, rotate: "14deg",  opacity: 0.10 },
		{ top: 335, left: 330, size: 48, rotate: "-6deg",  opacity: 0.08 },
		{ top: 390, left: 110, size: 50, rotate: "22deg",  opacity: 0.05 },
		{ top: 395, left: 270, size: 46, rotate: "-16deg", opacity: 0.03 },
	];

	const handleAppleSignIn = async () => {
		setLoadingApple(true);
		try {
			const credential = await AppleAuthentication.signInAsync({
				requestedScopes: [
					AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
					AppleAuthentication.AppleAuthenticationScope.EMAIL,
				],
			});

			if (!credential.identityToken) throw new Error("No identity token returned.");

			const { error } = await supabase.auth.signInWithIdToken({
				provider: "apple",
				token: credential.identityToken,
			});

			if (error) throw error;
			router.replace("/");
		} catch (e: any) {
			if (e.code !== "ERR_REQUEST_CANCELED") {
				Alert.alert("Sign In Failed", e.message ?? "Something went wrong.");
			}
		} finally {
			setLoadingApple(false);
		}
	};

	const handleGoogleSignIn = async () => {
		if (!GoogleSignin) {
			Alert.alert("Not Available", "Google Sign-In is not available in Expo Go. Use Apple Sign-In for development.");
			return;
		}
		setLoadingGoogle(true);
		try {
			await GoogleSignin.hasPlayServices();
			await GoogleSignin.signIn();
			const { idToken } = await GoogleSignin.getTokens();

			if (!idToken) throw new Error("No ID token returned.");

			const { error } = await supabase.auth.signInWithIdToken({
				provider: "google",
				token: idToken,
			});

			if (error) throw error;
			router.replace("/");
		} catch (e: any) {
			if (e.code !== statusCodes.SIGN_IN_CANCELLED) {
				Alert.alert("Sign In Failed", e.message ?? "Something went wrong.");
			}
		} finally {
			setLoadingGoogle(false);
		}
	};

	return (
		<View style={styles.container}>
			{/* Scattered logos */}
			<View style={styles.bgContainer}>
				{logos.map((pos, i) => (
					<View key={i} style={{ position: "absolute", top: pos.top, left: pos.left, opacity: pos.opacity, transform: [{ rotate: pos.rotate }] }}>
						<DiviLogo size={pos.size} />
					</View>
				))}
				<LinearGradient
					colors={["rgba(246,245,242,0.0)", "rgba(246,245,242,0.5)", "rgba(246,245,242,1.0)"]}
					locations={[0.45, 0.7, 0.88]}
					style={styles.gradient}
				/>
			</View>

			{/* Title - above the receipt */}
			<View style={styles.titleSection}>
				<Text style={styles.title}>
					<Text style={{ color: BLACK }}>D</Text>
					<Text style={{ color: GREEN }}>i</Text>
					<Text style={{ color: BLACK }}>v</Text>
					<Text style={{ color: GREEN }}>i</Text>
				</Text>
				<Text style={styles.tagline}>for who owes what.</Text>
			</View>

			{/* Receipt card - sign in options */}
			<View style={styles.receiptOuter}>
				<ZigzagEdge width={SCREEN_WIDTH} />
				<View style={styles.receipt}>

					{/* Apple */}
					<TouchableOpacity
						style={[styles.appleButton, loadingApple && styles.buttonDisabled]}
						activeOpacity={0.85}
						onPress={handleAppleSignIn}
						disabled={loadingApple || loadingGoogle}
					>
						{loadingApple
							? <ActivityIndicator color={colors.white} />
							: <>
								<Ionicons name="logo-apple" size={20} color={colors.white} />
								<Text style={styles.appleText}>Continue with Apple</Text>
							</>
						}
					</TouchableOpacity>

					{/* Google */}
					<TouchableOpacity
						style={[styles.googleButton, loadingGoogle && styles.buttonDisabled]}
						activeOpacity={0.85}
						onPress={handleGoogleSignIn}
						disabled={loadingApple || loadingGoogle}
					>
						{loadingGoogle
							? <ActivityIndicator color={BLACK} />
							: <>
								<Ionicons name="logo-google" size={18} color={BLACK} />
								<Text style={styles.googleText}>Continue with Google</Text>
							</>
						}
					</TouchableOpacity>

					{/* Divider */}
					<View style={styles.orRow}>
						<View style={styles.orLine} />
						<Text style={styles.orText}>or</Text>
						<View style={styles.orLine} />
					</View>

					{/* Email */}
					<TouchableOpacity
						style={styles.emailButton}
						onPress={() => router.push({ pathname: "/auth", params: { mode: "signup" } })}
						activeOpacity={0.85}
					>
						<MaterialIcons name="email" size={18} color={BLACK} />
						<Text style={styles.emailText}>Sign Up with Email</Text>
					</TouchableOpacity>

					{/* Login link */}
					<View style={styles.loginRow}>
						<Text style={styles.loginHint}>Already have an account? </Text>
						<TouchableOpacity onPress={() => router.push({ pathname: "/auth", params: { mode: "login" } })}>
							<Text style={styles.loginLink}>Log In</Text>
						</TouchableOpacity>
					</View>

				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
		justifyContent: "flex-end",
	},
	bgContainer: {
		position: "absolute",
		top: 0, left: 0, right: 0, bottom: 0,
	},
	gradient: {
		position: "absolute",
		top: 0, left: 0, right: 0, bottom: 0,
	},

	// Title above receipt
	titleSection: {
		paddingHorizontal: spacing.xl,
		paddingBottom: spacing.xl,
		gap: 6,
		alignItems: "center",
	},
	title: {
		fontFamily: fonts.bodyBold,
		fontSize: 72,
		letterSpacing: -2,
	},
	tagline: {
		fontFamily: fonts.body,
		fontSize: fontSizes.xl,
		color: colors.gray500,
	},

	// Receipt shell
	receiptOuter: {},
	receipt: {
		backgroundColor: colors.white,
		paddingHorizontal: spacing.xl,
		paddingTop: spacing.lg,
		paddingBottom: 48,
		gap: spacing.sm,
	},

	// Buttons
	appleButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
		backgroundColor: BLACK,
		paddingVertical: 15,
		borderRadius: 12,
		height: 54,
	},
	appleText: {
		fontFamily: fonts.bodySemiBold,
		fontSize: fontSizes.md,
		color: colors.white,
	},
	googleButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
		backgroundColor: colors.white,
		paddingVertical: 15,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.gray200,
		height: 54,
	},
	googleText: {
		fontFamily: fonts.bodySemiBold,
		fontSize: fontSizes.md,
		color: BLACK,
	},
	buttonDisabled: {
		opacity: 0.6,
	},

	// Or divider
	orRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		marginVertical: spacing.xs,
	},
	orLine: {
		flex: 1,
		height: 1,
		backgroundColor: colors.gray200,
	},
	orText: {
		fontFamily: fonts.body,
		fontSize: fontSizes.sm,
		color: colors.gray400,
	},

	// Email button
	emailButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
		backgroundColor: colors.white,
		paddingVertical: 15,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: colors.gray200,
	},
	emailText: {
		fontFamily: fonts.bodySemiBold,
		fontSize: fontSizes.md,
		color: BLACK,
	},

	// Login
	loginRow: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: spacing.xs,
	},
	loginHint: {
		fontSize: fontSizes.sm,
		color: colors.gray500,
		fontFamily: fonts.body,
	},
	loginLink: {
		color: GREEN,
		fontFamily: fonts.bodySemiBold,
		fontSize: fontSizes.sm,
	},
});
