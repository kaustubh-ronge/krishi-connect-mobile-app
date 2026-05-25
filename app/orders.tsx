import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useApiClient } from '@/services/api';
import { useState } from 'react';
import { Package, ChevronRight, ArrowLeft } from 'lucide-react-native';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PROCESSING:  { bg: '#fef9c3', text: '#a16207', label: 'Processing' },
  PACKED:      { bg: '#e0f2fe', text: '#0369a1', label: 'Packed' },
  SHIPPED:     { bg: '#ede9fe', text: '#6d28d9', label: 'Shipped' },
  IN_TRANSIT:  { bg: '#ffedd5', text: '#c2410c', label: 'In Transit' },
  DELIVERED:   { bg: '#dcfce7', text: '#15803d', label: 'Delivered' },
  CANCELLED:   { bg: '#fee2e2', text: '#b91c1c', label: 'Cancelled' },
};

const PAYMENT_STATUS_STYLES: Record<string, { color: string; label: string }> = {
  PENDING: { color: '#f59e0b', label: 'Pending' },
  PAID:    { color: '#16a34a', label: 'Paid' },
  REFUNDED: { color: '#6b7280', label: 'Refunded' },
};

export default function OrdersScreen() {
  const api = useApiClient();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('mobile/v1/orders');
      setOrders(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();
    }, [])
  );

  const renderOrder = ({ item }: { item: any }) => {
    const status = item.orderStatus || 'PROCESSING';
    const paymentStatus = item.paymentStatus || 'PENDING';
    const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.PROCESSING;
    const paymentStyle = PAYMENT_STATUS_STYLES[paymentStatus] || PAYMENT_STATUS_STYLES.PENDING;
    const date = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    const itemCount = item.items?.length || item._count?.items || 0;

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm"
        onPress={() => router.push(`/order-detail/${item.id}`)}
        activeOpacity={0.85}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View>
            <Text className="text-base font-bold text-gray-900">Order #{item.invoiceNumber || item.id.slice(-8).toUpperCase()}</Text>
            <Text className="text-xs text-gray-500 mt-1">{date}</Text>
          </View>
          <View style={{ backgroundColor: statusStyle.bg }} className="px-2.5 py-1 rounded-xl">
            <Text style={{ color: statusStyle.text }} className="text-xs font-bold">{statusStyle.label}</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1.5 mb-3">
          <Package color={Colors.light.icon} size={14} />
          <Text className="text-sm text-gray-500">{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
          <Text className="text-sm text-gray-500 mx-1">•</Text>
          <Text style={{ color: paymentStyle.color }} className="text-sm font-medium">
            {item.paymentMethod === 'COD' ? 'COD' : `Online · ${paymentStyle.label}`}
          </Text>
        </View>

        <View className="flex-row justify-between items-center pt-3 border-t border-gray-100">
          <Text className="text-lg font-bold text-gray-900">₹{Number(item.totalAmount || 0).toFixed(2)}</Text>
          <ChevronRight color={Colors.light.icon} size={18} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3.5 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ArrowLeft color={Colors.light.text} size={22} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 ml-3">My Orders</Text>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-red-500 text-base text-center mb-4">{error}</Text>
          <TouchableOpacity className="bg-primary px-6 py-3 rounded-xl" onPress={() => { setLoading(true); fetchOrders(); }}>
            <Text className="text-white font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerClassName="p-3 pb-20"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              colors={[Colors.light.primary]}
            />
          }
          ListEmptyComponent={
            <View className="pt-20 items-center gap-3">
              <Package color={Colors.light.icon} size={56} />
              <Text className="text-xl font-bold text-gray-900">No orders yet</Text>
              <Text className="text-sm text-gray-500 text-center">Your order history will appear here</Text>
              <TouchableOpacity className="bg-primary px-6 py-3 rounded-xl mt-2" onPress={() => router.push('/(tabs)')}>
                <Text className="text-white font-bold text-base">Browse Marketplace</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}


