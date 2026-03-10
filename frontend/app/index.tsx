import { Redirect } from 'expo-router';
import { useSession } from '@/utils/SessionContext';

export default function Index() {
  const { session } = useSession();

  // If user is already logged in, skip to the main app (tabs)
  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  // Otherwise, show the login/signup page
  return <Redirect href="/home" />;
}
