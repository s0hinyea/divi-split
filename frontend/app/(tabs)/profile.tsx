import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Image, RefreshControl, Linking } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { fonts, fontSizes, spacing, radii, shadows, colors } from '@/styles/theme';
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
            paddingTop: spacing.md,
            paddingBottom: spacing.sm,
        },
        title: { fontFamily: fonts.bodyBold, fontSize: 30, color: C.black, letterSpacing: -0.5 },
        editButton: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.md,
            color: C.green,
        },

        scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 140 },

        // Hero
        heroCard: {
            backgroundColor: C.white,
            borderRadius: radii.xl,
            padding: spacing.xl,
            alignItems: 'center',
            marginBottom: spacing.lg,
            ...shadows.sm,
        },
        avatarRing: {
            width: 96,
            height: 96,
            borderRadius: 48,
            borderWidth: 3,
            borderColor: C.green,
            padding: 3,
            marginBottom: spacing.md,
            position: 'relative',
        },
        avatar: { width: '100%', height: '100%', borderRadius: 42 },
        avatarPlaceholder: {
            width: '100%',
            height: '100%',
            borderRadius: 42,
            backgroundColor: C.gray100,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
        },
        cameraIconWrap: {
            position: 'absolute',
            bottom: -2,
            right: -2,
            backgroundColor: C.black,
            width: 28,
            height: 28,
            borderRadius: 14,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: C.white,
        },
        heroName: {
            fontFamily: fonts.bodyBold,
            fontSize: fontSizes.xl,
            color: C.black,
            marginBottom: 2,
        },
        heroUsername: {
            fontFamily: fonts.body,
            fontSize: fontSizes.sm,
            color: C.gray500,
        },
        editHeroInputs: { width: '100%', alignItems: 'center' as const, gap: spacing.sm },
        heroInputName: {
            fontFamily: fonts.bodyBold,
            fontSize: fontSizes.xl,
            color: C.black,
            textAlign: 'center' as const,
            borderBottomWidth: 1.5,
            borderBottomColor: C.green,
            paddingBottom: 4,
            width: '70%',
        },
        heroInputUser: {
            fontFamily: fonts.body,
            fontSize: fontSizes.md,
            color: C.gray600,
            textAlign: 'center' as const,
            borderBottomWidth: 1.5,
            borderBottomColor: C.green,
            width: '50%',
        },

        // Section
        sectionLabel: {
            fontFamily: fonts.bodySemiBold,
            fontSize: fontSizes.xs,
            color: C.gray500,
            letterSpacing: 1,
            textTransform: 'uppercase',
            marginBottom: spacing.sm,
            marginLeft: spacing.xs,
        },
        card: {
            backgroundColor: C.white,
            borderRadius: radii.lg,
            marginBottom: spacing.lg,
            overflow: 'hidden',
            ...shadows.sm,
        },
        row: {
            flexDirection: 'row' as const,
            alignItems: 'center' as const,
            paddingVertical: spacing.md,
            paddingHorizontal: spacing.md,
            gap: spacing.md,
        },
        divider: { height: 1, backgroundColor: C.gray200, marginHorizontal: spacing.md },

        // Payment handle rows
        paymentIconBox: {
            width: 42,
            height: 42,
            borderRadius: radii.sm,
            backgroundColor: C.gray100,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
        },
        venmoIcon: { width: 42, height: 42 },
        cashAppIcon: { width: 24, height: 24 },
        zelleIcon: { width: 30, height: 30 },
        paymentInfo: { flex: 1 },
        paymentLabel: { fontFamily: fonts.bodyMedium, fontSize: fontSizes.xs, color: C.gray500, marginBottom: 2 },
        paymentValue: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: C.black },
        paymentInput: {
            fontFamily: fonts.body,
            fontSize: fontSizes.md,
            color: C.black,
            borderBottomWidth: 1,
            borderBottomColor: C.green,
            paddingVertical: 0,
        },

        // Settings rows
        settingLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: C.black },
        settingIconBox: {
            width: 36,
            height: 36,
            borderRadius: radii.sm,
            backgroundColor: C.gray100,
            justifyContent: 'center' as const,
            alignItems: 'center' as const,
        },

        // Footer
        footer: { alignItems: 'center' as const, paddingTop: spacing.sm },
        email: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: C.gray400, marginBottom: spacing.md },
        signOutButton: {
            width: '100%',
            backgroundColor: C.white,
            paddingVertical: spacing.md,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: C.gray200,
            alignItems: 'center' as const,
            ...shadows.sm,
        },
        signOutText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: C.black },
        deleteText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: C.error, marginTop: spacing.md },
    });
}

