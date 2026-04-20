import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, fontSizes, radii, spacing } from '@/styles/theme';
import Svg, { Circle, Rect } from "react-native-svg";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	interpolateColor,
} from "react-native-reanimated";

const GREEN = colors.green;
const BLACK = colors.black;

function DiviLogo({ size = 80, green = GREEN, black = BLACK }: { size?: number; green?: string; black?: string }) {
	const scale = size / 160;
	return (
		<Svg width={120 * scale} height={160 * scale} viewBox="0 0 120 160" fill="none">
			<Circle cx="20" cy="80" r="8" fill={green} />
			<Rect x="40" y="30" width="10" height="100" rx="5" fill={green} />
			<Rect x="70" y="30" width="10" height="100" rx="5" fill={black} />
			<Circle cx="100" cy="80" r="8" fill={black} />
		</Svg>
	);
}

export default function Home() {
	const router = useRouter();
	const buttonProgress = useSharedValue(0);

	const animatedButtonStyle = useAnimatedStyle(() => ({
		backgroundColor: interpolateColor(
			buttonProgress.value,
			[0, 1],
			[BLACK, GREEN]
		),
	}));

	const animatedTextStyle = useAnimatedStyle(() => ({
		color: interpolateColor(
			buttonProgress.value,
			[0, 1],
			["#FFFFFF", "#FFFFFF"]
		),
	}));

	const logos = [
		{ top: 8,   left: 12,  size: 64, rotate: "-12deg", opacity: 0.9  },
		{ top: 12,  left: 190, size: 56, rotate: "14deg",  opacity: 0.88 },
		{ top: 18,  left: 310, size: 52, rotate: "-6deg",  opacity: 0.85 },
		{ top: 72,  left: 70,  size: 50, rotate: "20deg",  opacity: 0.75 },
		{ top: 62,  left: 248, size: 58, rotate: "-22deg", opacity: 0.72 },
		{ top: 58,  left: 358, size: 44, rotate: "9deg",   opacity: 0.68 },
		{ top: 128, left: 18,  size: 54, rotate: "-16deg", opacity: 0.52 },
		{ top: 118, left: 162, size: 46, rotate: "26deg",  opacity: 0.48 },
		{ top: 136, left: 318, size: 52, rotate: "-9deg",  opacity: 0.44 },
		{ top: 178, left: 98,  size: 48, rotate: "15deg",  opacity: 0.34 },
		{ top: 188, left: 268, size: 54, rotate: "-24deg", opacity: 0.3  },
		{ top: 196, left: 12,  size: 42, rotate: "7deg",   opacity: 0.26 },
		{ top: 238, left: 208, size: 50, rotate: "-13deg", opacity: 0.16 },
		{ top: 248, left: 52,  size: 46, rotate: "18deg",  opacity: 0.14 },
		{ top: 268, left: 330, size: 40, rotate: "-20deg", opacity: 0.1  },
		{ top: 300, left: 148, size: 52, rotate: "11deg",  opacity: 0.07 },
		{ top: 320, left: 280, size: 44, rotate: "-7deg",  opacity: 0.05 },
	];

	return (
		<View style={styles.container}>
			{/* Background logos */}
			<View style={styles.bgContainer}>
				{logos.map((pos, i) => (
					<View
						key={i}
						style={{
							position: "absolute",
							top: pos.top,
							left: pos.left,
							opacity: pos.opacity,
							transform: [{ rotate: pos.rotate }],
						}}
					>
						<DiviLogo size={pos.size} />
					</View>
				))}

				{/* Gradient fade — stronger, more dramatic */}
				<LinearGradient
					colors={[
						"rgba(246,245,242,0.0)",
						"rgba(246,245,242,0.7)",
						"rgba(246,245,242,1.0)",
					]}
					locations={[0, 0.55, 0.85]}
					style={styles.gradientOverlay}
				/>
			</View>

			{/* Content */}
			<View style={styles.content}>
				{/* Brand mark */}
				<View style={styles.brandRow}>
					<DiviLogo size={36} />
				</View>

				{/* Headline */}
				<Text style={styles.titleContainer}>
					<Text style={[styles.title, { color: BLACK }]}>D</Text>
					<Text style={[styles.title, { color: GREEN }]}>i</Text>
					<Text style={[styles.title, { color: BLACK }]}>v</Text>
					<Text style={[styles.title, { color: GREEN }]}>i</Text>
				</Text>

				<Text style={styles.subtitle}>Split smarter. Pay faster.</Text>

				{/* CTA */}
				<TouchableOpacity
					onPress={() => router.push({ pathname: "/auth", params: { mode: "signup" } })}
					onPressIn={() => { buttonProgress.value = withTiming(1, { duration: 140 }); }}
					onPressOut={() => { buttonProgress.value = withTiming(0, { duration: 220 }); }}
					activeOpacity={1}
					style={styles.buttonWrapper}
				>
					<Animated.View style={[styles.button, animatedButtonStyle]}>
						<Animated.Text style={[styles.buttonText, animatedTextStyle]}>
							Get Started — It&apos;s Free
						</Animated.Text>
					</Animated.View>
				</TouchableOpacity>

				{/* Login */}
				<View style={styles.loginRow}>
					<Text style={styles.loginHint}>Already have an account? </Text>
					<TouchableOpacity onPress={() => router.push({ pathname: "/auth", params: { mode: "login" } })}>
						<Text style={styles.loginLink}>Log In</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.background,
	},
	bgContainer: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		height: 420,
	},
	gradientOverlay: {
		position: "absolute",
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
	},
	content: {
		flex: 1,
		justifyContent: "flex-end",
		paddingHorizontal: spacing.xl,
		paddingBottom: 60,
	},
	brandRow: {
		marginBottom: spacing.xl,
	},
	titleContainer: {
		marginBottom: spacing.sm,
	},
	title: {
		fontSize: 56,
		fontFamily: fonts.bodyBold,
		letterSpacing: -1,
		lineHeight: 64,
	},
	subtitle: {
		fontSize: fontSizes.lg,
		color: colors.gray500,
		fontFamily: fonts.body,
		marginBottom: spacing.xl,
		letterSpacing: 0.2,
	},
	buttonWrapper: {
		width: "100%",
		marginBottom: spacing.md,
	},
	button: {
		paddingVertical: 18,
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: radii.md,
		shadowColor: BLACK,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 12,
		elevation: 4,
	},
	buttonText: {
		fontSize: fontSizes.md,
		fontFamily: fonts.bodySemiBold,
		letterSpacing: 0.2,
	},
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
		color: colors.green,
		fontFamily: fonts.bodySemiBold,
		fontSize: fontSizes.sm,
	},
});
