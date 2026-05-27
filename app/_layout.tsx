import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import 'react-native-reanimated';
import '../global.css';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useApiClient } from '@/services/api';
import { useUserStore } from '@/store/userStore';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in .env');
}

SplashScreen.preventAutoHideAsync();

const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      await SecureStore.deleteItemAsync(key);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Auth guard: DB role via profiles/me (source of truth), not only Clerk metadata
function AuthGuard() {
  const { isSignedIn, isLoaded } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const api = useApiClient();
  const { role, profile, fetchProfile, loading, initialized } = useUserStore();

  useEffect(() => {
    if (isSignedIn) {
      fetchProfile(api);
    }
  }, [isSignedIn, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    // Define explicitly protected routes
    const protectedSegments = [
      'checkout', 'orders', 'order-detail', 'create-listing', 
      'edit-listing', 'my-listings', 'manage-orders', 'sales'
    ];
    // Specific tabs that require full auth and profile
    const protectedTabs = ['dashboard', 'profile'];
    // Special case for cart: allow it to render, but internally it will prompt for login if !isSignedIn

    const rootSegment = segments[0] || '';
    const tabSegment = segments[1] || '';

    const inAuthGroup = rootSegment === '(auth)';
    const inOnboarding = rootSegment === 'onboarding';
    const inEditProfile = rootSegment === 'edit-profile';

    const isProtectedSegment = protectedSegments.includes(rootSegment);
    const isProtectedTab = rootSegment === '(tabs)' && protectedTabs.includes(tabSegment);

    const requiresAuth = isProtectedSegment || isProtectedTab;

    if (!isSignedIn) {
      if (requiresAuth) {
        router.replace('/(auth)/sign-in');
      }
      return;
    }

    if (isSignedIn && !initialized) return;

    if (isSignedIn) {
      const effectiveRole = role || 'none';

      // 1. If they already have a role, NEVER allow them on onboarding screen.
      if (effectiveRole !== 'none' && inOnboarding && !loading) {
        if (!profile) {
          router.replace('/edit-profile?onboarding=true');
        } else {
          router.replace('/(tabs)');
        }
        return;
      }

      // 2. If they are on a protected route, enforce onboarding flows
      if (requiresAuth) {
        if (effectiveRole === 'none' && !inOnboarding) {
          router.replace('/onboarding');
          return;
        }

        if (effectiveRole !== 'none' && !loading && !profile && !inEditProfile) {
          router.replace('/edit-profile?onboarding=true');
          return;
        }
      }
    }

    // Redirect away from auth screens if already signed in
    if (inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isSignedIn, isLoaded, segments, role, profile, loading, initialized]);

  return null;
}

function InitializationOverlay() {
  const { isSignedIn, isLoaded } = useAuth();
  const { initialized } = useUserStore();

  if (!isLoaded || (isSignedIn && !initialized)) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0f172a', zIndex: 99999, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={{ color: '#fff', marginTop: 16, fontWeight: '600', fontSize: 14 }}>Synchronizing profile...</Text>
      </View>
    );
  }
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey}>
      <ClerkLoaded>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthGuard />
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="checkout" options={{ headerShown: false }} />
            <Stack.Screen name="orders" options={{ headerShown: false }} />
            <Stack.Screen name="order-detail" options={{ headerShown: false }} />
            <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
            <Stack.Screen name="create-listing" options={{ headerShown: false }} />
            <Stack.Screen name="edit-listing" options={{ headerShown: false }} />
            <Stack.Screen name="my-listings" options={{ headerShown: false }} />
            <Stack.Screen name="manage-orders" options={{ headerShown: false }} />
            <Stack.Screen name="sales" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <InitializationOverlay />
          <StatusBar style="light" backgroundColor="transparent" translucent={true} />
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
