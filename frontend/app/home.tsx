import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Text, Button, Surface } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "../styles/homeCss";
import { useContext } from "react";
import { SessionContext } from "./_layout";

export default function Home() {
	const router = useRouter();
	const { session } = useContext(SessionContext);

	return (
		<View style={styles.container}>
			<View style={styles.bgImageContainer}>
				<Image
					style={styles.bgImage}
					source={require("../assets/images/floating-divison-signs.png")}
				/>
				<LinearGradient
					colors={[
						"rgba(255,240,219,0.1)",
						"rgba(255,240,219,0.9)",
						"rgba(255,240,219,1)",
					]}
					style={styles.gradientOverlay}
				/>
			</View>
			<Text style={styles.title}>Divi</Text>
			<Text style={styles.subtitle}>Split your bills with ease.</Text>
			<TouchableOpacity
				onPress={() =>
					router.push({
						pathname: "/auth",
						params: { mode: "signup" },
					})
				}
				style={styles.button}
			>
				<Text style={styles.buttonText}>Get Started for Free</Text>
			</TouchableOpacity>
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
