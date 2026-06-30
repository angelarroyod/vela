import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

// Sign in with Apple needs the native module, which is absent in Expo Go.
// Render only on iOS in a native/dev build; otherwise render nothing.
const isExpoGo = Constants.appOwnership === 'expo';
const enabled = Platform.OS === 'ios' && !isExpoGo;

export function AppleButton() {
  if (!enabled) return null;
  // Lazy require so Expo Go / web / tests never load the native module.
  const AppleAuthentication = require('expo-apple-authentication');
  const signIn = async () => {
    const cred = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (cred.identityToken) {
      await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken });
    }
  };
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={14}
      style={{ height: 50 }}
      onPress={signIn}
    />
  );
}