export default function Profile() {
    const { session } = useSession();
    const { profile, loading, updateProfile, refreshProfile } = useProfile();
    const router = useRouter();
    const C = useThemeColors();
    const styles = useMemo(() => createStyles(C), [C]);
    const [refreshing, setRefreshing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        username: '',
        venmo_handle: '',
        cashapp_handle: '',
        zelle_number: '',
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try { await refreshProfile(); } finally { setRefreshing(false); }
    }, []);

    useEffect(() => {
        if (profile) {
            setFormData({
                full_name: profile.full_name || '',
                username: profile.username || '',
                venmo_handle: profile.venmo_handle || '',
                cashapp_handle: profile.cashapp_handle || '',
                zelle_number: profile.zelle_number || '',
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
            'Delete Account',
            'To permanently delete your account and all associated data, please email us from the address on your account. We process deletions within 30 days.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Email Support',
                    style: 'destructive',
                    onPress: () => {
                        Linking.openURL(`mailto:suppport@divi.app?subject=Account Deletion Request&body=Please delete my account: ${session?.user?.email}`);
                    },
                },
            ]
        );
    };

    const handleSave = async () => {
        const cleanUsername = formData.username ? formData.username.replace('@', '').trim() : '';
        if (cleanUsername && cleanUsername.length < 3) {
            Alert.alert('Invalid Username', 'Username must be at least 3 characters.');
            return;
        }
        const dataToSave = { ...formData, username: cleanUsername || null };
        if (isEditing) {
            setFormData(prev => ({ ...prev, username: cleanUsername }));
            const errorMsg = await updateProfile(dataToSave);
            if (!errorMsg) {
                setIsEditing(false);
                Alert.alert('Saved', 'Profile updated.');
            } else {
                Alert.alert('Update failed', errorMsg);
            }
        }
    };

    const pickImage = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                Alert.alert('Permission required', 'Photo library access is needed to update your avatar.');
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
                if (errorMsg) Alert.alert('Upload failed', errorMsg);
            }
        } catch (error) {
            Alert.alert('Upload failed', getUserFacingErrorMessage(error, 'We could not open your photo library.'));
        }
    };

    const openPrivacyPolicy = async () => {
        if (!privacyPolicyUrl) {
            Alert.alert('Privacy policy missing', 'Set EXPO_PUBLIC_PRIVACY_POLICY_URL before submitting to Apple.');
            return;
        }
        try { await Linking.openURL(privacyPolicyUrl); }
        catch { Alert.alert('Link unavailable', 'We could not open the privacy policy right now.'); }
    };

    if (loading && !profile) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={C.green} /></View>;
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
                <TouchableOpacity onPress={() => isEditing ? handleSave() : setIsEditing(true)}>
                    <Text style={styles.editButton}>{isEditing ? 'Save' : 'Edit'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.green} />}
            >
                {/* Hero */}
                <View style={styles.heroCard}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarRing}>
                        {profile?.avatar_url ? (
                            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <MaterialIcons name="person" size={40} color={C.gray400} />
                            </View>
                        )}
                        <View style={styles.cameraIconWrap}>
                            <MaterialIcons name="camera-alt" size={13} color={C.white} />
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
                        <>
                            <Text style={styles.heroName}>{profile?.full_name || 'Your Name'}</Text>
                            <Text style={styles.heroUsername}>{profile?.username ? `@${profile.username}` : '@username'}</Text>
                        </>
                    )}
                </View>

                {/* Get Paid */}
                <Text style={styles.sectionLabel}>Get Paid</Text>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <View style={styles.paymentIconBox}>
                            <Image source={VenmoLogo} style={styles.venmoIcon} resizeMode="contain" />
                        </View>
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentLabel}>Venmo</Text>
                            {isEditing ? (
                                <TextInput style={styles.paymentInput} value={formData.venmo_handle} onChangeText={(t) => setFormData({ ...formData, venmo_handle: t })} placeholder="@username" placeholderTextColor={C.gray400} />
                            ) : (
                                <Text style={styles.paymentValue}>{profile?.venmo_handle || 'Not set'}</Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <View style={styles.paymentIconBox}>
                            <Image source={CashAppLogo} style={styles.cashAppIcon} resizeMode="contain" />
                        </View>
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentLabel}>Cash App</Text>
                            {isEditing ? (
                                <TextInput style={styles.paymentInput} value={formData.cashapp_handle} onChangeText={(t) => setFormData({ ...formData, cashapp_handle: t })} placeholder="$cashtag" placeholderTextColor={C.gray400} />
                            ) : (
                                <Text style={styles.paymentValue}>{profile?.cashapp_handle || 'Not set'}</Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <View style={styles.paymentIconBox}>
                            <Image source={ZelleLogo} style={styles.zelleIcon} resizeMode="contain" />
                        </View>
                        <View style={styles.paymentInfo}>
                            <Text style={styles.paymentLabel}>Zelle</Text>
                            {isEditing ? (
                                <TextInput style={styles.paymentInput} value={formData.zelle_number} onChangeText={(t) => setFormData({ ...formData, zelle_number: t })} placeholder="Phone or Email" placeholderTextColor={C.gray400} />
                            ) : (
                                <Text style={styles.paymentValue}>{profile?.zelle_number || 'Not set'}</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Settings */}
                <Text style={styles.sectionLabel}>Settings</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.row} onPress={() => router.push('/help')} activeOpacity={0.7}>
                        <View style={styles.settingIconBox}>
                            <MaterialIcons name="help-outline" size={20} color={C.gray600} />
                        </View>
                        <Text style={styles.settingLabel}>Help & FAQ</Text>
                        <MaterialIcons name="chevron-right" size={22} color={C.gray300} />
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.row} onPress={openPrivacyPolicy} activeOpacity={0.7}>
                        <View style={styles.settingIconBox}>
                            <MaterialIcons name="privacy-tip" size={20} color={C.gray600} />
                        </View>
                        <Text style={styles.settingLabel}>Privacy Policy</Text>
                        <MaterialIcons name="open-in-new" size={18} color={C.gray300} />
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.email}>{session?.user?.email}</Text>
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.7}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleAccountDeletion}>
                        <Text style={styles.deleteText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
