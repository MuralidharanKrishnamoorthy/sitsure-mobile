import React, {useContext, useState, useEffect, useRef} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, StatusBar, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withRepeat, withSequence, FadeInDown, Easing,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Path, Rect, G, Circle} from 'react-native-svg';
import Loader from '../components/Loader';
import {UserContext} from '../context/UserContext';
import {
  signInWithMicrosoft, storeTokens, validateDomain, parseIdToken,
} from '../services/authService';
import {COLORS} from '../theme/colors';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

function MicrosoftIcon({size = 18}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <Rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <Rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <Rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <Rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </Svg>
  );
}

export default function LoginScreen() {
  const {setAuthData} = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  // Glow pulse animation
  const glowScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.35);
  const cardOpacity = useSharedValue(0);
  const cardY = useSharedValue(30);
  const btnScale = useSharedValue(1);

  useEffect(() => {
    // Entrance animation
    cardOpacity.value = withTiming(1, {duration: 700, easing: Easing.out(Easing.cubic)});
    cardY.value = withSpring(0, {damping: 16, stiffness: 90});

    // Ambient glow pulse
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.18, {duration: 2800, easing: Easing.inOut(Easing.sin)}),
        withTiming(1, {duration: 2800, easing: Easing.inOut(Easing.sin)}),
      ),
      -1,
      false,
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.55, {duration: 2800}),
        withTiming(0.25, {duration: 2800}),
      ),
      -1,
      false,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{scale: glowScale.value}],
    opacity: glowOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{translateY: cardY.value}],
  }));

  const btnAnimStyle = useAnimatedStyle(() => ({
    transform: [{scale: btnScale.value}],
  }));

  const handleLogin = async () => {
    setLoading(true);
    btnScale.value = withSpring(0.97, {damping: 12});
    try {
      const result = await signInWithMicrosoft();
      const parsed = parseIdToken(result.idToken);
      const email =
        parsed?.preferred_username ||
        parsed?.upn ||
        result.additionalParameters?.login_hint ||
        '';

      if (!validateDomain(email)) {
        Alert.alert('Access Denied', 'Only @venzotechnologies.com accounts can sign in.');
        return;
      }

      await storeTokens({
        accessToken: result.accessToken,
        idToken: result.idToken,
        refreshToken: result.refreshToken,
        accessTokenExpirationDate: result.accessTokenExpirationDate,
        account: {email, name: parsed?.name},
      });

      await setAuthData({
        accessToken: result.accessToken,
        idToken: result.idToken,
        account: {email, name: parsed?.name},
      });
    } catch (err) {
      if (err.message !== 'User cancelled flow') {
        Alert.alert('Login Failed', err.message || 'Unable to sign in. Please try again.');
      }
    } finally {
      btnScale.value = withSpring(1, {damping: 12});
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, {paddingBottom: insets.bottom}]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bgDark} />

      {/* Radial violet glow */}
      <Animated.View style={[styles.glowOrb, glowStyle]} />

      {/* Card */}
      <Animated.View style={[styles.card, cardStyle]}>
        {/* Logo block */}
        <View style={styles.logoBlock}>
          <View style={styles.logoIconWrap}>
            <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
              <Rect width="36" height="36" rx="10" fill={COLORS.primary} />
              <Path
                d="M10 26L18 10L26 26"
                stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round"
              />
              <Path
                d="M13 21H23"
                stroke="#fff" strokeWidth={2.2} strokeLinecap="round"
              />
            </Svg>
          </View>
          <Text style={styles.logoText}>SitSure</Text>
          <Text style={styles.logoTagline}>WORKSPACE BOOKING</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Sign in label */}
        <Text style={styles.signInLabel}>Sign in to continue</Text>

        {/* Microsoft button */}
        <Animated.View style={btnAnimStyle}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <Loader color="#fff" size={22} />
            ) : (
              <>
                <View style={styles.msIconWrap}>
                  <MicrosoftIcon size={18} />
                </View>
                <Text style={styles.buttonText}>Sign in with Microsoft</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.hint}>@venzotechnologies.com accounts only</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  glowOrb: {
    position: 'absolute',
    width: SCREEN_W * 1.1,
    height: SCREEN_W * 1.1,
    borderRadius: SCREEN_W * 0.55,
    backgroundColor: COLORS.primary,
    opacity: 0.35,
    top: SCREEN_H * 0.18,
    alignSelf: 'center',
    // Radial-like feel via large blur shadow
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.9,
    shadowRadius: 120,
    elevation: 0,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(22,22,31,0.92)',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: 'rgba(139,111,255,0.18)',
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 20,
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoIconWrap: {
    marginBottom: 14,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1.2,
    marginBottom: 4,
  },
  logoTagline: {
    fontSize: 10,
    color: COLORS.textSecondaryDark,
    letterSpacing: 3.5,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginBottom: 24,
  },
  signInLabel: {
    fontSize: 13,
    color: COLORS.textSecondaryDark,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 54,
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  buttonDisabled: {opacity: 0.6, shadowOpacity: 0},
  msIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  hint: {
    color: COLORS.textTertiaryDark,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 18,
    letterSpacing: 0.1,
  },
});
