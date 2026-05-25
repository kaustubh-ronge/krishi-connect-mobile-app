import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCartStore } from '@/store/cartStore';
import { useApiClient } from '@/services/api';
import { Plus, Minus, Trash2, Package, ShoppingCart } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function CartScreen() {
  const { items, loading, error, fetchCart, updateQuantity, removeFromCart } = useCartStore();
  const api = useApiClient();
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchCart(api);
    }, [])
  );

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.product.pricePerUnit, 0
  );

  const handleRemove = (itemId: string, name: string) => {
    Alert.alert('Remove Item', `Remove "${name}" from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(api, itemId) },
    ]);
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const imageUrl = item.product.images?.[0];
    return (
      <MotiView
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 400, delay: index * 100 }}
        className="flex-row bg-white rounded-3xl p-3 mb-4 shadow-sm border border-gray-100"
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="w-24 h-24 rounded-2xl bg-gray-100" resizeMode="cover" />
        ) : (
          <View className="w-24 h-24 rounded-2xl bg-gray-100 items-center justify-center">
            <Package color="#9ca3af" size={28} />
          </View>
        )}

        <View className="flex-1 ml-4 justify-between py-1">
          <View>
            <Text className="text-base font-bold text-gray-900 leading-tight mb-1" numberOfLines={2}>{item.product.productName}</Text>
            <Text className="text-sm text-gray-500">₹{item.product.pricePerUnit} / {item.product.unit}</Text>
          </View>
          
          <Text className="text-base font-extrabold text-primary-dark mt-1">₹{(item.quantity * item.product.pricePerUnit).toFixed(2)}</Text>

          <View className="flex-row items-center mt-2">
            <TouchableOpacity
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center border border-gray-200"
              onPress={() => item.quantity > 1
                ? updateQuantity(api, item.id, item.quantity - 1)
                : handleRemove(item.id, item.product.productName)
              }
            >
              <Minus size={16} color="#374151" />
            </TouchableOpacity>
            
            <Text className="text-base font-bold mx-4 text-gray-800">{item.quantity}</Text>
            
            <TouchableOpacity
              className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center border border-gray-200"
              onPress={() => updateQuantity(api, item.id, item.quantity + 1)}
            >
              <Plus size={16} color="#374151" />
            </TouchableOpacity>

            <TouchableOpacity
              className="ml-auto p-2"
              onPress={() => handleRemove(item.id, item.product.productName)}
            >
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </MotiView>
    );
  };

  if (loading && items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center justify-between">
        <Text className="text-2xl font-extrabold text-gray-900 tracking-tight">My Cart</Text>
        {items.length > 0 && (
          <View className="bg-green-100 px-3 py-1 rounded-full">
            <Text className="text-sm font-bold text-green-700">{items.length} items</Text>
          </View>
        )}
      </View>

      {error ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-red-500 text-base text-center mb-4">{error}</Text>
          <TouchableOpacity className="bg-primary px-6 py-3 rounded-xl" onPress={() => fetchCart(api)}>
            <Text className="text-white font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerClassName="p-4 pt-6"
            ListEmptyComponent={
              <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="items-center justify-center pt-24 pb-10"
              >
                <View className="w-24 h-24 rounded-full bg-green-50 items-center justify-center mb-6 border-4 border-green-100">
                  <ShoppingCart color="#16a34a" size={40} />
                </View>
                <Text className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</Text>
                <Text className="text-base text-gray-500 text-center mb-8 px-10">Browse the marketplace and add fresh products!</Text>
                <TouchableOpacity 
                  className="bg-primary px-8 py-4 rounded-2xl shadow-sm"
                  onPress={() => router.push('/(tabs)')}
                >
                  <Text className="text-white font-bold text-lg">Shop Now</Text>
                </TouchableOpacity>
              </MotiView>
            }
          />

          {items.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              className="bg-white p-6 border-t border-gray-100 rounded-t-3xl shadow-lg"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 10,
              }}
            >
              <View className="flex-row justify-between items-center mb-1">
                <Text className="text-base text-gray-500 font-medium">Total</Text>
                <Text className="text-2xl font-extrabold text-gray-900">₹{totalAmount.toFixed(2)}</Text>
              </View>
              <Text className="text-xs text-gray-400 mb-5">Delivery charges calculated at checkout</Text>
              <TouchableOpacity
                className="bg-primary py-4 rounded-2xl items-center shadow-md flex-row justify-center"
                onPress={() => router.push('/checkout')}
              >
                <Text className="text-white text-lg font-bold">Proceed to Checkout</Text>
              </TouchableOpacity>
            </MotiView>
          )}
        </>
      )}
    </SafeAreaView>
  );
}
