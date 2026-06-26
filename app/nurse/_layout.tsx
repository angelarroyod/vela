import { Stack } from 'expo-router';

export default function NurseStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="medicacion" options={{ presentation: 'card' }} />
    </Stack>
  );
}
