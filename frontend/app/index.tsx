import { Redirect } from 'expo-router';
import { useContext } from 'react';
import { SessionContext } from './_layout';

export default function Index() {
  const { session } = useContext(SessionContext);

  // If user is already logged in, skip to the main app
  if (session) {
    return <Redirect href="/expense-splitter" />;
  }

  // Otherwise, show the login/signup page
  return <Redirect href="/home" />;
}