import { StyleSheet } from "react-native";
import Colors from "../constants/Colors";

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.cream,
		padding: 20,
	},
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	title: {
		fontFamily: "TanMeringue",
		fontSize: 20,
		fontWeight: "bold",
		color: Colors.darkGreen,
	},
	body: {
		flex: 1,
		marginTop: 20,
		marginBottom: 20,
	},
	card: {
		backgroundColor: Colors.white,
		shadowColor: "#101010",
		shadowOpacity: 0.1,
		shadowRadius: 3,
		shadowOffset: {
			width: 0,
			height: 0,
		},
		padding: 20,
		borderRadius: 20,
	},
	cardText: {
		fontSize: 16,
		fontFamily: "OptimaRoman",
		color: Colors.black,
		textAlign: "center",
	},
	footer: {
		flexDirection: "row",
		justifyContent: "space-around",
	},
	footerButton: {
		flex: 1,
		marginHorizontal: 5,
		color: "black",
	},
	plusButton: {
		width: 50,
		height: 50,
		borderRadius: 20,
		backgroundColor: Colors.orange,
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#101010",
		shadowOpacity: 0.1,
		shadowRadius: 3,
		shadowOffset: {
			width: 0,
			height: 0,
		},
		elevation: 8,
	},
	plusButtonText: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#f0f0f0",
		fontFamily: "OptimaRoman",
		marginLeft: 5,
	},
	surface: {
		elevation: 4,
		justifyContent: "center",
		alignItems: "center",
		height: "100%",
		width: "100%",
		alignSelf: "center",
		backgroundColor: Colors.cream,
	},
	modalContainer: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.5)",
	},
	modalContent: {
		flex: 1,
		alignItems: "flex-end",
		padding: 20,
	},
	modalPlusButton: {},
	floatingButton: {
		position: "absolute",
		top: 50, // Adjust based on your header height
		right: 40, // Align with plus button position
		zIndex: 1000,
		width: 100,
	},

	optionButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: Colors.white,
		height: 40,
		padding: 10,
		paddingLeft: 15,
		borderRadius: 20,
		shadowColor: "#101010",
		shadowOpacity: 0.2,
		shadowRadius: 8,
		shadowOffset: {
			width: 0,
			height: 2,
		},
		elevation: 8,
		minWidth: 180,
	},

	optionText: {
		fontSize: 16,
		marginLeft: 5,
		color: "#333",
		fontFamily: "OptimaRoman",
		fontWeight: "bold",
	},

	cameraImage: {
		height: 30,
		width: 30,
		resizeMode: "contain",
	},
});
