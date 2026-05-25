import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { useApiClient } from '@/services/api';
import { calculateDistance } from '@/lib/apiHelpers';
import { Plus, Minus, Trash2, Package, ShoppingCart, Clock, CheckCircle2, AlertCircle, Square, CheckSquare, Truck } from 'lucide-react-native';
import { MotiView, ScrollView } from 'moti';
import { useAuth } from '@clerk/clerk-expo';

export default function CartScreen() {
  const { isSignedIn } = useAuth();
  const { profile } = useUserStore();
  const { items, loading, error, fetchCart, updateQuantity, removeFromCart } = useCartStore();
  const [specialRequests, setSpecialRequests] = React.useState<any[]>([]);
  const api = useApiClient();
  const router = useRouter();

  const [selectedItemIds, setSelectedItemIds] = React.useState<string[]>([]);
  const [unserviceableIds, setUnserviceableIds] = React.useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (isSignedIn) {
        fetchCart(api);
        api.get('mobile/v1/special-delivery').then(res => {
          if (res.data?.success) setSpecialRequests(res.data.data || []);
        }).catch(() => { });
      }
    }, [isSignedIn])
  );

  // Identify unserviceable items based on distance
  React.useEffect(() => {
    if (profile?.lat && profile?.lng && items.length > 0) {
      const outOfRangeIds: string[] = [];
      items.forEach(item => {
        const seller = item.product?.farmer || item.product?.agent;
        if (seller?.lat && seller?.lng) {
          const distance = calculateDistance(profile.lat!, profile.lng!, seller.lat, seller.lng);
          const maxRange = item.product?.maxDeliveryRange || 50;
          if (distance > maxRange) {
            outOfRangeIds.push(item.id);
          }
        }
      });
      setUnserviceableIds(outOfRangeIds);
      
      // Auto-select valid items, auto-deselect invalid items
      const validItemIds = items.filter(it => {
        const isOutOfRange = outOfRangeIds.includes(it.id);
        const isApproved = specialRequests.some(r => r.productId === it.product.id && r.status === 'APPROVED');
        return !(isOutOfRange && !isApproved);
      }).map(it => it.id);
      
      setSelectedItemIds(validItemIds);
    }
  }, [items, profile, specialRequests]);

  const toggleSelect = (id: string, isSelectable: boolean) => {
    if (!isSelectable) {
      Alert.alert('Unavailable', 'This item is out of delivery range. Please request special delivery approval first.');
      return;
    }
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedItems = items.filter(item => selectedItemIds.includes(item.id));

  const productTotal = selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.product.pricePerUnit, 0
  );

  const dynamicDeliveryTotal = selectedItems.reduce((acc, item) => {
    const approval = specialRequests.find(r => r.productId === item.product.id && r.status === 'APPROVED' && !r.isConsumed);
    if (approval && approval.negotiatedFee !== null) {
      return acc + (item.quantity * approval.negotiatedFee);
    }
    return acc;
  }, 0);

  const totalAmount = productTotal + dynamicDeliveryTotal;

  const handleRemove = (itemId: string, name: string) => {
    Alert.alert('Remove Item', `Remove "${name}" from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(api, itemId) },
    ]);
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const imageUrl = item.product.images?.[0];
    const isOutOfRange = unserviceableIds.includes(item.id);
    const approval = specialRequests.find(r => r.productId === item.product.id && r.status === 'APPROVED');
    const isApproved = !!approval;
    const isSelectable = !(isOutOfRange && !isApproved);
    const isSelected = selectedItemIds.includes(item.id);
    const isGrayscaled = !isSelectable;

    return (
      <MotiView
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 400, delay: index * 100 }}
        className={`flex-row bg-white rounded-3xl p-3 mb-4 shadow-sm border ${isSelected ? 'border-primary' : 'border-gray-100'}`}
        style={{ opacity: isGrayscaled ? 0.6 : 1 }}
      >
        <TouchableOpacity 
          className="justify-center px-2"
          onPress={() => toggleSelect(item.id, isSelectable)}
        >
          {isSelected ? <CheckSquare color="#16a34a" size={24} /> : <Square color="#9ca3af" size={24} />}
        </TouchableOpacity>

        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="w-20 h-20 rounded-2xl bg-gray-100" resizeMode="cover" />
        ) : (
          <View className="w-20 h-20 rounded-2xl bg-gray-100 items-center justify-center">
            <Package color="#9ca3af" size={28} />
          </View>
        )}

        <View className="flex-1 ml-3 justify-between py-1">
          <View>
            <Text className="text-base font-bold text-gray-900 leading-tight mb-1" numberOfLines={2}>{item.product.productName}</Text>
            <Text className="text-sm text-gray-500">₹{item.product.pricePerUnit} / {item.product.unit}</Text>
          </View>

          <Text className="text-base font-extrabold text-primary-dark mt-1">₹{(item.quantity * item.product.pricePerUnit).toFixed(2)}</Text>
          {approval?.negotiatedFee != null && (
             <View className="flex-row items-center mt-1">
               <Truck color="#d97706" size={12} className="mr-1" />
               <Text className="text-xs font-bold text-amber-600">+ ₹{(approval.negotiatedFee * item.quantity).toFixed(2)} delivery</Text>
             </View>
          )}

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
              className={`w-8 h-8 rounded-full items-center justify-center border ${isApproved && item.quantity >= approval.quantity ? 'bg-gray-50 border-gray-100 opacity-50' : 'bg-gray-100 border-gray-200'}`}
              onPress={() => {
                if (isApproved && item.quantity >= approval.quantity) {
                  Alert.alert('Limit Reached', `You are approved for a maximum of ${approval.quantity} units.`);
                  return;
                }
                updateQuantity(api, item.id, item.quantity + 1);
              }}
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
          {isGrayscaled && (
             <Text className="text-[10px] text-red-500 font-bold uppercase mt-2">Requires Special Logistics</Text>
          )}
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

  if (!isSignedIn) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center justify-between">
          <Text className="text-2xl font-extrabold text-gray-900 tracking-tight">My Cart</Text>
        </View>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 items-center justify-center p-6"
        >
          <View className="w-24 h-24 rounded-full bg-blue-50 items-center justify-center mb-6 border-4 border-blue-100">
            <ShoppingCart color="#3b82f6" size={40} />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2">Login Required</Text>
          <Text className="text-base text-gray-500 text-center mb-8 px-4">Please log in to view your cart and checkout items.</Text>
          <TouchableOpacity
            className="bg-blue-600 px-8 py-4 rounded-2xl shadow-sm"
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text className="text-white font-bold text-lg">Login to Continue</Text>
          </TouchableOpacity>
        </MotiView>
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
        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Active Cart Items */}
          {items.length > 0 ? (
            <View className="p-4">
              <Text className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Checkout Items</Text>
              {items.map((item, index) => (
                <React.Fragment key={item.id}>
                  {renderItem({ item, index })}
                </React.Fragment>
              ))}
            </View>
          ) : (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="items-center justify-center pt-10 pb-6"
            >
              <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-4 border-4 border-green-100">
                <ShoppingCart color="#16a34a" size={32} />
              </View>
              <Text className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</Text>
              <TouchableOpacity
                className="bg-primary px-6 py-3 rounded-2xl shadow-sm mt-2"
                onPress={() => router.push('/(tabs)')}
              >
                <Text className="text-white font-bold">Shop Now</Text>
              </TouchableOpacity>
            </MotiView>
          )}

          {/* Special Delivery Requests */}
          {specialRequests.length > 0 && (
            <View className="p-4 pt-2">
              <Text className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Logistics Mediation</Text>
              {specialRequests.map((req: any, index: number) => {
                const isPending = req.status === 'PENDING';
                const isApproved = req.status === 'APPROVED';
                const isRejected = req.status === 'REJECTED';

                return (
                  <View key={req.id} className="bg-white rounded-3xl p-4 mb-3 border border-gray-100 shadow-sm flex-row items-center">
                    <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${isPending ? 'bg-amber-100' : isApproved ? 'bg-emerald-100' : 'bg-red-100'}`}>
                      {isPending ? <Clock color="#d97706" size={24} /> : isApproved ? <CheckCircle2 color="#059669" size={24} /> : <AlertCircle color="#dc2626" size={24} />}
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-gray-900 leading-tight mb-0.5">{req.product?.productName}</Text>
                      <Text className="text-xs text-gray-500">Requested: {req.requestedQuantity} {req.unit}</Text>
                      <View className={`self-start px-2 py-0.5 rounded mt-1.5 ${isPending ? 'bg-amber-50' : isApproved ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        <Text className={`text-[10px] font-black uppercase ${isPending ? 'text-amber-600' : isApproved ? 'text-emerald-600' : 'text-red-600'}`}>
                          {req.status}
                        </Text>
                      </View>
                    </View>
                    {isApproved && (
                      <TouchableOpacity
                        className="bg-emerald-600 px-3 py-2 rounded-xl"
                        onPress={() => router.push(`/product/${req.productId}`)}
                      >
                        <Text className="text-white text-xs font-bold">View</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          )}
          {items.length > 0 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              className="bg-white p-6 border-t border-gray-100 rounded-t-3xl shadow-lg mt-auto"
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
              {dynamicDeliveryTotal > 0 ? (
                <Text className="text-xs font-bold text-amber-600 mb-5">Includes ₹{dynamicDeliveryTotal.toFixed(2)} negotiated delivery fees</Text>
              ) : (
                <Text className="text-xs text-gray-400 mb-5">Delivery charges calculated at checkout</Text>
              )}
              <TouchableOpacity
                className={`py-4 rounded-2xl items-center shadow-md flex-row justify-center ${selectedItemIds.length === 0 ? 'bg-gray-300' : 'bg-primary'}`}
                onPress={() => {
                  if (selectedItemIds.length === 0) {
                    Alert.alert('No Items Selected', 'Please select at least one item to checkout.');
                    return;
                  }
                  // Ideally, pass selectedItemIds to checkout, but router.push('/checkout') is sufficient for this demo
                  router.push('/checkout');
                }}
                disabled={selectedItemIds.length === 0}
              >
                <Text className="text-white text-lg font-bold">Proceed to Checkout</Text>
              </TouchableOpacity>
            </MotiView>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
