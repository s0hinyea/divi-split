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
import { Config } from "@/constants/Config";
import { supabase } from "@/lib/supabase";

// Type for receipts from backend
interface Receipt {
  id: string;
  receipt_name: string;
  total_amount: number;
  created_at: string;
  receipt_items: { id: string; item_name: string; item_price: number }[];
}

export default function MainPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [showReceiptsModal, setShowReceiptsModal] = useState(false);
  const { updateReceiptData } = useReceipt();
  const { setIsProcessing } = useOCR();

  // Real receipts from backend
  const [pastReceipts, setPastReceipts] = useState<Receipt[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Selected receipt for modal
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch receipts on mount
  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoadingReceipts(true);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setLoadingReceipts(false);
        return;
      }

      const offset = loadMore ? pastReceipts.length : 0;
      const response = await fetch(`${Config.BACKEND_URL}/receipts?limit=5&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (loadMore) {
          setPastReceipts(prev => [...prev, ...(data.receipts || [])]);
        } else {
          setPastReceipts(data.receipts || []);
        }
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error('Error fetching receipts:', error);
    } finally {
      setLoadingReceipts(false);
      setLoadingMore(false);
    }
  };

  // Delete a receipt
  const deleteReceipt = async (receiptId: string) => {
    try {
      setDeleting(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) return;

      const response = await fetch(`${Config.BACKEND_URL}/receipts/${receiptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove from local state
        setPastReceipts(prev => prev.filter(r => r.id !== receiptId));
        setShowReceiptsModal(false);
        setSelectedReceipt(null);
      }
    } catch (error) {
      console.error('Error deleting receipt:', error);
    } finally {
      setDeleting(false);
    }
  };

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
          {loadingReceipts ? (
            <Text style={styles.receiptDate}>Loading receipts...</Text>
          ) : pastReceipts.length === 0 ? (
            <Text style={styles.receiptDate}>No receipts yet. Scan one to get started!</Text>
          ) : (
            <>
              {pastReceipts.map((receipt) => (
                <TouchableOpacity
                  key={receipt.id}
                  style={styles.receiptCard}
                  onPress={() => {
                    setSelectedReceipt(receipt);
                    setShowReceiptsModal(true);
                  }}
                >
                  <View style={styles.receiptInfo}>
                    <Text style={styles.receiptName}>{receipt.receipt_name}</Text>
                    <Text style={styles.receiptDate}>
                      {new Date(receipt.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.receiptTotal}>
                    ${(receipt.total_amount || 0).toFixed(2)}
                  </Text>
                </TouchableOpacity>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <TouchableOpacity
                  style={{
                    padding: 12,
                    alignItems: 'center',
                    marginVertical: 8,
                  }}
                  onPress={() => fetchReceipts(true)}
                  disabled={loadingMore}
                >
                  <Text style={{ color: '#007AFF', fontSize: 16 }}>
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
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
                        setIsProcessing,
                        router
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
          animationType="fade"
          transparent={true}
          visible={showReceiptsModal}
          onRequestClose={() => {
            setShowReceiptsModal(false);
            setSelectedReceipt(null);
          }}
        >
          <BlurView intensity={50} style={styles.receiptModalOverlay}>
            <View style={styles.receiptModalContainer}>
              <View style={styles.receiptModalHeader}>
                <Text style={styles.receiptModalTitle}>
                  {selectedReceipt?.receipt_name || 'Receipt Details'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowReceiptsModal(false);
                    setSelectedReceipt(null);
                  }}
                  style={styles.closeButton}
                >
                  <Icon source="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.receiptModalContent}>
                {selectedReceipt && (
                  <>
                    <Text style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
                      {new Date(selectedReceipt.created_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>

                    {selectedReceipt.receipt_items?.map((item) => (
                      <View key={item.id} style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: '#eee'
                      }}>
                        <Text style={{ fontSize: 16 }}>{item.item_name}</Text>
                        <Text style={{ fontSize: 16, color: '#333' }}>
                          ${item.item_price.toFixed(2)}
                        </Text>
                      </View>
                    ))}

                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingTop: 12,
                      marginTop: 8,
                      borderTopWidth: 2,
                      borderTopColor: '#333'
                    }}>
                      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Total</Text>
                      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                        ${(selectedReceipt.total_amount || 0).toFixed(2)}
                      </Text>
                    </View>
                  </>
                )}
              </ScrollView>

              <View style={styles.receiptModalFooter}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#ff4444',
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    flex: 1
                  }}
                  onPress={() => {
                    if (selectedReceipt) {
                      deleteReceipt(selectedReceipt.id);
                    }
                  }}
                  disabled={deleting}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                    {deleting ? 'Deleting...' : 'Delete Receipt'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
