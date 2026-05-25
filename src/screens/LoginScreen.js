import React, { useContext, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, StatusBar,
} from 'react-native';
import Loader from '../components/Loader';
import { UserContext } from '../context/UserContext';
import {
  signInWithMicrosoft,
  storeTokens,
  validateDomain,
  parseIdToken,
} from '../services/authService';
import { COLORS } from '../theme/colors';

export default function LoginScreen() {
  const { setAuthData } = useContext(UserContext);
  const [loading, setLoading] = useState(false);

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={styles.overlay} />
      <View style={styles.content}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>SitSure</Text>
          {/* <Text style={styles.subtitle}>Venzo Technologies Seat Booking</Text> */}
        </View>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <Loader color="#fff" size={36} />
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
  container: { flex: 1, backgroundColor: COLORS.primary },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(254,116,42,0.7)',
  },
  content: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 48,
  },
  logoBox: { alignItems: 'center', marginBottom: 48 },
  logoText: { fontSize: 42, fontWeight: '800', color: '#fff', letterSpacing: 2 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 8, textAlign: 'center' },
  button: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.primary, fontWeight: '700', fontSize: 16 ,},
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 16 },
});
