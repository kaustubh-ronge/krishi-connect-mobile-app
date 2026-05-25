import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
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

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  APPROVED: { bg: '#dcfce7', text: '#15803d' },
  PENDING: { bg: '#fef9c3', text: '#a16207' },
  REJECTED: { bg: '#fee2e2', text: '#b91c1c' },
};

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const api = useApiClient();
  const { profile, role, loading, fetchProfile } = useUserStore();
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
      try {
        await signOut();
      } catch (e) {
        console.error('SignOut error', e);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to sign out?')) {
        await doSignOut();
      }
      return;
    }

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: doSignOut,
        },
      ]
    );
  };

  const displayName = profile?.name || user?.fullName || 'User';
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const phone = profile?.phone || '';
  const address = profile?.address || '';
  const sellingStatus = profile?.sellingStatus || profile?.approvalStatus;

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => router.push('/edit-profile')} style={styles.editHeaderBtn}>
          <Edit3 size={20} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{displayName[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{ROLE_LABELS[role] || role || 'User'}</Text>
          </View>
          {sellingStatus && STATUS_COLORS[sellingStatus] && (
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[sellingStatus].bg }]}>
              <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[sellingStatus].text }]}>
                {sellingStatus === 'PENDING' ? '⏳ Approval Pending' :
                 sellingStatus === 'APPROVED' ? '✅ Approved Seller' :
                 '❌ Application Rejected'}
              </Text>
            </View>
          )}
        </View>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Account Information</Text>

          <View style={styles.infoRow}>
            <Mail color={Colors.light.icon} size={16} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{email || 'Not set'}</Text>
            </View>
          </View>

          {phone ? (
            <View style={styles.infoRow}>
              <Phone color={Colors.light.icon} size={16} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{phone}</Text>
              </View>
            </View>
          ) : null}

          {address ? (
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <MapPin color={Colors.light.icon} size={16} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Address</Text>
                <Text style={styles.infoValue}>{address}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Menu */}
        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/edit-profile')}>
            <Edit3 color={Colors.light.icon} size={20} />
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <ChevronRight color={Colors.light.icon} size={18} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/orders')}>
            <ShoppingBag color={Colors.light.icon} size={20} />
            <Text style={styles.menuItemText}>My Orders</Text>
            <ChevronRight color={Colors.light.icon} size={18} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleSignOut}>
            <LogOut color={Colors.light.error} size={20} />
            <Text style={[styles.menuItemText, { color: Colors.light.error }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.light.text },
  editHeaderBtn: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
  displayName: { fontSize: 22, fontWeight: 'bold', color: Colors.light.text, marginBottom: 8 },
  roleBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleBadgeText: { fontSize: 13, fontWeight: 'bold', color: Colors.light.primaryDark },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  statusBadgeText: { fontSize: 13, fontWeight: '600' },
  infoCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  infoCardTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.light.icon, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, color: Colors.light.icon, marginBottom: 2 },
  infoValue: { fontSize: 15, color: Colors.light.text, fontWeight: '500' },
  menuList: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 12,
  },
  menuItemText: { fontSize: 15, color: Colors.light.text, flex: 1 },
});
