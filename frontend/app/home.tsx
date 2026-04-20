import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts, fontSizes, spacing } from '@/styles/theme';
import Svg, { Circle, Rect, Path } from "react-native-svg";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	interpolateColor,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GREEN = colors.green;
const BLACK = colors.black;
const ZIGZAG_H = 12;
const ZIGZAG_W = 18;

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

// Zigzag edge — rendered as an SVG strip above the receipt card
function ZigzagEdge({ width, backgroundColor }: { width: number; backgroundColor: string }) {
	const numZigzags = Math.floor(width / ZIGZAG_W);
	let path = `M 0,${ZIGZAG_H}`;
	for (let i = 0; i < numZigzags; i++) {
		const x1 = i * ZIGZAG_W + ZIGZAG_W / 2;
		const x2 = (i + 1) * ZIGZAG_W;
		path += ` L ${x1},0 L ${x2},${ZIGZAG_H}`;
	}
	path += ` L ${width},${ZIGZAG_H} L ${width},${ZIGZAG_H * 3} L 0,${ZIGZAG_H * 3} Z`;

	return (
		<Svg width={width} height={ZIGZAG_H * 3} style={{ display: 'flex' }}>
			<Path d={path} fill={backgroundColor} />
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
		{ top: 178, left: 98,  size: 48, rotate: "15deg",  opacity: 0.28 },
		{ top: 188, left: 268, size: 54, rotate: "-24deg", opacity: 0.2  },
		{ top: 238, left: 40,  size: 50, rotate: "-8deg",  opacity: 0.13 },
		{ top: 248, left: 200, size: 46, rotate: "18deg",  opacity: 0.1  },
		{ top: 255, left: 330, size: 52, rotate: "-14deg", opacity: 0.08 },
		{ top: 305, left: 110, size: 48, rotate: "10deg",  opacity: 0.05 },
		{ top: 315, left: 260, size: 44, rotate: "-20deg", opacity: 0.03 },
	];

	return (
		<View style={styles.container}>
			{/* Scattered logos */}
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

				{/* Fade logos into the receipt */}
				<LinearGradient
					colors={[
						"rgba(246,245,242,0.0)",
						"rgba(246,245,242,0.6)",
						"rgba(246,245,242,1.0)",
					]}
					locations={[0.1, 0.5, 0.75]}
					style={styles.gradient}
				/>
			</View>

			{/* Receipt card */}
			<View style={styles.receiptWrapper}>
				<ZigzagEdge width={SCREEN_WIDTH} backgroundColor={colors.white} />

				<View style={styles.receipt}>
					{/* Receipt header */}
					<View style={styles.receiptHeader}>
						<DiviLogo size={28} />
						<Text style={styles.receiptTitle}>divi</Text>
					</View>

					<View style={styles.receiptDivider} />

					<Text style={styles.subheading}>for who owes what.</Text>

					<View style={[styles.receiptDivider, { marginBottom: spacing.xl }]} />

					{/* CTA */}
					<TouchableOpacity
						onPress={() => router.push({ pathname: "/auth", params: { mode: "signup" } })}
						onPressIn={() => { buttonProgress.value = withTiming(1, { duration: 140 }); }}
						onPressOut={() => { buttonProgress.value = withTiming(0, { duration: 220 }); }}
						activeOpacity={1}
					>
						<Animated.View style={[styles.button, animatedButtonStyle]}>
							<Text style={styles.buttonText}>Get Started — It&apos;s Free</Text>
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
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
	},
	gradient: {
		position: "absolute",
		left: 0,
		right: 0,
		top: 0,
		bottom: 0,
	},

	// Receipt
	receiptWrapper: {
		width: "100%",
	},
	receipt: {
		backgroundColor: colors.white,
		paddingHorizontal: spacing.xl,
		paddingBottom: 52,
	},
	receiptHeader: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingTop: spacing.lg,
		paddingBottom: spacing.md,
	},
	receiptTitle: {
		fontFamily: fonts.bodyBold,
		fontSize: fontSizes.xxl,
		color: BLACK,
		letterSpacing: 6,
		textTransform: "lowercase",
	},
	receiptDivider: {
		height: 1,
		backgroundColor: colors.gray200,
		marginVertical: spacing.md,
	},
	subheading: {
		fontFamily: fonts.body,
		fontSize: fontSizes.lg,
		color: colors.gray500,
		paddingVertical: spacing.md,
	},

	// CTA
	button: {
		paddingVertical: 17,
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 14,
	},
	buttonText: {
		fontSize: fontSizes.md,
		fontFamily: fonts.bodySemiBold,
		color: colors.white,
		letterSpacing: 0.2,
	},
	loginRow: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: spacing.md,
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
