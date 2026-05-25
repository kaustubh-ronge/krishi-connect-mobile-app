import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSignUp, useOAuth } from '@clerk/clerk-expo';
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

export default function SignUpScreen() {
  useWarmUpBrowser();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSignUpPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');
    
    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'An error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  const onSelectGoogleAuth = async () => {
    setLoading(true);
    setError('');
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/onboarding', { scheme: 'krishiconnect' }),
      });

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        router.replace('/onboarding');
      } else {
        // If further steps are required, like choosing a role, redirect there
        // (Usually handled via onboarding)
      }
    } catch (err: any) {
      console.error('OAuth error', err);
      setError('Google Sign-Up failed or was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError('');

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        // After signup, user must pick a role
        router.replace('/onboarding');
      } else {
        setError('Verification incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'Verification failed.');
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
              <Text className="text-base text-gray-500 text-center px-4">Create an account to join the marketplace.</Text>
            </MotiView>

            {error ? (
              <MotiView from={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50 p-4 rounded-2xl mb-6 border border-red-100">
                <Text className="text-red-600 text-center font-medium">{error}</Text>
              </MotiView>
            ) : null}

            {!pendingVerification && (
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
                  onPress={onSignUpPress} 
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-lg font-bold tracking-wide">Sign Up</Text>
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
                  <Text className="text-gray-500 text-base">Already have an account? </Text>
                  <TouchableOpacity onPress={() => router.push('/sign-in')}>
                    <Text className="text-primary text-base font-bold">Sign In</Text>
                  </TouchableOpacity>
                </View>
              </MotiView>
            )}

            {pendingVerification && (
              <MotiView
                from={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full"
              >
                <Text className="text-sm font-semibold text-gray-700 mb-1 ml-1">Verification Code</Text>
                <Text className="text-xs text-gray-500 mb-4 ml-1">A code was sent to {emailAddress}</Text>
                <TextInput
                  value={code}
                  placeholder="123456"
                  onChangeText={setCode}
                  className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 text-base text-gray-800 text-center tracking-[8px] font-bold shadow-sm"
                  keyboardType="number-pad"
                  placeholderTextColor="#d1d5db"
                />

                <TouchableOpacity 
                  className={`bg-primary p-4 rounded-2xl items-center shadow-md ${loading ? 'opacity-70' : 'opacity-100'}`}
                  onPress={onPressVerify} 
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-lg font-bold tracking-wide">Verify Email</Text>
                  )}
                </TouchableOpacity>
              </MotiView>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}
