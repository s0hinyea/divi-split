import {
  View,
  Modal,
  StyleSheet,
  Image,
  TouchableOpacity,
  Touchable,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
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

  // Get screen dimensions for responsive positioning
  const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

  // Calculate responsive positions relative to the plus button
  const buttonSpacing = 100; // Space between each floating button
  const sideMargin = 30; // Distance from right edge

  // Base positions relative to screen bottom
  const baseYPosition = screenHeight - 60; // Position above plus button

  // Animation values for each button
  const animatedValues = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Animation value for plus button rotation
  const rotationValue = useRef(new Animated.Value(0)).current;

  const showModal = () => {
    setVisible(true);
    // Reset animations
    animatedValues.forEach((value) => value.setValue(0));

    // Animate plus button rotation
    Animated.timing(rotationValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

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
    // Animate plus button rotation back
    Animated.timing(rotationValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

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

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.plusButton} onPress={showModal}>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: rotationValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "45deg"],
                  }),
                },
              ],
            }}
          >
            <Icon source="plus" size={40} color="#f0f0f0" />
          </Animated.View>
        </TouchableOpacity>

        <Modal
          animationType="fade"
          transparent={true}
          visible={visible}
          onRequestClose={hideModal}
        >
          <TouchableWithoutFeedback onPress={hideModal}>
            <View style={styles.modalContainer}>
              {/* Scan Receipt Option */}
              <Animated.View
                style={[
                  styles.floatingButton,
                  {
                    opacity: animatedValues[0],
                    transform: [
                      {
                        translateY: animatedValues[0].interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            baseYPosition,
                            baseYPosition - buttonSpacing,
                          ],
                        }),
                      },
                      {
                        translateX: animatedValues[0].interpolate({
                          inputRange: [0, 1],
                          outputRange: [screenWidth / 2, -sideMargin],
                        }),
                      },
                      {
                        scale: animatedValues[0].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => {
                    hideModal();
                    setTimeout(() => router.push("/scan"), 150);
                  }}
                >
                  <Icon source="camera" size={20} color={Colors.orange} />
                  <Text style={styles.optionText}>Scan Receipt</Text>
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
                        translateY: animatedValues[1].interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            baseYPosition,
                            baseYPosition - buttonSpacing * 2,
                          ],
                        }),
                      },
                      {
                        translateX: animatedValues[1].interpolate({
                          inputRange: [0, 1],
                          outputRange: [screenWidth / 2, -sideMargin],
                        }),
                      },
                      {
                        scale: animatedValues[1].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.optionButton}
                  onPress={() => {
                    hideModal();
                    setTimeout(() => router.push("/library"), 150);
                  }}
                >
                  <Icon source="image" size={20} color={Colors.orange} />
                  <Text style={styles.optionText}>Pick From Photos</Text>
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
                        translateY: animatedValues[2].interpolate({
                          inputRange: [0, 1],
                          outputRange: [
                            baseYPosition,
                            baseYPosition - buttonSpacing * 3,
                          ],
                        }),
                      },
                      {
                        translateX: animatedValues[2].interpolate({
                          inputRange: [0, 1],
                          outputRange: [screenWidth / 2, -sideMargin],
                        }),
                      },
                      {
                        scale: animatedValues[2].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
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
                    }, 150);
                  }}
                >
                  <Icon source="pencil" size={20} color={Colors.orange} />
                  <Text style={styles.optionText}>Manual</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
