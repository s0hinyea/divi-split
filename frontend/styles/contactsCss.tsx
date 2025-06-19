import { StyleSheet } from "react-native";
import Colors from "../constants/Colors";

export const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.beige,
		padding: 20,
	},
	header: {
		flexDirection: "column",
		justifyContent: "space-between",
		marginBottom: 20,
	},
	headerTitle: {
		fontSize: 20,
		fontWeight: "bold",
		color: Colors.darkGreen,
		fontFamily: "TanMeringue",
		marginBottom: 20,
	},
	statusContainer: {
		flexDirection: "row",
		alignItems: "center",
	},
	statusText: {
		marginLeft: 8,
		fontSize: 16,
	},
	searchInput: {
		height: 40,
		borderWidth: 1,
		borderColor: "#ddd",
		borderRadius: 8,
		paddingHorizontal: 10,
		marginBottom: 10,
	},
	contactItem: {
		padding: 15,
		borderBottomWidth: 1,
		borderBottomColor: "#d9b99b",
	},
	selectedContact: {
		backgroundColor: "#eed9c4",
	},
	contactName: {
		fontSize: 16,
		fontWeight: "bold",
		fontFamily: "OptimaRoman",
		color: Colors.black,
	},
	phoneNumber: {
		fontSize: 14,
		color: "#666",
		marginTop: 5,
	},
	loading: {
		marginRight: 10,
		justifyContent: "center",
		alignItems: "center",
	},
	loadingContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
	},
	done: {
		width: 24,
		height: 24,
		resizeMode: "contain",
	},
	continueButton: {
		position: "absolute",
		right: 5,
		bottom: 5,
		justifyContent: "center",
		alignItems: "center",
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "#f5f5f5",
		borderColor: "#e0f7fa",
		borderWidth: 4,
	},
	continueIcon: {
		width: 30,
		height: 30,
		resizeMode: "contain",
	},
});
