import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, StatusBar, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Loader from '../components/Loader';
import { UserContext } from '../context/UserContext';
import {
  signInWithMicrosoft,
  storeTokens,
  validateDomain,
  parseIdToken,
} from '../services/authService';
import { COLORS } from '../theme/colors';

const { width: SCREEN_W } = Dimensions.get('window');

export default function LoginScreen() {
  const { setAuthData } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  // Responsive logo size: clamp between 28 and 42 based on screen width
  const logoFontSize = Math.min(42, Math.max(28, SCREEN_W * 0.11));

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithMicrosoft();

      const parsed = parseIdToken(result.idToken);
      const email = parsed?.preferred_username || parsed?.upn || result.additionalParameters?.login_hint || '';

      if (!validateDomain(email)) {
        Alert.alert('Access Denied', 'Only @venzotechnologies.com accounts can sign in.');
        return;
      }

      await storeTokens({
        accessToken: result.accessToken,
        idToken: result.idToken,
        refreshToken: result.refreshToken,
        accessTokenExpirationDate: result.accessTokenExpirationDate,
        account: { email, name: parsed?.name },
      });

      await setAuthData({
        accessToken: result.accessToken,
        idToken: result.idToken,
        account: { email, name: parsed?.name },
      });
    } catch (err) {
      if (err.message !== 'User cancelled flow') {
        Alert.alert('Login Failed', err.message || 'Unable to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />
      <View style={styles.content}>
        <View style={styles.logoBox}>
          <Text style={[styles.logoText, { fontSize: logoFontSize }]}>SitSure</Text>
          <Text style={styles.logoTagline}>Workspace Booking</Text>
        </View>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <Loader color={COLORS.primary} size={36} />
          ) : (
            <Text style={styles.buttonText}>Sign in with Microsoft</Text>
          )}
        </TouchableOpacity>
        {/* <Text style={styles.hint}>Only @venzotechnologies.com accounts</Text> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 28, paddingBottom: 48,
  },
  logoBox: { alignItems: 'center', marginBottom: 52 },
  logoText: {
    fontWeight: '900', color: COLORS.primary,
    letterSpacing: -1.5,
  },
  logoTagline: {
    fontSize: 13, color: COLORS.textSecondaryDark,
    marginTop: 6, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '500',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 17,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    minHeight: 54,
    justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.65, shadowOpacity: 0 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
  hint: { color: COLORS.textTertiaryDark, fontSize: 12, marginTop: 20, textAlign: 'center' },
});
