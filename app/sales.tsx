import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, TrendingUp } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useApiClient } from '@/services/api';
import { unwrapData } from '@/lib/apiHelpers';

export default function SalesScreen() {
  const router = useRouter();
  const api = useApiClient();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('mobile/v1/seller/sales');
      const data = unwrapData<any[]>(res) || [];
      setSales(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSales();
    }, [fetchSales])
  );

  const totalRevenue = sales.reduce(
    (sum, item) => sum + Number(item.totalPriceAtTime || item.quantity * item.priceAtTime || 0),
    0
  );

  const renderItem = ({ item }: { item: any }) => {
    const order = item.order;
    const product = item.product;
    return (
      <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
        <View className="flex-row items-center mb-2">
          <Image
            source={{ uri: product?.images?.[0] || 'https://via.placeholder.com/48' }}
            className="w-12 h-12 rounded-lg bg-gray-100 mr-3"
          />
          <View className="flex-1">
            <Text className="font-bold text-gray-900" numberOfLines={1}>{product?.productName}</Text>
            <Text className="text-xs text-gray-500">
              Order #{order?.id?.slice(0, 8)} · {order?.orderStatus}
            </Text>
          </View>
          <Text className="font-bold text-green-600">
            ₹{Number(item.totalPriceAtTime || 0).toFixed(2)}
          </Text>
        </View>
        <Text className="text-sm text-gray-600">
          {item.quantity} {product?.unit} @ ₹{item.priceAtTime}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-100">
        <TouchableOpacity className="p-2 rounded-lg bg-gray-100" onPress={() => router.back()}>
          <ArrowLeft color="#1f2937" size={24} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Sales</Text>
        <View style={{ width: 40 }} />
      </View>

      <View className="mx-4 mt-4 p-5 bg-primary rounded-2xl flex-row items-center">
        <TrendingUp color="#fff" size={28} />
        <View className="ml-4">
          <Text className="text-green-100 text-sm font-semibold">Total Revenue</Text>
          <Text className="text-white text-2xl font-black">₹{totalRevenue.toFixed(2)}</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : sales.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <Text className="text-gray-500 text-center">No sales recorded yet.</Text>
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerClassName="p-4 pb-20"
          refreshing={loading}
          onRefresh={fetchSales}
        />
      )}
    </SafeAreaView>
  );
}
