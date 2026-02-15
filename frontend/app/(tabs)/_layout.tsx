import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, Modal, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Circle, Rect } from 'react-native-svg';
import { useState, useRef } from 'react';
import { colors, fonts, spacing, radii, animation } from '@/styles/theme';

const GREEN = colors.green;
const BLACK = colors.black;
const GRAY = colors.gray400;

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');


function DiviLogo({ size = 36 }: { size?: number }) {
    const scale = size / 160;
    return (
        <Svg width={120 * scale} height={160 * scale} viewBox="0 0 120 160" fill="none">
            <Circle cx="20" cy="80" r="8" fill={GREEN} />
            <Rect x="40" y="30" width="10" height="100" rx="5" fill={GREEN} />
            <Rect x="70" y="30" width="10" height="100" rx="5" fill={BLACK} />
            <Circle cx="100" cy="80" r="8" fill={BLACK} />
        </Svg>
    );
}

export default function TabsLayout() {
    const router = useRouter();
    const [scanModalVisible, setScanModalVisible] = useState(false);


    const animatedValues = useRef([
        new Animated.Value(0),
        new Animated.Value(0),
    ]).current;
    const rotationValue = useRef(new Animated.Value(0)).current;

    const buttonSpacing = 100;
    const sideMargin = 30;
    const baseYPosition = screenHeight - 160;

    const showScanModal = () => {
        setScanModalVisible(true);
        animatedValues.forEach((value) => value.setValue(0));

        Animated.timing(rotationValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        const animations = animatedValues.map((value) =>
            Animated.timing(value, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            })
        );
        Animated.stagger(100, animations).start();
    };

    const hideScanModal = () => {
        Animated.timing(rotationValue, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();

        const animations = animatedValues.map((value) =>
            Animated.timing(value, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            })
        );
        Animated.stagger(100, animations).start(() => {
            setScanModalVisible(false);
        });
    };

    return (
        <>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: styles.tabBar,
                    tabBarActiveTintColor: GREEN,
                    tabBarInactiveTintColor: GRAY,
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
                            <MaterialIcons name="home" size={size} color={color} />
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


            <TouchableOpacity
                style={styles.floatingAddButton}
                onPress={showScanModal}
                activeOpacity={0.8}
            >
                <MaterialIcons name="add" size={32} color={colors.white} />
            </TouchableOpacity>


            <Modal
                animationType="fade"
                transparent={true}
                visible={scanModalVisible}
                onRequestClose={hideScanModal}
            >
                <TouchableWithoutFeedback onPress={hideScanModal}>
                    <View style={styles.modalContainer}>

                        <Animated.View
                            style={[
                                styles.floatingButton,
                                {
                                    opacity: animatedValues[0],
                                    transform: [
                                        {
                                            translateY: animatedValues[0].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [baseYPosition, baseYPosition - buttonSpacing],
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
                                    hideScanModal();
                                    setTimeout(() => router.push('/scan'), 150);
                                }}
                            >
                                <Icon source="camera" size={20} color={GREEN} />
                                <Text style={styles.optionText}>Scan Receipt</Text>
                            </TouchableOpacity>
                        </Animated.View>


                        <Animated.View
                            style={[
                                styles.floatingButton,
                                {
                                    opacity: animatedValues[1],
                                    transform: [
                                        {
                                            translateY: animatedValues[1].interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [baseYPosition, baseYPosition - buttonSpacing * 2],
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
                                    hideScanModal();
                                    setTimeout(() => router.push('/library'), 150);
                                }}
                            >
                                <Icon source="image" size={20} color={GREEN} />
                                <Text style={styles.optionText}>Pick From Photos</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.gray200,
        height: 90,
        paddingBottom: spacing.lg,
        paddingTop: spacing.sm,
    },
    tabLabel: {
        fontFamily: fonts.body,
        fontSize: 11,
    },
    floatingAddButton: {
        position: 'absolute',
        bottom: 100,
        left: '50%',
        marginLeft: -28, // Half of width to center
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.black,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    floatingButton: {
        position: 'absolute',
        right: 0,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        padding: spacing.md,
        borderRadius: radii.xl,
        gap: spacing.sm,
        ...({
            shadowColor: colors.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
        }),
    },
    optionText: {
        fontFamily: fonts.bodySemiBold,
        fontSize: 16,
        color: colors.black,
    },
});
