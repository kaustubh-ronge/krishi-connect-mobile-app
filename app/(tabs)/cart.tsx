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
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

const CountdownTimer = ({ expiryDate, onExpire }: { expiryDate: Date, onExpire?: () => void }) => {
  const [timeLeft, setTimeLeft] = React.useState("");

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = expiryDate.getTime() - now.getTime();

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft("Expired");
        if (onExpire) onExpire();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${days}d : ${hours}h : ${mins}m : ${secs}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryDate, onExpire]);

  return <Text className="text-[10px] font-black text-emerald-700">{timeLeft}</Text>;
};

export default function CartScreen() {
  const { isSignedIn } = useAuth();
  const { profile } = useUserStore();
  const { items, loading, error, fetchCart, updateQuantity, removeFromCart } = useCartStore();
  const [specialRequests, setSpecialRequests] = React.useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = React.useState<any[]>([]);
  const api = useApiClient();
  const router = useRouter();

  const [selectedItemIds, setSelectedItemIds] = React.useState<string[]>([]);
  const [unserviceableIds, setUnserviceableIds] = React.useState<string[]>([]);
  const [dynamicFeeData, setDynamicFeeData] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState<'CART' | 'RECOVERIES'>('CART');

  useFocusEffect(
    useCallback(() => {
      if (isSignedIn) {
        fetchCart(api);
        api.get('mobile/v1/special-delivery').then(res => {
          if (res.data?.success) setSpecialRequests(res.data.data || []);
        }).catch(() => { });
        api.get('mobile/v1/orders/pending').then(res => {
          if (res.data?.success) setPendingOrders(res.data.data || []);
        }).catch(() => { });
      }
    }, [isSignedIn])
  );

  // Sync with /orders/fee API
  React.useEffect(() => {
    const fetchFee = async () => {
      if (profile?.lat && profile?.lng && items.length > 0) {
        try {
          // Only fetch fee for selected items to match Web behavior!
          const itemIdsStr = items.map((it: any) => it.id).join(',');
          const selectedItemIdsStr = selectedItemIds.join(',');
          
          // Fetch fee for selected items
          if (selectedItemIds.length > 0) {
            const res = await api.get(`mobile/v1/orders/fee?lat=${profile.lat}&lng=${profile.lng}&itemIds=${selectedItemIdsStr}`);
            if (res.data?.success) setDynamicFeeData(res.data);
          } else {
            setDynamicFeeData(null);
          }

          // Fetch unserviceable status for ALL items so UI can render correctly
          const allRes = await api.get(`mobile/v1/orders/fee?lat=${profile.lat}&lng=${profile.lng}&itemIds=${itemIdsStr}`);
          if (allRes.data?.success) {
            setUnserviceableIds(allRes.data.unserviceableIds || []);
            
            // Auto-select valid items, auto-deselect invalid items
            // (Only run this logic once on initial load or when items change significantly to avoid overriding user's manual selections)
            const outOfRangeIds = allRes.data.unserviceableIds || [];
            
            setSelectedItemIds(prev => {
                const prevSet = new Set(prev);
                const validItemIds = items.filter(it => {
                    const isOutOfRange = outOfRangeIds.includes(it.id);
                    const isApproved = specialRequests.some(r => r.productId === it.product.id && r.status === 'APPROVED');
                    return !(isOutOfRange && !isApproved);
                }).map(it => it.id);
                
                // If this is the first load (prev empty) or we just want to ensure only valid items are selected
                return validItemIds.filter(id => prev.length === 0 || prevSet.has(id));
            });
          }
        } catch (err) {
          console.error("Fee Fetch Error:", err);
        }
      } else {
        setDynamicFeeData(null);
        setUnserviceableIds([]);
      }
    };
    fetchFee();
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

  const dynamicDeliveryTotal = dynamicFeeData?.fee || 0;
  const platformFee = productTotal > 100 ? Math.round(productTotal * 0.03) : 0;
  const totalAmount = productTotal + dynamicDeliveryTotal + platformFee;

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
    const isQuantityExceeded = isApproved && item.quantity > approval.quantity;
    
    // An item is selectable if it's within range OR (it's approved AND hasn't exceeded approved quantity)
    const isSelectable = !(isOutOfRange && !isApproved) && !isQuantityExceeded;
    
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
          {isApproved && (
            <View className="flex-row items-center mt-1 bg-emerald-50 px-2 py-1 rounded-md self-start border border-emerald-100">
              <Clock color="#059669" size={12} className="mr-1" />
              <CountdownTimer 
                expiryDate={new Date(new Date(approval.approvedAt || approval.updatedAt).getTime() + 10 * 24 * 60 * 60 * 1000)}
                onExpire={() => api.get('mobile/v1/special-delivery').then(res => res.data?.success && setSpecialRequests(res.data.data || []))}
              />
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

  const handleResumeOrder = async (orderId: string) => {
    try {
      const payload = {
        action: 'initiateCheckout',
        params: { orderId }
      };
      const response = await api.post('mobile/v1/orders', payload);
      if (response.data?.success && response.data?.data?.razorpayOrderId) {
          const razorpayOrderId = response.data.data.razorpayOrderId;
          const deepLink = Linking.createURL('payment-callback');
          const checkoutUrl = `${process.env.EXPO_PUBLIC_APP_URL?.replace('/api/', '') || 'https://krishi-web-for-mobile-building.vercel.app'}/mobile-checkout?orderId=${orderId}&razorpayOrderId=${razorpayOrderId}&redirectUrl=${encodeURIComponent(deepLink)}`;

          const browserResult = await WebBrowser.openAuthSessionAsync(checkoutUrl, deepLink);
          if (browserResult.type === 'success') {
            if (browserResult.url.includes('status=success')) {
              Alert.alert('Payment Successful ✓', 'Your payment was completed and order resumed!', [
                { text: 'View Orders', onPress: () => { fetchCart(api); router.replace('/orders'); } },
              ]);
            } else {
              Alert.alert('Payment Cancelled', 'Your payment was not completed.');
            }
          }
      } else {
         Alert.alert('Error', response.data?.error || 'Failed to resume order.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'An error occurred while resuming.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center justify-between">
        <Text className="text-2xl font-extrabold text-gray-900 tracking-tight">My Cart</Text>
        {items.length > 0 && activeTab === 'CART' && (
          <View className="bg-green-100 px-3 py-1 rounded-full">
            <Text className="text-sm font-bold text-green-700">{items.length} items</Text>
          </View>
        )}
      </View>

      <View className="bg-white border-b border-gray-100 flex-row">
        <TouchableOpacity 
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'CART' ? 'border-primary' : 'border-transparent'}`}
          onPress={() => setActiveTab('CART')}
        >
          <Text className={`font-bold ${activeTab === 'CART' ? 'text-primary' : 'text-gray-500'}`}>Current Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'RECOVERIES' ? 'border-primary' : 'border-transparent'}`}
          onPress={() => setActiveTab('RECOVERIES')}
        >
          <Text className={`font-bold ${activeTab === 'RECOVERIES' ? 'text-primary' : 'text-gray-500'}`}>Recoveries {pendingOrders.length > 0 && `(${pendingOrders.length})`}</Text>
        </TouchableOpacity>
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
          {activeTab === 'CART' ? (
            <>
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
                      router.push('/checkout');
                    }}
                    disabled={selectedItemIds.length === 0}
                  >
                    <Text className="text-white text-lg font-bold">Proceed to Checkout</Text>
                  </TouchableOpacity>
                </MotiView>
              )}
            </>
          ) : (
            <View className="p-4">
              {pendingOrders.length === 0 ? (
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="items-center justify-center pt-10 pb-6"
                >
                  <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-4 border-4 border-blue-100">
                    <Clock color="#3b82f6" size={32} />
                  </View>
                  <Text className="text-xl font-bold text-gray-900 mb-2">No Recoveries</Text>
                  <Text className="text-base text-gray-500 text-center px-4">You do not have any pending or failed orders to recover.</Text>
                </MotiView>
              ) : (
                <>
                  <Text className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Pending Orders</Text>
                  {pendingOrders.map(order => {
                    const expiryDate = new Date(new Date(order.createdAt).getTime() + 30 * 60 * 1000);
                    return (
                      <View key={order.id} className="bg-white rounded-3xl p-4 mb-4 border border-gray-100 shadow-sm">
                        <View className="flex-row items-center justify-between mb-3 border-b border-gray-50 pb-3">
                          <View>
                            <Text className="text-sm font-bold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</Text>
                            <Text className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</Text>
                          </View>
                          <View className="bg-amber-50 px-2 py-1 rounded items-end">
                            <Text className="text-xs font-bold text-amber-600 mb-1">PENDING</Text>
                            <CountdownTimer 
                              expiryDate={expiryDate} 
                              onExpire={() => {
                                // Just re-fetch pending orders which might be expired on backend, 
                                // or we could filter it out locally if we want immediately
                                api.get('mobile/v1/orders/pending').then(res => res.data?.success && setPendingOrders(res.data.data || []));
                              }} 
                            />
                          </View>
                        </View>
                        
                        <View className="mb-4">
                          {order.items?.map((item: any) => (
                            <View key={item.id} className="flex-row items-center mb-2">
                              <Text className="text-sm text-gray-600 flex-1" numberOfLines={1}>{item.product?.productName}</Text>
                              <Text className="text-sm font-bold text-gray-900">x{item.quantity}</Text>
                            </View>
                          ))}
                        </View>

                        <View className="flex-row items-center justify-between mb-4 bg-gray-50 p-3 rounded-xl">
                          <Text className="text-sm font-semibold text-gray-600">Total Amount</Text>
                          <Text className="text-lg font-black text-primary-dark">₹{order.totalAmount.toFixed(2)}</Text>
                        </View>

                        <View className="flex-row gap-2 mt-2">
                          <TouchableOpacity 
                            className="flex-1 bg-red-50 py-3 rounded-xl items-center border border-red-100"
                            onPress={async () => {
                              Alert.alert('Start Fresh', 'Are you sure you want to cancel this pending order?', [
                                { text: 'No', style: 'cancel' },
                                { text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
                                  try {
                                    await api.post('mobile/v1/orders', { action: 'cancelPending', orderId: order.id });
                                    api.get('mobile/v1/orders/pending').then(res => res.data?.success && setPendingOrders(res.data.data || []));
                                  } catch (e) {}
                                }}
                              ])
                            }}
                          >
                            <Text className="text-red-600 font-bold text-sm">Start Fresh</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            className={`flex-1 py-3 rounded-xl items-center ${new Date() > expiryDate ? 'bg-gray-300' : 'bg-primary'}`}
                            onPress={() => handleResumeOrder(order.id)}
                            disabled={new Date() > expiryDate}
                          >
                            <Text className="text-white font-bold text-sm">Resume Order</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
