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
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.darkGreen,
    fontFamily: "OptimaRoman",
    marginBottom: 20,
  },
  listContainer: {
    height: "100%",
    borderRadius: 15,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    marginLeft: 8,
    fontSize: 20,
    fontFamily: "WorkSans",
  },
  searchInput: {
    backgroundColor: "#fafafa",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#dddddd",
    padding: 12,
    paddingLeft: 15,
    fontSize: 16,
    fontFamily: "WorkSans",
    color: "#0a0a0a",
    marginBottom: 20,
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
    fontFamily: "WorkSans-Medium",
    color: Colors.black,
    fontWeight: "500",
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
    marginTop: 50,
    padding: 15,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f66b00",
    borderRadius: 15,
  },
  buttonText: {
    color: "#f0f0f0",
    fontSize: 20,
    fontFamily: "OptimaRoman",
    fontWeight: "bold",
  },
});
