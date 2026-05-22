import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { UserContext } from '../context/UserContext';
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

function HomeIcon({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 12L12 3L21 12V21H15V15H9V21H3V12Z" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

function HistoryIcon({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={2} />
      <Path d="M12 7V12L15 15" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FunsightsIcon({ color, size }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}

function TabIcon({ name, color, size }) {
  if (name === 'Home') return <HomeIcon color={color} size={size} />;
  if (name === 'History') return <HistoryIcon color={color} size={size} />;
  if (name === 'Funsights') return <FunsightsIcon color={color} size={size} />;
  return null;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#eee' },
        tabBarIcon: ({ color, size }) => <TabIcon name={route.name} color={color} size={size} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Funsights" component={FunsightsScreen} />
    </Tab.Navigator>
  );
}

function CustomDrawerContent(props) {
  const { employee, logout } = useContext(UserContext);
  return (
    <DrawerContentScrollView {...props}>
      {/* Profile section */}
      <View style={styles.profileSection}>
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
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

function AdminDrawer() {
  const { isAdmin } = useContext(UserContext);
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.primary },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        drawerActiveTintColor: COLORS.primary,
        drawerActiveBackgroundColor: '#fff6f0',
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
  splash: { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  splashText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  profileSection: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: COLORS.primary, marginBottom: 8,
  },
  profileAvatar: { marginRight: 12 },
  profileImg: { width: 44, height: 44, borderRadius: 22 },
  profileAvatarFallback: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center',
  },
  profileInitial: { color: '#fff', fontWeight: '700', fontSize: 18 },
  profileInfo: { flex: 1 },
  profileName: { color: '#fff', fontWeight: '700', fontSize: 15 },
  profileEmail: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
  profileEmpId: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 },
  logoutBtn: {
    margin: 16, backgroundColor: '#ffebee', borderRadius: 6,
    padding: 12, alignItems: 'center',
  },
  logoutText: { color: '#d32f2f', fontWeight: '700' },
});
