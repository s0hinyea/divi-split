import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useContext } from "react";
import { SessionContext } from "./_layout";
import Svg, { Circle, Rect } from "react-native-svg";
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withTiming,
	interpolateColor,
} from "react-native-reanimated";

const { width: SCREEN_W } = Dimensions.get("window");

const GREEN = "#228B22";
const BLACK = "#000000";

// Render the Divi logo as inline SVG (scalable, no image file needed)
function DiviLogo({ size = 80 }: { size?: number }) {
	const scale = size / 160; // SVG viewBox height is 160
	return (
		<Svg
			width={120 * scale}
			height={160 * scale}
			viewBox="0 0 120 160"
			fill="none"
		>
			<Circle cx="20" cy="80" r="8" fill={GREEN} />
			<Rect x="40" y="30" width="10" height="100" rx="5" fill={GREEN} />
			<Rect x="70" y="30" width="10" height="100" rx="5" fill={BLACK} />
			<Circle cx="100" cy="80" r="8" fill={BLACK} />
		</Svg>
	);
}

export default function Home() {
	const router = useRouter();
	const { session } = useContext(SessionContext);

	// Animated button press (0 = default, 1 = pressed)
	const buttonProgress = useSharedValue(0);

	const animatedButtonStyle = useAnimatedStyle(() => ({
		backgroundColor: interpolateColor(
			buttonProgress.value,
			[0, 1],
			["#FFFFFF", GREEN]
		),
		borderColor: interpolateColor(
			buttonProgress.value,
			[0, 1],
			[BLACK, GREEN]
		),
	}));

	const animatedTextStyle = useAnimatedStyle(() => ({
		color: interpolateColor(
			buttonProgress.value,
			[0, 1],
			[BLACK, "#FFFFFF"]
		),
	}));

	return (
		<View style={styles.container}>
			{/* Background: scattered logos with fade */}
			<View style={styles.bgImageContainer}>
				{/* Scatter several small logos across the top */}
				{[
					{ top: 10, left: 10, size: 60, rotate: "-10deg", opacity: 0.8 },
					{ top: 15, left: 180, size: 55, rotate: "12deg", opacity: 0.8 },
					{ top: 25, left: 300, size: 50, rotate: "-5deg", opacity: 0.78 },
					{ top: 70, left: 80, size: 48, rotate: "18deg", opacity: 0.7 },
					{ top: 60, left: 240, size: 55, rotate: "-20deg", opacity: 0.72 },
					{ top: 55, left: 350, size: 42, rotate: "8deg", opacity: 0.68 },
					{ top: 120, left: 20, size: 52, rotate: "-15deg", opacity: 0.55 },
					{ top: 110, left: 160, size: 45, rotate: "25deg", opacity: 0.5 },
					{ top: 130, left: 310, size: 50, rotate: "-8deg", opacity: 0.48 },
					{ top: 170, left: 100, size: 46, rotate: "14deg", opacity: 0.38 },
					{ top: 180, left: 260, size: 52, rotate: "-22deg", opacity: 0.35 },
					{ top: 190, left: 10, size: 40, rotate: "6deg", opacity: 0.3 },
					{ top: 230, left: 200, size: 48, rotate: "-12deg", opacity: 0.22 },
					{ top: 240, left: 50, size: 44, rotate: "16deg", opacity: 0.2 },
					{ top: 260, left: 320, size: 38, rotate: "-18deg", opacity: 0.15 },
					{ top: 290, left: 140, size: 50, rotate: "10deg", opacity: 0.1 },
					{ top: 310, left: 270, size: 42, rotate: "-6deg", opacity: 0.08 },
				].map((pos, i) => (
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

				{/* Gradient fade to white */}
				<LinearGradient
					colors={[
						"rgba(255,255,255,0.1)",
						"rgba(255,255,255,0.85)",
						"rgba(255,255,255,1)",
					]}
					style={styles.gradientOverlay}
				/>
			</View>

			{/* Divi title with alternating colors: D(black) i(green) v(black) i(green) */}
			<Text style={styles.titleContainer}>
				<Text style={[styles.title, { color: BLACK }]}>D</Text>
				<Text style={[styles.title, { color: GREEN }]}>i</Text>
				<Text style={[styles.title, { color: BLACK }]}>v</Text>
				<Text style={[styles.title, { color: GREEN }]}>i</Text>
			</Text>

			<Text style={styles.subtitle}>Split your bills with ease.</Text>

			{/* Get Started button — smooth animated press */}
			<TouchableOpacity
				onPress={() =>
					router.push({
						pathname: "/auth",
						params: { mode: "signup" },
					})
				}
				onPressIn={() => {
					buttonProgress.value = withTiming(1, { duration: 150 });
				}}
				onPressOut={() => {
					buttonProgress.value = withTiming(0, { duration: 250 });
				}}
				activeOpacity={1}
				style={{ marginTop: 50, width: "100%" }}
			>
				<Animated.View style={[styles.button, animatedButtonStyle]}>
					<Animated.Text style={[styles.buttonText, animatedTextStyle]}>
						Get Started for Free
					</Animated.Text>
				</Animated.View>
			</TouchableOpacity>

			{/* Login link */}
			<View style={styles.loginContainer}>
				<Text style={styles.smallText}>Already have an account? </Text>
				<TouchableOpacity
					onPress={() =>
						router.push({
							pathname: "/auth",
							params: { mode: "login" },
						})
					}
				>
					<Text style={styles.loginText}>Log In</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFFFFF",
		justifyContent: "center",
		padding: 40,
	},
	bgImageContainer: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
	},
	gradientOverlay: {
		position: "absolute",
		left: 0,
		right: 0,
		top: 0,
		height: 5000,
	},
	titleContainer: {
		marginTop: 350,
	},
	title: {
		fontSize: 48,
		fontWeight: "bold",
		fontFamily: "TanMeringue",
		letterSpacing: 4,
	},
	subtitle: {
		fontSize: 24,
		color: "#101010",
		fontFamily: "OptimaRoman",
	},
	button: {
		padding: 15,
		width: "100%",
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#FFFFFF",
		borderRadius: 15,
		borderWidth: 2,
		borderColor: BLACK,
	},
	buttonText: {
		fontSize: 20,
		fontFamily: "OptimaRoman",
		fontWeight: "bold",
	},
	loginContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 20,
	},
	smallText: {
		fontSize: 16,
		color: BLACK,
		fontFamily: "OptimaRoman",
		textAlign: "center",
	},
	loginText: {
		color: GREEN,
		fontWeight: "bold",
		fontFamily: "OptimaRoman",
		fontSize: 16,
	},
});
