import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle, Rect } from 'react-native-svg';
import { useState, useRef } from 'react';
import { fonts, spacing, radii, animation } from '@/styles/theme';
import { useThemeColors } from '@/utils/ThemeContext';
import NetworkBanner from '@/components/NetworkBanner';

const { height: screenHeight } = Dimensions.get('window');

function DiviLogo({ size = 36, green, black }: { size?: number; green: string; black: string }) {
    const scale = size / 160;
    return (
        <Svg width={120 * scale} height={160 * scale} viewBox="0 0 120 160" fill="none">
            <Circle cx="20" cy="80" r="8" fill={green} />
            <Rect x="40" y="30" width="10" height="100" rx="5" fill={green} />
            <Rect x="70" y="30" width="10" height="100" rx="5" fill={black} />
            <Circle cx="100" cy="80" r="8" fill={black} />
        </Svg>
    );
}

export default function TabsLayout() {
    const router = useRouter();
    const C = useThemeColors();
    const [scanModalVisible, setScanModalVisible] = useState(false);
    const [selectedOption, setSelectedOption] = useState<'scan' | 'library' | null>(null);

    const slideAnim = useRef(new Animated.Value(0)).current;

    const showScanModal = () => {
        setScanModalVisible(true);
        Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
        }).start();
    };

    const hideScanModal = () => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            setScanModalVisible(false);
            setSelectedOption(null);
        });
    };

    const handleOptionPress = (option: 'scan' | 'library') => {
        setSelectedOption(option);
        setTimeout(() => {
            hideScanModal();
            setTimeout(() => {
                router.push(option === 'scan' ? '/scan' : '/library');
            }, 100);
        }, 150);
    };

    const bottomSheetHeight = screenHeight * 0.3;

    return (
        <>
            <NetworkBanner />
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: C.white,
                        borderTopWidth: 1,
                        borderTopColor: C.gray200,
                        height: 90,
                        paddingBottom: spacing.lg,
                        paddingTop: spacing.sm,
                    },
                    tabBarActiveTintColor: C.green,
                    tabBarInactiveTintColor: C.gray400,
                    tabBarLabelStyle: styles.tabLabel,
                }}
            >
                <Tabs.Screen
                    name="history"
                    options={{
                        title: 'History',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="receipt-long" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Home',
                        tabBarIcon: ({ color, size }) => (
                            <DiviLogo size={size * 1.4} green={C.green} black={C.black} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Profile',
                        tabBarIcon: ({ color, size }) => (
                            <MaterialIcons name="person-outline" size={size} color={color} />
                        ),
                    }}
                />
            </Tabs>

            {usePathname() === '/' && (
                <TouchableOpacity
                    style={[styles.floatingAddButton, { backgroundColor: C.black }]}
                    onPress={showScanModal}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="add" size={32} color={C.gray100} />
                </TouchableOpacity>
            )}

            <Modal
                animationType="fade"
                transparent={true}
                visible={scanModalVisible}
                onRequestClose={hideScanModal}
            >
                <TouchableWithoutFeedback onPress={hideScanModal}>
                    <View style={styles.modalBackdrop}>
                        <TouchableWithoutFeedback>
                            <Animated.View
                                style={[
                                    styles.bottomSheet,
                                    {
                                        backgroundColor: C.gray100,
                                        height: bottomSheetHeight,
                                        transform: [
                                            {
                                                translateY: slideAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [bottomSheetHeight, 0],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <View style={styles.bottomSheetContent}>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionCard,
                                            { backgroundColor: C.white },
                                            selectedOption === 'scan' && { backgroundColor: `${C.green}20` },
                                        ]}
                                        onPress={() => handleOptionPress('scan')}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialIcons name="camera-alt" size={40} color={C.green} />
                                        <Text style={[styles.optionTitle, { color: C.black }]}>Scan with camera</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.optionCard,
                                            { backgroundColor: C.white },
                                            selectedOption === 'library' && { backgroundColor: `${C.green}20` },
                                        ]}
                                        onPress={() => handleOptionPress('library')}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialIcons name="photo-library" size={40} color={C.green} />
                                        <Text style={[styles.optionTitle, { color: C.black }]}>Pick from gallery</Text>
                                    </TouchableOpacity>
                                </View>
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    tabLabel: {
        fontFamily: fonts.body,
        fontSize: 11,
    },
    floatingAddButton: {
        position: 'absolute',
        bottom: 100,
        left: '50%',
        marginLeft: -28,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 10,
    },
    bottomSheetContent: {
        flexDirection: 'row',
        padding: spacing.lg,
        gap: spacing.md,
        height: '100%',
    },
    optionCard: {
        flex: 1,
        borderRadius: radii.md,
        padding: spacing.lg,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.sm,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    optionTitle: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 14,
        textAlign: 'center',
    },
});
