import { Tabs, useRouter, usePathname } from 'expo-router';
import { View, TouchableOpacity, Pressable, StyleSheet, Modal, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle, Rect } from 'react-native-svg';
import { useState, useRef } from 'react';
import { fonts, spacing, radii, colors, shadows } from '@/styles/theme';
import { useThemeColors } from '@/utils/ThemeContext';
import { useSplitStore } from '@/stores/splitStore';
import { useCustomAlert } from '@/components/CustomAlert';

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

    const currentStep = useSplitStore((state) => state.currentStep);
    const resumeContactIndex = useSplitStore((state) => state.resumeContactIndex);
    const receiptItems = useSplitStore((state) => state.receiptData.items);
    const resetStore = useSplitStore((state) => state.resetStore);
    const { showAlert } = useCustomAlert();
    const pathname = usePathname();

    const splitInProgress = currentStep !== null && receiptItems.length > 0;

    const showScanModal = () => {
        setScanModalVisible(true);
        Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 70,
            friction: 12,
        }).start();
    };

    const hideScanModal = () => {
        Animated.timing(slideAnim, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
        }).start(() => {
            setScanModalVisible(false);
            setSelectedOption(null);
        });
    };

    const resumeSplit = () => {
        if (!currentStep) return;
        if (currentStep === 'assign') {
            router.push({ pathname: '/assign', params: { initialIndex: resumeContactIndex } });
        } else {
            router.push(`/${currentStep}` as any);
        }
    };

    const handleAddPress = () => {
        if (splitInProgress) {
            showAlert({
                title: 'Split already in progress',
                message: 'You have an unfinished split. Resume it or start over?',
                buttons: [
                    { text: 'Resume', onPress: resumeSplit },
                    { text: 'Start over', style: 'destructive', onPress: () => { resetStore(); showScanModal(); } },
                    { text: 'Cancel', style: 'cancel' },
                ],
            });
        } else {
            showScanModal();
        }
    };

    const handleOptionPress = (option: 'scan' | 'library') => {
        setSelectedOption(option);
        setTimeout(() => {
            hideScanModal();
            setTimeout(() => {
                if (option === 'scan') router.push('/scan');
                else router.push('/library');
            }, 100);
        }, 150);
    };

    const bottomSheetHeight = screenHeight * 0.30;

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    lazy: false,
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
                    tabBarShowLabel: false,
                    tabBarItemStyle: {
                        paddingVertical: spacing.sm,
                    },
                }}
            >
                <Tabs.Screen
                    name="history"
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <View style={styles.tabIconWrapper}>
                                <MaterialIcons name="receipt-long" size={24} color={color} />
                                {focused && <View style={[styles.activeDot, { backgroundColor: C.green }]} />}
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="index"
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <View style={styles.tabIconWrapper}>
                                <MaterialIcons name="home" size={24} color={color} />
                                {focused && <View style={[styles.activeDot, { backgroundColor: C.green }]} />}
                            </View>
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        tabBarIcon: ({ color, focused }) => (
                            <View style={styles.tabIconWrapper}>
                                <MaterialIcons name="person-outline" size={24} color={color} />
                                {focused && <View style={[styles.activeDot, { backgroundColor: C.green }]} />}
                            </View>
                        ),
                    }}
                />
            </Tabs>

            {/* Floating scan button - only on home tab */}
            {pathname === '/' && (
                <Pressable
                    style={({ pressed }) => [styles.floatingAddButton, { backgroundColor: C.green }, pressed && { opacity: 0.85 }]}
                    onPress={handleAddPress}
                >
                    <MaterialIcons name="add" size={28} color={C.white} />
                </Pressable>
            )}

            {/* Scan options bottom sheet */}
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
                                        backgroundColor: C.white,
                                        height: bottomSheetHeight,
                                        transform: [{
                                            translateY: slideAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [bottomSheetHeight, 0],
                                            }),
                                        }],
                                    },
                                ]}
                            >
                                {/* Handle */}
                                <View style={[styles.handle, { backgroundColor: C.gray300 }]} />

                                <Text style={[styles.sheetTitle, { color: C.black }]}>Add a receipt</Text>

                                <View style={styles.sheetOptionsRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.sheetOptionCard,
                                            { borderColor: C.gray200, backgroundColor: C.white },
                                            selectedOption === 'scan' && styles.sheetOptionCardSelected,
                                        ]}
                                        onPress={() => handleOptionPress('scan')}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.sheetOptionIcon, { backgroundColor: selectedOption === 'scan' ? colors.greenLight : C.gray100 }]}>
                                            <MaterialIcons name="camera-alt" size={26} color={colors.green} />
                                        </View>
                                        <Text style={[styles.sheetOptionText, { color: C.black }]}>Scan with{'\n'}camera</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.sheetOptionCard,
                                            { borderColor: C.gray200, backgroundColor: C.white },
                                            selectedOption === 'library' && styles.sheetOptionCardSelected,
                                        ]}
                                        onPress={() => handleOptionPress('library')}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.sheetOptionIcon, { backgroundColor: selectedOption === 'library' ? colors.greenLight : C.gray100 }]}>
                                            <MaterialIcons name="photo-library" size={26} color={colors.green} />
                                        </View>
                                        <Text style={[styles.sheetOptionText, { color: C.black }]}>Pick from{'\n'}gallery</Text>
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
    tabIconWrapper: {
        alignItems: 'center',
        gap: 4,
    },
    activeDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    centerTabButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    floatingAddButton: {
        position: 'absolute',
        bottom: 100,
        left: '50%',
        marginLeft: -26,
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#00C37F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(10,10,10,0.45)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        borderTopLeftRadius: radii.xl,
        borderTopRightRadius: radii.xl,
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxxl,
        shadowColor: '#0A0A0A',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 12,
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.lg,
    },
    sheetTitle: {
        fontFamily: fonts.bodyBold,
        fontSize: 18,
        marginBottom: spacing.md,
    },
    sheetOptionsRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    sheetOptionCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.lg,
        borderRadius: radii.lg,
        borderWidth: 1.5,
    },
    sheetOptionCardSelected: {
        borderColor: colors.green,
        backgroundColor: colors.greenLight,
        shadowColor: colors.green,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    sheetOptionIcon: {
        width: 52,
        height: 52,
        borderRadius: radii.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sheetOptionText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 14,
        textAlign: 'center',
    },
});
