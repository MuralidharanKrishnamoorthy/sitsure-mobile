import React, {useContext, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Pressable} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, Easing, FadeInDown,
} from 'react-native-reanimated';
import Loader from '../components/Loader';
import Svg, {Path, Circle, Rect, G, Polyline, Line} from 'react-native-svg';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
// Drawer import removed — no drawer navigator used
import {UserContext} from '../context/UserContext';
import {useTheme} from '../context/ThemeContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import FunsightsScreen from '../screens/FunsightsScreen';
import TodayScreen from '../screens/TodayScreen';
import {COLORS} from '../theme/colors';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ─────────────────────────────────────────────────────────────────────────────
// TAB ICONS
// ─────────────────────────────────────────────────────────────────────────────

function HomeIcon({color, size, focused}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {focused ? (
        <G>
          {/* Rounded filled house body */}
          <Path
            d="M5 13.5C5 12.7 5.35 11.95 5.96 11.44L12.96 5.44C13.55 4.95 14.45 4.95 15.04 5.44L22.04 11.44C22.65 11.95 23 12.7 23 13.5V22C23 23.1 22.1 24 21 24H18C17.45 24 17 23.55 17 23V19C17 18.45 16.55 18 16 18H12C11.45 18 11 18.45 11 19V23C11 23.55 10.55 24 10 24H7C5.9 24 5 23.1 5 22V13.5Z"
            fill={color}
          />
          {/* Door cutout */}
          <Rect x="11" y="18" width="6" height="6" rx="1.5" fill="white" opacity={0.2} />
        </G>
      ) : (
        <G>
          {/* Rounded stroke house */}
          <Path
            d="M5 13.5C5 12.7 5.35 11.95 5.96 11.44L12.96 5.44C13.55 4.95 14.45 4.95 15.04 5.44L22.04 11.44C22.65 11.95 23 12.7 23 13.5V22C23 23.1 22.1 24 21 24H18C17.45 24 17 23.55 17 23V19C17 18.45 16.55 18 16 18H12C11.45 18 11 18.45 11 19V23C11 23.55 10.55 24 10 24H7C5.9 24 5 23.1 5 22V13.5Z"
            stroke={color} strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round"
          />
          {/* Door */}
          <Rect x="11.5" y="18.5" width="5" height="5.5" rx="1.2" stroke={color} strokeWidth={1.3} />
        </G>
      )}
    </Svg>
  );
}

function HistoryIcon({color, size, focused}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {focused ? (
        <G>
          <Circle cx="14" cy="14" r="11" fill={color} />
          <Path d="M14 8V14.5L18 17.5" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="14" cy="14" r="1.2" fill="white" />
          <Path d="M14 4.5V6.5" stroke="white" strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M14 21.5V23.5" stroke="white" strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M4.5 14H6.5" stroke="white" strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M21.5 14H23.5" stroke="white" strokeWidth={1.4} strokeLinecap="round" />
        </G>
      ) : (
        <G>
          <Circle cx="14" cy="14" r="10" stroke={color} strokeWidth={1.7} />
          <Path d="M14 8.5V14L17.5 17" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="14" cy="14" r="1" fill={color} />
          <Path d="M14 5V7" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M14 21V23" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M5 14H7" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M21 14H23" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
        </G>
      )}
    </Svg>
  );
}

function FunsightsIcon({color, size, focused}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {focused ? (
        <G>
          <Rect x="3" y="16" width="5" height="9" rx="1.5" fill={color} />
          <Rect x="11" y="10" width="5" height="15" rx="1.5" fill={color} />
          <Rect x="19" y="5" width="5" height="20" rx="1.5" fill={color} />
          <Path d="M5.5 15L13.5 9L21.5 4" stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.4} />
          <Circle cx="21.5" cy="4" r="2" fill={color} />
        </G>
      ) : (
        <G>
          <Rect x="3" y="16" width="5" height="9" rx="1.5" stroke={color} strokeWidth={1.5} />
          <Rect x="11" y="10" width="5" height="15" rx="1.5" stroke={color} strokeWidth={1.5} />
          <Rect x="19" y="5" width="5" height="20" rx="1.5" stroke={color} strokeWidth={1.5} />
          <Path d="M5.5 15.5L13.5 9.5L21.5 4.5" stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.5} />
        </G>
      )}
    </Svg>
  );
}

