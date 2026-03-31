import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth/AuthContext';

function RootLayoutNav() {
  const { session, userProfile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === 'auth';
    const inOnboarding = segments[0] === 'onboarding';
    const inTabs = segments[0] === '(tabs)';
    const inTrips = segments[0] === 'trips';
    const inJoin = segments[0] === 'join';

    // Allow /join/[code] route without session (for invite preview)
    if (inJoin) {
      return;
    }

    // If no session and not on auth screens, redirect to welcome
    if (!session) {
      if (!inAuth) {
        router.replace('/auth/welcome');
      }
      return;
    }

    // User has session but no profile (or has default "Guest" name), redirect to onboarding
    if (!userProfile?.display_name || userProfile.display_name === 'Guest') {
      if (!inOnboarding && !inAuth) {
        router.replace('/onboarding/set-profile');
      }
    } else {
      // User has session + profile, ensure they're in the main app
      if (!inTabs && !inTrips && !inAuth) {
        router.replace('/(tabs)');
      }
    }
  }, [session, userProfile, isLoading, segments]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0E0C16' },
        }}
      >
        <Stack.Screen name="auth/welcome" />
        <Stack.Screen name="auth/guest-setup" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/sign-in" />
        <Stack.Screen name="onboarding/set-profile" />
        <Stack.Screen name="trips/create" />
        <Stack.Screen name="trips/[id]" />
        <Stack.Screen name="join/[code]" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
