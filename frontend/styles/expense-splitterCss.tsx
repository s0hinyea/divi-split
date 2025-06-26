import { StyleSheet } from "react-native";
import Colors from "../constants/Colors";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.beige,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontFamily: "OptimaRoman",
    fontSize: 24,
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
    borderRadius: 15,
  },
  cardText: {
    fontSize: 16,
    fontFamily: "WorkSans-Regular",
    color: Colors.black,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: Colors.orange,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#101010",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    elevation: 8,
    marginBottom: -20,
    marginRight: 10,
  },
  surface: {
    elevation: 4,
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    width: "100%",
    alignSelf: "center",
    backgroundColor: Colors.beige,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    flex: 1,
    alignItems: "flex-end",
    justifyContent: "flex-end",
    padding: 20,
  },
  modalPlusButton: {
    shadowOpacity: 0,
  },
  floatingButton: {
    justifyContent: "center",
    alignItems: "flex-end",
  },

  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    height: 40,
    padding: 10,
    paddingLeft: 15,
    borderRadius: 15,
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
