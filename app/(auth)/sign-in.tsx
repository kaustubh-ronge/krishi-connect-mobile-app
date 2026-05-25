import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      void WebBrowser.warmUpAsync();
    }
    return () => {
      if (Platform.OS !== 'web') {
        void WebBrowser.coolDownAsync();
      }
    };
  }, []);
};

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

export default function SignInScreen() {
  useWarmUpBrowser();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSignInPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');
    
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId });
        router.replace('/(tabs)');
      } else {
        setError('Sign in requires further steps. Please verify your email or phone.');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'An error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  const onSelectGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/(tabs)', { scheme: 'krishiconnect' }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/(tabs)');
      } else {
        // If further steps are required, like choosing a role, redirect there
        // (Usually handled via onboarding)
      }
    } catch (err: any) {
      console.error('OAuth error', err);
      setError('Google Sign-In failed or was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <LinearGradient
        colors={['#f0fdf4', '#ffffff']}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          className="flex-1"
        >
          <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
            <MotiView
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 800 }}
              className="items-center mb-10 mt-8"
            >
              <Text className="text-4xl font-extrabold text-primary-dark mb-2 tracking-tight">KrishiConnect</Text>
              <Text className="text-base text-gray-500 text-center px-4">Welcome back! Please sign in to continue.</Text>
            </MotiView>

            {error ? (
              <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 p-4 rounded-2xl mb-6 border border-red-100">
                <Text className="text-red-600 text-center font-medium">{error}</Text>
              </MotiView>
            ) : null}

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 800, delay: 150 }}
              className="w-full"
            >
              <Text className="text-sm font-semibold text-gray-700 mb-2 ml-1">Email Address</Text>
              <TextInput
                autoCapitalize="none"
                value={emailAddress}
                placeholder="farmer@example.com"
                onChangeText={setEmailAddress}
                className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 text-base text-gray-800 shadow-sm"
                keyboardType="email-address"
                placeholderTextColor="#9ca3af"
              />

              <Text className="text-sm font-semibold text-gray-700 mb-2 ml-1">Password</Text>
              <TextInput
                value={password}
                placeholder="********"
                secureTextEntry
                onChangeText={setPassword}
                className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 text-base text-gray-800 shadow-sm"
                placeholderTextColor="#9ca3af"
              />

              <TouchableOpacity 
                className={`bg-primary p-4 rounded-2xl items-center shadow-md ${loading ? 'opacity-70' : 'opacity-100'}`}
                onPress={onSignInPress} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-lg font-bold tracking-wide">Sign In</Text>
                )}
              </TouchableOpacity>

              <View className="flex-row items-center my-8">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="px-4 text-gray-400 font-medium text-sm">OR</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>

              <TouchableOpacity 
                className={`bg-white border border-gray-200 p-4 rounded-2xl flex-row justify-center items-center shadow-sm ${loading ? 'opacity-70' : 'opacity-100'}`}
                onPress={onSelectGoogleAuth}
                disabled={loading}
              >
                <Text className="text-gray-700 text-base font-semibold">Continue with Google</Text>
              </TouchableOpacity>

              <View className="flex-row justify-center mt-10">
                <Text className="text-gray-500 text-base">Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/sign-up')}>
                  <Text className="text-primary text-base font-bold">Sign Up</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
