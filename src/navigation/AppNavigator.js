import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Loader from '../components/Loader';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { UserContext } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import FunsightsScreen from '../screens/FunsightsScreen';
import AllBookingsScreen from '../screens/admin/AllBookingsScreen';
import SeatManagementScreen from '../screens/admin/SeatManagementScreen';
import FloorManagementScreen from '../screens/admin/FloorManagementScreen';
import AnchorDaysScreen from '../screens/admin/AnchorDaysScreen';
import EmployeeGroupsScreen from '../screens/admin/EmployeeGroupsScreen';
import { COLORS } from '../theme/colors';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// ── iOS-premium SVG tab icons ─────────────────────────────────────────────────
// Active = filled solid. Inactive = clean outline. SF-Symbol-inspired detail.

function HomeIcon({ color, size, focused }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {focused ? (
        // Active — filled house with inner window detail
        <G>
          {/* Roof filled */}
          <Path
            d="M14 3L2 13.5H5V24C5 24.55 5.45 25 6 25H11V18H17V25H22C22.55 25 23 24.55 23 24V13.5H26L14 3Z"
            fill={color}
          />
          {/* Door cutout — visual detail */}
          <Rect x="11" y="18" width="6" height="7" rx="1" fill="white" opacity={0.25} />
          {/* Chimney */}
          <Rect x="18" y="6" width="3" height="5" rx="0.8" fill={color} opacity={0.7} />
        </G>
      ) : (
        // Inactive — outlined house
        <G>
          <Path
            d="M14 4L3 13.5H6V23.5C6 24.05 6.45 24.5 7 24.5H11.5V18H16.5V24.5H21C21.55 24.5 22 24.05 22 23.5V13.5H25L14 4Z"
            stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round"
          />
          {/* door */}
          <Rect x="11.5" y="18" width="5" height="6.5" rx="0.8" stroke={color} strokeWidth={1.2} />
        </G>
      )}
    </Svg>
  );
}

function HistoryIcon({ color, size, focused }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {focused ? (
        // Active — filled clock face
        <G>
          <Circle cx="14" cy="14" r="11" fill={color} />
          {/* clock hands white */}
          <Path d="M14 8V14.5L18 17.5" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {/* center dot */}
          <Circle cx="14" cy="14" r="1.2" fill="white" />
          {/* tick marks */}
          <Path d="M14 4.5V6.5" stroke="white" strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M14 21.5V23.5" stroke="white" strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M4.5 14H6.5" stroke="white" strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M21.5 14H23.5" stroke="white" strokeWidth={1.4} strokeLinecap="round" />
        </G>
      ) : (
        // Inactive — outlined clock
        <G>
          <Circle cx="14" cy="14" r="10" stroke={color} strokeWidth={1.6} />
          <Path d="M14 8.5V14L17.5 17" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          <Circle cx="14" cy="14" r="1" fill={color} />
          {/* subtle ticks */}
          <Path d="M14 5V7" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M14 21V23" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M5 14H7" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
          <Path d="M21 14H23" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
        </G>
      )}
    </Svg>
  );
}

function FunsightsIcon({ color, size, focused }) {
  // Bar chart / analytics icon — more fitting for "Funsights" data screen
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      {focused ? (
        // Active — filled bars with sparkle
        <G>
          {/* bars */}
          <Rect x="3" y="16" width="5" height="9" rx="1.5" fill={color} />
          <Rect x="11" y="10" width="5" height="15" rx="1.5" fill={color} />
          <Rect x="19" y="5" width="5" height="20" rx="1.5" fill={color} />
          {/* trend line */}
          <Path d="M5.5 15L13.5 9L21.5 4" stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.45} />
          {/* sparkle dot */}
          <Circle cx="21.5" cy="4" r="2" fill={color} />
        </G>
      ) : (
        // Inactive — outlined bars
        <G>
          <Rect x="3" y="16" width="5" height="9" rx="1.5" stroke={color} strokeWidth={1.5} />
          <Rect x="11" y="10" width="5" height="15" rx="1.5" stroke={color} strokeWidth={1.5} />
          <Rect x="19" y="5" width="5" height="20" rx="1.5" stroke={color} strokeWidth={1.5} />
          {/* trend line */}
          <Path d="M5.5 15.5L13.5 9.5L21.5 4.5" stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.5} />
        </G>
      )}
    </Svg>
  );
}

function TabIcon({ name, color, size, focused }) {
  if (name === 'Home') return <HomeIcon color={color} size={size} focused={focused} />;
  if (name === 'History') return <HistoryIcon color={color} size={size} focused={focused} />;
  if (name === 'Funsights') return <FunsightsIcon color={color} size={size} focused={focused} />;
  return null;
}

function MainTabs() {
  const { t } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: t.tabInactive,
        tabBarStyle: {
          backgroundColor: t.tabBar,
          borderTopColor: t.tabBarBorder,
          borderTopWidth: 1,
          height: 66,
          paddingBottom: 10,
          paddingTop: 6,
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: t.dark ? 0.45 : 0.08,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <TabIcon name={route.name} color={color} size={size + 2} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Funsights" component={FunsightsScreen} />
    </Tab.Navigator>
  );
}

