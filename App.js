import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppConfigProvider } from './src/AppConfigContext';
import { AuthProvider, useAuth } from './src/AuthContext';
import { LocationProvider } from './src/LocationContext';
import { CartProvider } from './src/CartContext';
import { colors } from './src/theme';
import { navigationRef } from './src/navigation';
import { listenForNotificationTaps, registerForPushNotifications } from './src/push';
import { Loader } from './src/components/ui';
import LoginScreen from './src/screens/LoginScreen';
import CompleteProfileScreen from './src/screens/CompleteProfileScreen';
import TermsScreen from './src/screens/TermsScreen';
import HomeScreen from './src/screens/HomeScreen';
import RestaurantScreen from './src/screens/RestaurantScreen';
import CartScreen from './src/screens/CartScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import OrderTrackingScreen from './src/screens/OrderTrackingScreen';
import AccountScreen from './src/screens/AccountScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import AddressesScreen from './src/screens/AddressesScreen';
import AddAddressScreen from './src/screens/AddAddressScreen';
import DeleteAccountScreen from './src/screens/DeleteAccountScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const navTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.bg, primary: colors.primaryDark } };

function Tabs() {
  const icons = { Home: 'fast-food', Orders: 'receipt', Account: 'person' };
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontWeight: '700' },
        tabBarIcon: ({ focused, size }) => (
          <Ionicons name={icons[route.name] + (focused ? '' : '-outline')} size={size} color={focused ? colors.primaryDark : colors.muted} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const { user, loading } = useAuth();

  // Register this phone for order updates and announcements once the customer is signed up
  useEffect(() => {
    if (user?.profile_completed) registerForPushNotifications();
  }, [user?.id, user?.profile_completed]);
  useEffect(() => listenForNotificationTaps(), []);

  if (loading) return <Loader />;

  return (
    <NavigationContainer theme={navTheme} ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerTintColor: colors.text, headerShadowVisible: false, headerTitleStyle: { fontWeight: '800' } }}>
        {!user ? (
          // 1. Mobile number + OTP (works for both new and existing customers)
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : !user.profile_completed ? (
          // 2. First login only: name, terms and location
          <>
            <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms & Conditions' }} />
          </>
        ) : (
          // 3. The app
          <>
            <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="Restaurant" component={RestaurantScreen} options={{ title: '' }} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Your cart' }} />
            <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: 'Track order' }} />
            <Stack.Screen name="Addresses" component={AddressesScreen}
              options={({ route }) => ({ title: route.params?.selectMode ? 'Choose delivery location' : 'Saved addresses' })} />
            <Stack.Screen name="AddAddress" component={AddAddressScreen} options={{ title: 'Add address' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit profile' }} />
            <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} options={{ title: 'Delete account' }} />
            <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms & Conditions' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppConfigProvider>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <StatusBar style="dark" />
              <Root />
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </AppConfigProvider>
    </SafeAreaProvider>
  );
}
