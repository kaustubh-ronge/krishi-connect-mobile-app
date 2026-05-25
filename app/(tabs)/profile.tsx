import React, { useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useApiClient } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { useCartStore } from '@/store/cartStore';
import {
  User as UserIcon, Mail, Phone, MapPin,
  ShoppingBag, Edit3, LogOut, ChevronRight,
} from 'lucide-react-native';
import { MotiView, MotiScrollView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';

const ROLE_LABELS: Record<string, string> = {
  farmer: 'Farmer',
  agent: 'Agent',
  delivery: 'Delivery Partner',
  admin: 'Admin',
  none: 'New User',
};

const STATUS_COLORS: Record<string, string> = {
  APPROVED: 'text-green-700 bg-green-100 border-green-200',
  PENDING: 'text-yellow-700 bg-yellow-100 border-yellow-200',
  REJECTED: 'text-red-700 bg-red-100 border-red-200',
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
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-900">My Profile</Text>
        <TouchableOpacity onPress={() => router.push('/edit-profile')} className="p-2">
          <Edit3 size={20} color="#16a34a" />
        </TouchableOpacity>
      </View>

      <MotiScrollView contentContainerClassName="p-4 pb-10">
        {/* Avatar + Name */}
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'timing', duration: 500 }}
          className="items-center mb-8 mt-4"
        >
          <View className="w-24 h-24 rounded-full bg-primary items-center justify-center shadow-md mb-4 border-4 border-green-50">
            <Text className="text-white text-4xl font-bold">{displayName[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">{displayName}</Text>
          <View className="bg-green-100 px-4 py-1.5 rounded-full mb-3">
            <Text className="text-sm font-bold text-green-800">{ROLE_LABELS[role] || role || 'User'}</Text>
          </View>
          {sellingStatus && STATUS_COLORS[sellingStatus] && (
            <View className={`px-4 py-1.5 rounded-full border ${STATUS_COLORS[sellingStatus]}`}>
              <Text className="text-sm font-semibold opacity-90">
                {sellingStatus === 'PENDING' ? '⏳ Approval Pending' :
                 sellingStatus === 'APPROVED' ? '✅ Approved Seller' :
                 '❌ Application Rejected'}
              </Text>
            </View>
          )}
        </MotiView>

        {/* Info Cards */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 100 }}
          className="bg-white rounded-3xl p-5 mb-6 shadow-sm border border-gray-100"
        >
          <Text className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Account Information</Text>

          <View className="flex-row items-center py-3 border-b border-gray-50 mb-1">
            <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-4">
              <Mail color="#3b82f6" size={18} />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500 mb-1">Email</Text>
              <Text className="text-base text-gray-900 font-medium">{email || 'Not set'}</Text>
            </View>
          </View>

          {phone ? (
            <View className="flex-row items-center py-3 border-b border-gray-50 mb-1">
              <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center mr-4">
                <Phone color="#10b981" size={18} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Phone</Text>
                <Text className="text-base text-gray-900 font-medium">{phone}</Text>
              </View>
            </View>
          ) : null}

          {address ? (
            <View className="flex-row items-center py-3">
              <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center mr-4">
                <MapPin color="#8b5cf6" size={18} />
              </View>
              <View className="flex-1">
                <Text className="text-xs text-gray-500 mb-1">Address</Text>
                <Text className="text-base text-gray-900 font-medium">{address}</Text>
              </View>
            </View>
          ) : null}
        </MotiView>

        {/* Menu */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600, delay: 200 }}
          className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100"
        >
          <TouchableOpacity className="flex-row items-center p-5 border-b border-gray-50" onPress={() => router.push('/edit-profile')}>
            <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-4">
              <Edit3 color="#6b7280" size={20} />
            </View>
            <Text className="text-base font-semibold text-gray-800 flex-1">Edit Profile</Text>
            <ChevronRight color="#9ca3af" size={20} />
          </TouchableOpacity>

          <TouchableOpacity className="flex-row items-center p-5 border-b border-gray-50" onPress={() => router.push('/orders')}>
            <View className="w-10 h-10 rounded-full bg-gray-50 items-center justify-center mr-4">
              <ShoppingBag color="#6b7280" size={20} />
            </View>
            <Text className="text-base font-semibold text-gray-800 flex-1">My Orders</Text>
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