function SunIcon({ size = 18, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={1.8} />
      <Path d="M12 2V4M12 20V22M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M2 12H4M20 12H22M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function MoonIcon({ size = 18, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
        stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CustomDrawerContent(props) {
  const { employee, logout } = useContext(UserContext);
  const { darkMode, toggleTheme, t } = useTheme();
  return (
    <DrawerContentScrollView {...props} style={{ backgroundColor: t.drawerBg }}>
      {/* Profile section */}
      <View style={[styles.profileSection, { borderBottomColor: t.divider }]}>
        <View style={styles.profileAvatar}>
          {employee?.profilePic ? (
            <Image source={{ uri: employee.profilePic }} style={styles.profileImg} />
          ) : (
            <View style={styles.profileAvatarFallback}>
              <Text style={styles.profileInitial}>
                {employee?.name ? employee.name[0].toUpperCase() : '?'}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{employee?.name}</Text>
          <Text style={styles.profileEmail}>{employee?.email}</Text>
          {employee?.empid && <Text style={styles.profileEmpId}>ID: {employee.empid}</Text>}
        </View>
      </View>

      <DrawerItemList {...props} />

      {/* Theme toggle row */}
      <TouchableOpacity
        style={[styles.themeToggleRow, { borderColor: t.cardBorder }]}
        onPress={toggleTheme}
        activeOpacity={0.7}
      >
        <View style={[styles.themeToggleIcon, { backgroundColor: darkMode ? '#1f2230' : '#fff6f0' }]}>
          {darkMode
            ? <SunIcon color={COLORS.primary} size={17} />
            : <MoonIcon color={COLORS.primary} size={17} />
          }
        </View>
        <Text style={[styles.themeToggleText, { color: t.text }]}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </Text>
        {/* pill indicator */}
        <View style={[styles.themeTogglePill, { backgroundColor: darkMode ? '#1f2230' : '#f5f5f5' }]}>
          <View style={[
            styles.themeToggleDot,
            { backgroundColor: COLORS.primary, alignSelf: darkMode ? 'flex-end' : 'flex-start' },
          ]} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

function AdminDrawer() {
  const { isAdmin } = useContext(UserContext);
  const { t } = useTheme();
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
          elevation: 0, shadowOpacity: 0,
          borderBottomWidth: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '800', fontSize: 17, letterSpacing: -0.2 },
        drawerActiveTintColor: t.drawerActiveText,
        drawerActiveBackgroundColor: t.drawerActiveBg,
        drawerInactiveTintColor: t.textSub,
        drawerStyle: { backgroundColor: t.drawerBg },
      }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} options={{ title: 'SitSure', drawerLabel: 'Home' }} />
      {isAdmin && (
        <>
          <Drawer.Screen name="AllBookings" component={AllBookingsScreen} options={{ title: 'All Bookings' }} />
          <Drawer.Screen name="SeatManagement" component={SeatManagementScreen} options={{ title: 'Seat Management' }} />
          <Drawer.Screen name="FloorManagement" component={FloorManagementScreen} options={{ title: 'Floor Management' }} />
          <Drawer.Screen name="AnchorDays" component={AnchorDaysScreen} options={{ title: 'Anchor Days' }} />
          <Drawer.Screen name="EmployeeGroups" component={EmployeeGroupsScreen} options={{ title: 'Employee Groups' }} />
        </>
      )}
    </Drawer.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashText}>SitSure</Text>
        <Text style={styles.splashSub}>Workspace Booking</Text>
        <Loader color={COLORS.primary} size={60} style={{ marginTop: 32 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="App" component={AdminDrawer} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1, backgroundColor: COLORS.bgDark,
    justifyContent: 'center', alignItems: 'center',
  },
  splashText: {
    color: COLORS.primary, fontSize: 42, fontWeight: '900',
    letterSpacing: -1.5,
  },
  splashSub: {
    color: COLORS.textSecondaryDark, fontSize: 13, fontWeight: '500',
    marginTop: 6, letterSpacing: 2, textTransform: 'uppercase',
  },

  // ── Drawer profile section ────────────────────────────────────────────────────
  profileSection: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 20,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 6,
  },
  profileAvatar: { marginRight: 14 },
  profileImg: { width: 48, height: 48, borderRadius: 24 },
  profileAvatarFallback: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.primaryMuted,
    borderWidth: 2, borderColor: COLORS.primaryGlow,
    justifyContent: 'center', alignItems: 'center',
  },
  profileInitial: { color: COLORS.primary, fontWeight: '800', fontSize: 20 },
  profileInfo: { flex: 1 },
  profileName: { color: COLORS.textPrimaryDark, fontWeight: '800', fontSize: 15, letterSpacing: -0.3 },
  profileEmail: { color: COLORS.textSecondaryDark, fontSize: 12, marginTop: 2 },
  profileEmpId: {
    color: COLORS.primary, fontSize: 11, marginTop: 3,
    fontWeight: '700', letterSpacing: 0.5,
  },

  // ── Theme toggle ──────────────────────────────────────────────────────────────
  themeToggleRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 12, marginTop: 8, marginBottom: 4,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1,
  },
  themeToggleIcon: {
    width: 34, height: 34, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  themeToggleText: { flex: 1, fontSize: 14, fontWeight: '600' },
  themeTogglePill: {
    width: 38, height: 22, borderRadius: 11,
    justifyContent: 'center', paddingHorizontal: 3,
  },
  themeToggleDot: { width: 16, height: 16, borderRadius: 8 },

  // ── Logout button ─────────────────────────────────────────────────────────────
  logoutBtn: {
    margin: 16, marginTop: 8,
    backgroundColor: 'rgba(239,83,80,0.10)',
    borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(239,83,80,0.25)',
  },
  logoutText: { color: '#ef5350', fontWeight: '700', fontSize: 14 },
});
