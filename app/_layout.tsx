import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif';

export default function RootLayout() {
  const [loaded] = useFonts({
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
    InstrumentSerif_400Regular,
  });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F1F5F2' } }} />
    </SafeAreaProvider>
  );
}
