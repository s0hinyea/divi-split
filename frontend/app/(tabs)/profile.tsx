import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useContext } from 'react';
import { useRouter } from 'expo-router';
import { SessionContext } from '@/app/_layout';
import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, fontSizes, spacing, radii } from '@/styles/theme';

export default function Profile() {
    const { session } = useContext(SessionContext);
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.replace('/home');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Profile</Text>
            </View>

            <View style={styles.content}>
                {/* Avatar placeholder */}
                <View style={styles.avatar}>
                    <MaterialIcons name="person" size={48} color={colors.gray400} />
                </View>

                {/* Email */}
                <Text style={styles.email}>{session?.user?.email || 'Not signed in'}</Text>

                {/* Sign out */}
                <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    header: { padding: spacing.lg, paddingBottom: spacing.md },
    title: {
        fontFamily: fonts.header,
        fontSize: fontSizes.xxl,
        color: colors.black,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingTop: spacing.xxl,
        paddingHorizontal: spacing.lg,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.gray100,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        borderWidth: 2,
        borderColor: colors.gray200,
    },
    email: {
        fontFamily: fonts.body,
        fontSize: fontSizes.md,
        color: colors.gray600,
        marginBottom: spacing.xxl,
    },
    signOutButton: {
        backgroundColor: colors.white,
        paddingVertical: 14,
        paddingHorizontal: spacing.xxl,
        borderRadius: radii.md,
        borderWidth: 2,
        borderColor: colors.error,
    },
    signOutText: {
        fontFamily: fonts.body,
        fontSize: fontSizes.md,
        color: colors.error,
        fontWeight: '600',
    },
});
