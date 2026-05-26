import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

const EXPO_PROJECT_ID = 'e4b03e3d-d79c-4300-9d55-c869a5508515';

/**
 * Requests push notification permission, gets the Expo push token, and saves
 * it to the user's profile row so the Edge Function can reach them.
 * Safe to call multiple times -- only writes when the token changes.
 */
export async function registerForPushNotifications(userId: string): Promise<void> {
    // Push notifications are not available in Expo Go simulator
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        return;
    }

    let token: string;
    try {
        const result = await Notifications.getExpoPushTokenAsync({
            projectId: EXPO_PROJECT_ID,
        });
        token = result.data;
    } catch (err) {
        console.warn('Could not get push token:', err);
        return;
    }

    // Read current token to avoid unnecessary writes
    const { data } = await supabase
        .from('profiles')
        .select('expo_push_token')
        .eq('id', userId)
        .single();

    if (data?.expo_push_token === token) return;

    await supabase
        .from('profiles')
        .update({ expo_push_token: token })
        .eq('id', userId);
}

/**
 * Configure how notifications are displayed when the app is in the foreground.
 * Call once at app startup.
 */
export function configureNotificationHandler() {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}
