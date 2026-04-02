import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Image, RefreshControl, Linking } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { fonts, fontSizes, spacing, radii } from '@/styles/theme';
import { useThemeColors } from '@/utils/ThemeContext';
import { useProfile } from '@/utils/ProfileContext';
import * as ImagePicker from 'expo-image-picker';
import { useSession } from '@/utils/SessionContext';
import { getUserFacingErrorMessage } from '@/utils/network';
import { privacyPolicyUrl } from '@/constants/appConfig';

const VenmoLogo = require('@/assets/images/venmo.png');
const CashAppLogo = require('@/assets/images/cashapp.png');
const ZelleLogo = require('@/assets/images/zelle.png');

function createStyles(C: ReturnType<typeof useThemeColors>) {
    return StyleSheet.create({
        container: { flex: 1, backgroundColor: C.gray100 },
        centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.gray100 },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.md,
        },
        title: { fontFamily: fonts.bodyBold, fontSize: 28, color: C.black },
        editButton: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: C.green },

        scrollView: { flex: 1 },
        content: { padding: spacing.lg, paddingBottom: 100 },

        // Hero
        section: { marginBottom: spacing.xl },
        heroContainer: { alignItems: 'center' },
        avatarContainer: { position: 'relative', marginBottom: spacing.md },
        avatar: { width: 100, height: 100, borderRadius: 50 },
        avatarPlaceholder: {
            backgroundColor: C.white,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
            borderWidth: 1,
            borderColor: C.gray200,
        },
        cameraIcon: {
            position: 'absolute', bottom: 0, right: 0,
            backgroundColor: C.black, padding: 6, borderRadius: radii.full,
            borderWidth: 2, borderColor: C.gray100,
        },
        heroTextContainer: { alignItems: 'center' },
        heroName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xl, color: C.black, marginBottom: 4 },
        heroUsername: { fontFamily: fonts.body, fontSize: fontSizes.md, color: C.gray500 },

        editHeroInputs: { width: '100%', alignItems: 'center' as const, gap: 8 },
        heroInputName: {
            fontFamily: fonts.bodyBold, fontSize: fontSizes.xl,
            color: C.black, textAlign: 'center' as const,
            borderBottomWidth: 1, borderBottomColor: C.gray300,
            paddingBottom: 4, width: '60%',
        },
        heroInputUser: {
            fontFamily: fonts.body, fontSize: fontSizes.md,
            color: C.gray600, textAlign: 'center' as const,
            borderBottomWidth: 1, borderBottomColor: C.gray300,
            width: '40%',
        },

        // Sections
        sectionTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: C.gray600, marginBottom: spacing.sm, marginLeft: spacing.xs },
        card: {
            backgroundColor: C.white,
            borderRadius: radii.lg,
            padding: spacing.md,
            marginBottom: spacing.xl,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
        },
        row: { flexDirection: 'row' as const, alignItems: 'center' as const, paddingVertical: spacing.sm },
        divider: { height: 1, backgroundColor: C.gray200, marginVertical: spacing.xs },

        iconContainer: {
            width: 36, height: 36, borderRadius: radii.md,
            backgroundColor: C.white,
            justifyContent: 'center' as const, alignItems: 'center' as const,
            marginRight: spacing.md,
            borderWidth: 1, borderColor: C.gray200,
        },
        venmoIcon: { width: 45, height: 45 },
        cashAppIcon: { width: 26, height: 26 },
        zelleIcon: { width: 32, height: 32 },
        inputWrapper: { flex: 1 },
        label: { fontFamily: fonts.bodyBold, fontSize: 12, color: C.gray500, marginBottom: 2 },
        value: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: C.black },
        input: {
            fontFamily: fonts.body, fontSize: fontSizes.md, color: C.black,
            borderBottomWidth: 1, borderBottomColor: C.green, paddingVertical: 0,
        },

        // Settings
        settingLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: C.black },

        // Footer
        footer: { alignItems: 'center' as const, marginTop: spacing.lg },
        email: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: C.gray400, marginBottom: spacing.lg },
        signOutButton: {
            width: '100%', backgroundColor: C.white,
            paddingVertical: 14, borderRadius: radii.md,
            borderWidth: 1, borderColor: C.gray300,
            alignItems: 'center' as const,
        },
        signOutText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: C.black },
        deleteText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: C.error },
    });
}

