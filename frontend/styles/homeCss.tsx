import { log } from "console";
import { StyleSheet } from "react-native";
import { text } from "stream/consumers";

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff0db",
		justifyContent: "center",
		padding: 40,
	},
	bgImageContainer: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
	},
	bgImage: {
		width: 400,
		height: 400,
		opacity: 1,
		position: "absolute",
		top: 0,
	},
	gradientOverlay: {
		position: "absolute",
		left: 0,
		right: 0,
		top: 0,
		height: 800,
	},
	title: {
		color: "#205237",
		fontSize: 48,
		fontWeight: "bold",
		padding: 0,
		fontFamily: "TanMeringue",
		letterSpacing: 4,
		marginTop: 350,
	},
	subtitle: {
		fontSize: 24,
		color: "#101010",
		fontFamily: "OptimaRoman",
	},
	button: {
		marginTop: 50,
		width: "100%",
		height: 50,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f66b00",
		borderRadius: 100,
	},
	buttonText: {
		color: "#f0f0f0",
		fontSize: 20,
		fontFamily: "OptimaRoman",
		fontWeight: "bold",
	},
	surface: {
		elevation: 4,
		justifyContent: "center",
		alignItems: "center",
		height: "70%",
		width: "90%",
		alignSelf: "center",
		padding: 20,
		backgroundColor: "#ffffff",
		borderRadius: 65,
		borderWidth: 3,
		borderColor: "#b2ebf2",
	},
	loginContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		marginTop: 20,
	},
	smallText: {
		fontSize: 16,
		color: "#101010",
		fontFamily: "OptimaRoman",
		textAlign: "center",
	},
	loginText: {
		color: "#f66b00",
		fontWeight: "bold",
		fontFamily: "OptimaRoman",
		fontSize: 16,
	},
});
