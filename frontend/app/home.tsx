import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Text, Button, Surface } from "react-native-paper";
import { styles } from "../styles/homeCss";

export default function Home() {
	const router = useRouter();

	return (
		<View style={styles.container}>
			{/* <Surface style={styles.surface}> */}
			<Image
				style={styles.bgImage}
				source={require("../assets/images/floating-divison-signs.png")}
			></Image>
			<Text style={styles.title}>Divi</Text>
			<Text style={styles.subtitle}>Split your bills with ease.</Text>
			<TouchableOpacity
				onPress={() => {
					router.push("/expense-splitter");
				}}
				style={styles.button}
			>
				<Text style={styles.buttonText}>Get Started for Free</Text>
			</TouchableOpacity>
			<View style={styles.loginContainer}>
				<Text style={styles.smallText}>Already have an account? </Text>
				<TouchableOpacity>
					<Text style={styles.loginText}>Log In</Text>
				</TouchableOpacity>
			</View>

			{/* </Surface> */}
		</View>
	);
}