export default function Profile() {
    const { session } = useSession();
    const { profile, loading, updateProfile, refreshProfile } = useProfile();
    const router = useRouter();
    const C = useThemeColors();
    const styles = useMemo(() => createStyles(C), [C]);

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refreshProfile();
        } finally {
            setRefreshing(false);
        }
    }, []);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        venmo_handle: '',
        cashapp_handle: '',
        zelle_number: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                username: profile.username || '',
                venmo_handle: profile.venmo_handle || '',
                cashapp_handle: profile.cashapp_handle || '',
                zelle_number: profile.zelle_number || ''
            });
        }
    }, [profile]);

    const handleSignOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            router.replace('/home');
        } catch (error) {
            Alert.alert('Error signing out', getUserFacingErrorMessage(error, 'Unable to sign out right now.'));
        }
    };

    const handleAccountDeletion = () => {
        Alert.alert(
            "Delete Account",
            "To permanently delete your account and all associated receipt data, please email us from the email associated with your account.\n\nWe will process the deletion within 30 days.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Email Support",
                    style: "destructive",
                    onPress: () => {
                        Linking.openURL(`mailto:suppport@divi.app?subject=Account Deletion Request&body=Please delete my account associated with this email address: ${session?.user?.email}`);
                    }
                }
            ]
        );
    };

    const handleSave = async () => {
        const cleanUsername = formData.username.replace('@', '').trim();

        if (cleanUsername.length < 3) {
            Alert.alert("Invalid Username", "Username must be at least 3 characters long.");
            return;
        }

        const dataToSave = { ...formData, username: cleanUsername };

        if (isEditing) {
            setFormData(prev => ({ ...prev, username: cleanUsername }));
            const errorMsg = await updateProfile(dataToSave);

            if (!errorMsg) {
                setIsEditing(false);
                Alert.alert('Success', 'Profile updated.');
            } else {
                Alert.alert('Update failed', errorMsg);
            }
        }
    };

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Permission required', 'Photo library access is required to update your avatar.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                const base64Data = `data:image/jpeg;base64,${result.assets[0].base64}`;
                const errorMsg = await updateProfile({ avatar_url: base64Data });
                if (errorMsg) {
                    Alert.alert('Upload failed', errorMsg);
                }
            }
        } catch (error) {
            Alert.alert('Upload failed', getUserFacingErrorMessage(error, 'We could not open your photo library.'));
        }
    };

    const openPrivacyPolicy = async () => {
        if (!privacyPolicyUrl) {
            Alert.alert(
                'Privacy policy missing',
                'Set EXPO_PUBLIC_PRIVACY_POLICY_URL to a public policy page before submitting to Apple.'
            );
            return;
        }

        try {
            await Linking.openURL(privacyPolicyUrl);
        } catch {
            Alert.alert('Link unavailable', 'We could not open the privacy policy right now.');
        }
    };

    if (loading && !profile) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={C.green} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
                <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(true)}>
                    <Text style={styles.editButton}>{isEditing ? 'Save' : 'Edit'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={C.green}
                    />
                }
            >

                {/* 1. Hero / Identity Section */}
                <View style={styles.section}>
                    <View style={styles.heroContainer}>
                        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                    <MaterialIcons name="person" size={48} color={C.gray400} />
                                </View>
                            )}
                            <View style={styles.cameraIcon}>
                                <MaterialIcons name="camera-alt" size={16} color={C.gray100} />
                            </View>
                        </TouchableOpacity>

                        {isEditing ? (
                            <View style={styles.editHeroInputs}>
                                <TextInput
                                    style={styles.heroInputName}
                                    value={formData.full_name}
                                    onChangeText={(t) => setFormData({ ...formData, full_name: t })}
                                    placeholder="Full Name"
                                    placeholderTextColor={C.gray400}
                                />
                                <TextInput
                                    style={styles.heroInputUser}
                                    value={formData.username}
                                    onChangeText={(t) => setFormData({ ...formData, username: t })}
                                    placeholder="@username"
                                    placeholderTextColor={C.gray400}
                                    autoCapitalize="none"
                                />
                            </View>
                        ) : (
                            <View style={styles.heroTextContainer}>
                                <Text style={styles.heroName}>{profile?.full_name || 'Your Name'}</Text>
                                <Text style={styles.heroUsername}>{profile?.username ? `@${profile.username}` : '@username'}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* 2. Get Paid Section */}
                <Text style={styles.sectionTitle}>Get Paid</Text>
                <View style={styles.card}>
                    {/* Venmo */}
                    <View style={styles.row}>
                        <View style={styles.iconContainer}>
                            <Image source={VenmoLogo} style={styles.venmoIcon} resizeMode="contain" />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Venmo</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={formData.venmo_handle}
                                    onChangeText={(t) => setFormData({ ...formData, venmo_handle: t })}
                                    placeholder="@username"
                                    placeholderTextColor={C.gray400}
                                />
                            ) : (
                                <Text style={styles.value}>{profile?.venmo_handle || 'Not set'}</Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.divider} />

                    {/* Cash App */}
                    <View style={styles.row}>
                        <View style={styles.iconContainer}>
                            <Image source={CashAppLogo} style={styles.cashAppIcon} resizeMode="contain" />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Cash App</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={formData.cashapp_handle}
                                    onChangeText={(t) => setFormData({ ...formData, cashapp_handle: t })}
                                    placeholder="$cashtag"
                                    placeholderTextColor={C.gray400}
                                />
                            ) : (
                                <Text style={styles.value}>{profile?.cashapp_handle || 'Not set'}</Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.divider} />

                    {/* Zelle */}
                    <View style={styles.row}>
                        <View style={styles.iconContainer}>
                            <Image source={ZelleLogo} style={styles.zelleIcon} resizeMode="contain" />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Zelle</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={formData.zelle_number}
                                    onChangeText={(t) => setFormData({ ...formData, zelle_number: t })}
                                    placeholder="Phone or Email"
                                    placeholderTextColor={C.gray400}
                                />
                            ) : (
                                <Text style={styles.value}>{profile?.zelle_number || 'Not set'}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* 3. Settings */}
                <Text style={styles.sectionTitle}>Settings</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.row} onPress={() => router.push('/help')} activeOpacity={0.7}>
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="help-outline" size={22} color={C.black} />
                        </View>
                        <Text style={styles.settingLabel}>Help & FAQ</Text>
                        <MaterialIcons name="chevron-right" size={24} color={C.gray400} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.row} onPress={openPrivacyPolicy} activeOpacity={0.7}>
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="privacy-tip" size={22} color={C.black} />
                        </View>
                        <Text style={styles.settingLabel}>Privacy Policy</Text>
                        <MaterialIcons name="open-in-new" size={20} color={C.gray400} />
                    </TouchableOpacity>
                </View>

                {/* 4. Footer Actions */}
                <View style={styles.footer}>
                    <Text style={styles.email}>{session?.user?.email}</Text>
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ marginTop: spacing.md }} onPress={handleAccountDeletion}>
                        <Text style={styles.deleteText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
