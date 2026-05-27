import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView, StyleSheet,
} from 'react-native';
import { useSignIn, useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Leaf, Eye, EyeOff } from 'lucide-react-native';

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
  const [showPassword, setShowPassword] = useState(false);
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
      }
    } catch (err: any) {
      console.error('OAuth error', err);
      setError('Google Sign-In failed or was cancelled.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <LinearGradient
        colors={['#0f172a', '#134e2a', '#0f172a']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Decorative glow */}
      <View style={styles.decorCircle} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Logo Hero */}
            <MotiView
              from={{ opacity: 0, translateY: -30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 120 }}
              style={styles.hero}
            >
              <LinearGradient
                colors={['#16a34a', '#22c55e']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Leaf color="#fff" size={30} />
              </LinearGradient>
              <Text style={styles.appName}>KrishiConnect</Text>
              <Text style={styles.tagline}>Welcome back! Sign in to continue.</Text>
            </MotiView>

            {/* Card */}
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 16, delay: 150 }}
              style={styles.card}
            >
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Mail color="#94a3b8" size={17} style={styles.inputIcon} />
                <TextInput
                  autoCapitalize="none"
                  value={emailAddress}
                  placeholder="farmer@example.com"
                  onChangeText={setEmailAddress}
                  style={styles.input}
                  keyboardType="email-address"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock color="#94a3b8" size={17} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  onChangeText={setPassword}
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  {showPassword ? <EyeOff color="#94a3b8" size={17} /> : <Eye color="#94a3b8" size={17} />}
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity onPress={onSignInPress} disabled={loading} activeOpacity={0.88} style={{ marginTop: 8 }}>
                <LinearGradient
                  colors={loading ? ['#64748b', '#64748b'] : ['#15803d', '#16a34a']}
                  style={styles.primaryBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google */}
              <TouchableOpacity
                style={[styles.googleBtn, loading && { opacity: 0.6 }]}
                onPress={onSelectGoogleAuth}
                disabled={loading}
                activeOpacity={0.88}
              >
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Sign Up link */}
              <View style={styles.signUpRow}>
                <Text style={styles.signUpPrompt}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/sign-up')}>
                  <Text style={styles.signUpLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 },

  decorCircle: {
    position: 'absolute', width: 300, height: 300, borderRadius: 150,
    backgroundColor: 'rgba(34,197,94,0.07)', top: -60, right: -60,
  },

  // Hero
  hero: { alignItems: 'center', marginBottom: 32, marginTop: 24 },
  logoGradient: {
    width: 68, height: 68, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 10,
  },
  appName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 6 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '500', textAlign: 'center' },

  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24, padding: 22,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#fca5a5', textAlign: 'center', fontWeight: '600', fontSize: 13 },

  label: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: 8, marginTop: 16, letterSpacing: 0.5, textTransform: 'uppercase' },

  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14, color: '#f1f5f9', fontWeight: '500' },
  eyeBtn: { padding: 4 },

  primaryBtn: {
    borderRadius: 16, paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 22, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },

  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderRadius: 16, paddingVertical: 14, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  googleG: { fontSize: 17, fontWeight: '800', color: '#4285F4' },
  googleBtnText: { fontSize: 14, fontWeight: '700', color: '#1e293b' },

  signUpRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, alignItems: 'center' },
  signUpPrompt: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '500' },
  signUpLink: { fontSize: 13, fontWeight: '800', color: '#4ade80' },
});
