import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useApiClient } from '@/services/api';
import { Tractor, Briefcase, Truck, ChevronRight, Leaf } from 'lucide-react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserStore } from '@/store/userStore';

const { width } = Dimensions.get('window');

const ROLES = [
  {
    id: 'farmer',
    title: 'Farmer',
    description: 'Sell your produce directly\nto buyers across India',
    icon: Tractor,
    emoji: '🌾',
    gradient: ['#15803d', '#16a34a'] as const,
    lightBg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    id: 'agent',
    title: 'Agent / Buyer',
    description: 'Buy wholesale produce &\nmanage large-scale trades',
    icon: Briefcase,
    emoji: '🏢',
    gradient: ['#1d4ed8', '#3b82f6'] as const,
    lightBg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    id: 'delivery',
    title: 'Delivery Partner',
    description: 'Fulfill delivery jobs &\nearn money on every trip',
    icon: Truck,
    emoji: '🚚',
    gradient: ['#b45309', '#f59e0b'] as const,
    lightBg: '#fffbeb',
    border: '#fde68a',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const api = useApiClient();
  const { fetchProfile } = useUserStore();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onContinue = async () => {
    if (!selectedRole) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.post('mobile/v1/auth/role', { role: selectedRole });
      if (response.success) {
        await fetchProfile(api);
        router.replace('/edit-profile?onboarding=true');
      } else {
        setError(response.error || 'Failed to assign role');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving your role.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleData = ROLES.find((r) => r.id === selectedRole);

  return (
    <View style={styles.root}>
      {/* Gradient background */}
      <LinearGradient
        colors={['#0f172a', '#134e2a', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative circles */}
      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero section */}
          <MotiView
            from={{ opacity: 0, translateY: -30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 120 }}
            style={styles.hero}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#16a34a', '#22c55e']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Leaf color="#fff" size={32} />
              </LinearGradient>
            </View>
            <Text style={styles.heroTitle}>KrishiConnect</Text>
            <Text style={styles.heroSubtitle}>India's Agri Marketplace</Text>
          </MotiView>

          {/* Heading */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 200 }}
            style={styles.headingContainer}
          >
            <Text style={styles.heading}>Choose your role</Text>
            <Text style={styles.subheading}>
              This cannot be changed later.{'\n'}Select the role that best fits you.
            </Text>
          </MotiView>

          {/* Error */}
          {error ? (
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={styles.errorBox}
            >
              <Text style={styles.errorText}>{error}</Text>
            </MotiView>
          ) : null}

          {/* Role cards */}
          <View style={styles.roleList}>
            {ROLES.map((role, index) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.id;

              return (
                <MotiView
                  key={role.id}
                  from={{ opacity: 0, translateX: -30 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ type: 'spring', damping: 18, delay: 300 + index * 100 }}
                >
                  <TouchableOpacity
                    style={[
                      styles.roleCard,
                      isSelected && { borderColor: role.border, borderWidth: 2, backgroundColor: role.lightBg },
                      !isSelected && { borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1.5, backgroundColor: 'rgba(255,255,255,0.06)' },
                    ]}
                    onPress={() => setSelectedRole(role.id)}
                    activeOpacity={0.8}
                  >
                    {/* Icon */}
                    <LinearGradient
                      colors={isSelected ? role.gradient : ['#334155', '#475569']}
                      style={styles.roleIconGradient}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    >
                      <Text style={{ fontSize: 26 }}>{role.emoji}</Text>
                    </LinearGradient>

                    {/* Text */}
                    <View style={styles.roleTextContainer}>
                      <Text style={[styles.roleTitle, isSelected && { color: '#0f172a' }]}>
                        {role.title}
                      </Text>
                      <Text style={[styles.roleDesc, isSelected && { color: '#374151' }]}>
                        {role.description}
                      </Text>
                    </View>

                    {/* Selection indicator */}
                    <View style={[
                      styles.radioOuter,
                      isSelected && { borderColor: role.gradient[0] },
                    ]}>
                      {isSelected && (
                        <LinearGradient
                          colors={role.gradient}
                          style={styles.radioInner}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </View>

          {/* CTA */}
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 700 }}
            style={styles.ctaContainer}
          >
            <TouchableOpacity
              onPress={onContinue}
              disabled={!selectedRole || loading}
              activeOpacity={0.88}
            >
              {selectedRole && !loading ? (
                <LinearGradient
                  colors={selectedRoleData?.gradient || ['#16a34a', '#22c55e']}
                  style={styles.ctaButton}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.ctaButtonText}>Continue as {selectedRoleData?.title}</Text>
                  <ChevronRight color="#fff" size={20} />
                </LinearGradient>
              ) : (
                <View style={[styles.ctaButton, { backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center' }]}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.ctaButtonText, { color: 'rgba(255,255,255,0.4)' }]}>Select a role to continue</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              By continuing you agree to our Terms of Service
            </Text>
          </MotiView>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Decorative
  decorCircle1: {
    position: 'absolute', width: 320, height: 320, borderRadius: 160,
    backgroundColor: 'rgba(34, 197, 94, 0.07)',
    top: -80, right: -80,
  },
  decorCircle2: {
    position: 'absolute', width: 240, height: 240, borderRadius: 120,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    bottom: 100, left: -60,
  },

  scrollContent: { paddingHorizontal: 22, paddingBottom: 32, paddingTop: 16 },

  // Hero
  hero: { alignItems: 'center', marginBottom: 32, marginTop: 16 },
  logoContainer: { marginBottom: 12 },
  logoGradient: {
    width: 70, height: 70, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  heroTitle: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4, fontWeight: '500' },

  // Heading
  headingContainer: { marginBottom: 24 },
  heading: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4, marginBottom: 8 },
  subheading: { fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 21, fontWeight: '500' },

  // Error
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.12)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 14, padding: 14, marginBottom: 16,
  },
  errorText: { color: '#fca5a5', textAlign: 'center', fontWeight: '600', fontSize: 13 },

  // Role cards
  roleList: { gap: 12, marginBottom: 28 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, padding: 16, gap: 14,
  },
  roleIconGradient: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  roleTextContainer: { flex: 1 },
  roleTitle: { fontSize: 16, fontWeight: '800', color: '#f1f5f9', marginBottom: 3, letterSpacing: -0.2 },
  roleDesc: { fontSize: 12, color: 'rgba(241,245,249,0.55)', lineHeight: 18, fontWeight: '500' },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },

  // CTA
  ctaContainer: { gap: 14 },
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 18, paddingVertical: 17, paddingHorizontal: 28, gap: 8,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 8,
  },
  ctaButtonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
  disclaimer: { textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: '500' },
});
