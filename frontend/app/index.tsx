import { Redirect } from 'expo-router';
import { useSession } from '@/utils/SessionContext';
import { useProfile } from '@/utils/ProfileContext';

export default function Index() {
  const { session } = useSession();
  const { profile, loading } = useProfile();

  if (!session) return <Redirect href="/home" />;
  if (loading) return null;
  if (!profile?.username) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
