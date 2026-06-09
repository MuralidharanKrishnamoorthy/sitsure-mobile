import React, {useContext, useState, useEffect} from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, StatusBar, Dimensions, Image,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring, Easing,
} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Rect, Path} from 'react-native-svg';
import Loader from '../components/Loader';
import {UserContext} from '../context/UserContext';
import {
  signInWithMicrosoft, storeTokens, validateDomain, parseIdToken,
} from '../services/authService';
import {COLORS} from '../theme/colors';

const {width: W, height: H} = Dimensions.get('window');

// Smooth organic wave — white fill sits on top of image bottom edge
// Creates a gentle S-curve / wave transition from image into white content area
const WAVE_H = 72;
function WaveClip() {
  // Cubic bezier wave: starts flush left, dips in middle, rises right
  // Fills the white bg shape over the bottom of the image
  const d = `
    M0,${WAVE_H * 0.55}
    C${W * 0.25},${WAVE_H * 1.1} ${W * 0.75},0 ${W},${WAVE_H * 0.45}
    L${W},${WAVE_H}
    L0,${WAVE_H}
    Z
  `;
  return (
    <Svg
      width={W}
      height={WAVE_H}
      style={styles.wave}
      viewBox={`0 0 ${W} ${WAVE_H}`}>
      <Path d={d} fill="#ffffff" />
    </Svg>
  );
}

function MicrosoftIcon({size = 20}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <Rect x="1"  y="1"  width="9" height="9" fill="#F25022" />
      <Rect x="11" y="1"  width="9" height="9" fill="#7FBA00" />
      <Rect x="1"  y="11" width="9" height="9" fill="#00A4EF" />
      <Rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </Svg>
  );
}

export default function LoginScreen() {
  const {setAuthData} = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const imgOp    = useSharedValue(0);
  const imgY     = useSharedValue(-30);
  const titleOp  = useSharedValue(0);
  const titleY   = useSharedValue(20);
  const descOp   = useSharedValue(0);
  const descY    = useSharedValue(20);
  const btnOp    = useSharedValue(0);
  const btnY     = useSharedValue(20);
  const btnScale = useSharedValue(1);

  const SP = {damping: 15, stiffness: 100};

  useEffect(() => {
    imgOp.value = withTiming(1, {duration: 900, easing: Easing.out(Easing.cubic)});
    imgY.value  = withSpring(0, SP);
    setTimeout(() => {
      titleOp.value = withTiming(1, {duration: 600});
      titleY.value  = withSpring(0, SP);
    }, 200);
    setTimeout(() => {
      descOp.value = withTiming(1, {duration: 600});
      descY.value  = withSpring(0, SP);
    }, 380);
    setTimeout(() => {
      btnOp.value = withTiming(1, {duration: 600});
      btnY.value  = withSpring(0, SP);
    }, 540);
  }, []);

  const imgStyle   = useAnimatedStyle(() => ({opacity: imgOp.value,   transform: [{translateY: imgY.value}]}));
  const titleStyle = useAnimatedStyle(() => ({opacity: titleOp.value, transform: [{translateY: titleY.value}]}));
  const descStyle  = useAnimatedStyle(() => ({opacity: descOp.value,  transform: [{translateY: descY.value}]}));
  const btnStyle   = useAnimatedStyle(() => ({opacity: btnOp.value,   transform: [{translateY: btnY.value}, {scale: btnScale.value}]}));

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    btnScale.value = withSpring(0.97, {damping: 12});
    try {
      const result = await signInWithMicrosoft();
      const parsed = parseIdToken(result.idToken);
      const email  =
        parsed?.preferred_username ||
        parsed?.upn ||
        result.additionalParameters?.login_hint || '';
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

  const IMG_H = H * 0.56;

  return (
    <View style={[styles.root, {paddingBottom: insets.bottom + 28}]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Image block — full bleed, wave SVG overlaid at bottom ── */}
      <Animated.View style={[{width: W, height: IMG_H}, imgStyle]}>
        <Image
          source={require('../../assets/venzo.png')}
          style={styles.image}
          resizeMode="cover"
        />
        {/* Wave overlay sits at bottom of image, fills into white bg */}
        <WaveClip />
      </Animated.View>

      {/* ── Content ── */}
      <View style={styles.content}>
        <Animated.Text style={[styles.title, titleStyle]}>
          {'Welcome To '}
          <Text style={styles.titleAccent}>SitSure</Text>
        </Animated.Text>

        <Animated.Text style={[styles.desc, descStyle]}>
          Reserve seat and manage your workspace effortlessly your smart seat booking companion.
        </Animated.Text>
      </View>

      {/* ── Actions ── */}
      <View style={styles.actions}>
        <Animated.View style={[btnStyle, {width: '100%'}]}>
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}>
            {loading ? (
              <Loader color="#fff" size={22} />
            ) : (
              <>
                <View style={styles.msIconWrap}>
                  <MicrosoftIcon size={18} />
                </View>
                <Text style={styles.btnText}>Continue with Microsoft</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },

  // SVG wave — absolute, sits at very bottom of image container
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 14,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 40,
  },
  titleAccent: {
    color: COLORS.primary,
  },

  desc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },

  actions: {
    width: '100%',
    paddingHorizontal: 28,
    paddingBottom: 4,
  },

  btn: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 10,
  },
  btnDisabled: {opacity: 0.6},
  msIconWrap: {
    width: 28, height: 28, borderRadius: 6,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
