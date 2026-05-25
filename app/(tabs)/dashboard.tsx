import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useApiClient } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { useCartStore } from '@/store/cartStore';
import {
  Package, Truck, Activity, User as UserIcon,
  Bell, LogOut, ChevronRight, ShoppingBag,
} from 'lucide-react-native';

const ROLE_LABELS: Record<string, string> = {
  farmer: '🌾 Farmer',
  agent: '🏢 Agent',
  delivery: '🚚 Delivery Partner',
  admin: '🛡️ Admin',
  none: 'New User',
};

const SELLING_STATUS_COLORS: Record<string, string> = {
  APPROVED: '#16a34a',
  PENDING: '#f59e0b',
  REJECTED: '#ef4444',
  NONE: '#6b7280',
};

export default function DashboardScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const api = useApiClient();
  const { profile, role, loading, fetchProfile } = useUserStore();
  const { clearLocalCart } = useCartStore();

  // Re-fetch profile every time dashboard is focused
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

  const sellingStatus = profile?.sellingStatus || profile?.approvalStatus || 'NONE';
  const displayName = profile?.name || user?.fullName || 'User';
  const displayRole = ROLE_LABELS[role] || role || 'User';

  const getQuickActions = () => {
    const common = [
      {
        id: 'orders',
        title: 'My Orders',
        subtitle: 'View all purchases',
        icon: ShoppingBag,
        color: '#3b82f6',
        bgColor: '#eff6ff',
        onPress: () => router.push('/orders'),
      },
    ];

    if (role === 'farmer' || role === 'agent') {
      return [
        ...common,
        {
          id: 'listings',
          title: 'My Listings',
          subtitle: 'Manage your products',
          icon: Package,
          color: Colors.light.primary,
          bgColor: '#f0fdf4',
          onPress: () => Alert.alert('Coming Soon', 'Manage listings is available on the web app.'),
        },
        {
          id: 'earnings',
          title: 'Earnings',
          subtitle: 'Sales & payouts',
          icon: Activity,
          color: '#8b5cf6',
          bgColor: '#f5f3ff',
          onPress: () => Alert.alert('Coming Soon', 'Earnings report is available on the web app.'),
        },
      ];
    }

    if (role === 'delivery') {
      return [
        {
          id: 'deliveries',
          title: 'My Deliveries',
          subtitle: 'Jobs & history',
          icon: Truck,
          color: '#f59e0b',
          bgColor: '#fffbeb',
          onPress: () => Alert.alert('Coming Soon', 'Delivery jobs are available on the web app.'),
        },
      ];
    }

    return common;
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => fetchProfile(api)}
            colors={[Colors.light.primary]}
          />
        }
      >
        {/* Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{displayName[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.displayName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.primaryEmailAddress?.emailAddress || ''}
            </Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{displayRole}</Text>
              </View>
              {(role === 'farmer' || role === 'agent') && sellingStatus !== 'NONE' && (
                <View style={[styles.statusBadge, { backgroundColor: SELLING_STATUS_COLORS[sellingStatus] + '22' }]}>
                  <Text style={[styles.statusBadgeText, { color: SELLING_STATUS_COLORS[sellingStatus] }]}>
                    {sellingStatus}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {getQuickActions().map((action) => {
            const Icon = action.icon;
            return (
              <TouchableOpacity
                key={action.id}
                style={[styles.actionCard, { backgroundColor: action.bgColor }]}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconBg, { backgroundColor: action.color + '22' }]}>
                  <Icon color={action.color} size={26} />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/edit-profile')}>
            <UserIcon color={Colors.light.icon} size={20} />
            <Text style={styles.menuItemText}>Edit Profile</Text>
            <ChevronRight color={Colors.light.icon} size={18} style={styles.menuChevron} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/orders')}>
            <ShoppingBag color={Colors.light.icon} size={20} />
            <Text style={styles.menuItemText}>Order History</Text>
            <ChevronRight color={Colors.light.icon} size={18} style={styles.menuChevron} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuItem, styles.signOutItem]} onPress={handleSignOut}>
            <LogOut color={Colors.light.error} size={20} />
            <Text style={[styles.menuItemText, styles.signOutText]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  profileInfo: { marginLeft: 14, flex: 1 },
  displayName: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  email: { fontSize: 12, color: Colors.light.icon, marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  roleBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  roleBadgeText: { fontSize: 11, fontWeight: 'bold', color: Colors.light.primaryDark },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionCard: {
    width: '47%',
    padding: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.light.text, marginBottom: 2 },
  actionSubtitle: { fontSize: 11, color: Colors.light.icon },
  menuList: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
  menuChevron: { marginLeft: 'auto' },
  signOutItem: { borderBottomWidth: 0 },
  signOutText: { color: Colors.light.error },
});
