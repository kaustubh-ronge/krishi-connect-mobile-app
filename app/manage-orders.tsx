import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, ClipboardList, Check, Truck, Package } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useApiClient } from '@/services/api';
import { unwrapData } from '@/lib/apiHelpers';

const STATUS_COLORS: Record<string, string> = {
  PROCESSING: '#3b82f6',
  PACKED: '#6366f1',
  SHIPPED: '#8b5cf6',
  IN_TRANSIT: '#f59e0b',
  DELIVERED: '#10b981',
  CANCELLED: '#ef4444',
};

/** Matches web ManageOrdersClient STATUS_TRANSITIONS */
const NEXT_STATUS: Record<string, { status: string; label: string } | null> = {
  PROCESSING: { status: 'PACKED', label: 'Mark Packed' },
  PACKED: { status: 'SHIPPED', label: 'Mark Shipped' },
  SHIPPED: { status: 'IN_TRANSIT', label: 'In Transit' },
  IN_TRANSIT: { status: 'DELIVERED', label: 'Mark Delivered' },
};

export default function ManageOrdersScreen() {
  const router = useRouter();
  const api = useApiClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('mobile/v1/seller/orders?page=1&limit=50');
      const data = unwrapData<any[]>(res);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load your orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const updateStatus = async (orderId: string, status: string) => {
    Alert.alert(
      'Update Order',
      `Update order status to ${status}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await api.put('mobile/v1/seller/orders', { orderId, status });
              Alert.alert('Success', 'Order updated.');
              fetchOrders();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to update order.');
            }
          },
        },
      ]
    );
  };

  const promptNextStatus = (order: any) => {
    const current = order.orderStatus || 'PROCESSING';
    const next = NEXT_STATUS[current];
    if (!next) return;
    updateStatus(order.id, next.status);
  };

  const renderItem = ({ item: order }: { item: any }) => {
    const status = order.orderStatus || 'PROCESSING';
    const statusColor = STATUS_COLORS[status] || '#6b7280';
    const firstItem = order.items?.[0];
    const product = firstItem?.product;
    const buyer =
      order.buyerUser?.farmerProfile?.name ||
      order.buyerUser?.agentProfile?.name ||
      order.buyerUser?.email ||
      'Buyer';
    const next = NEXT_STATUS[status];

    return (
      <View className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
        <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
          <Text className="text-sm font-bold text-gray-600">Order #{order.id?.slice(0, 8)}</Text>
          <View style={{ backgroundColor: statusColor + '20' }} className="px-2.5 py-1 rounded-xl">
            <Text style={{ color: statusColor }} className="text-xs font-bold">{status}</Text>
          </View>
        </View>

        {order.items?.map((line: any) => (
          <View key={line.id} className="flex-row items-center mb-3">
            <Image
              source={{ uri: line.product?.images?.[0] || 'https://via.placeholder.com/50' }}
              className="w-12 h-12 rounded-lg bg-gray-200 mr-3"
            />
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-800">{line.product?.productName}</Text>
              <Text className="text-sm text-gray-500">
                {line.quantity} × ₹{line.priceAtTime ?? line.pricePerUnit}
              </Text>
            </View>
          </View>
        ))}

        <View className="bg-gray-50 p-3 rounded-xl mb-4">
          <Text className="text-xs font-semibold text-gray-500 mb-1">Buyer</Text>
          <Text className="text-sm font-bold text-gray-800">{buyer}</Text>
          {order.shippingAddress ? (
            <Text className="text-xs text-gray-600 mt-1" numberOfLines={3}>{order.shippingAddress}</Text>
          ) : null}
          <Text className="text-sm font-bold text-green-600 mt-2">
            Total: ₹{Number(order.totalAmount || 0).toFixed(2)}
          </Text>
        </View>

        {next && status !== 'DELIVERED' && status !== 'CANCELLED' && (
          <TouchableOpacity
            className="flex-row items-center justify-center py-3 rounded-xl gap-2 bg-primary"
            onPress={() => promptNextStatus(order)}
          >
            {next.status === 'PACKED' && <Package size={16} color="white" />}
            {next.status === 'SHIPPED' && <Truck size={16} color="white" />}
            {next.status === 'DELIVERED' && <Check size={16} color="white" />}
            <Text className="text-white font-bold text-sm">{next.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-100">
        <TouchableOpacity className="p-2 rounded-lg bg-gray-100" onPress={() => router.back()}>
          <ArrowLeft color="#1f2937" size={24} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Manage Orders</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center p-6">
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <ClipboardList size={64} color="#d1d5db" />
          <Text className="text-xl font-bold text-gray-800 mt-4">No Orders Yet</Text>
          <Text className="text-sm text-gray-500 text-center mt-2">
            When customers buy your products, they will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerClassName="p-4 pb-20"
          refreshing={loading}
          onRefresh={fetchOrders}
        />
      )}
    </SafeAreaView>
  );
}
