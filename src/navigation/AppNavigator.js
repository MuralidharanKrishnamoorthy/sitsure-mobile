import React, {useContext, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Image, Pressable} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence,
  withTiming, withSpring, Easing, FadeInDown, SlideInLeft, ZoomIn, FadeInUp,
  interpolateColor, useDerivedValue,
} from 'react-native-reanimated';
import Loader from '../components/Loader';
import Svg, {Path, Circle, Rect, G, Polyline, Line} from 'react-native-svg';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createDrawerNavigator, DrawerContentScrollView} from '@react-navigation/drawer';
import {UserContext} from '../context/UserContext';
import {useTheme} from '../context/ThemeContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import FunsightsScreen from '../screens/FunsightsScreen';
import AllBookingsScreen from '../screens/admin/AllBookingsScreen';
import SeatManagementScreen from '../screens/admin/SeatManagementScreen';
import FloorManagementScreen from '../screens/admin/FloorManagementScreen';
import AnchorDaysScreen from '../screens/admin/AnchorDaysScreen';
import EmployeeGroupsScreen from '../screens/admin/EmployeeGroupsScreen';
import {COLORS} from '../theme/colors';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// ─────────────────────────────────────────────────────────────────────────────
// TAB ICONS
// ─────────────────────────────────────────────────────────────────────────────

