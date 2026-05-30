import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useSession } from '@/utils/SessionContext';
import { useProfile } from '@/utils/ProfileContext';
import { colors } from '@/styles/theme';

export default function Index() {
  const { session } = useSession();
  const { profile, loading } = useProfile();

  if (!session) return <Redirect href="/home" />;
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  if (!profile?.username) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