function TodayIcon({color, size, focused}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {focused ? (
        <G>
          <Rect x="3" y="5" width="22" height="20" rx="3.5" fill={color} />
          <Rect x="3" y="5" width="22" height="8" rx="3.5" fill={color} />
          <Path d="M9 3V7M19 3V7" stroke="white" strokeWidth={2} strokeLinecap="round" />
          <Circle cx="9" cy="17" r="1.8" fill="white" />
          <Circle cx="14" cy="17" r="1.8" fill="white" />
          <Circle cx="19" cy="17" r="1.8" fill="white" />
          <Circle cx="9" cy="22" r="1.8" fill="white" />
          <Circle cx="14" cy="22" r="1.8" fill="white" />
        </G>
      ) : (
        <G>
          <Rect x="3" y="5" width="22" height="20" rx="3.5" stroke={color} strokeWidth={1.7} />
          <Path d="M3 11H25" stroke={color} strokeWidth={1.5} />
          <Path d="M9 3V7M19 3V7" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Circle cx="9" cy="17" r="1.5" fill={color} />
          <Circle cx="14" cy="17" r="1.5" fill={color} />
          <Circle cx="19" cy="17" r="1.5" fill={color} />
          <Circle cx="9" cy="22" r="1.5" fill={color} />
          <Circle cx="14" cy="22" r="1.5" fill={color} />
        </G>
      )}
    </Svg>
  );
}

