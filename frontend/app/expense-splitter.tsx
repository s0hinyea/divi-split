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
  ScrollView,
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
import { BlurView } from "expo-blur";

export default function MainPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [showReceiptsModal, setShowReceiptsModal] = useState(false);
  const { updateReceiptData } = useReceipt();
  const { setIsProcessing } = useOCR();

  // Dummy data for past receipts (replace with real data later)
  const pastReceipts = [
    { id: 1, name: "Dinner at Olive Garden", date: "2024-01-15", total: 45.67 },
    { id: 2, name: "Lunch with Friends", date: "2024-01-14", total: 32.40 },
    { id: 3, name: "Coffee Shop Receipt", date: "2024-01-13", total: 18.25 },
    { id: 4, name: "Grocery Store", date: "2024-01-12", total: 78.90 },
    { id: 5, name: "Restaurant Receipt", date: "2024-01-11", total: 56.30 },
    { id: 6, name: "Fast Food", date: "2024-01-10", total: 12.99 },
  ];

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
        <ScrollView style={styles.scrollContainer}>
          {pastReceipts.map((receipt) => (
            <TouchableOpacity 
              key={receipt.id} 
              style={styles.receiptCard}
              onPress={() => setShowReceiptsModal(true)}
            >
              <View style={styles.receiptInfo}>
                <Text style={styles.receiptName}>{receipt.name}</Text>
                <Text style={styles.receiptDate}>{receipt.date}</Text>
              </View>
              <Text style={styles.receiptTotal}>${receipt.total.toFixed(2)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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

        {/* Receipt Details Modal */}
        <Modal
          animationType="fade"y  
          transparent={true}
          visible={showReceiptsModal}
          onRequestClose={() => setShowReceiptsModal(false)}
        >
          <BlurView intensity={50} style={styles.receiptModalOverlay}>
            <View style={styles.receiptModalContainer}>
              <View style={styles.receiptModalHeader}>
                <Text style={styles.receiptModalTitle}>Receipt Details</Text>
                <TouchableOpacity 
                  onPress={() => setShowReceiptsModal(false)}
                  style={styles.closeButton}
                >
                  <Icon source="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.receiptModalContent}>
                <Text style={styles.placeholder}>
                  Receipt details will be loaded here...
                </Text>
                {/* Receipt details will be populated here later */}
              </ScrollView>
              
              <View style={styles.receiptModalFooter}>
                <TouchableOpacity style={styles.resendButton}>
                  <Text style={styles.resendButtonText}>Resend SMS</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
