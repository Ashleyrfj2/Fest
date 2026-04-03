import { Stack } from 'expo-router';
import { colors } from '@/lib/tokens';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.base },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="appearance" />
      <Stack.Screen name="help" />
    </Stack>
  );
}