function TabIcon({name, color, size, focused}) {
  if (name === 'Home') return <HomeIcon color={color} size={size} focused={focused} />;
  if (name === 'History') return <HistoryIcon color={color} size={size} focused={focused} />;
  if (name === 'Today') return <TodayIcon color={color} size={size} focused={focused} />;
  if (name === 'Funsights') return <FunsightsIcon color={color} size={size} focused={focused} />;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPANDABLE TAB BAR — active tab expands with animated label (nav.txt port)
// ─────────────────────────────────────────────────────────────────────────────

const TAB_DEFS = [
  {name: 'Home',      label: 'Home'},
  {name: 'History',   label: 'History'},
  {name: 'Today',     label: 'Today'},
  {name: 'Funsights', label: 'Funsights'},
];

function ExpandableTabItem({tabDef, focused, onPress, t}) {
  const width      = useSharedValue(focused ? 120 : 52);
  const labelOpacity = useSharedValue(focused ? 1 : 0);
  const bgOpacity  = useSharedValue(focused ? 1 : 0);
  const iconScale  = useSharedValue(focused ? 1.08 : 1);

  useEffect(() => {
    width.value        = withSpring(focused ? 120 : 52, {damping: 18, stiffness: 160, mass: 0.8});
    labelOpacity.value = withTiming(focused ? 1 : 0,   {duration: focused ? 220 : 120, easing: Easing.out(Easing.cubic)});
    bgOpacity.value    = withTiming(focused ? 1 : 0,   {duration: 200});
    iconScale.value    = withSpring(focused ? 1.12 : 1, {damping: 14, stiffness: 200});
  }, [focused]);

  const pillStyle  = useAnimatedStyle(() => ({width: width.value}));
  const labelStyle = useAnimatedStyle(() => ({opacity: labelOpacity.value}));
  const bgStyle    = useAnimatedStyle(() => ({opacity: bgOpacity.value}));
  const iconStyle  = useAnimatedStyle(() => ({transform: [{scale: iconScale.value}]}));

  return (
    <Pressable onPress={onPress} style={styles.expandTabBtn}>
      <Animated.View style={[styles.expandTabPill, pillStyle]}>
        {/* Active bg */}
        <Animated.View style={[
          StyleSheet.absoluteFill,
          styles.expandTabBg,
          {backgroundColor: COLORS.primaryMuted},
          bgStyle,
        ]} />
        {/* Icon */}
        <Animated.View style={[styles.expandTabIcon, iconStyle]}>
          <TabIcon
            name={tabDef.name}
            color={focused ? COLORS.primary : t.tabInactive}
            size={22}
            focused={focused}
          />
        </Animated.View>
        {/* Label — slides in, hidden when inactive */}
        {focused && (
          <Animated.Text
            style={[styles.expandTabLabel, {color: COLORS.primary}, labelStyle]}
            numberOfLines={1}>
            {tabDef.label}
          </Animated.Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

function CustomTabBar({state, descriptors, navigation}) {
  const {t} = useTheme();
  return (
    <View style={styles.expandBarOuter}>
      <View style={[styles.expandBarInner, {
        backgroundColor: t.tabBar,
        borderColor: t.tabBarBorder,
      }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const tabDef  = TAB_DEFS[index];
          const onPress = () => {
            const event = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          return (
            <ExpandableTabItem
              key={route.key}
              tabDef={tabDef}
              focused={focused}
              onPress={onPress}
              t={t}
            />
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name="Home"      component={HomeScreen} />
      <Tab.Screen name="History"   component={HistoryScreen} />
      <Tab.Screen name="Today"     component={TodayScreen} />
      <Tab.Screen name="Funsights" component={FunsightsScreen} />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME TOGGLE ICONS
// ─────────────────────────────────────────────────────────────────────────────

function SunIcon({size = 18, color}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={1.8} />
      <Path d="M12 2V4M12 20V22M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M2 12H4M20 12H22M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function MoonIcon({size = 18, color}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME TOGGLE — header right icon button (Sun↔Moon with scale+rotate anim)
// ─────────────────────────────────────────────────────────────────────────────

function ThemeToggleButton() {
  const {darkMode, toggleTheme} = useTheme();
  const iconRotate = useSharedValue(darkMode ? 180 : 0);
  const iconScale  = useSharedValue(1);
  const btnScale   = useSharedValue(1);

  useEffect(() => {
    iconScale.value  = withSequence(withSpring(0, {damping: 12}), withSpring(1, {damping: 14}));
    iconRotate.value = withTiming(darkMode ? 180 : 0, {duration: 400, easing: Easing.inOut(Easing.cubic)});
  }, [darkMode]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${iconRotate.value}deg`}, {scale: iconScale.value}],
  }));
  const btnStyle = useAnimatedStyle(() => ({transform: [{scale: btnScale.value}]}));

  const handlePress = () => {
    btnScale.value = withSequence(withSpring(0.82, {damping: 10}), withSpring(1, {damping: 13}));
    toggleTheme();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={styles.themeHeaderBtn}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
      <Animated.View style={[styles.themeHeaderBtnInner, btnStyle]}>
        <Animated.View style={iconStyle}>
          {darkMode
            ? <SunIcon  color="#fff" size={19} />
            : <MoonIcon color="#fff" size={19} />}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP STACK — authenticated flow (no drawer, logout lives in avatar modal)
// ─────────────────────────────────────────────────────────────────────────────

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {fontWeight: '800', fontSize: 17, letterSpacing: -0.3},
        headerRight: () => <ThemeToggleButton />,
      }}>
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{title: 'SitSure'}}
      />
    </Stack.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPLASH
// ─────────────────────────────────────────────────────────────────────────────

function SplashScreen() {
  const opacity  = useSharedValue(0);
  const dotOp1   = useSharedValue(0.3);
  const dotOp2   = useSharedValue(0.3);
  const dotOp3   = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withTiming(1, {duration: 500, easing: Easing.out(Easing.cubic)});
    // Staggered dot pulse loop
    const loop = (sv, delay) => setTimeout(() => {
      sv.value = withRepeat(
        withSequence(
          withTiming(1,   {duration: 380}),
          withTiming(0.3, {duration: 380}),
        ), -1, false,
      );
    }, delay);
    loop(dotOp1, 0);
    loop(dotOp2, 180);
    loop(dotOp3, 360);
  }, []);

  const fadeStyle  = useAnimatedStyle(() => ({opacity: opacity.value}));
  const d1Style    = useAnimatedStyle(() => ({opacity: dotOp1.value}));
  const d2Style    = useAnimatedStyle(() => ({opacity: dotOp2.value}));
  const d3Style    = useAnimatedStyle(() => ({opacity: dotOp3.value}));

  return (
    <Animated.View style={[styles.splash, fadeStyle]}>
      <Text style={styles.splashText}>SitSure</Text>
      <Text style={styles.splashSub}>WORKSPACE BOOKING</Text>
      <View style={styles.splashDots}>
        <Animated.View style={[styles.splashDot, d1Style]} />
        <Animated.View style={[styles.splashDot, d2Style]} />
        <Animated.View style={[styles.splashDot, d3Style]} />
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function AppNavigator() {
  const {user, loading} = useContext(UserContext);
  if (loading) return <SplashScreen />;
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!user
          ? <Stack.Screen name="Login" component={LoginScreen} />
          : <Stack.Screen name="App"   component={AppStack} />
        }
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Splash ─────────────────────────────────────────────────────────────────
  splash: {flex: 1, backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center', gap: 10},
  splashText: {color: '#0f172a', fontSize: 32, fontWeight: '900', letterSpacing: -1.2},
  splashSub: {color: '#94a3b8', fontSize: 10, fontWeight: '600', letterSpacing: 3.5},
  splashDots: {flexDirection: 'row', gap: 8, marginTop: 32},
  splashDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary},

  // ── Theme toggle header button ─────────────────────────────────────────────
  themeHeaderBtn: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeHeaderBtnInner: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // ── Expandable tab bar ─────────────────────────────────────────────────────
  expandBarOuter: {
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 18,
  },
  expandBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderTopWidth: 1,
    borderRadius: 0,
    paddingVertical: 10,
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 4,
  },
  expandTabBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandTabPill: {
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 12,
    gap: 6,
  },
  expandTabBg: {
    borderRadius: 22,
  },
  expandTabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandTabLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
    flexShrink: 1,
  },

});