function HomeIcon({color, size, focused}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {focused ? (
        <G>
          <Path d="M14 3L2 13.5H5V24C5 24.55 5.45 25 6 25H11V18H17V25H22C22.55 25 23 24.55 23 24V13.5H26L14 3Z" fill={color} />
          <Rect x="11" y="18" width="6" height="7" rx="1" fill="white" opacity={0.22} />
        </G>
      ) : (
        <G>
          <Path d="M14 4L3 13.5H6V23.5C6 24.05 6.45 24.5 7 24.5H11.5V18H16.5V24.5H21C21.55 24.5 22 24.05 22 23.5V13.5H25L14 4Z"
            stroke={color} strokeWidth={1.7} strokeLinejoin="round" strokeLinecap="round" />
          <Rect x="11.5" y="18" width="5" height="6.5" rx="0.8" stroke={color} strokeWidth={1.2} />
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

function TabIcon({name, color, size, focused}) {
  if (name === 'Home') return <HomeIcon color={color} size={size} focused={focused} />;
  if (name === 'History') return <HistoryIcon color={color} size={size} focused={focused} />;
  if (name === 'Funsights') return <FunsightsIcon color={color} size={size} focused={focused} />;
  return null;
}

function MainTabs() {
  const {t} = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: t.tabInactive,
        tabBarStyle: {
          backgroundColor: t.tabBar,
          borderTopColor: t.tabBarBorder,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: {width: 0, height: -6},
          shadowOpacity: t.dark ? 0.5 : 0.09,
          shadowRadius: 20,
        },
        tabBarLabelStyle: {fontSize: 11, fontWeight: '700', letterSpacing: 0.25},
        tabBarIcon: ({color, size, focused}) => (
          <TabIcon name={route.name} color={color} size={size + 2} focused={focused} />
        ),
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Funsights" component={FunsightsScreen} />
    </Tab.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DRAWER ICONS — admin nav
// ─────────────────────────────────────────────────────────────────────────────

function IconAllBookings({color, size = 22}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="2.5" stroke={color} strokeWidth={1.7} />
      <Path d="M8 2V6M16 2V6M3 9H21" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M8 13L11 16L16 11" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconSeatMgmt({color, size = 22}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.7} />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.7} />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.7} />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

function IconFloorMgmt({color, size = 22}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 20H21" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M5 20V14H19V20" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M7 14V9H17V14" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 9V5H15V9" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function IconAnchorDays({color, size = 22}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="17" rx="2.5" stroke={color} strokeWidth={1.7} />
      <Path d="M8 2V6M16 2V6M3 9H21" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Circle cx="12" cy="15" r="2.5" stroke={color} strokeWidth={1.6} />
      <Path d="M12 17.5V20M10 20H14" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function IconEmpGroups({color, size = 22}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="7" r="3" stroke={color} strokeWidth={1.7} />
      <Path d="M3 21V19C3 16.79 5.24 15 8 15" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Circle cx="16" cy="9" r="2.5" stroke={color} strokeWidth={1.6} />
      <Path d="M21 21V19.5C21 17.57 19.21 16 17 16H15" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
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
// ANIMATED NAV ITEM
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_ROUTES = [
  {name: 'AllBookings',     label: 'All Bookings',     Icon: IconAllBookings},
  {name: 'SeatManagement',  label: 'Seat Management',  Icon: IconSeatMgmt},
  {name: 'FloorManagement', label: 'Floor Management', Icon: IconFloorMgmt},
  {name: 'AnchorDays',      label: 'Anchor Days',      Icon: IconAnchorDays},
  {name: 'EmployeeGroups',  label: 'Employee Groups',  Icon: IconEmpGroups},
];

function DrawerNavItem({route, index, isActive, onPress, t}) {
  const scale = useSharedValue(1);
  const barWidth = useSharedValue(isActive ? 4 : 0);
  const bgOpacity = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    barWidth.value = withSpring(isActive ? 4 : 0, {damping: 14, stiffness: 120});
    bgOpacity.value = withTiming(isActive ? 1 : 0, {duration: 220});
  }, [isActive]);

  const pressIn = () => { scale.value = withSpring(0.96, {damping: 12}); };
  const pressOut = () => { scale.value = withSpring(1, {damping: 12}); };

  const scaleStyle = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));
  const barStyle  = useAnimatedStyle(() => ({width: barWidth.value}));
  const bgStyle   = useAnimatedStyle(() => ({opacity: bgOpacity.value}));

  const iconColor = isActive ? COLORS.primary : t.textSub;
  const labelColor = isActive ? COLORS.primary : t.text;

  return (
    <Animated.View entering={SlideInLeft.delay(index * 55).duration(380).springify().damping(16)}>
      <Animated.View style={scaleStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={styles.navItem}>
        {/* Active bg fill */}
        <Animated.View style={[styles.navItemBg, {backgroundColor: COLORS.primaryMuted}, bgStyle]} />
        {/* Left accent bar */}
        <Animated.View style={[styles.navItemBar, {backgroundColor: COLORS.primary}, barStyle]} />
        {/* Icon */}
        <View style={styles.navItemIcon}>
          <route.Icon color={iconColor} size={21} />
        </View>
        {/* Label */}
        <Text style={[styles.navItemLabel, {color: labelColor, fontWeight: isActive ? '700' : '500'}]}>
          {route.label}
        </Text>
      </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED THEME PILL
// ─────────────────────────────────────────────────────────────────────────────

function AnimatedThemeToggle({darkMode, toggleTheme, t}) {
  const dotX = useSharedValue(darkMode ? 18 : 2);
  const iconRotate = useSharedValue(darkMode ? 180 : 0);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    dotX.value = withSpring(darkMode ? 18 : 2, {damping: 14, stiffness: 130});
    iconRotate.value = withTiming(darkMode ? 180 : 0, {duration: 350, easing: Easing.inOut(Easing.cubic)});
  }, [darkMode]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{translateX: dotX.value}],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{rotate: `${iconRotate.value}deg`}],
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{scale: pressScale.value}],
  }));

  const handlePress = () => {
    pressScale.value = withSequence(
      withSpring(0.94, {damping: 10}),
      withSpring(1, {damping: 12}),
    );
    toggleTheme();
  };

  return (
    <Animated.View entering={FadeInUp.delay(320).duration(400)}>
      <Animated.View style={[styles.themeRow, {borderColor: t.cardBorder, backgroundColor: t.surface}, btnStyle]}>
      <Pressable onPress={handlePress} style={styles.themeRowInner}>
        <View style={[styles.themeIconBox, {backgroundColor: t.card}]}>
          <Animated.View style={iconStyle}>
            {darkMode
              ? <SunIcon color={COLORS.primary} size={17} />
              : <MoonIcon color={COLORS.primary} size={17} />}
          </Animated.View>
        </View>
        <Text style={[styles.themeLabel, {color: t.text}]}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </Text>
        {/* Animated pill */}
        <View style={[styles.themePill, {backgroundColor: darkMode ? COLORS.primaryMuted : t.chipBg}]}>
          <Animated.View style={[styles.themeDot, {backgroundColor: COLORS.primary}, dotStyle]} />
        </View>
      </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED ONLINE DOT
// ─────────────────────────────────────────────────────────────────────────────

function PulsingDot({borderColor}) {
  const scale = useSharedValue(1);
  const ringOpacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, {duration: 800, easing: Easing.inOut(Easing.sin)}),
        withTiming(1,   {duration: 800}),
      ),
      -1, false,
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0, {duration: 800}),
        withTiming(1, {duration: 800}),
      ),
      -1, false,
    );
  }, []);

  const dotStyle  = useAnimatedStyle(() => ({transform: [{scale: scale.value}]}));
  const ringStyle = useAnimatedStyle(() => ({opacity: ringOpacity.value}));

  return (
    <View style={[styles.onlineDotWrap, {borderColor}]}>
      <Animated.View style={[styles.onlineDotRing, ringStyle]} />
      <Animated.View style={[styles.onlineDot, dotStyle]} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM DRAWER CONTENT
// ─────────────────────────────────────────────────────────────────────────────

function CustomDrawerContent(props) {
  const {employee, logout, isAdmin} = useContext(UserContext);
  const {darkMode, toggleTheme, t} = useTheme();

  // Active route = current drawer screen name
  const activeRouteName = props.state?.routes?.[props.state.index]?.name ?? '';

  return (
    <DrawerContentScrollView
      {...props}
      style={{backgroundColor: t.drawerBg}}
      contentContainerStyle={{paddingBottom: 32}}
      showsVerticalScrollIndicator={false}>

      {/* ── Profile section ──────────────────────────────────────────────────── */}
      <View style={[styles.profileSection, {borderBottomColor: t.divider}]}>
        <Animated.View entering={ZoomIn.delay(60).duration(400)} style={styles.profileAvatarWrap}>
          {employee?.profilePic ? (
            <Image source={{uri: employee.profilePic}} style={styles.profileImg} />
          ) : (
            <View style={[styles.profileAvatarFallback, {backgroundColor: COLORS.primaryMuted, borderColor: COLORS.primaryGlow}]}>
              <Text style={[styles.profileInitial, {color: t.drawerActiveText}]}>
                {employee?.name ? employee.name[0].toUpperCase() : '?'}
              </Text>
            </View>
          )}
          <PulsingDot borderColor={t.drawerBg} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(380)} style={styles.profileInfo}>
          <Text style={[styles.profileName, {color: t.text}]} numberOfLines={1}>
            {employee?.name}
          </Text>
          <Text style={[styles.profileEmail, {color: t.textSub}]} numberOfLines={1}>
            {employee?.email}
          </Text>
          {employee?.empid && (
            <View style={[styles.empIdBadge, {backgroundColor: t.badgeBg}]}>
              <Text style={[styles.empIdText, {color: t.badgeText}]}>ID {employee.empid}</Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* ── Section label ────────────────────────────────────────────────────── */}
      {isAdmin && (
        <Animated.View entering={FadeInDown.delay(180).duration(300)}>
          <Text style={[styles.sectionLabel, {color: t.textTertiary}]}>ADMIN</Text>
        </Animated.View>
      )}

      {/* ── Admin nav items ───────────────────────────────────────────────────── */}
      {isAdmin && ADMIN_ROUTES.map((route, index) => (
        <DrawerNavItem
          key={route.name}
          route={route}
          index={index}
          isActive={activeRouteName === route.name}
          t={t}
          onPress={() => props.navigation.navigate(route.name)}
        />
      ))}


      {/* ── Divider ───────────────────────────────────────────────────────────── */}
      <View style={[styles.divider, {backgroundColor: t.divider}]} />

      {/* ── Theme toggle ──────────────────────────────────────────────────────── */}
      <AnimatedThemeToggle darkMode={darkMode} toggleTheme={toggleTheme} t={t} />

      {/* ── Logout ────────────────────────────────────────────────────────────── */}
      <Animated.View entering={FadeInUp.delay(420).duration(380)}>
        <TouchableOpacity
          style={[styles.logoutBtn, {borderColor: 'rgba(239,83,80,0.20)', backgroundColor: 'rgba(239,83,80,0.07)'}]}
          onPress={logout}
          activeOpacity={0.8}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </Animated.View>
    </DrawerContentScrollView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DRAWER
// ─────────────────────────────────────────────────────────────────────────────

function AdminDrawer() {
  const {isAdmin} = useContext(UserContext);
  const {t} = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {fontWeight: '800', fontSize: 17, letterSpacing: -0.3},
        drawerActiveTintColor: t.drawerActiveText,
        drawerActiveBackgroundColor: t.drawerActiveBg,
        drawerInactiveTintColor: t.textSub,
        drawerStyle: {backgroundColor: t.drawerBg},
      }}>
      {/* MainTabs — hidden from drawer (bottom tabs handle Home/History/Funsights) */}
      <Drawer.Screen
        name="MainTabs"
        component={MainTabs}
        options={{
          title: 'SitSure',
          drawerItemStyle: {display: 'none'},
        }}
      />
      {isAdmin && (
        <>
          <Drawer.Screen name="AllBookings"     component={AllBookingsScreen}     options={{title: 'All Bookings'}} />
          <Drawer.Screen name="SeatManagement"  component={SeatManagementScreen}  options={{title: 'Seat Management'}} />
          <Drawer.Screen name="FloorManagement" component={FloorManagementScreen} options={{title: 'Floor Management'}} />
          <Drawer.Screen name="AnchorDays"      component={AnchorDaysScreen}      options={{title: 'Anchor Days'}} />
          <Drawer.Screen name="EmployeeGroups"  component={EmployeeGroupsScreen}  options={{title: 'Employee Groups'}} />
        </>
      )}
    </Drawer.Navigator>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SPLASH
// ─────────────────────────────────────────────────────────────────────────────

function SplashScreen() {
  const pulse = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, {duration: 600, easing: Easing.out(Easing.cubic)});
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.12, {duration: 900, easing: Easing.inOut(Easing.sin)}),
        withTiming(1,    {duration: 900, easing: Easing.inOut(Easing.sin)}),
      ),
      -1, false,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({transform: [{scale: pulse.value}]}));
  const fadeStyle  = useAnimatedStyle(() => ({opacity: opacity.value}));

  return (
    <Animated.View style={[styles.splash, fadeStyle]}>
      <Animated.View style={[styles.splashGlow, pulseStyle]} />
      <Svg width={52} height={52} viewBox="0 0 36 36" fill="none">
        <Rect width="36" height="36" rx="10" fill={COLORS.primary} />
        <Path d="M10 26L18 10L26 26" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M13 21H23" stroke="#fff" strokeWidth={2.2} strokeLinecap="round" />
      </Svg>
      <Text style={styles.splashText}>SitSure</Text>
      <Text style={styles.splashSub}>WORKSPACE BOOKING</Text>
      <View style={styles.splashLoaderWrap}>
        <Loader color={COLORS.primary} size={22} />
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
          : <Stack.Screen name="App"   component={AdminDrawer} />
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
  splash: {flex: 1, backgroundColor: COLORS.bgDark, justifyContent: 'center', alignItems: 'center', gap: 12},
  splashGlow: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    backgroundColor: COLORS.primary, opacity: 0.15,
    shadowColor: COLORS.primary, shadowOffset: {width: 0, height: 0}, shadowOpacity: 1, shadowRadius: 80,
  },
  splashText: {color: '#FFFFFF', fontSize: 38, fontWeight: '900', letterSpacing: -1.5, marginTop: 6},
  splashSub: {color: COLORS.textSecondaryDark, fontSize: 10, fontWeight: '600', letterSpacing: 3.5},
  splashLoaderWrap: {marginTop: 36},

  // ── Drawer top strip ───────────────────────────────────────────────────────
  topStrip: {
    height: 6, width: '100%', marginBottom: 0,
  },
  topStripOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // ── Profile ────────────────────────────────────────────────────────────────
  profileSection: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 22,
    borderBottomWidth: 1, marginBottom: 6,
  },
  profileAvatarWrap: {marginRight: 14, position: 'relative'},
  profileImg: {width: 52, height: 52, borderRadius: 26},
  profileAvatarFallback: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
  },
  profileInitial: {fontWeight: '800', fontSize: 21},

  // Pulsing online dot
  onlineDotWrap: {
    position: 'absolute', bottom: 0, right: 0,
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, backgroundColor: '#4caf50',
    justifyContent: 'center', alignItems: 'center',
    overflow: 'visible',
  },
  onlineDotRing: {
    position: 'absolute',
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#4caf50', opacity: 0.3,
  },
  onlineDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#4caf50',
  },

  profileInfo: {flex: 1, minWidth: 0},
  profileName: {fontWeight: '800', fontSize: 15, letterSpacing: -0.3, marginBottom: 2},
  profileEmail: {fontSize: 12, marginBottom: 6},
  empIdBadge: {alignSelf: 'flex-start', borderRadius: 6, paddingVertical: 2, paddingHorizontal: 8},
  empIdText: {fontSize: 11, fontWeight: '700', letterSpacing: 0.4},

  // ── Section label ──────────────────────────────────────────────────────────
  sectionLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.8,
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6,
  },

  // ── Nav items ──────────────────────────────────────────────────────────────
  navItem: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 10, marginVertical: 2,
    borderRadius: 12, overflow: 'hidden',
    minHeight: 48, paddingRight: 12,
    position: 'relative',
  },
  navItemBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  navItemBar: {
    position: 'absolute', left: 0, top: 8, bottom: 8,
    borderRadius: 2,
  },
  navItemIcon: {
    width: 44, height: 48, alignItems: 'center', justifyContent: 'center',
    paddingLeft: 10,
  },
  navItemLabel: {flex: 1, fontSize: 14, letterSpacing: 0.1},

  // ── No admin msg ───────────────────────────────────────────────────────────
  noAdminMsg: {
    margin: 16, borderRadius: 12, padding: 14,
  },
  noAdminText: {fontSize: 13, textAlign: 'center'},

  // ── Divider ────────────────────────────────────────────────────────────────
  divider: {height: 1, marginHorizontal: 16, marginVertical: 12},

  // ── Theme toggle ───────────────────────────────────────────────────────────
  themeRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 12, marginBottom: 4,
    borderRadius: 14, borderWidth: 1,
  },
  themeRowInner: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
  },
  themeIconBox: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  themeLabel: {flex: 1, fontSize: 14, fontWeight: '600'},
  themePill: {
    width: 40, height: 22, borderRadius: 11,
    justifyContent: 'center', paddingHorizontal: 2, overflow: 'hidden',
  },
  themeDot: {width: 18, height: 18, borderRadius: 9, position: 'absolute'},

  // ── Logout ─────────────────────────────────────────────────────────────────
  logoutBtn: {
    margin: 16, marginTop: 8, borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1,
  },
  logoutText: {color: '#ef5350', fontWeight: '700', fontSize: 14},
});
