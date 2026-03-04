import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Switch, Image } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useContext } from 'react';
import { useRouter } from 'expo-router';
import { SessionContext } from '@/app/_layout';
import { supabase } from '@/lib/supabase';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, radii, shadows } from '@/styles/theme';
import { useProfile } from '@/utils/ProfileContext';
import * as ImagePicker from 'expo-image-picker';

export default function Profile() {
    const { session } = useContext(SessionContext);
    const { profile, loading, updateProfile } = useProfile();
    const router = useRouter();

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(false);


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
        const { error } = await supabase.auth.signOut();
        if (error) Alert.alert("Error signing out", error.message);
        router.replace('/home');
    };

    const handleSave = async () => {
        // Validation
        const cleanUsername = formData.username.replace('@', '').trim();

        if (cleanUsername.length < 3) {
            Alert.alert("Invalid Username", "Username must be at least 3 characters long.");
            return;
        }

        // Prepare data for save (remove @ from username for storage if needed, or keep it consistent)
        // Here we store it without @ to be clean
        const dataToSave = {
            ...formData,
            username: cleanUsername
        };

        if (isEditing) {
            // Optimistic update with formatted data
            setFormData(prev => ({ ...prev, username: cleanUsername }));
            await updateProfile(dataToSave);
            setIsEditing(false);
            Alert.alert("Success", "Profile updated!");
        }
    };

    const pickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permission to access camera roll is required!");
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
            await updateProfile({ avatar_url: base64Data }); // In a real app, upload to storage bucket
        }
    };

    if (loading && !profile) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.green} />
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

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>

                {/* 1. Hero / Identity Section */}
                <View style={styles.section}>
                    <View style={styles.heroContainer}>
                        <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                    <MaterialIcons name="person" size={48} color={colors.gray400} />
                                </View>
                            )}
                            <View style={styles.cameraIcon}>
                                <MaterialIcons name="camera-alt" size={16} color={colors.white} />
                            </View>
                        </TouchableOpacity>

                        {isEditing ? (
                            <View style={styles.editHeroInputs}>
                                <TextInput
                                    style={styles.heroInputName}
                                    value={formData.full_name}
                                    onChangeText={(t) => setFormData({ ...formData, full_name: t })}
                                    placeholder="Full Name"
                                    placeholderTextColor={colors.gray400}
                                />
                                <TextInput
                                    style={styles.heroInputUser}
                                    value={formData.username}
                                    onChangeText={(t) => setFormData({ ...formData, username: t })}
                                    placeholder="@username"
                                    placeholderTextColor={colors.gray400}
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
                            <FontAwesome5 name="venmo" size={20} color="#3D95CE" />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Venmo</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={formData.venmo_handle}
                                    onChangeText={(t) => setFormData({ ...formData, venmo_handle: t })}
                                    placeholder="@username"
                                    placeholderTextColor={colors.gray400}
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
                            <FontAwesome5 name="dollar-sign" size={20} color="#00D632" />
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Cash App</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={formData.cashapp_handle}
                                    onChangeText={(t) => setFormData({ ...formData, cashapp_handle: t })}
                                    placeholder="$cashtag"
                                    placeholderTextColor={colors.gray400}
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
                            <Text style={{ fontWeight: 'bold', color: '#6D1ED4', fontSize: 12 }}>Zelle</Text>
                        </View>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Zelle</Text>
                            {isEditing ? (
                                <TextInput
                                    style={styles.input}
                                    value={formData.zelle_number}
                                    onChangeText={(t) => setFormData({ ...formData, zelle_number: t })}
                                    placeholder="Phone or Email"
                                    placeholderTextColor={colors.gray400}
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
                    <View style={styles.row}>
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="notifications" size={22} color={colors.black} />
                        </View>
                        <Text style={styles.settingLabel}>Notifications</Text>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: colors.gray300, true: colors.green }}
                        />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.row}>
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="dark-mode" size={22} color={colors.black} />
                        </View>
                        <Text style={styles.settingLabel}>Dark Mode</Text>
                        <Switch
                            value={darkMode}
                            onValueChange={setDarkMode}
                            trackColor={{ false: colors.gray300, true: colors.black }}
                        />
                    </View>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.row} onPress={() => router.push('/help')} activeOpacity={0.7}>
                        <View style={styles.iconContainer}>
                            <MaterialIcons name="help-outline" size={22} color={colors.black} />
                        </View>
                        <Text style={styles.settingLabel}>Help & FAQ</Text>
                        <MaterialIcons name="chevron-right" size={24} color={colors.gray400} />
                    </TouchableOpacity>
                </View>

                {/* 4. Footer Actions */}
                <View style={styles.footer}>
                    <Text style={styles.email}>{session?.user?.email}</Text>
                    <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                        <Text style={styles.signOutText}>Sign Out</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ marginTop: spacing.md }}>
                        <Text style={styles.deleteText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.gray100 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    title: { fontFamily: fonts.bodyBold, fontSize: 28, color: colors.black },
    editButton: { fontFamily: fonts.bodyBold, fontSize: fontSizes.md, color: colors.green },

    scrollView: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: 100 },

    // Hero
    section: { marginBottom: spacing.xl },
    heroContainer: { alignItems: 'center' },
    avatarContainer: { position: 'relative', marginBottom: spacing.md },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: { backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.gray200 },
    cameraIcon: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: colors.black, padding: 6, borderRadius: radii.full,
        borderWidth: 2, borderColor: colors.white
    },
    heroTextContainer: { alignItems: 'center' },
    heroName: { fontFamily: fonts.bodyBold, fontSize: fontSizes.xl, color: colors.black, marginBottom: 4 },
    heroUsername: { fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.gray500 },

    editHeroInputs: { width: '100%', alignItems: 'center', gap: 8 },
    heroInputName: {
        fontFamily: fonts.bodyBold, fontSize: fontSizes.xl,
        color: colors.black, textAlign: 'center',
        borderBottomWidth: 1, borderBottomColor: colors.gray300,
        paddingBottom: 4, width: '60%'
    },
    heroInputUser: {
        fontFamily: fonts.body, fontSize: fontSizes.md,
        color: colors.gray600, textAlign: 'center',
        borderBottomWidth: 1, borderBottomColor: colors.gray300,
        width: '40%'
    },

    // Sections
    sectionTitle: { fontFamily: fonts.bodyBold, fontSize: fontSizes.lg, color: colors.gray600, marginBottom: spacing.sm, marginLeft: spacing.xs },
    card: {
        backgroundColor: colors.white,
        borderRadius: radii.lg,
        padding: spacing.md,
        marginBottom: spacing.xl,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
    divider: { height: 1, backgroundColor: colors.gray100, marginVertical: spacing.xs },

    iconContainer: {
        width: 36, height: 36, borderRadius: radii.md,
        backgroundColor: colors.gray100,
        justifyContent: 'center', alignItems: 'center',
        marginRight: spacing.md
    },
    inputWrapper: { flex: 1 },
    label: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.gray500, marginBottom: 2 },
    value: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: colors.black },
    input: {
        fontFamily: fonts.body, fontSize: fontSizes.md, color: colors.black,
        borderBottomWidth: 1, borderBottomColor: colors.green, paddingVertical: 0
    },

    // Settings
    settingLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: colors.black },

    // Footer
    footer: { alignItems: 'center', marginTop: spacing.lg },
    email: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.gray400, marginBottom: spacing.lg },
    signOutButton: {
        width: '100%', backgroundColor: colors.white,
        paddingVertical: 14, borderRadius: radii.md,
        borderWidth: 1, borderColor: colors.gray300,
        alignItems: 'center'
    },
    signOutText: { fontFamily: fonts.bodySemiBold, fontSize: fontSizes.md, color: colors.black },
    deleteText: { fontFamily: fonts.body, fontSize: fontSizes.sm, color: colors.error },
});
