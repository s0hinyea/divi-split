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

// Dots leader for receipt rows
function Dots() {
	return (
		<Text style={styles.dots} numberOfLines={1}>
			{"· · · · · · · · · · · · · · · · · · · ·"}
		</Text>
	);
}

const TODAY = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const TIME = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export default function Home() {
	const router = useRouter();
	const buttonProgress = useSharedValue(0);

	const animatedButtonStyle = useAnimatedStyle(() => ({
		backgroundColor: interpolateColor(buttonProgress.value, [0, 1], [BLACK, GREEN]),
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
					<View key={i} style={{ position: "absolute", top: pos.top, left: pos.left, opacity: pos.opacity, transform: [{ rotate: pos.rotate }] }}>
						<DiviLogo size={pos.size} />
					</View>
				))}
				<LinearGradient
					colors={["rgba(246,245,242,0.0)", "rgba(246,245,242,0.65)", "rgba(246,245,242,1.0)"]}
					locations={[0.1, 0.5, 0.72]}
					style={styles.gradient}
				/>
			</View>

			{/* Receipt */}
			<View style={styles.receiptOuter}>
				<ZigzagEdge width={SCREEN_WIDTH} />

				<View style={styles.receipt}>

					{/* ── Merchant header ── */}
					<View style={styles.merchantHeader}>
						<DiviLogo size={32} />
						<Text style={styles.merchantName}>
							<Text style={{ color: BLACK }}>D</Text>
							<Text style={{ color: GREEN }}>i</Text>
							<Text style={{ color: BLACK }}>v</Text>
							<Text style={{ color: GREEN }}>i</Text>
						</Text>
						<Text style={styles.merchantTagline}>for who owes what.</Text>
					</View>

					<View style={styles.divider} />

					{/* ── Meta row ── */}
					<View style={styles.metaRow}>
						<Text style={styles.metaText}>{TODAY}  {TIME}</Text>
						<Text style={styles.metaText}>REF #0001</Text>
					</View>

					<View style={styles.dividerDashed} />

					{/* ── Line items ── */}
					<View style={styles.lineItem}>
						<Text style={styles.itemName}>Receipt scanning</Text>
						<Dots />
						<Text style={styles.itemPrice}>FREE</Text>
					</View>
					<View style={styles.lineItem}>
						<Text style={styles.itemName}>Contact picking</Text>
						<Dots />
						<Text style={styles.itemPrice}>FREE</Text>
					</View>
					<View style={styles.lineItem}>
						<Text style={styles.itemName}>Item assignment</Text>
						<Dots />
						<Text style={styles.itemPrice}>FREE</Text>
					</View>
					<View style={styles.lineItem}>
						<Text style={styles.itemName}>Payment dispatch</Text>
						<Dots />
						<Text style={styles.itemPrice}>FREE</Text>
					</View>
					<View style={styles.lineItem}>
						<Text style={[styles.itemName, { color: GREEN }]}>Voice AI assistant</Text>
						<Dots />
						<Text style={[styles.itemPrice, { color: GREEN }]}>PRO</Text>
					</View>

					<View style={styles.dividerDashed} />

					{/* ── Totals ── */}
					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>Subtotal</Text>
						<Text style={styles.totalValue}>$0.00</Text>
					</View>
					<View style={styles.totalRow}>
						<Text style={styles.totalLabel}>Tax</Text>
						<Text style={styles.totalValue}>$0.00</Text>
					</View>

					<View style={styles.divider} />

					<View style={styles.totalRow}>
						<Text style={styles.grandLabel}>TOTAL DUE</Text>
						<Text style={styles.grandValue}>$0.00</Text>
					</View>

					<View style={styles.dividerDashed} />

					{/* ── Tagline ── */}
					<Text style={styles.thankYou}>Thank you for dining.</Text>
					<Text style={styles.tagline}>Split the bill. Keep the friends.</Text>

					<View style={styles.divider} />

					{/* ── CTA ── */}
					<TouchableOpacity
						onPress={() => router.push({ pathname: "/auth", params: { mode: "signup" } })}
						onPressIn={() => { buttonProgress.value = withTiming(1, { duration: 140 }); }}
						onPressOut={() => { buttonProgress.value = withTiming(0, { duration: 220 }); }}
						activeOpacity={1}
						style={{ marginTop: spacing.sm }}
					>
						<Animated.View style={[styles.button, animatedButtonStyle]}>
							<Text style={styles.buttonText}>Sign Up for Free</Text>
						</Animated.View>
					</TouchableOpacity>

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

	// Receipt shell
	receiptOuter: {
		borderLeftWidth: 1,
		borderRightWidth: 1,
		borderBottomWidth: 1,
		borderColor: BLACK,
	},
	receipt: {
		backgroundColor: colors.white,
		paddingHorizontal: spacing.xl,
		paddingBottom: 44,
	},

	// Header
	merchantHeader: {
		alignItems: "center",
		paddingTop: spacing.lg,
		paddingBottom: spacing.md,
		gap: 4,
	},
	merchantName: {
		fontFamily: fonts.bodyBold,
		fontSize: 36,
		letterSpacing: 8,
		marginTop: spacing.sm,
	},
	merchantTagline: {
		fontFamily: fonts.body,
		fontSize: fontSizes.sm,
		color: colors.gray500,
		letterSpacing: 0.5,
	},

	// Dividers
	divider: {
		height: 1,
		backgroundColor: BLACK,
		marginVertical: spacing.md,
	},
	dividerDashed: {
		borderBottomWidth: 1,
		borderColor: BLACK,
		borderStyle: "dashed",
		marginVertical: spacing.md,
	},

	// Meta
	metaRow: {
		flexDirection: "row",
		justifyContent: "space-between",
	},
	metaText: {
		fontFamily: fonts.body,
		fontSize: fontSizes.xs,
		color: colors.gray500,
	},

	// Line items
	lineItem: {
		flexDirection: "row",
		alignItems: "center",
		paddingVertical: 5,
	},
	itemName: {
		fontFamily: fonts.body,
		fontSize: fontSizes.sm,
		color: BLACK,
		width: 148,
	},
	dots: {
		flex: 1,
		fontFamily: fonts.body,
		fontSize: fontSizes.xs,
		color: colors.gray300,
		overflow: "hidden",
	},
	itemPrice: {
		fontFamily: fonts.bodySemiBold,
		fontSize: fontSizes.sm,
		color: BLACK,
		width: 36,
		textAlign: "right",
	},

	// Totals
	totalRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingVertical: 4,
	},
	totalLabel: {
		fontFamily: fonts.body,
		fontSize: fontSizes.sm,
		color: colors.gray600,
	},
	totalValue: {
		fontFamily: fonts.body,
		fontSize: fontSizes.sm,
		color: BLACK,
	},
	grandLabel: {
		fontFamily: fonts.bodyBold,
		fontSize: fontSizes.md,
		color: BLACK,
		letterSpacing: 1,
	},
	grandValue: {
		fontFamily: fonts.bodyBold,
		fontSize: fontSizes.md,
		color: BLACK,
	},

	// Tagline
	thankYou: {
		fontFamily: fonts.body,
		fontSize: fontSizes.sm,
		color: colors.gray500,
		textAlign: "center",
		marginTop: spacing.xs,
	},
	tagline: {
		fontFamily: fonts.bodySemiBold,
		fontSize: fontSizes.sm,
		color: BLACK,
		textAlign: "center",
		marginTop: 2,
		marginBottom: spacing.xs,
	},

	// CTA
	button: {
		paddingVertical: 16,
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 12,
	},
	buttonText: {
		fontSize: fontSizes.md,
		fontFamily: fonts.bodySemiBold,
		color: colors.white,
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
