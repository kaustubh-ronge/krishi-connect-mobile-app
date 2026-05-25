import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useApiClient } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { useCartStore } from '@/store/cartStore';
import {
  Package, Truck, Activity, User as UserIcon,
  LogOut, ChevronRight, ShoppingBag, PlusCircle, ClipboardList,
} from 'lucide-react-native';
import { MotiView, MotiScrollView } from 'moti';

const ROLE_LABELS: Record<string, string> = {
  farmer: '🌾 Farmer',
  agent: '🏢 Agent',
  delivery: '🚚 Delivery Partner',
  admin: '🛡️ Admin',
  none: 'New User',
};

const SELLING_STATUS_COLORS: Record<string, string> = {
  APPROVED: 'text-green-600 bg-green-100',
  PENDING: 'text-yellow-600 bg-yellow-100',
  REJECTED: 'text-red-600 bg-red-100',
  NONE: 'text-gray-600 bg-gray-100',
};

export default function DashboardScreen() {
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
        bgColor: 'bg-blue-50',
        iconBg: 'bg-blue-100',
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
          color: '#16a34a',
          bgColor: 'bg-green-50',
          iconBg: 'bg-green-100',
          onPress: () => {
            if (sellingStatus !== 'APPROVED') {
              Alert.alert('Account Pending', 'Your seller profile is pending approval by an admin. You cannot manage listings yet.');
            } else {
              router.push('/my-listings');
            }
          },
        },
        {
          id: 'create',
          title: 'Add Listing',
          subtitle: 'Sell new produce',
          icon: PlusCircle,
          color: '#0ea5e9',
          bgColor: 'bg-sky-50',
          iconBg: 'bg-sky-100',
          onPress: () => {
            if (sellingStatus !== 'APPROVED') {
              Alert.alert('Account Pending', 'Your seller profile is pending approval by an admin.');
            } else {
              router.push('/create-listing');
            }
          },
        },
        {
          id: 'manage-orders',
          title: 'Manage Orders',
          subtitle: 'Fulfill customer orders',
          icon: ClipboardList,
          color: '#f59e0b',
          bgColor: 'bg-amber-50',
          iconBg: 'bg-amber-100',
          onPress: () => router.push('/manage-orders'),
        },
        {
          id: 'earnings',
          title: 'Earnings',
          subtitle: 'Sales & payouts',
          icon: Activity,
          color: '#8b5cf6',
          bgColor: 'bg-purple-50',
          iconBg: 'bg-purple-100',
          onPress: () => router.push('/sales'),
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
          bgColor: 'bg-amber-50',
          iconBg: 'bg-amber-100',
          onPress: () => Alert.alert('Coming Soon', 'Delivery jobs are available on the web app.'),
        },
      ];
    }

    return common;
  };

  if (loading && !profile) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <MotiScrollView
        contentContainerClassName="px-4 pb-10 pt-4"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => fetchProfile(api)}
            colors={['#16a34a']}
          />
        }
      >
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          className="flex-row items-center bg-white rounded-3xl p-5 mb-6 shadow-sm border border-gray-100"
        >
          <View className="w-16 h-16 rounded-full bg-primary items-center justify-center shadow-sm">
            <Text className="text-white text-3xl font-bold">{displayName[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>{displayName}</Text>
            <Text className="text-sm text-gray-500 mb-2" numberOfLines={1}>
              {user?.primaryEmailAddress?.emailAddress || ''}
            </Text>
            <View className="flex-row gap-2 flex-wrap">
              <View className="bg-green-100 px-3 py-1 rounded-full">
                <Text className="text-xs font-bold text-green-700">{displayRole}</Text>
              </View>
              {(role === 'farmer' || role === 'agent') && sellingStatus !== 'NONE' && (
                <View className={`px-3 py-1 rounded-full ${SELLING_STATUS_COLORS[sellingStatus].split(' ')[1]}`}>
                  <Text className={`text-xs font-bold ${SELLING_STATUS_COLORS[sellingStatus].split(' ')[0]}`}>
                    {sellingStatus}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </MotiView>

        <Text className="text-lg font-bold text-gray-900 mb-3 px-1">Quick Actions</Text>
        <View className="flex-row flex-wrap gap-3 mb-8">
          {getQuickActions().map((action, index) => {
            const Icon = action.icon;
            return (
              <MotiView
                key={action.id}
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', delay: index * 100 }}
                style={{ width: '48%' }}
              >
                <TouchableOpacity
                  className={`${action.bgColor} p-4 rounded-3xl shadow-sm border border-white`}
                  onPress={action.onPress}
                  activeOpacity={0.8}
                >
                  <View className={`w-12 h-12 rounded-full ${action.iconBg} items-center justify-center mb-3`}>
                    <Icon color={action.color} size={24} />
                  </View>
                  <Text className="text-base font-bold text-gray-900 mb-1">{action.title}</Text>
                  <Text className="text-xs text-gray-500">{action.subtitle}</Text>
                </TouchableOpacity>
              </MotiView>
            );
          })}
        </View>

        <Text className="text-lg font-bold text-gray-900 mb-3 px-1">Account</Text>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 200 }}
          className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100"
        >
          <TouchableOpacity className="flex-row items-center p-5 border-b border-gray-100" onPress={() => router.push('/edit-profile')}>
            <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-4">
              <UserIcon color="#6b7280" size={20} />
            </View>
            <Text className="text-base font-semibold text-gray-800 flex-1">Edit Profile</Text>
            <ChevronRight color="#9ca3af" size={20} />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-5 border-b border-gray-100" onPress={() => router.push('/orders')}>
            <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-4">
              <ShoppingBag color="#6b7280" size={20} />
            </View>
            <Text className="text-base font-semibold text-gray-800 flex-1">Order History</Text>
            <ChevronRight color="#9ca3af" size={20} />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-5" onPress={handleSignOut}>
            <View className="w-10 h-10 rounded-full bg-red-50 items-center justify-center mr-4">
              <LogOut color="#ef4444" size={20} />
            </View>
            <Text className="text-base font-semibold text-red-500 flex-1">Sign Out</Text>
          </TouchableOpacity>
        </MotiView>
      </MotiScrollView>
    </SafeAreaView>
  );
}
