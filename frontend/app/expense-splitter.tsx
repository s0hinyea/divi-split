import {
	View,
	Modal,
	StyleSheet,
	Image,
	TouchableOpacity,
	Touchable,
	TouchableWithoutFeedback,
	Animated,
} from "react-native";
import { Text, Button, Surface, Icon } from "react-native-paper";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "expo-router";
import { styles } from "../styles/expense-splitterCss";
import { ocrTest } from "../scripts/manual";
import { useReceipt } from "../utils/ReceiptContext";
import { useOCR } from "../utils/OCRContext";
import { handleOCR } from "../utils/ocrUtil";
import { SafeAreaView } from "react-native-safe-area-context";
import Colors from "../constants/Colors";

export default function MainPage() {
	const router = useRouter();
	const [visible, setVisible] = useState(false);
	const { updateReceiptData } = useReceipt();
	const { setIsProcessing } = useOCR();

	// Animation values for each button
	const animatedValues = useRef([
		new Animated.Value(0),
		new Animated.Value(0),
		new Animated.Value(0),
	]).current;

	const showModal = () => {
		setVisible(true);
		// Reset animations
		animatedValues.forEach((value) => value.setValue(0));

		// Animate buttons in sequence
		const animations = animatedValues.map((value, index) =>
			Animated.timing(value, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			})
		);

		Animated.stagger(100, animations).start();
	};

	const hideModal = () => {
		// Animate buttons out in reverse
		const animations = animatedValues.map((value, index) =>
			Animated.timing(value, {
				toValue: 0,
				duration: 200,
				useNativeDriver: true,
			})
		);

		Animated.stagger(100, animations).start(() => {
			setVisible(false);
		});
	};

	return (
		<SafeAreaView style={styles.container}>
			{/* Header */}
			<View style={styles.header}>
				<Text style={styles.title}>Your Past Receipts</Text>
				<TouchableOpacity style={styles.plusButton} onPress={showModal}>
					<Icon source="plus" size={30} color="#f0f0f0" />
				</TouchableOpacity>
			</View>

			{/* Body */}
			<View style={styles.body}>
				<View style={styles.card}>
					<Text style={styles.cardText}>
						You do not have any past receipts.
					</Text>
				</View>
				{/* Render past bills here */}
			</View>

			<Modal
				animationType="fade"
				transparent={true}
				visible={visible}
				onRequestClose={hideModal}
			>
				<TouchableWithoutFeedback onPress={hideModal}>
					<View style={styles.modalContainer}>
						<SafeAreaView style={styles.modalContent}>
							<TouchableOpacity
								style={[
									styles.plusButton,
									styles.modalPlusButton,
								]}
								onPress={showModal}
							>
								<Icon source="plus" size={30} color="#f0f0f0" />
							</TouchableOpacity>
						</SafeAreaView>

						{/* Scan Receipt Option */}
						<Animated.View
							style={[
								styles.floatingButton,
								{
									opacity: animatedValues[0],
									transform: [
										{
											translateY:
												animatedValues[0].interpolate({
													inputRange: [0, 1],
													outputRange: [100, 100], // Start from plus button area, move down
												}),
										},
										{
											translateX:
												animatedValues[0].interpolate({
													inputRange: [0, 1],
													outputRange: [60, -60], // Move slightly left
												}),
										},
										{
											scale: animatedValues[0].interpolate(
												{
													inputRange: [0, 1],
													outputRange: [0, 1],
												}
											),
										},
									],
								},
							]}
						>
							<TouchableOpacity
								style={styles.optionButton}
								onPress={() => {
									hideModal();
									setTimeout(() => router.push("/scan"), 300);
								}}
							>
								<Icon
									source="camera"
									size={20}
									color={Colors.orange}
								/>
								<Text style={styles.optionText}>
									Scan Receipt
								</Text>
							</TouchableOpacity>
						</Animated.View>

						{/* Pick From Photos Option */}
						<Animated.View
							style={[
								styles.floatingButton,
								{
									opacity: animatedValues[1],
									transform: [
										{
											translateY:
												animatedValues[1].interpolate({
													inputRange: [0, 1],
													outputRange: [100, 160], // Start from plus button area, move down more
												}),
										},
										{
											translateX:
												animatedValues[1].interpolate({
													inputRange: [0, 1],
													outputRange: [60, -60], // Move slightly left, less than first
												}),
										},
										{
											scale: animatedValues[1].interpolate(
												{
													inputRange: [0, 1],
													outputRange: [0, 1],
												}
											),
										},
									],
								},
							]}
						>
							<TouchableOpacity
								style={styles.optionButton}
								onPress={() => {
									hideModal();
									setTimeout(
										() => router.push("/library"),
										300
									);
								}}
							>
								<Icon
									source="image"
									size={20}
									color={Colors.orange}
								/>
								<Text style={styles.optionText}>
									Pick From Photos
								</Text>
							</TouchableOpacity>
						</Animated.View>

						{/* Manual Entry Option */}
						<Animated.View
							style={[
								styles.floatingButton,
								{
									opacity: animatedValues[2],
									transform: [
										{
											translateY:
												animatedValues[2].interpolate({
													inputRange: [0, 1],
													outputRange: [100, 220], // Start from plus button area, move down most
												}),
										},
										{
											translateX:
												animatedValues[2].interpolate({
													inputRange: [0, 1],
													outputRange: [30, -60], // Move slightly left, least amount
												}),
										},
										{
											scale: animatedValues[2].interpolate(
												{
													inputRange: [0, 1],
													outputRange: [0.3, 1],
												}
											),
										},
									],
								},
							]}
						>
							<TouchableOpacity
								style={styles.optionButton}
								onPress={async () => {
									hideModal();
									setTimeout(async () => {
										await handleOCR(
											ocrTest,
											updateReceiptData,
											setIsProcessing
										);
									}, 300);
								}}
							>
								<Icon
									source="pencil"
									size={20}
									color={Colors.orange}
								/>
								<Text style={styles.optionText}>Manual</Text>
							</TouchableOpacity>
						</Animated.View>
					</View>
				</TouchableWithoutFeedback>
			</Modal>

			{/* Footer */}
			<View style={styles.footer}></View>
		</SafeAreaView>
	);
}
