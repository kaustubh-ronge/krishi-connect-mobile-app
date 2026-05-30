import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Alert, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter, Redirect } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useApiClient } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { useCartStore } from '@/store/cartStore';
import {
  Package, Truck, Activity, User as UserIcon,
  LogOut, ChevronRight, ShoppingBag, PlusCircle, ClipboardList,
  IndianRupee, TrendingUp,
} from 'lucide-react-native';

const ROLE_LABELS: Record<string, string> = {
  farmer: '🌾 Farmer',
  agent: '🏢 Agent',
  delivery: '🚚 Delivery Partner',
  admin: '🛡️ Admin',
  none: 'New User',
};

const SELLING_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  APPROVED: { bg: '#dcfce7', text: '#15803d' },
  PENDING: { bg: '#fef9c3', text: '#a16207' },
  REJECTED: { bg: '#fee2e2', text: '#b91c1c' },
  NONE: { bg: '#f1f5f9', text: '#64748b' },
};

export default function DashboardScreen() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const api = useApiClient();
  const { profile, role, loading, initialized, fetchProfile } = useUserStore();
  const { clearLocalCart } = useCartStore();

  const [salesSummary, setSalesSummary] = React.useState({ totalOrders: 0, totalRevenue: 0 });

  useFocusEffect(
    useCallback(() => {
      fetchProfile(api);
      if (role === 'farmer' || role === 'agent') {
        api.get('mobile/v1/seller/sales').then((res: any) => {
          const data = res.data?.data || res.data || [];
          if (Array.isArray(data)) {
            const revenue = data.reduce((sum: number, item: any) => sum + Number(item.totalPriceAtTime || item.quantity * item.priceAtTime || 0), 0);
            setSalesSummary({ totalOrders: data.length, totalRevenue: revenue });
          }
        }).catch(() => {});
      }
    }, [role])
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

  if (isLoaded && !isSignedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 }}>Dashboard</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 4, borderColor: '#dbeafe' }}>
            <Activity color="#3b82f6" size={40} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>Login Required</Text>
          <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 32, paddingHorizontal: 16 }}>Please log in to view your dashboard and manage your account.</Text>
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

  // Block only on the initial load; background refreshes keep cached content
  // and surface progress via the RefreshControl.
  if (!initialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      </SafeAreaView>
    );
  }

  // At this point, we know user is signed in and profile fetch completed.
  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#111827', letterSpacing: -0.5 }}>Dashboard</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 4, borderColor: '#dcfce7' }}>
            <UserIcon color="#16a34a" size={40} />
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>Profile Required</Text>
          <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 32, paddingHorizontal: 16 }}>Please create your profile to access your dashboard.</Text>
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

  const sellingStatus = profile?.sellingStatus || profile?.approvalStatus || 'NONE';
  const displayName = profile?.name || user?.fullName || 'User';
  const displayRole = ROLE_LABELS[role] || role || 'User';
  const statusStyle = SELLING_STATUS_COLORS[sellingStatus] || SELLING_STATUS_COLORS.NONE;

  const getQuickActions = () => {
    const common = [{
      id: 'orders', title: 'My Orders', subtitle: 'View all purchases',
      icon: ShoppingBag, gradient: ['#2563eb', '#3b82f6'] as const,
      iconBg: '#eff6ff', onPress: () => router.push('/orders'),
    }];

    if (role === 'farmer' || role === 'agent') {
      return [
        ...common,
        {
          id: 'listings', title: 'My Listings', subtitle: 'Manage products',
          icon: Package, gradient: ['#15803d', '#22c55e'] as const,
          iconBg: '#f0fdf4',
          onPress: () => {
            if (sellingStatus !== 'APPROVED') {
              Alert.alert('Account Pending', 'Your seller profile is pending approval.');
            } else {
              router.push('/my-listings');
            }
          },
        },
        {
          id: 'create', title: 'Add Listing', subtitle: 'Sell new produce',
          icon: PlusCircle, gradient: ['#0284c7', '#0ea5e9'] as const,
          iconBg: '#f0f9ff',
          onPress: () => {
            if (sellingStatus !== 'APPROVED') {
              Alert.alert('Account Pending', 'Your seller profile is pending approval.');
            } else {
              router.push('/create-listing');
            }
          },
        },
        {
          id: 'manage-orders', title: 'Manage Orders', subtitle: 'Fulfill orders',
          icon: ClipboardList, gradient: ['#b45309', '#f59e0b'] as const,
          iconBg: '#fffbeb',
          onPress: () => router.push('/manage-orders'),
        },
        {
          id: 'earnings', title: 'Earnings', subtitle: 'Sales & payouts',
          icon: TrendingUp, gradient: ['#7c3aed', '#8b5cf6'] as const,
          iconBg: '#f5f3ff',
          onPress: () => router.push('/sales'),
        },
      ];
    }

    if (role === 'delivery') {
      return [{
        id: 'deliveries', title: 'My Deliveries', subtitle: 'Jobs & history',
        icon: Truck, gradient: ['#b45309', '#f59e0b'] as const,
        iconBg: '#fffbeb',
        onPress: () => router.push('/deliveries'),
      }];
    }

    return common;
  };



  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Gradient header strip */}
      <LinearGradient
        colors={['#15803d', '#16a34a']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.headerStrip}
      >
        <Text style={styles.headerTitle}>Dashboard</Text>
        <Text style={styles.headerSubtitle}>Welcome back, {displayName.split(' ')[0]}!</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => fetchProfile(api)}
            colors={['#16a34a']} tintColor="#16a34a"
          />
        }
      >
        {/* Profile Card */}
        <View
          style={styles.profileCard}
        >
          <LinearGradient
            colors={['#f0fdf4', '#ffffff']}
            style={styles.profileCardGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <View style={styles.avatarContainer}>
              <LinearGradient colors={['#15803d', '#22c55e']} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.avatarText}>{displayName[0]?.toUpperCase() || 'U'}</Text>
              </LinearGradient>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {user?.primaryEmailAddress?.emailAddress || ''}
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>{displayRole}</Text>
                </View>
                {(role === 'farmer' || role === 'agent') && sellingStatus !== 'NONE' && (
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>{sellingStatus}</Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Performance Card */}
        {(role === 'farmer' || role === 'agent') && sellingStatus === 'APPROVED' && (
          <View
            style={styles.performanceCardWrapper}
          >
            <LinearGradient
              colors={['#065f46', '#059669', '#10b981']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.performanceCard}
            >
              <View style={styles.performanceHeader}>
                <Text style={styles.performanceTitle}>Performance Overview</Text>
                <Activity color="rgba(255,255,255,0.8)" size={18} />
              </View>
              <View style={styles.performanceStats}>
                <View style={styles.statBlock}>
                  <Text style={styles.statLabel}>TOTAL REVENUE</Text>
                  <Text style={styles.statValue}>₹{salesSummary.totalRevenue.toLocaleString()}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBlock}>
                  <Text style={styles.statLabel}>ITEMS SOLD</Text>
                  <Text style={styles.statValue}>{salesSummary.totalOrders}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {getQuickActions().map((action, index) => {
            const Icon = action.icon;
            return (
              <View
                key={action.id}
                style={styles.actionCardWrapper}
              >
                <TouchableOpacity
                  style={[styles.actionCard, { backgroundColor: action.iconBg }]}
                  onPress={action.onPress}
                  activeOpacity={0.82}
                >
                  <LinearGradient
                    colors={action.gradient}
                    style={styles.actionIconGradient}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    <Icon color="#fff" size={22} />
                  </LinearGradient>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View
          style={styles.menuCard}
        >
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/edit-profile')}>
            <View style={[styles.menuIconBg, { backgroundColor: '#f1f5f9' }]}>
              <UserIcon color="#475569" size={19} />
            </View>
            <Text style={styles.menuLabel}>Edit Profile</Text>
            <ChevronRight color="#cbd5e1" size={19} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/orders')}>
            <View style={[styles.menuIconBg, { backgroundColor: '#eff6ff' }]}>
              <ShoppingBag color="#3b82f6" size={19} />
            </View>
            <Text style={styles.menuLabel}>Order History</Text>
            <ChevronRight color="#cbd5e1" size={19} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <View style={[styles.menuIconBg, { backgroundColor: '#fef2f2' }]}>
              <LogOut color="#ef4444" size={19} />
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

  headerStrip: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '500', marginTop: 2 },

  scrollContent: { padding: 16, paddingBottom: 100 },

  // Profile Card
  profileCard: {
    borderRadius: 22, marginBottom: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  profileCardGradient: { flexDirection: 'row', alignItems: 'center', padding: 18 },
  avatarContainer: {},
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '800' },
  profileName: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 3 },
  profileEmail: { fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: '500' },
  badgeRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  roleBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  roleBadgeText: { fontSize: 11, fontWeight: '700', color: '#15803d' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  // Performance card
  performanceCardWrapper: { marginBottom: 20 },
  performanceCard: { borderRadius: 22, padding: 20 },
  performanceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  performanceTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  performanceStats: { flexDirection: 'row', alignItems: 'center' },
  statBlock: { flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.8, marginBottom: 4 },
  statValue: { fontSize: 26, fontWeight: '900', color: '#fff' },
  statDivider: { width: 1, height: 44, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 20 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 12, letterSpacing: -0.2 },

  // Actions grid
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  actionCardWrapper: { width: '47.5%' },
  actionCard: {
    borderRadius: 20, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  actionIconGradient: {
    width: 48, height: 48, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  actionTitle: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 3 },
  actionSubtitle: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },

  // Menu
  menuCard: {
    backgroundColor: '#fff', borderRadius: 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    overflow: 'hidden', marginBottom: 12,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 16 },
  menuIconBg: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  menuDivider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 70 },
});
