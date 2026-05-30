import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter, Redirect } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useApiClient } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { useCartStore } from '@/store/cartStore';
import {
  User as UserIcon, Mail, Phone, MapPin,
  ShoppingBag, Edit3, LogOut, ChevronRight,
} from 'lucide-react-native';

const ROLE_LABELS: Record<string, string> = {
  farmer: 'Farmer',
  agent: 'Agent',
  delivery: 'Delivery Partner',
  admin: 'Admin',
  none: 'New User',
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  APPROVED: { bg: '#dcfce7', text: '#15803d', label: '✅ Approved Seller' },
  PENDING: { bg: '#fef9c3', text: '#a16207', label: '⏳ Approval Pending' },
  REJECTED: { bg: '#fee2e2', text: '#b91c1c', label: '❌ Application Rejected' },
};

export default function ProfileScreen() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const api = useApiClient();
  const { profile, role, loading, initialized, fetchProfile } = useUserStore();
  const { clearLocalCart } = useCartStore();

  useFocusEffect(
    useCallback(() => {
      fetchProfile(api);
    }, [])
  );

  const handleSignOut = async () => {
    const doSignOut = async () => {
      clearLocalCart();
      useUserStore.getState().clearProfile();
      try { await signOut(); } catch (e) {}
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) await doSignOut();
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doSignOut },
    ]);
  };

  const displayName = profile?.name || user?.fullName || 'User';
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const phone = profile?.phone || '';
  const address = profile?.address || '';
  const sellingStatus = profile?.sellingStatus || profile?.approvalStatus;
  const statusConfig = sellingStatus ? STATUS_CONFIG[sellingStatus] : null;

  const needsProfile = isSignedIn && initialized && !profile && !loading;

  if (isLoaded && !isSignedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 }}>Profile</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 4, borderColor: '#dbeafe' }}>
            <UserIcon color="#3b82f6" size={40} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>Login Required</Text>
          <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 32, paddingHorizontal: 16 }}>Please log in to view your profile and manage your settings.</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#2563eb', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Login to Continue</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (needsProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 }}>Profile</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 4, borderColor: '#dcfce7' }}>
            <Edit3 color="#16a34a" size={40} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>Profile Required</Text>
          <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 32, paddingHorizontal: 16 }}>Please create your profile to access your account settings.</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#16a34a', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 }}
            onPress={() => router.push('/edit-profile?onboarding=true')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <LinearGradient
          colors={['#0f172a', '#134e2a', '#15803d']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.heroDecorCircle} />
          <TouchableOpacity
            style={styles.editIconBtn}
            onPress={() => router.push('/edit-profile')}
          >
            <Edit3 color="#fff" size={17} />
          </TouchableOpacity>

          {/* Avatar */}
          <View
            style={styles.avatarWrapper}
          >
            <LinearGradient
              colors={['#22c55e', '#16a34a']}
              style={styles.avatar}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>{displayName[0]?.toUpperCase() || 'U'}</Text>
            </LinearGradient>
          </View>

          <Text style={styles.heroName}>{displayName}</Text>
          <View style={styles.heroBadgeRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>{ROLE_LABELS[role] || role || 'User'}</Text>
            </View>
            {statusConfig && (
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Text style={styles.statusBadgeText}>{statusConfig.label}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Info Card */}
        <View
          style={styles.infoCard}
        >
          <Text style={styles.cardSectionLabel}>Account Information</Text>

          <View style={styles.infoRow}>
            <View style={[styles.infoIconBg, { backgroundColor: '#eff6ff' }]}>
              <Mail color="#3b82f6" size={17} />
            </View>
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email || 'Not set'}</Text>
            </View>
          </View>

          {phone ? (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <View style={[styles.infoIconBg, { backgroundColor: '#f0fdf4' }]}>
                  <Phone color="#16a34a" size={17} />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{phone}</Text>
                </View>
              </View>
            </>
          ) : null}

          {address ? (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <View style={[styles.infoIconBg, { backgroundColor: '#faf5ff' }]}>
                  <MapPin color="#8b5cf6" size={17} />
                </View>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{address}</Text>
                </View>
              </View>
            </>
          ) : null}
        </View>

        {/* Menu Card */}
        <View
          style={styles.menuCard}
        >
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/edit-profile')}>
            <View style={[styles.menuIconBg, { backgroundColor: '#f1f5f9' }]}>
              <Edit3 color="#475569" size={18} />
            </View>
            <Text style={styles.menuLabel}>Edit Profile</Text>
            <ChevronRight color="#cbd5e1" size={19} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/orders')}>
            <View style={[styles.menuIconBg, { backgroundColor: '#eff6ff' }]}>
              <ShoppingBag color="#3b82f6" size={18} />
            </View>
            <Text style={styles.menuLabel}>My Orders</Text>
            <ChevronRight color="#cbd5e1" size={19} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <View style={[styles.menuIconBg, { backgroundColor: '#fef2f2' }]}>
              <LogOut color="#ef4444" size={18} />
            </View>
            <Text style={[styles.menuLabel, { color: '#ef4444' }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 100 },

  // Hero Banner
  heroBanner: {
    paddingTop: 20, paddingBottom: 40, paddingHorizontal: 20,
    alignItems: 'center', position: 'relative',
  },
  heroDecorCircle: {
    position: 'absolute', width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(34,197,94,0.08)', top: -40, right: -40,
  },
  editIconBtn: {
    position: 'absolute', top: 16, right: 18,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarWrapper: { marginBottom: 14 },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  heroName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 10, letterSpacing: -0.4 },
  heroBadgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  roleBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Cards
  infoCard: {
    backgroundColor: '#fff', borderRadius: 22, marginHorizontal: 16,
    marginTop: -20, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
  },
  cardSectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#94a3b8',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  infoIconBg: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#1e293b', fontWeight: '600' },
  infoDivider: { height: 1, backgroundColor: '#f8fafc', marginVertical: 4 },

  menuCard: {
    backgroundColor: '#fff', borderRadius: 22, marginHorizontal: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    overflow: 'hidden',
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  menuIconBg: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  menuDivider: { height: 1, backgroundColor: '#f8fafc', marginLeft: 70 },
});
