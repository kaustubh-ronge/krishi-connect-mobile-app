// // import React, { useCallback } from 'react';
// // import {
// //   View, Text, FlatList, TouchableOpacity,
// //   ActivityIndicator, Image, Alert,
// // } from 'react-native';
// // import { SafeAreaView } from 'react-native-safe-area-context';
// // import { useFocusEffect, useRouter } from 'expo-router';
// // import { useCartStore } from '@/store/cartStore';
// // import { useUserStore } from '@/store/userStore';
// // import { useApiClient } from '@/services/api';
// // import { calculateDistance } from '@/lib/apiHelpers';
// // import { Plus, Minus, Trash2, Package, ShoppingCart, Clock, CheckCircle2, AlertCircle, Square, CheckSquare, Truck } from 'lucide-react-native';
// // import { MotiView, ScrollView } from 'moti';
// // import { useAuth } from '@clerk/clerk-expo';
// // import SpecialDeliveryModal from '@/components/SpecialDeliveryModal';
// // import * as WebBrowser from 'expo-web-browser';
// // import * as Linking from 'expo-linking';

// // const computeTimeLeft = (expiryDate: Date): string => {
// //   const now = new Date();
// //   const diff = expiryDate.getTime() - now.getTime();
// //   if (diff <= 0) return "Expired";
// //   const days = Math.floor(diff / (1000 * 60 * 60 * 24));
// //   const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
// //   const mins = Math.floor((diff / 1000 / 60) % 60);
// //   const secs = Math.floor((diff / 1000) % 60);
// //   return `${days}d : ${hours}h : ${mins}m : ${secs}s`;
// // };

// // const CountdownTimer = ({ expiryDate, onExpire }: { expiryDate: Date, onExpire?: () => void }) => {
// //   // Initialize immediately so there is no blank flash on first render
// //   const [timeLeft, setTimeLeft] = React.useState(() => computeTimeLeft(expiryDate));

// //   React.useEffect(() => {
// //     // Update immediately in case expiryDate changed
// //     setTimeLeft(computeTimeLeft(expiryDate));

// //     const interval = setInterval(() => {
// //       const value = computeTimeLeft(expiryDate);
// //       setTimeLeft(value);
// //       if (value === "Expired") {
// //         clearInterval(interval);
// //         if (onExpire) onExpire();
// //       }
// //     }, 1000);

// //     return () => clearInterval(interval);
// //   }, [expiryDate, onExpire]);

// //   return <Text className="text-[10px] font-black text-emerald-700">{timeLeft}</Text>;
// // };

// // export default function CartScreen() {
// //   const { isSignedIn } = useAuth();
// //   const { profile } = useUserStore();
// //   const { items, loading, error, fetchCart, updateQuantity, removeFromCart } = useCartStore();
// //   const [specialRequests, setSpecialRequests] = React.useState<any[]>([]);
// //   const [pendingOrders, setPendingOrders] = React.useState<any[]>([]);
// //   const [isSpecialDeliveryModalVisible, setSpecialDeliveryModalVisible] = React.useState(false);
// //   const [activeProductForMediation, setActiveProductForMediation] = React.useState<any>(null);
// //   const api = useApiClient();
// //   const router = useRouter();

// //   const deleteRequest = async (id: string) => {
// //     try {
// //       const res = await api.delete(`mobile/v1/special-delivery?id=${id}`);
// //       if (res?.success) {
// //         api.get('mobile/v1/special-delivery').then((res: any) => res?.success && setSpecialRequests(res.data || []));
// //       }
// //     } catch (e: any) {
// //       Alert.alert('Error', e.message || 'Failed to cancel request');
// //     }
// //   };

// //   const [selectedItemIds, setSelectedItemIds] = React.useState<string[]>([]);
// //   const [unserviceableIds, setUnserviceableIds] = React.useState<string[]>([]);
// //   const [dynamicFeeData, setDynamicFeeData] = React.useState<any>(null);
// //   const [activeTab, setActiveTab] = React.useState<'CART' | 'RECOVERIES'>('CART');

// //   useFocusEffect(
// //     useCallback(() => {
// //       if (isSignedIn) {
// //         fetchCart(api);
// //         api.get('mobile/v1/special-delivery').then((res: any) => {
// //           // api client returns the JSON body directly: { success, data }
// //           if (res?.success) setSpecialRequests(res.data || []);
// //         }).catch(() => { });
// //         api.get('mobile/v1/orders/pending').then((res: any) => {
// //           if (res?.success) setPendingOrders(res.data || []);
// //         }).catch(() => { });
// //       }
// //     }, [isSignedIn])
// //   );

// //   // Sync with /orders/fee API
// //   React.useEffect(() => {
// //     const fetchFee = async () => {
// //       if (profile?.lat && profile?.lng && items.length > 0) {
// //         try {
// //           // Only fetch fee for selected items to match Web behavior!
// //           const itemIdsStr = items.map((it: any) => it.id).join(',');
// //           const selectedItemIdsStr = selectedItemIds.join(',');

// //           // Fetch fee for selected items
// //           if (selectedItemIds.length > 0) {
// //             const res = await api.get(`mobile/v1/orders/fee?lat=${profile.lat}&lng=${profile.lng}&itemIds=${selectedItemIdsStr}`);
// //             if (res?.success) setDynamicFeeData(res);
// //           } else {
// //             setDynamicFeeData(null);
// //           }

// //           // Fetch unserviceable status for ALL items so UI can render correctly
// //           const allRes = await api.get(`mobile/v1/orders/fee?lat=${profile.lat}&lng=${profile.lng}&itemIds=${itemIdsStr}`);
// //           if (allRes?.success) {
// //             setUnserviceableIds(allRes.unserviceableIds || []);

// //             // Auto-select valid items, auto-deselect invalid items
// //             // (Only run this logic once on initial load or when items change significantly to avoid overriding user's manual selections)
// //             const outOfRangeIds = allRes.unserviceableIds || [];

// //             setSelectedItemIds(prev => {
// //               const prevSet = new Set(prev);
// //               const validItemIds = items.filter(it => {
// //                 const isOutOfRange = outOfRangeIds.includes(it.id);
// //                 const isApproved = specialRequests.some(r => r.productId === it.product.id && r.status === 'APPROVED');
// //                 return !(isOutOfRange && !isApproved);
// //               }).map(it => it.id);

// //               // If this is the first load (prev empty) or we just want to ensure only valid items are selected
// //               return validItemIds.filter(id => prev.length === 0 || prevSet.has(id));
// //             });
// //           }
// //         } catch (err) {
// //           console.error("Fee Fetch Error:", err);
// //         }
// //       } else {
// //         setDynamicFeeData(null);
// //         setUnserviceableIds([]);
// //       }
// //     };
// //     fetchFee();
// //   }, [items, profile, specialRequests]);

// //   const toggleSelect = (id: string, isSelectable: boolean) => {
// //     if (!isSelectable) {
// //       Alert.alert('Unavailable', 'This item is out of delivery range. Please request special delivery approval first.');
// //       return;
// //     }
// //     setSelectedItemIds(prev =>
// //       prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
// //     );
// //   };

// //   const selectedItems = items.filter(item => selectedItemIds.includes(item.id));

// //   const productTotal = selectedItems.reduce(
// //     (sum, item) => sum + item.quantity * item.product.pricePerUnit, 0
// //   );

// //   const dynamicDeliveryTotal = dynamicFeeData?.fee || 0;
// //   const platformFee = productTotal > 100 ? Math.round(productTotal * 0.03) : 0;
// //   const totalAmount = productTotal + dynamicDeliveryTotal + platformFee;

// //   const handleRemove = (itemId: string, name: string) => {
// //     Alert.alert('Remove Item', `Remove "${name}" from cart?`, [
// //       { text: 'Cancel', style: 'cancel' },
// //       { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(api, itemId) },
// //     ]);
// //   };

// //   const renderItem = ({ item, index }: { item: any; index: number }) => {
// //     const imageUrl = item.product.images?.[0];
// //     const isOutOfRange = unserviceableIds.includes(item.id);
// //     const activeRequest = specialRequests.find((r: any) => r.productId === item.product.id && !r.isConsumed);
// //     const isApproved = activeRequest?.status === 'APPROVED';
// //     const isPendingReq = activeRequest?.status === 'PENDING';
// //     const isRejected = activeRequest?.status === 'REJECTED';
// //     const isQuantityExceeded = isApproved && item.quantity > activeRequest.quantity;

// //     // An item is selectable if it's within range OR (it's approved AND hasn't exceeded approved quantity)
// //     const isSelectable = !(isOutOfRange && !isApproved) && !isQuantityExceeded && !isRejected;

// //     const isSelected = selectedItemIds.includes(item.id);
// //     const isGrayscaled = !isSelectable;

// //     // Quantity control locks — match web handleUpdateQty logic
// //     const minQty = item.product.minOrderQuantity || 1;
// //     const availableStock = item.product.availableStock ?? Infinity;
// //     const atApprovalLimit = isApproved && item.quantity >= activeRequest.quantity;
// //     const atStockLimit = item.quantity >= availableStock;
// //     const incrementLocked = atApprovalLimit || atStockLimit;
// //     const decrementLocked = item.quantity <= minQty;

// //     return (
// //       <MotiView
// //         from={{ opacity: 0, translateX: -20 }}
// //         animate={{ opacity: 1, translateX: 0 }}
// //         transition={{ type: 'timing', duration: 400, delay: index * 100 }}
// //         className={`flex-row bg-white rounded-3xl p-3 mb-4 shadow-sm border ${isSelected ? 'border-primary' : 'border-gray-100'}`}
// //         style={{ opacity: isGrayscaled ? 0.6 : 1 }}
// //       >
// //         <TouchableOpacity
// //           className="justify-center px-2"
// //           onPress={() => toggleSelect(item.id, isSelectable)}
// //         >
// //           {isSelected ? <CheckSquare color="#16a34a" size={24} /> : <Square color="#9ca3af" size={24} />}
// //         </TouchableOpacity>

// //         {imageUrl ? (
// //           <Image source={{ uri: imageUrl }} className="w-20 h-20 rounded-2xl bg-gray-100" resizeMode="cover" />
// //         ) : (
// //           <View className="w-20 h-20 rounded-2xl bg-gray-100 items-center justify-center">
// //             <Package color="#9ca3af" size={28} />
// //           </View>
// //         )}

// //         <View className="flex-1 ml-3 justify-between py-1">
// //           <View>
// //             <Text className="text-base font-bold text-gray-900 leading-tight mb-1" numberOfLines={2}>{item.product.productName}</Text>
// //             <Text className="text-sm text-gray-500">₹{item.product.pricePerUnit} / {item.product.unit}</Text>
// //           </View>

// //           <Text className="text-base font-extrabold text-primary-dark mt-1">₹{(item.quantity * item.product.pricePerUnit).toFixed(2)}</Text>
// //           {activeRequest?.negotiatedFee != null && (
// //             <View className="flex-row items-center mt-1">
// //               <Truck color="#d97706" size={12} className="mr-1" />
// //               <Text className="text-xs font-bold text-amber-600">+ ₹{(activeRequest.negotiatedFee * item.quantity).toFixed(2)} delivery</Text>
// //             </View>
// //           )}
// //           {isApproved && (
// //             <View className="mt-2 bg-emerald-50 border border-emerald-100 rounded-xl p-2">
// //               <View className="flex-row items-center justify-between mb-1">
// //                 <View className="flex-row items-center">
// //                   <Truck color="#059669" size={11} />
// //                   <Text className="text-[10px] font-black uppercase text-emerald-800 ml-1">Special Delivery Approved</Text>
// //                 </View>
// //                 <View className="bg-emerald-100 px-2 py-0.5 rounded">
// //                   <Text className="text-[9px] font-black text-emerald-700 uppercase">Limit: {activeRequest.quantity} {item.product.unit}</Text>
// //                 </View>
// //               </View>
// //               <View className="flex-row items-center bg-white px-2 py-1 rounded-lg border border-emerald-100 self-start">
// //                 <Clock color="#059669" size={10} />
// //                 <Text className="text-[10px] font-black text-emerald-700 ml-1">Expires: </Text>
// //                 <CountdownTimer
// //                   expiryDate={new Date(new Date(activeRequest.approvedAt || activeRequest.updatedAt).getTime() + 10 * 24 * 60 * 60 * 1000)}
// //                   onExpire={() => api.get('mobile/v1/special-delivery').then((res: any) => res?.success && setSpecialRequests(res.data || []))}
// //                 />
// //               </View>
// //               <TouchableOpacity
// //                 className="mt-2 bg-white px-3 py-1.5 rounded-lg border border-emerald-100 self-start"
// //                 onPress={() => deleteRequest(activeRequest.id)}
// //               >
// //                 <Text className="text-emerald-700 font-bold text-[10px] uppercase">Cancel & Re-request</Text>
// //               </TouchableOpacity>
// //             </View>
// //           )}

// //           <View className="flex-row items-center mt-2">
// //             <TouchableOpacity
// //               className={`w-8 h-8 rounded-full items-center justify-center border ${decrementLocked ? 'bg-gray-50 border-gray-100 opacity-40' : 'bg-gray-100 border-gray-200'
// //                 }`}
// //               disabled={decrementLocked}
// //               onPress={() => {
// //                 if (item.quantity > minQty) {
// //                   updateQuantity(api, item.id, item.quantity - 1);
// //                 } else {
// //                   handleRemove(item.id, item.product.productName);
// //                 }
// //               }}
// //             >
// //               <Minus size={16} color={decrementLocked ? '#d1d5db' : '#374151'} />
// //             </TouchableOpacity>

// //             <Text className="text-base font-bold mx-4 text-gray-800">{item.quantity}</Text>

// //             <TouchableOpacity
// //               className={`w-8 h-8 rounded-full items-center justify-center border ${incrementLocked ? 'bg-gray-50 border-gray-100 opacity-40' : 'bg-gray-100 border-gray-200'
// //                 }`}
// //               disabled={incrementLocked}
// //               onPress={() => updateQuantity(api, item.id, item.quantity + 1)}
// //             >
// //               <Plus size={16} color={incrementLocked ? '#d1d5db' : '#374151'} />
// //             </TouchableOpacity>

// //             <TouchableOpacity
// //               className="ml-auto p-2"
// //               onPress={() => handleRemove(item.id, item.product.productName)}
// //             >
// //               <Trash2 size={20} color="#ef4444" />
// //             </TouchableOpacity>
// //           </View>
// //           {isPendingReq && (
// //             <View className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
// //               <View className="flex-row items-center justify-between mb-2">
// //                 <View className="flex-row items-center">
// //                   <Clock color="#d97706" size={14} />
// //                   <Text className="text-xs font-bold text-amber-800 ml-2">Mediation in Progress</Text>
// //                 </View>
// //                 <View className="bg-amber-100 px-2 py-1 rounded">
// //                   <Text className="text-[10px] font-black text-amber-700 uppercase">Pending</Text>
// //                 </View>
// //               </View>
// //               <Text className="text-[11px] text-amber-700 mb-2 leading-tight">We are negotiating delivery with logistics partners. Please check back later.</Text>
// //               <TouchableOpacity
// //                 className="bg-white px-3 py-2 rounded-lg border border-amber-200 self-start"
// //                 onPress={() => deleteRequest(activeRequest.id)}
// //               >
// //                 <Text className="text-amber-700 font-bold text-xs">Cancel Request</Text>
// //               </TouchableOpacity>
// //             </View>
// //           )}

// //           {isRejected && (
// //             <View className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3">
// //               <View className="flex-row items-center justify-between mb-2">
// //                 <View className="flex-row items-center">
// //                   <AlertCircle color="#dc2626" size={14} />
// //                   <Text className="text-xs font-bold text-red-800 ml-2">Mediation Rejected</Text>
// //                 </View>
// //                 <View className="bg-red-100 px-2 py-1 rounded">
// //                   <Text className="text-[10px] font-black text-red-700 uppercase">Locked</Text>
// //                 </View>
// //               </View>
// //               <Text className="text-[11px] text-red-700 mb-2 leading-tight">Delivery is unavailable for this quantity/location. Try modifying your order or checking other sellers.</Text>
// //               <TouchableOpacity
// //                 className="bg-white px-3 py-2 rounded-lg border border-red-200 self-start"
// //                 onPress={() => deleteRequest(activeRequest.id)}
// //               >
// //                 <Text className="text-red-700 font-bold text-xs">Clear & Retry</Text>
// //               </TouchableOpacity>
// //             </View>
// //           )}

// //           {isOutOfRange && !activeRequest && (
// //             <View className="mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
// //               <View className="flex-row items-center mb-1">
// //                 <Truck color="#2563eb" size={14} />
// //                 <Text className="text-xs font-bold text-blue-800 ml-2">Out of Delivery Range</Text>
// //               </View>
// //               <Text className="text-[11px] text-blue-700 mb-2 leading-tight">This seller is outside our standard radius. Request special delivery to proceed.</Text>
// //               <TouchableOpacity
// //                 className="bg-blue-600 px-3 py-2 rounded-lg self-start mt-1"
// //                 onPress={() => {
// //                   setActiveProductForMediation(item.product);
// //                   setSpecialDeliveryModalVisible(true);
// //                 }}
// //               >
// //                 <Text className="text-white font-bold text-xs">Request Mediation</Text>
// //               </TouchableOpacity>
// //             </View>
// //           )}
// //         </View>
// //       </MotiView>
// //     );
// //   };

// //   if (loading && items.length === 0) {
// //     return (
// //       <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
// //         <ActivityIndicator size="large" color="#16a34a" />
// //       </SafeAreaView>
// //     );
// //   }

// //   if (!isSignedIn) {
// //     return (
// //       <SafeAreaView className="flex-1 bg-gray-50">
// //         <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center justify-between">
// //           <Text className="text-2xl font-extrabold text-gray-900 tracking-tight">My Cart</Text>
// //         </View>
// //         <MotiView
// //           from={{ opacity: 0, scale: 0.9 }}
// //           animate={{ opacity: 1, scale: 1 }}
// //           className="flex-1 items-center justify-center p-6"
// //         >
// //           <View className="w-24 h-24 rounded-full bg-blue-50 items-center justify-center mb-6 border-4 border-blue-100">
// //             <ShoppingCart color="#3b82f6" size={40} />
// //           </View>
// //           <Text className="text-2xl font-bold text-gray-900 mb-2">Login Required</Text>
// //           <Text className="text-base text-gray-500 text-center mb-8 px-4">Please log in to view your cart and checkout items.</Text>
// //           <TouchableOpacity
// //             className="bg-blue-600 px-8 py-4 rounded-2xl shadow-sm"
// //             onPress={() => router.push('/(auth)/sign-in')}
// //           >
// //             <Text className="text-white font-bold text-lg">Login to Continue</Text>
// //           </TouchableOpacity>
// //         </MotiView>
// //       </SafeAreaView>
// //     );
// //   }

// //   const handleResumeOrder = async (orderId: string) => {
// //     try {
// //       const payload = {
// //         action: 'initiateCheckout',
// //         params: { orderId }
// //       };
// //       const response = await api.post('mobile/v1/orders', payload);
// //       if (response.data?.success && response.data?.data?.razorpayOrderId) {
// //         const razorpayOrderId = response.data.data.razorpayOrderId;
// //         const deepLink = Linking.createURL('payment-callback');
// //         const checkoutUrl = `${process.env.EXPO_PUBLIC_APP_URL?.replace('/api/', '') || 'https://krishi-web-for-mobile-building.vercel.app'}/mobile-checkout?orderId=${orderId}&razorpayOrderId=${razorpayOrderId}&redirectUrl=${encodeURIComponent(deepLink)}`;

// //         const browserResult = await WebBrowser.openAuthSessionAsync(checkoutUrl, deepLink);
// //         if (browserResult.type === 'success') {
// //           if (browserResult.url.includes('status=success')) {
// //             Alert.alert('Payment Successful ✓', 'Your payment was completed and order resumed!', [
// //               { text: 'View Orders', onPress: () => { fetchCart(api); router.replace('/orders'); } },
// //             ]);
// //           } else {
// //             Alert.alert('Payment Cancelled', 'Your payment was not completed.');
// //           }
// //         }
// //       } else {
// //         Alert.alert('Error', response.data?.error || 'Failed to resume order.');
// //       }
// //     } catch (e: any) {
// //       Alert.alert('Error', e.message || 'An error occurred while resuming.');
// //     }
// //   };

// //   return (
// //     <SafeAreaView className="flex-1 bg-gray-50">
// //       <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center justify-between">
// //         <Text className="text-2xl font-extrabold text-gray-900 tracking-tight">My Cart</Text>
// //         {items.length > 0 && activeTab === 'CART' && (
// //           <View className="bg-green-100 px-3 py-1 rounded-full">
// //             <Text className="text-sm font-bold text-green-700">{items.length} items</Text>
// //           </View>
// //         )}
// //       </View>

// //       <View className="bg-white border-b border-gray-100 flex-row">
// //         <TouchableOpacity
// //           className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'CART' ? 'border-primary' : 'border-transparent'}`}
// //           onPress={() => setActiveTab('CART')}
// //         >
// //           <Text className={`font-bold ${activeTab === 'CART' ? 'text-primary' : 'text-gray-500'}`}>Current Cart</Text>
// //         </TouchableOpacity>
// //         <TouchableOpacity
// //           className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'RECOVERIES' ? 'border-primary' : 'border-transparent'}`}
// //           onPress={() => setActiveTab('RECOVERIES')}
// //         >
// //           <Text className={`font-bold ${activeTab === 'RECOVERIES' ? 'text-primary' : 'text-gray-500'}`}>Recoveries {pendingOrders.length > 0 && `(${pendingOrders.length})`}</Text>
// //         </TouchableOpacity>
// //       </View>

// //       {error ? (
// //         <View className="flex-1 items-center justify-center p-6">
// //           <Text className="text-red-500 text-base text-center mb-4">{error}</Text>
// //           <TouchableOpacity className="bg-primary px-6 py-3 rounded-xl" onPress={() => fetchCart(api)}>
// //             <Text className="text-white font-bold">Retry</Text>
// //           </TouchableOpacity>
// //         </View>
// //       ) : (
// //         <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 20 }}>
// //           {activeTab === 'CART' ? (
// //             <>
// //               {/* Active Cart Items */}
// //               {items.length > 0 ? (
// //                 <View className="p-4">
// //                   <Text className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Checkout Items</Text>
// //                   {items.map((item, index) => (
// //                     <React.Fragment key={item.id}>
// //                       {renderItem({ item, index })}
// //                     </React.Fragment>
// //                   ))}
// //                 </View>
// //               ) : (
// //                 <MotiView
// //                   from={{ opacity: 0, scale: 0.9 }}
// //                   animate={{ opacity: 1, scale: 1 }}
// //                   className="items-center justify-center pt-10 pb-6"
// //                 >
// //                   <View className="w-20 h-20 rounded-full bg-green-50 items-center justify-center mb-4 border-4 border-green-100">
// //                     <ShoppingCart color="#16a34a" size={32} />
// //                   </View>
// //                   <Text className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</Text>
// //                   <TouchableOpacity
// //                     className="bg-primary px-6 py-3 rounded-2xl shadow-sm mt-2"
// //                     onPress={() => router.push('/(tabs)')}
// //                   >
// //                     <Text className="text-white font-bold">Shop Now</Text>
// //                   </TouchableOpacity>
// //                 </MotiView>
// //               )}

// //               {/* Special Delivery Requests */}
// //               {specialRequests.length > 0 && (
// //                 <View className="p-4 pt-2">
// //                   <Text className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Logistics Mediation</Text>
// //                   {specialRequests.map((req: any, index: number) => {
// //                     const isPending = req.status === 'PENDING';
// //                     const isApproved = req.status === 'APPROVED';
// //                     const isRejected = req.status === 'REJECTED';

// //                     return (
// //                       <View key={req.id} className="bg-white rounded-3xl p-4 mb-3 border border-gray-100 shadow-sm flex-row items-center">
// //                         <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${isPending ? 'bg-amber-100' : isApproved ? 'bg-emerald-100' : 'bg-red-100'}`}>
// //                           {isPending ? <Clock color="#d97706" size={24} /> : isApproved ? <CheckCircle2 color="#059669" size={24} /> : <AlertCircle color="#dc2626" size={24} />}
// //                         </View>
// //                         <View className="flex-1">
// //                           <Text className="text-sm font-bold text-gray-900 leading-tight mb-0.5">{req.product?.productName}</Text>
// //                           <Text className="text-xs text-gray-500">Requested: {req.requestedQuantity} {req.unit}</Text>
// //                           <View className={`self-start px-2 py-0.5 rounded mt-1.5 ${isPending ? 'bg-amber-50' : isApproved ? 'bg-emerald-50' : 'bg-red-50'}`}>
// //                             <Text className={`text-[10px] font-black uppercase ${isPending ? 'text-amber-600' : isApproved ? 'text-emerald-600' : 'text-red-600'}`}>
// //                               {req.status}
// //                             </Text>
// //                           </View>
// //                         </View>
// //                         {isApproved && (
// //                           <TouchableOpacity
// //                             className="bg-emerald-600 px-3 py-2 rounded-xl"
// //                             onPress={() => router.push(`/product/${req.productId}`)}
// //                           >
// //                             <Text className="text-white text-xs font-bold">View</Text>
// //                           </TouchableOpacity>
// //                         )}
// //                       </View>
// //                     );
// //                   })}
// //                 </View>
// //               )}
// //               {items.length > 0 && (
// //                 <MotiView
// //                   from={{ opacity: 0, translateY: 20 }}
// //                   animate={{ opacity: 1, translateY: 0 }}
// //                   className="bg-white p-6 border-t border-gray-100 rounded-t-3xl shadow-lg mt-auto"
// //                   style={{
// //                     shadowColor: '#000',
// //                     shadowOffset: { width: 0, height: -4 },
// //                     shadowOpacity: 0.05,
// //                     shadowRadius: 8,
// //                     elevation: 10,
// //                   }}
// //                 >
// //                   <View className="flex-row justify-between items-center mb-1">
// //                     <Text className="text-base text-gray-500 font-medium">Total</Text>
// //                     <Text className="text-2xl font-extrabold text-gray-900">₹{totalAmount.toFixed(2)}</Text>
// //                   </View>
// //                   {dynamicDeliveryTotal > 0 ? (
// //                     <Text className="text-xs font-bold text-amber-600 mb-5">Includes ₹{dynamicDeliveryTotal.toFixed(2)} negotiated delivery fees</Text>
// //                   ) : (
// //                     <Text className="text-xs text-gray-400 mb-5">Delivery charges calculated at checkout</Text>
// //                   )}
// //                   <TouchableOpacity
// //                     className={`py-4 rounded-2xl items-center shadow-md flex-row justify-center ${selectedItemIds.length === 0 ? 'bg-gray-300' : 'bg-primary'}`}
// //                     onPress={() => {
// //                       if (selectedItemIds.length === 0) {
// //                         Alert.alert('No Items Selected', 'Please select at least one item to checkout.');
// //                         return;
// //                       }
// //                       router.push('/checkout');
// //                     }}
// //                     disabled={selectedItemIds.length === 0}
// //                   >
// //                     <Text className="text-white text-lg font-bold">Proceed to Checkout</Text>
// //                   </TouchableOpacity>
// //                 </MotiView>
// //               )}
// //             </>
// //           ) : (
// //             <View className="p-4">
// //               {pendingOrders.length === 0 ? (
// //                 <MotiView
// //                   from={{ opacity: 0, scale: 0.9 }}
// //                   animate={{ opacity: 1, scale: 1 }}
// //                   className="items-center justify-center pt-10 pb-6"
// //                 >
// //                   <View className="w-20 h-20 rounded-full bg-blue-50 items-center justify-center mb-4 border-4 border-blue-100">
// //                     <Clock color="#3b82f6" size={32} />
// //                   </View>
// //                   <Text className="text-xl font-bold text-gray-900 mb-2">No Recoveries</Text>
// //                   <Text className="text-base text-gray-500 text-center px-4">You do not have any pending or failed orders to recover.</Text>
// //                 </MotiView>
// //               ) : (
// //                 <>
// //                   <Text className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Pending Orders</Text>
// //                   {pendingOrders.map(order => {
// //                     const expiryDate = new Date(new Date(order.createdAt).getTime() + 30 * 60 * 1000);
// //                     return (
// //                       <View key={order.id} className="bg-white rounded-3xl p-4 mb-4 border border-gray-100 shadow-sm">
// //                         <View className="flex-row items-center justify-between mb-3 border-b border-gray-50 pb-3">
// //                           <View>
// //                             <Text className="text-sm font-bold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</Text>
// //                             <Text className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</Text>
// //                           </View>
// //                           <View className="bg-amber-50 px-2 py-1 rounded items-end">
// //                             <Text className="text-xs font-bold text-amber-600 mb-1">PENDING</Text>
// //                             <CountdownTimer
// //                               expiryDate={expiryDate}
// //                               onExpire={() => {
// //                                 // Just re-fetch pending orders which might be expired on backend, 
// //                                 // or we could filter it out locally if we want immediately
// //                                 api.get('mobile/v1/orders/pending').then((res: any) => res?.success && setPendingOrders(res.data || []));
// //                               }}
// //                             />
// //                           </View>
// //                         </View>

// //                         <View className="mb-4">
// //                           {order.items?.map((item: any) => (
// //                             <View key={item.id} className="flex-row items-center mb-2">
// //                               <Text className="text-sm text-gray-600 flex-1" numberOfLines={1}>{item.product?.productName}</Text>
// //                               <Text className="text-sm font-bold text-gray-900">x{item.quantity}</Text>
// //                             </View>
// //                           ))}
// //                         </View>

// //                         <View className="flex-row items-center justify-between mb-4 bg-gray-50 p-3 rounded-xl">
// //                           <Text className="text-sm font-semibold text-gray-600">Total Amount</Text>
// //                           <Text className="text-lg font-black text-primary-dark">₹{order.totalAmount.toFixed(2)}</Text>
// //                         </View>

// //                         <View className="flex-row gap-2 mt-2">
// //                           <TouchableOpacity
// //                             className="flex-1 bg-red-50 py-3 rounded-xl items-center border border-red-100"
// //                             onPress={async () => {
// //                               Alert.alert('Start Fresh', 'Are you sure you want to cancel this pending order?', [
// //                                 { text: 'No', style: 'cancel' },
// //                                 {
// //                                   text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
// //                                     try {
// //                                       await api.post('mobile/v1/orders', { action: 'cancelPending', orderId: order.id });
// //                                       api.get('mobile/v1/orders/pending').then((res: any) => res?.success && setPendingOrders(res.data || []));
// //                                     } catch (e) { }
// //                                   }
// //                                 }
// //                               ])
// //                             }}
// //                           >
// //                             <Text className="text-red-600 font-bold text-sm">Start Fresh</Text>
// //                           </TouchableOpacity>
// //                           <TouchableOpacity
// //                             className={`flex-1 py-3 rounded-xl items-center ${new Date() > expiryDate ? 'bg-gray-300' : 'bg-primary'}`}
// //                             onPress={() => handleResumeOrder(order.id)}
// //                             disabled={new Date() > expiryDate}
// //                           >
// //                             <Text className="text-white font-bold text-sm">Resume Order</Text>
// //                           </TouchableOpacity>
// //                         </View>
// //                       </View>
// //                     );
// //                   })}
// //                 </>
// //               )}
// //             </View>
// //           )}
// //         </ScrollView>
// //       )}

// //       <SpecialDeliveryModal
// //         visible={isSpecialDeliveryModalVisible}
// //         onClose={() => setSpecialDeliveryModalVisible(false)}
// //         product={activeProductForMediation}
// //         onSuccess={() => {
// //           api.get('mobile/v1/special-delivery').then((res: any) => res?.success && setSpecialRequests(res.data || []));
// //         }}
// //       />
// //     </SafeAreaView>
// //   );
// // }


// import React, { useCallback } from 'react';
// import {
//   View, Text, FlatList, TouchableOpacity,
//   ActivityIndicator, Image, Alert, StyleSheet, Pressable,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useFocusEffect, useRouter } from 'expo-router';
// import { useCartStore } from '@/store/cartStore';
// import { useUserStore } from '@/store/userStore';
// import { useApiClient } from '@/services/api';
// import { calculateDistance } from '@/lib/apiHelpers';
// import { Plus, Minus, Trash2, Package, ShoppingCart, Clock, CheckCircle2, AlertCircle, Square, CheckSquare, Truck, ChevronRight } from 'lucide-react-native';
// import { MotiView, ScrollView, AnimatePresence } from 'moti';
// import { MotiPressable } from 'moti/interactions';
// import { useAuth } from '@clerk/clerk-expo';
// import SpecialDeliveryModal from '@/components/SpecialDeliveryModal';
// import * as WebBrowser from 'expo-web-browser';
// import * as Linking from 'expo-linking';

// const computeTimeLeft = (expiryDate: Date): string => {
//   const now = new Date();
//   const diff = expiryDate.getTime() - now.getTime();
//   if (diff <= 0) return "Expired";
//   const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//   const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
//   const mins = Math.floor((diff / 1000 / 60) % 60);
//   const secs = Math.floor((diff / 1000) % 60);
//   return `${days}d : ${hours}h : ${mins}m : ${secs}s`;
// };

// const CountdownTimer = ({ expiryDate, onExpire }: { expiryDate: Date, onExpire?: () => void }) => {
//   const [timeLeft, setTimeLeft] = React.useState(() => computeTimeLeft(expiryDate));

//   React.useEffect(() => {
//     setTimeLeft(computeTimeLeft(expiryDate));
//     const interval = setInterval(() => {
//       const value = computeTimeLeft(expiryDate);
//       setTimeLeft(value);
//       if (value === "Expired") {
//         clearInterval(interval);
//         if (onExpire) onExpire();
//       }
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [expiryDate, onExpire]);

//   return (
//     <View className="bg-white/80 px-2 py-0.5 rounded-full">
//       <Text className="text-[10px] font-black text-emerald-700">{timeLeft}</Text>
//     </View>
//   );
// };

// // Skeleton placeholder for loading state
// const CartSkeleton = () => (
//   <MotiView
//     from={{ opacity: 0.5 }}
//     animate={{ opacity: 1 }}
//     transition={{ type: 'timing', duration: 800, loop: true }}
//     className="bg-white rounded-2xl p-3 mb-4 mx-4 flex-row"
//   >
//     <View className="w-20 h-20 rounded-xl bg-gray-200" />
//     <View className="flex-1 ml-3">
//       <View className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
//       <View className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
//       <View className="flex-row justify-between items-center">
//         <View className="flex-row gap-2">
//           <View className="w-8 h-8 rounded-full bg-gray-200" />
//           <View className="w-8 h-8 rounded-full bg-gray-200" />
//         </View>
//         <View className="w-10 h-6 bg-gray-200 rounded" />
//       </View>
//     </View>
//   </MotiView>
// );

// export default function CartScreen() {
//   const { isSignedIn } = useAuth();
//   const { profile } = useUserStore();
//   const { items, loading, error, fetchCart, updateQuantity, removeFromCart } = useCartStore();
//   const [specialRequests, setSpecialRequests] = React.useState<any[]>([]);
//   const [pendingOrders, setPendingOrders] = React.useState<any[]>([]);
//   const [isSpecialDeliveryModalVisible, setSpecialDeliveryModalVisible] = React.useState(false);
//   const [activeProductForMediation, setActiveProductForMediation] = React.useState<any>(null);
//   const api = useApiClient();
//   const router = useRouter();

//   const deleteRequest = async (id: string) => {
//     try {
//       const res = await api.delete(`mobile/v1/special-delivery?id=${id}`);
//       if (res?.success) {
//         api.get('mobile/v1/special-delivery').then((res: any) => res?.success && setSpecialRequests(res.data || []));
//       }
//     } catch (e: any) {
//       Alert.alert('Error', e.message || 'Failed to cancel request');
//     }
//   };

//   const [selectedItemIds, setSelectedItemIds] = React.useState<string[]>([]);
//   const [unserviceableIds, setUnserviceableIds] = React.useState<string[]>([]);
//   const [dynamicFeeData, setDynamicFeeData] = React.useState<any>(null);
//   const [activeTab, setActiveTab] = React.useState<'CART' | 'RECOVERIES'>('CART');

//   useFocusEffect(
//     useCallback(() => {
//       if (isSignedIn) {
//         fetchCart(api);
//         api.get('mobile/v1/special-delivery').then((res: any) => {
//           if (res?.success) setSpecialRequests(res.data || []);
//         }).catch(() => { });
//         api.get('mobile/v1/orders/pending').then((res: any) => {
//           if (res?.success) setPendingOrders(res.data || []);
//         }).catch(() => { });
//       }
//     }, [isSignedIn])
//   );

//   // Sync with /orders/fee API
//   React.useEffect(() => {
//     const fetchFee = async () => {
//       if (profile?.lat && profile?.lng && items.length > 0) {
//         try {
//           const itemIdsStr = items.map((it: any) => it.id).join(',');
//           const selectedItemIdsStr = selectedItemIds.join(',');

//           if (selectedItemIds.length > 0) {
//             const res = await api.get(`mobile/v1/orders/fee?lat=${profile.lat}&lng=${profile.lng}&itemIds=${selectedItemIdsStr}`);
//             if (res?.success) setDynamicFeeData(res);
//           } else {
//             setDynamicFeeData(null);
//           }

//           const allRes = await api.get(`mobile/v1/orders/fee?lat=${profile.lat}&lng=${profile.lng}&itemIds=${itemIdsStr}`);
//           if (allRes?.success) {
//             setUnserviceableIds(allRes.unserviceableIds || []);

//             const outOfRangeIds = allRes.unserviceableIds || [];
//             setSelectedItemIds(prev => {
//               const prevSet = new Set(prev);
//               const validItemIds = items.filter(it => {
//                 const isOutOfRange = outOfRangeIds.includes(it.id);
//                 const isApproved = specialRequests.some(r => r.productId === it.product.id && r.status === 'APPROVED');
//                 return !(isOutOfRange && !isApproved);
//               }).map(it => it.id);
//               return validItemIds.filter(id => prev.length === 0 || prevSet.has(id));
//             });
//           }
//         } catch (err) {
//           console.error("Fee Fetch Error:", err);
//         }
//       } else {
//         setDynamicFeeData(null);
//         setUnserviceableIds([]);
//       }
//     };
//     fetchFee();
//   }, [items, profile, specialRequests]);

//   const toggleSelect = (id: string, isSelectable: boolean) => {
//     if (!isSelectable) {
//       Alert.alert('Unavailable', 'This item is out of delivery range. Please request special delivery approval first.');
//       return;
//     }
//     setSelectedItemIds(prev =>
//       prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
//     );
//   };

//   const selectedItems = items.filter(item => selectedItemIds.includes(item.id));

//   const productTotal = selectedItems.reduce(
//     (sum, item) => sum + item.quantity * item.product.pricePerUnit, 0
//   );

//   const dynamicDeliveryTotal = dynamicFeeData?.fee || 0;
//   const platformFee = productTotal > 100 ? Math.round(productTotal * 0.03) : 0;
//   const totalAmount = productTotal + dynamicDeliveryTotal + platformFee;

//   const handleRemove = (itemId: string, name: string) => {
//     Alert.alert('Remove Item', `Remove "${name}" from cart?`, [
//       { text: 'Cancel', style: 'cancel' },
//       { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(api, itemId) },
//     ]);
//   };

//   const renderItem = ({ item, index }: { item: any; index: number }) => {
//     const imageUrl = item.product.images?.[0];
//     const isOutOfRange = unserviceableIds.includes(item.id);
//     const activeRequest = specialRequests.find((r: any) => r.productId === item.product.id && !r.isConsumed);
//     const isApproved = activeRequest?.status === 'APPROVED';
//     const isPendingReq = activeRequest?.status === 'PENDING';
//     const isRejected = activeRequest?.status === 'REJECTED';
//     const isQuantityExceeded = isApproved && item.quantity > activeRequest.quantity;

//     const isSelectable = !(isOutOfRange && !isApproved) && !isQuantityExceeded && !isRejected;
//     const isSelected = selectedItemIds.includes(item.id);
//     const isGrayscaled = !isSelectable;

//     const minQty = isApproved ? 1 : (item.product.minOrderQuantity || 1);
//     const availableStock = item.product.availableStock ?? Infinity;
//     const atApprovalLimit = isApproved && item.quantity >= activeRequest.quantity;
//     const atStockLimit = item.quantity >= availableStock;
//     const incrementLocked = atApprovalLimit || atStockLimit;
//     const decrementLocked = item.quantity <= minQty;

//     return (
//       <MotiView
//         from={{ opacity: 0, translateX: -20 }}
//         animate={{ opacity: 1, translateX: 0 }}
//         transition={{ type: 'timing', duration: 400, delay: index * 80 }}
//         className={`mx-4 bg-white rounded-2xl p-4 mb-4 shadow-sm border ${isSelected ? 'border-green-500' : 'border-gray-100'}`}
//         style={isGrayscaled && { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}
//       >
//         {/* Grayscale overlay label */}
//         {isGrayscaled && (
//           <View className="absolute top-3 right-3 z-10 bg-gray-200/80 px-2 py-0.5 rounded-full">
//             <Text className="text-[10px] font-semibold text-gray-500">Unavailable</Text>
//           </View>
//         )}

//         <View className="flex-row">
//           {/* Image section */}
//           <View className="relative">
//             {imageUrl ? (
//               <Image
//                 source={{ uri: imageUrl }}
//                 className="w-20 h-20 rounded-xl bg-gray-100"
//                 resizeMode="cover"
//                 style={isGrayscaled && { opacity: 0.5 }}
//               />
//             ) : (
//               <View className="w-20 h-20 rounded-xl bg-gray-100 items-center justify-center">
//                 <Package color={isGrayscaled ? "#9ca3af" : "#6b7280"} size={28} />
//               </View>
//             )}
//             {/* Selection checkbox */}
//             <TouchableOpacity
//               className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm"
//               onPress={() => toggleSelect(item.id, isSelectable)}
//               disabled={isGrayscaled}
//             >
//               {isSelected ? (
//                 <CheckSquare color="#16a34a" size={22} />
//               ) : (
//                 <Square color={isGrayscaled ? "#d1d5db" : "#9ca3af"} size={22} />
//               )}
//             </TouchableOpacity>
//           </View>

//           {/* Details */}
//           <View className="flex-1 ml-3">
//             {/* Product name and seller info */}
//             <View className="flex-row justify-between items-start">
//               <Text
//                 className="text-base font-bold text-gray-900 flex-1 mr-2"
//                 numberOfLines={2}
//                 style={isGrayscaled && { color: '#9ca3af' }}
//               >
//                 {item.product.productName}
//               </Text>
//               {/* Approval badge – moved to top right */}
//               {isApproved && (
//                 <View className="bg-emerald-100 px-2 py-0.5 rounded-full">
//                   <Text className="text-[10px] font-bold text-emerald-800">Approved</Text>
//                 </View>
//               )}
//               {isPendingReq && (
//                 <View className="bg-amber-100 px-2 py-0.5 rounded-full">
//                   <Text className="text-[10px] font-bold text-amber-800">Pending</Text>
//                 </View>
//               )}
//               {isRejected && (
//                 <View className="bg-red-100 px-2 py-0.5 rounded-full">
//                   <Text className="text-[10px] font-bold text-red-800">Rejected</Text>
//                 </View>
//               )}
//             </View>

//             {/* Seller name if available */}
//             {item.product.sellerName && (
//               <Text className="text-xs text-gray-400 mt-0.5">{item.product.sellerName}</Text>
//             )}

//             {/* Price per unit */}
//             <Text className="text-sm text-gray-500 mt-1">
//               ₹{item.product.pricePerUnit} / {item.product.unit}
//             </Text>

//             {/* Line total */}
//             <Text className="text-base font-extrabold text-gray-900 mt-1">
//               ₹{(item.quantity * item.product.pricePerUnit).toFixed(2)}
//             </Text>

//             {/* Quantity controls */}
//             <View className="flex-row items-center mt-3">
//               <MotiPressable
//                 onPress={() => {
//                   if (item.quantity > minQty) {
//                     updateQuantity(api, item.id, item.quantity - 1);
//                   } else {
//                     handleRemove(item.id, item.product.productName);
//                   }
//                 }}
//                 disabled={decrementLocked}
//                 animate={({ pressed }: any) => ({
//                   scale: pressed ? 0.9 : 1,
//                 })}
//                 style={[
//                   styles.quantityBtn,
//                   decrementLocked && styles.quantityBtnDisabled,
//                 ]}
//               >
//                 <Minus size={18} color={decrementLocked ? '#d1d5db' : '#374151'} />
//               </MotiPressable>

//               <Text className="text-lg font-bold mx-5 text-gray-800 tabular-nums">{item.quantity}</Text>

//               <MotiPressable
//                 onPress={() => updateQuantity(api, item.id, item.quantity + 1)}
//                 disabled={incrementLocked}
//                 animate={({ pressed }: any) => ({
//                   scale: pressed ? 0.9 : 1,
//                 })}
//                 style={[
//                   styles.quantityBtn,
//                   incrementLocked && styles.quantityBtnDisabled,
//                 ]}
//               >
//                 <Plus size={18} color={incrementLocked ? '#d1d5db' : '#374151'} />
//               </MotiPressable>

//               <MotiPressable
//                 onPress={() => handleRemove(item.id, item.product.productName)}
//                 style={{ marginLeft: 'auto', padding: 8 }}
//                 animate={({ pressed }: any) => ({
//                   scale: pressed ? 0.85 : 1,
//                 })}
//               >
//                 <Trash2 size={22} color="#ef4444" />
//               </MotiPressable>
//             </View>

//             {/* Mediation/Approval details */}
//             {activeRequest?.negotiatedFee != null && (
//               <View className="flex-row items-center mt-2 bg-amber-50 px-2 py-1 rounded-lg self-start">
//                 <Truck color="#d97706" size={12} />
//                 <Text className="text-xs font-bold text-amber-700 ml-1">
//                   + ₹{(activeRequest.negotiatedFee * item.quantity).toFixed(2)} delivery
//                 </Text>
//               </View>
//             )}

//             {isApproved && (
//               <View className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
//                 <View className="flex-row items-center justify-between mb-2">
//                   <View className="flex-row items-center">
//                     <CheckCircle2 color="#059669" size={14} />
//                     <Text className="text-xs font-bold text-emerald-800 ml-1.5">Special Delivery Approved</Text>
//                   </View>
//                   <View className="bg-white px-2 py-0.5 rounded-full">
//                     <Text className="text-[10px] font-black text-emerald-700">
//                       Limit: {activeRequest.quantity} {item.product.unit}
//                     </Text>
//                   </View>
//                 </View>
//                 <View className="flex-row items-center justify-between">
//                   <View className="flex-row items-center">
//                     <Clock color="#059669" size={11} />
//                     <Text className="text-[10px] font-medium text-emerald-700 ml-1">Expires in </Text>
//                   </View>
//                   <CountdownTimer
//                     expiryDate={new Date(new Date(activeRequest.approvedAt || activeRequest.updatedAt).getTime() + 10 * 24 * 60 * 60 * 1000)}
//                     onExpire={() => api.get('mobile/v1/special-delivery').then((res: any) => res?.success && setSpecialRequests(res.data || []))}
//                   />
//                 </View>
//                 <TouchableOpacity
//                   className="mt-2 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 self-start"
//                   onPress={() => deleteRequest(activeRequest.id)}
//                 >
//                   <Text className="text-emerald-700 font-bold text-[10px] uppercase">Cancel & Re-request</Text>
//                 </TouchableOpacity>
//               </View>
//             )}

//             {isPendingReq && (
//               <View className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
//                 <View className="flex-row items-center justify-between mb-2">
//                   <View className="flex-row items-center">
//                     <Clock color="#d97706" size={14} />
//                     <Text className="text-xs font-bold text-amber-800 ml-2">Mediation in Progress</Text>
//                   </View>
//                   <View className="bg-amber-100 px-2 py-0.5 rounded-full">
//                     <Text className="text-[10px] font-black text-amber-700">Pending</Text>
//                   </View>
//                 </View>
//                 <Text className="text-[11px] text-amber-700 mb-2 leading-tight">
//                   We are negotiating delivery with logistics partners. Please check back later.
//                 </Text>
//                 <TouchableOpacity
//                   className="bg-white px-3 py-2 rounded-lg border border-amber-200 self-start"
//                   onPress={() => deleteRequest(activeRequest.id)}
//                 >
//                   <Text className="text-amber-700 font-bold text-xs">Cancel Request</Text>
//                 </TouchableOpacity>
//               </View>
//             )}

//             {isRejected && (
//               <View className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
//                 <View className="flex-row items-center justify-between mb-2">
//                   <View className="flex-row items-center">
//                     <AlertCircle color="#dc2626" size={14} />
//                     <Text className="text-xs font-bold text-red-800 ml-2">Mediation Rejected</Text>
//                   </View>
//                   <View className="bg-red-100 px-2 py-0.5 rounded-full">
//                     <Text className="text-[10px] font-black text-red-700">Locked</Text>
//                   </View>
//                 </View>
//                 <Text className="text-[11px] text-red-700 mb-2 leading-tight">
//                   Delivery is unavailable for this quantity/location. Try modifying your order or checking other sellers.
//                 </Text>
//                 <TouchableOpacity
//                   className="bg-white px-3 py-2 rounded-lg border border-red-200 self-start"
//                   onPress={() => deleteRequest(activeRequest.id)}
//                 >
//                   <Text className="text-red-700 font-bold text-xs">Clear & Retry</Text>
//                 </TouchableOpacity>
//               </View>
//             )}

//             {isOutOfRange && !activeRequest && (
//               <View className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
//                 <View className="flex-row items-center mb-1">
//                   <Truck color="#2563eb" size={14} />
//                   <Text className="text-xs font-bold text-blue-800 ml-2">Out of Delivery Range</Text>
//                 </View>
//                 <Text className="text-[11px] text-blue-700 mb-2 leading-tight">
//                   This seller is outside our standard radius. Request special delivery to proceed.
//                 </Text>
//                 <TouchableOpacity
//                   className="bg-blue-600 px-3 py-2 rounded-lg self-start mt-1"
//                   onPress={() => {
//                     setActiveProductForMediation(item.product);
//                     setSpecialDeliveryModalVisible(true);
//                   }}
//                 >
//                   <Text className="text-white font-bold text-xs">Request Mediation</Text>
//                 </TouchableOpacity>
//               </View>
//             )}
//           </View>
//         </View>
//       </MotiView>
//     );
//   };

//   if (loading && items.length === 0) {
//     return (
//       <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
//         <LinearGradient
//           colors={['#15803d', '#16a34a']}
//           start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//           style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16 }}
//         >
//           <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.4 }}>My Cart</Text>
//         </LinearGradient>
//         <ScrollView contentContainerStyle={{ paddingTop: 20 }}>
//           {[...Array(3)].map((_, i) => <CartSkeleton key={i} />)}
//         </ScrollView>
//       </SafeAreaView>
//     );
//   }

//   if (!isSignedIn) {
//     return (
//       <SafeAreaView className="flex-1 bg-gray-50">
//         <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center justify-between">
//           <Text className="text-2xl font-extrabold text-gray-900 tracking-tight">My Cart</Text>
//         </View>
//         <MotiView
//           from={{ opacity: 0, scale: 0.9 }}
//           animate={{ opacity: 1, scale: 1 }}
//           className="flex-1 items-center justify-center p-6"
//         >
//           <View className="w-24 h-24 rounded-full bg-blue-50 items-center justify-center mb-6 border-4 border-blue-100">
//             <ShoppingCart color="#3b82f6" size={40} />
//           </View>
//           <Text className="text-2xl font-bold text-gray-900 mb-2">Login Required</Text>
//           <Text className="text-base text-gray-500 text-center mb-8 px-4">
//             Please log in to view your cart and checkout items.
//           </Text>
//           <TouchableOpacity
//             className="bg-blue-600 px-8 py-4 rounded-2xl shadow-sm"
//             onPress={() => router.push('/(auth)/sign-in')}
//           >
//             <Text className="text-white font-bold text-lg">Login to Continue</Text>
//           </TouchableOpacity>
//         </MotiView>
//       </SafeAreaView>
//     );
//   }

//   const handleResumeOrder = async (orderId: string) => {
//     try {
//       const payload = {
//         action: 'initiateCheckout',
//         params: { orderId }
//       };
//       const response = await api.post('mobile/v1/orders', payload);
//       if (response.data?.success && response.data?.data?.razorpayOrderId) {
//         const razorpayOrderId = response.data.data.razorpayOrderId;
//         const deepLink = Linking.createURL('payment-callback');
//         const checkoutUrl = `${process.env.EXPO_PUBLIC_APP_URL?.replace('/api/', '') || 'https://krishi-web-for-mobile-building.vercel.app'}/mobile-checkout?orderId=${orderId}&razorpayOrderId=${razorpayOrderId}&redirectUrl=${encodeURIComponent(deepLink)}`;

//         const browserResult = await WebBrowser.openAuthSessionAsync(checkoutUrl, deepLink);
//         if (browserResult.type === 'success') {
//           if (browserResult.url.includes('status=success')) {
//             Alert.alert('Payment Successful ✓', 'Your payment was completed and order resumed!', [
//               { text: 'View Orders', onPress: () => { fetchCart(api); router.replace('/orders'); } },
//             ]);
//           } else {
//             Alert.alert('Payment Cancelled', 'Your payment was not completed.');
//           }
//         }
//       } else {
//         Alert.alert('Error', response.data?.error || 'Failed to resume order.');
//       }
//     } catch (e: any) {
//       Alert.alert('Error', e.message || 'An error occurred while resuming.');
//     }
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
//       <LinearGradient
//         colors={['#15803d', '#16a34a']}
//         start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
//         style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
//       >
//         <View>
//           <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.4 }}>My Cart</Text>
//           {items.length > 0 && activeTab === 'CART' && (
//             <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginTop: 2 }}>
//               {items.length} item{items.length !== 1 ? 's' : ''} in cart
//             </Text>
//           )}
//         </View>
//         {items.length > 0 && activeTab === 'CART' && (
//           <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
//             <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{items.length}</Text>
//           </View>
//         )}
//       </LinearGradient>

//       <View className="bg-white border-b border-gray-100 flex-row">
//         <TouchableOpacity
//           className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'CART' ? 'border-green-600' : 'border-transparent'}`}
//           onPress={() => setActiveTab('CART')}
//         >
//           <Text className={`font-bold text-sm ${activeTab === 'CART' ? 'text-green-600' : 'text-gray-500'}`}>Current Cart</Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           className={`flex-1 py-3 items-center border-b-2 ${activeTab === 'RECOVERIES' ? 'border-green-600' : 'border-transparent'}`}
//           onPress={() => setActiveTab('RECOVERIES')}
//         >
//           <Text className={`font-bold text-sm ${activeTab === 'RECOVERIES' ? 'text-green-600' : 'text-gray-500'}`}>
//             Recoveries {pendingOrders.length > 0 && `(${pendingOrders.length})`}
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {error ? (
//         <View className="flex-1 items-center justify-center p-6">
//           <Text className="text-red-500 text-base text-center mb-4">{error}</Text>
//           <TouchableOpacity className="bg-green-600 px-6 py-3 rounded-xl" onPress={() => fetchCart(api)}>
//             <Text className="text-white font-bold">Retry</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <ScrollView
//           className="flex-1"
//           contentContainerStyle={{ paddingBottom: 140 }}
//           showsVerticalScrollIndicator={false}
//         >
//           {activeTab === 'CART' ? (
//             <>
//               {items.length > 0 ? (
//                 <View className="pt-4 pb-2">
//                   <Text className="px-4 text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Cart Items</Text>
//                   {items.map((item, index) => (
//                     <React.Fragment key={item.id}>
//                       {renderItem({ item, index })}
//                     </React.Fragment>
//                   ))}
//                 </View>
//               ) : (
//                 <MotiView
//                   from={{ opacity: 0, scale: 0.9 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   className="items-center justify-center pt-20 pb-6"
//                 >
//                   <View className="w-24 h-24 rounded-full bg-green-50 items-center justify-center mb-6 border-4 border-green-100">
//                     <ShoppingCart color="#16a34a" size={40} />
//                   </View>
//                   <Text className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</Text>
//                   <Text className="text-sm text-gray-500 mb-6 px-8 text-center">
//                     Looks like you haven’t added anything yet. Explore our marketplace and find something fresh!
//                   </Text>
//                   <TouchableOpacity
//                     className="bg-green-600 px-8 py-4 rounded-2xl shadow-sm"
//                     onPress={() => router.push('/(tabs)')}
//                   >
//                     <Text className="text-white font-bold text-lg">Browse Products</Text>
//                   </TouchableOpacity>
//                 </MotiView>
//               )}

//               {specialRequests.length > 0 && (
//                 <View className="px-4 pt-2 pb-4">
//                   <Text className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Logistics Mediation</Text>
//                   {specialRequests.map((req: any, index: number) => {
//                     const isPending = req.status === 'PENDING';
//                     const isApproved = req.status === 'APPROVED';
//                     const isRejected = req.status === 'REJECTED';
//                     return (
//                       <View key={req.id} className="bg-white rounded-2xl p-4 mb-3 border border-gray-100 shadow-sm flex-row items-center">
//                         <View
//                           className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${isPending ? 'bg-amber-100' : isApproved ? 'bg-emerald-100' : 'bg-red-100'
//                             }`}
//                         >
//                           {isPending ? (
//                             <Clock color="#d97706" size={22} />
//                           ) : isApproved ? (
//                             <CheckCircle2 color="#059669" size={22} />
//                           ) : (
//                             <AlertCircle color="#dc2626" size={22} />
//                           )}
//                         </View>
//                         <View className="flex-1">
//                           <Text className="text-sm font-bold text-gray-900 leading-tight mb-0.5">
//                             {req.product?.productName}
//                           </Text>
//                           <Text className="text-xs text-gray-500">
//                             Requested: {req.requestedQuantity} {req.unit}
//                           </Text>
//                           <View
//                             className={`self-start px-2 py-0.5 rounded-full mt-1.5 ${isPending ? 'bg-amber-50' : isApproved ? 'bg-emerald-50' : 'bg-red-50'
//                               }`}
//                           >
//                             <Text
//                               className={`text-[10px] font-black uppercase ${isPending ? 'text-amber-600' : isApproved ? 'text-emerald-600' : 'text-red-600'
//                                 }`}
//                             >
//                               {req.status}
//                             </Text>
//                           </View>
//                         </View>
//                         {isApproved && (
//                           <TouchableOpacity
//                             className="bg-emerald-600 px-4 py-2 rounded-xl"
//                             onPress={() => router.push(`/product/${req.productId}`)}
//                           >
//                             <Text className="text-white text-xs font-bold">View</Text>
//                           </TouchableOpacity>
//                         )}
//                       </View>
//                     );
//                   })}
//                 </View>
//               )}

//               {items.length > 0 && (
//                 <MotiView
//                   from={{ opacity: 0, translateY: 20 }}
//                   animate={{ opacity: 1, translateY: 0 }}
//                   className="mx-4 bg-white p-5 rounded-2xl shadow-lg mt-4 mb-6 border border-gray-100"
//                   style={{
//                     shadowColor: '#000',
//                     shadowOffset: { width: 0, height: -4 },
//                     shadowOpacity: 0.05,
//                     shadowRadius: 12,
//                     elevation: 8,
//                   }}
//                 >
//                   <Text className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Payment Summary</Text>

//                   <View className="flex-row justify-between mb-2">
//                     <Text className="text-gray-600">Subtotal</Text>
//                     <Text className="font-semibold">₹{productTotal.toFixed(2)}</Text>
//                   </View>

//                   {dynamicDeliveryTotal > 0 && (
//                     <View className="flex-row justify-between mb-2">
//                       <Text className="text-gray-600">Delivery Fee</Text>
//                       <Text className="font-semibold text-amber-600">₹{dynamicDeliveryTotal.toFixed(2)}</Text>
//                     </View>
//                   )}

//                   {platformFee > 0 && (
//                     <View className="flex-row justify-between mb-2">
//                       <Text className="text-gray-600">Platform Fee</Text>
//                       <Text className="font-semibold">₹{platformFee.toFixed(2)}</Text>
//                     </View>
//                   )}

//                   <View className="border-t border-gray-100 my-3" />

//                   <View className="flex-row justify-between items-center mb-5">
//                     <Text className="text-base font-bold text-gray-900">Total Amount</Text>
//                     <Text className="text-2xl font-extrabold text-gray-900">₹{totalAmount.toFixed(2)}</Text>
//                   </View>

//                   {dynamicDeliveryTotal > 0 ? (
//                     <Text className="text-xs font-bold text-amber-600 mb-3">
//                       Includes ₹{dynamicDeliveryTotal.toFixed(2)} negotiated delivery fees
//                     </Text>
//                   ) : (
//                     <Text className="text-xs text-gray-400 mb-3">
//                       Delivery charges calculated at checkout
//                     </Text>
//                   )}

//                   <TouchableOpacity
//                     className={`py-4 rounded-2xl items-center shadow-md flex-row justify-center ${selectedItemIds.length === 0 ? 'bg-gray-300' : 'bg-green-600'
//                       }`}
//                     onPress={() => {
//                       if (selectedItemIds.length === 0) {
//                         Alert.alert('No Items Selected', 'Please select at least one item to checkout.');
//                         return;
//                       }
//                       router.push('/checkout');
//                     }}
//                     disabled={selectedItemIds.length === 0}
//                     activeOpacity={0.9}
//                   >
//                     <Text className="text-white text-lg font-bold mr-2">Proceed to Checkout</Text>
//                     <ChevronRight color="#fff" size={20} />
//                   </TouchableOpacity>
//                 </MotiView>
//               )}
//             </>
//           ) : (
//             <View className="p-4">
//               {pendingOrders.length === 0 ? (
//                 <MotiView
//                   from={{ opacity: 0, scale: 0.9 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   className="items-center justify-center pt-20 pb-6"
//                 >
//                   <View className="w-24 h-24 rounded-full bg-blue-50 items-center justify-center mb-6 border-4 border-blue-100">
//                     <Clock color="#3b82f6" size={40} />
//                   </View>
//                   <Text className="text-xl font-bold text-gray-900 mb-2">No Recoveries</Text>
//                   <Text className="text-sm text-gray-500 text-center px-8">
//                     You don’t have any pending or failed orders to recover. All clear!
//                   </Text>
//                 </MotiView>
//               ) : (
//                 <>
//                   <Text className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Pending Orders</Text>
//                   {pendingOrders.map(order => {
//                     const expiryDate = new Date(new Date(order.createdAt).getTime() + 30 * 60 * 1000);
//                     return (
//                       <View key={order.id} className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
//                         <View className="flex-row items-center justify-between mb-3 border-b border-gray-50 pb-3">
//                           <View>
//                             <Text className="text-sm font-bold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</Text>
//                             <Text className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</Text>
//                           </View>
//                           <View className="bg-amber-50 px-3 py-1.5 rounded-xl items-end">
//                             <Text className="text-xs font-bold text-amber-600 mb-1">PENDING</Text>
//                             <CountdownTimer
//                               expiryDate={expiryDate}
//                               onExpire={() => {
//                                 api.get('mobile/v1/orders/pending').then((res: any) => res?.success && setPendingOrders(res.data || []));
//                               }}
//                             />
//                           </View>
//                         </View>

//                         <View className="mb-4">
//                           {order.items?.map((item: any) => (
//                             <View key={item.id} className="flex-row items-center mb-2">
//                               <Text className="text-sm text-gray-600 flex-1" numberOfLines={1}>
//                                 {item.product?.productName}
//                               </Text>
//                               <Text className="text-sm font-bold text-gray-900">x{item.quantity}</Text>
//                             </View>
//                           ))}
//                         </View>

//                         <View className="flex-row items-center justify-between mb-4 bg-gray-50 p-3 rounded-xl">
//                           <Text className="text-sm font-semibold text-gray-600">Total Amount</Text>
//                           <Text className="text-lg font-black text-green-700">₹{order.totalAmount.toFixed(2)}</Text>
//                         </View>

//                         <View className="flex-row gap-2 mt-2">
//                           <TouchableOpacity
//                             className="flex-1 bg-red-50 py-3 rounded-xl items-center border border-red-100"
//                             onPress={async () => {
//                               Alert.alert('Start Fresh', 'Are you sure you want to cancel this pending order?', [
//                                 { text: 'No', style: 'cancel' },
//                                 {
//                                   text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
//                                     try {
//                                       await api.post('mobile/v1/orders', { action: 'cancelPending', orderId: order.id });
//                                       api.get('mobile/v1/orders/pending').then((res: any) => res?.success && setPendingOrders(res.data || []));
//                                     } catch (e) { }
//                                   }
//                                 }
//                               ])
//                             }}
//                           >
//                             <Text className="text-red-600 font-bold text-sm">Start Fresh</Text>
//                           </TouchableOpacity>
//                           <TouchableOpacity
//                             className={`flex-1 py-3 rounded-xl items-center ${new Date() > expiryDate ? 'bg-gray-300' : 'bg-green-600'
//                               }`}
//                             onPress={() => handleResumeOrder(order.id)}
//                             disabled={new Date() > expiryDate}
//                           >
//                             <Text className="text-white font-bold text-sm">Resume Order</Text>
//                           </TouchableOpacity>
//                         </View>
//                       </View>
//                     );
//                   })}
//                 </>
//               )}
//             </View>
//           )}
//         </ScrollView>
//       )}

//       <SpecialDeliveryModal
//         visible={isSpecialDeliveryModalVisible}
//         onClose={() => setSpecialDeliveryModalVisible(false)}
//         product={activeProductForMediation}
//         onSuccess={() => {
//           api.get('mobile/v1/special-delivery').then((res: any) => res?.success && setSpecialRequests(res.data || []));
//         }}
//       />
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   quantityBtn: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#F3F4F6',
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//   },
//   quantityBtnDisabled: {
//     backgroundColor: '#F9FAFB',
//     borderColor: '#F3F4F6',
//     opacity: 0.5,
//   },
// });


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ===================================================================
// BEFORE AND AFTER UPDATING THE UI 
// ===================================================================
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Image, Alert, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { useApiClient } from '@/services/api';
import { calculateDistance } from '@/lib/apiHelpers';
import { Plus, Minus, Trash2, Package, ShoppingCart, Clock, CheckCircle2, AlertCircle, Square, CheckSquare, Truck, ArrowRight } from 'lucide-react-native';
import { MotiView, ScrollView } from 'moti';
import { useAuth } from '@clerk/clerk-expo';
import SpecialDeliveryModal from '@/components/SpecialDeliveryModal';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// ─── Unchanged logic helpers ──────────────────────────────────────────────────

const computeTimeLeft = (expiryDate: Date): string => {
  const now = new Date();
  const diff = expiryDate.getTime() - now.getTime();
  if (diff <= 0) return "Expired";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / 1000 / 60) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  return `${days}d : ${hours}h : ${mins}m : ${secs}s`;
};

const CountdownTimer = ({ expiryDate, onExpire }: { expiryDate: Date, onExpire?: () => void }) => {
  const [timeLeft, setTimeLeft] = React.useState(() => computeTimeLeft(expiryDate));

  React.useEffect(() => {
    setTimeLeft(computeTimeLeft(expiryDate));
    const interval = setInterval(() => {
      const value = computeTimeLeft(expiryDate);
      setTimeLeft(value);
      if (value === "Expired") {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [expiryDate, onExpire]);

  return (
    <Text style={styles.timerText}>{timeLeft}</Text>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CartScreen() {
  const { isSignedIn } = useAuth();
  const { profile } = useUserStore();
  const { items, loading, error, fetchCart, updateQuantity, removeFromCart } = useCartStore();
  const [specialRequests, setSpecialRequests] = React.useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = React.useState<any[]>([]);
  const [isSpecialDeliveryModalVisible, setSpecialDeliveryModalVisible] = React.useState(false);
  const [activeProductForMediation, setActiveProductForMediation] = React.useState<any>(null);
  const api = useApiClient();
  const router = useRouter();

  // ── Unchanged: deleteRequest ──────────────────────────────────────────────
  const deleteRequest = async (id: string) => {
    try {
      const res = await api.delete(`mobile/v1/special-delivery?id=${id}`);
      if (res?.success) {
        api.get('mobile/v1/special-delivery').then((res: any) => res?.success && setSpecialRequests(res.data || []));
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to cancel request');
    }
  };

  const [selectedItemIds, setSelectedItemIds] = React.useState<string[]>([]);
  const [unserviceableIds, setUnserviceableIds] = React.useState<string[]>([]);
  const [dynamicFeeData, setDynamicFeeData] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState<'CART' | 'RECOVERIES'>('CART');

  // ── Unchanged: useFocusEffect ─────────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      if (isSignedIn) {
        fetchCart(api);
        api.get('mobile/v1/special-delivery').then((res: any) => {
          if (res?.success) setSpecialRequests(res.data || []);
        }).catch(() => { });
        api.get('mobile/v1/orders/pending').then((res: any) => {
          if (res?.success) setPendingOrders(res.data || []);
        }).catch(() => { });
      }
    }, [isSignedIn])
  );

  // ── Unchanged: fee sync effect ────────────────────────────────────────────
  React.useEffect(() => {
    const fetchFee = async () => {
      if (profile?.lat && profile?.lng && items.length > 0) {
        try {
          const itemIdsStr = items.map((it: any) => it.id).join(',');
          const selectedItemIdsStr = selectedItemIds.join(',');
          if (selectedItemIds.length > 0) {
            const res = await api.get(`mobile/v1/orders/fee?lat=${profile.lat}&lng=${profile.lng}&itemIds=${selectedItemIdsStr}`);
            if (res?.success) setDynamicFeeData(res);
          } else {
            setDynamicFeeData(null);
          }
          const allRes = await api.get(`mobile/v1/orders/fee?lat=${profile.lat}&lng=${profile.lng}&itemIds=${itemIdsStr}`);
          if (allRes?.success) {
            setUnserviceableIds(allRes.unserviceableIds || []);
            const outOfRangeIds = allRes.unserviceableIds || [];
            setSelectedItemIds(prev => {
              const prevSet = new Set(prev);
              const validItemIds = items.filter(it => {
                const isOutOfRange = outOfRangeIds.includes(it.id);
                const isApproved = specialRequests.some(r => r.productId === it.product.id && r.status === 'APPROVED');
                return !(isOutOfRange && !isApproved);
              }).map(it => it.id);
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

  // ── Unchanged: toggleSelect ───────────────────────────────────────────────
  const toggleSelect = (id: string, isSelectable: boolean) => {
    if (!isSelectable) {
      Alert.alert('Unavailable', 'This item is out of delivery range. Please request special delivery approval first.');
      return;
    }
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // ── Unchanged: derived totals ─────────────────────────────────────────────
  const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
  const productTotal = selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.product.pricePerUnit, 0
  );
  const dynamicDeliveryTotal = dynamicFeeData?.fee || 0;
  const platformFee = productTotal > 100 ? Math.round(productTotal * 0.03) : 0;
  const totalAmount = productTotal + dynamicDeliveryTotal + platformFee;

  // ── Unchanged: handleRemove ───────────────────────────────────────────────
  const handleRemove = (itemId: string, name: string) => {
    Alert.alert('Remove Item', `Remove "${name}" from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(api, itemId) },
    ]);
  };

  // ── Improved: renderItem ──────────────────────────────────────────────────
  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const imageUrl = item.product.images?.[0];

    // ── All logic below is UNCHANGED ─────────────────────────────────────
    const isOutOfRange = unserviceableIds.includes(item.id);
    const activeRequest = specialRequests.find((r: any) => r.productId === item.product.id && !r.isConsumed);
    const isApproved = activeRequest?.status === 'APPROVED';
    const isPendingReq = activeRequest?.status === 'PENDING';
    const isRejected = activeRequest?.status === 'REJECTED';
    const isQuantityExceeded = isApproved && item.quantity > activeRequest.quantity;
    const isSelectable = !(isOutOfRange && !isApproved) && !isQuantityExceeded && !isRejected;
    const isSelected = selectedItemIds.includes(item.id);
    const isGrayscaled = !isSelectable;
    const minQty = isApproved ? 1 : (item.product.minOrderQuantity || 1);
    const availableStock = item.product.availableStock ?? Infinity;
    const atApprovalLimit = isApproved && item.quantity >= activeRequest.quantity;
    const atStockLimit = item.quantity >= availableStock;
    const incrementLocked = atApprovalLimit || atStockLimit;
    const decrementLocked = item.quantity <= minQty;
    // ─────────────────────────────────────────────────────────────────────

    return (
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: isGrayscaled ? 0.55 : 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350, delay: index * 80 }}
        style={[
          styles.card,
          isSelected && styles.cardSelected,
        ]}
      >
        {/* ── Row 1: Checkbox + Image + Core Info ── */}
        <View style={styles.cardTopRow}>

          {/* Checkbox */}
          <TouchableOpacity
            style={styles.checkboxHit}
            onPress={() => toggleSelect(item.id, isSelectable)}
            activeOpacity={0.7}
          >
            {isSelected
              ? <CheckSquare color="#16a34a" size={22} strokeWidth={2.2} />
              : <Square color="#cbd5e1" size={22} strokeWidth={1.8} />
            }
          </TouchableOpacity>

          {/* Product Image */}
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Package color="#94a3b8" size={26} strokeWidth={1.5} />
            </View>
          )}

          {/* Name + Price meta */}
          <View style={styles.cardInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.product.productName}
            </Text>
            <Text style={styles.productUnit}>
              ₹{item.product.pricePerUnit} / {item.product.unit}
            </Text>

            {/* Line total */}
            <View style={styles.lineTotalRow}>
              <Text style={styles.lineTotal}>
                ₹{(item.quantity * item.product.pricePerUnit).toFixed(2)}
              </Text>
              {activeRequest?.negotiatedFee != null && (
                <View style={styles.negotiatedFeeChip}>
                  <Truck color="#b45309" size={10} strokeWidth={2} />
                  <Text style={styles.negotiatedFeeText}>
                    +₹{(activeRequest.negotiatedFee * item.quantity).toFixed(2)} del
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Trash */}
          <TouchableOpacity
            style={styles.trashBtn}
            onPress={() => handleRemove(item.id, item.product.productName)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={17} color="#f87171" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* ── Row 2: Quantity Controls ── */}
        <View style={styles.qtyRow}>
          <View style={styles.qtyGroup}>
            <TouchableOpacity
              style={[styles.qtyBtn, decrementLocked && styles.qtyBtnDisabled]}
              disabled={decrementLocked}
              activeOpacity={0.7}
              onPress={() => {
                if (item.quantity > minQty) {
                  updateQuantity(api, item.id, item.quantity - 1);
                } else {
                  handleRemove(item.id, item.product.productName);
                }
              }}
            >
              <Minus size={14} color={decrementLocked ? '#cbd5e1' : '#475569'} strokeWidth={2.5} />
            </TouchableOpacity>

            <Text style={styles.qtyValue}>{item.quantity}</Text>

            <TouchableOpacity
              style={[styles.qtyBtn, incrementLocked && styles.qtyBtnDisabled]}
              disabled={incrementLocked}
              activeOpacity={0.7}
              onPress={() => updateQuantity(api, item.id, item.quantity + 1)}
            >
              <Plus size={14} color={incrementLocked ? '#cbd5e1' : '#475569'} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <Text style={styles.qtyUnit}>{item.product.unit}</Text>
        </View>

        {/* ── Status Banners (unchanged conditions, improved UI) ── */}

        {/* APPROVED */}
        {isApproved && (
          <View style={styles.bannerApproved}>
            <View style={styles.bannerHeader}>
              <View style={styles.bannerLabelRow}>
                <Truck color="#059669" size={12} strokeWidth={2} />
                <Text style={styles.bannerTitleApproved}>Special Delivery Approved</Text>
              </View>
              <View style={styles.chipApproved}>
                <Text style={styles.chipTextApproved}>Limit: {activeRequest.quantity} {item.product.unit}</Text>
              </View>
            </View>

            <View style={styles.timerRow}>
              <Clock color="#059669" size={11} strokeWidth={2} />
              <Text style={styles.timerLabel}>Expires in </Text>
              <CountdownTimer
                expiryDate={new Date(new Date(activeRequest.approvedAt || activeRequest.updatedAt).getTime() + 10 * 24 * 60 * 60 * 1000)}
                onExpire={() => api.get('mobile/v1/special-delivery').then((res: any) => res?.success && setSpecialRequests(res.data || []))}
              />
            </View>

            <TouchableOpacity
              style={styles.bannerActionApproved}
              onPress={() => deleteRequest(activeRequest.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.bannerActionTextApproved}>Cancel & Re-request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* PENDING */}
        {isPendingReq && (
          <View style={styles.bannerPending}>
            <View style={styles.bannerHeader}>
              <View style={styles.bannerLabelRow}>
                <Clock color="#d97706" size={12} strokeWidth={2} />
                <Text style={styles.bannerTitlePending}>Mediation in Progress</Text>
              </View>
              <View style={styles.chipPending}>
                <Text style={styles.chipTextPending}>Pending</Text>
              </View>
            </View>
            <Text style={styles.bannerBody}>
              We're negotiating delivery with logistics partners. Please check back later.
            </Text>
            <TouchableOpacity
              style={styles.bannerActionPending}
              onPress={() => deleteRequest(activeRequest.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.bannerActionTextPending}>Cancel Request</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* REJECTED */}
        {isRejected && (
          <View style={styles.bannerRejected}>
            <View style={styles.bannerHeader}>
              <View style={styles.bannerLabelRow}>
                <AlertCircle color="#dc2626" size={12} strokeWidth={2} />
                <Text style={styles.bannerTitleRejected}>Mediation Rejected</Text>
              </View>
              <View style={styles.chipRejected}>
                <Text style={styles.chipTextRejected}>Locked</Text>
              </View>
            </View>
            <Text style={styles.bannerBody}>
              Delivery unavailable for this quantity/location. Try modifying your order or checking other sellers.
            </Text>
            <TouchableOpacity
              style={styles.bannerActionRejected}
              onPress={() => deleteRequest(activeRequest.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.bannerActionTextRejected}>Clear & Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* OUT OF RANGE */}
        {isOutOfRange && !activeRequest && (
          <View style={styles.bannerOutOfRange}>
            <View style={styles.bannerHeader}>
              <View style={styles.bannerLabelRow}>
                <Truck color="#2563eb" size={12} strokeWidth={2} />
                <Text style={styles.bannerTitleOutOfRange}>Out of Delivery Range</Text>
              </View>
            </View>
            <Text style={styles.bannerBody}>
              This seller is outside our standard radius. Request special delivery to proceed.
            </Text>
            <TouchableOpacity
              style={styles.requestMediationBtn}
              onPress={() => {
                setActiveProductForMediation(item.product);
                setSpecialDeliveryModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.requestMediationText}>Request Mediation</Text>
            </TouchableOpacity>
          </View>
        )}
      </MotiView>
    );
  };

  // ── Unchanged: loading guard ──────────────────────────────────────────────
  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.loaderText}>Loading your cart…</Text>
      </SafeAreaView>
    );
  }

  // ── Unchanged: signed-out state ───────────────────────────────────────────
  if (!isSignedIn) {
    return (
      <SafeAreaView style={styles.rootBg}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>
        <MotiView
          from={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.emptyCenter}
        >
          <View style={styles.emptyIconRing}>
            <ShoppingCart color="#3b82f6" size={38} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>Login Required</Text>
          <Text style={styles.emptySubtitle}>
            Please log in to view your cart and checkout items.
          </Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.85}
          >
            <Text style={styles.loginBtnText}>Login to Continue</Text>
            <ArrowRight color="#fff" size={18} strokeWidth={2.5} />
          </TouchableOpacity>
        </MotiView>
      </SafeAreaView>
    );
  }

  // ── Unchanged: handleResumeOrder ──────────────────────────────────────────
  const handleResumeOrder = async (orderId: string) => {
    try {
      const payload = { action: 'initiateCheckout', params: { orderId } };
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

  // ── Main Render ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.rootBg} edges={['top']}>

      {/* Header */}
      <LinearGradient
        colors={['#15803d', '#16a34a']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.gradientHeader}
      >
        <View>
          <Text style={styles.headerTitle}>My Cart</Text>
          {items.length > 0 && activeTab === 'CART' && (
            <Text style={styles.headerSubtitle}>
              {items.length} item{items.length !== 1 ? 's' : ''} in cart
            </Text>
          )}
        </View>
        {items.length > 0 && activeTab === 'CART' && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{items.length}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'CART' && styles.tabActive]}
          onPress={() => setActiveTab('CART')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabLabel, activeTab === 'CART' && styles.tabLabelActive]}>
            Current Cart
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'RECOVERIES' && styles.tabActive]}
          onPress={() => setActiveTab('RECOVERIES')}
          activeOpacity={0.8}
        >
          <Text style={[styles.tabLabel, activeTab === 'RECOVERIES' && styles.tabLabelActive]}>
            Recoveries{pendingOrders.length > 0 ? ` (${pendingOrders.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchCart(api)}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {activeTab === 'CART' ? (
            <>
              {/* ── Cart Items ── */}
              {items.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Checkout Items</Text>
                  {items.map((item, index) => (
                    <React.Fragment key={item.id}>
                      {renderItem({ item, index })}
                    </React.Fragment>
                  ))}
                </View>
              ) : (
                <MotiView
                  from={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={styles.emptyCenter}
                >
                  <View style={[styles.emptyIconRing, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                    <ShoppingCart color="#16a34a" size={34} strokeWidth={1.5} />
                  </View>
                  <Text style={styles.emptyTitle}>Your cart is empty</Text>
                  <Text style={styles.emptySubtitle}>
                    Browse fresh produce and add items to get started.
                  </Text>
                  <TouchableOpacity
                    style={styles.shopNowBtn}
                    onPress={() => router.push('/(tabs)')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.shopNowText}>Shop Now</Text>
                    <ArrowRight color="#fff" size={16} strokeWidth={2.5} />
                  </TouchableOpacity>
                </MotiView>
              )}

              {/* ── Special Delivery Requests ── */}
              {specialRequests.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Logistics Mediation</Text>
                  {specialRequests.map((req: any) => {
                    const isPending = req.status === 'PENDING';
                    const isApproved = req.status === 'APPROVED';
                    const isRejected = req.status === 'REJECTED';
                    const accent = isPending ? '#d97706' : isApproved ? '#059669' : '#dc2626';
                    const accentBg = isPending ? '#fffbeb' : isApproved ? '#f0fdf4' : '#fff1f2';
                    const accentBorder = isPending ? '#fde68a' : isApproved ? '#bbf7d0' : '#fecaca';

                    return (
                      <View key={req.id} style={[styles.mediationCard, { borderColor: accentBorder, backgroundColor: accentBg }]}>
                        <View style={[styles.mediationIconBox, { backgroundColor: accentBorder }]}>
                          {isPending
                            ? <Clock color={accent} size={22} strokeWidth={2} />
                            : isApproved
                              ? <CheckCircle2 color={accent} size={22} strokeWidth={2} />
                              : <AlertCircle color={accent} size={22} strokeWidth={2} />
                          }
                        </View>
                        <View style={styles.mediationInfo}>
                          <Text style={styles.mediationProductName} numberOfLines={1}>
                            {req.product?.productName}
                          </Text>
                          <Text style={styles.mediationMeta}>
                            Requested: {req.requestedQuantity} {req.unit}
                          </Text>
                          <View style={[styles.statusChip, { backgroundColor: accentBorder }]}>
                            <Text style={[styles.statusChipText, { color: accent }]}>{req.status}</Text>
                          </View>
                        </View>
                        {isApproved && (
                          <TouchableOpacity
                            style={[styles.viewBtn, { backgroundColor: accent }]}
                            onPress={() => router.push(`/product/${req.productId}`)}
                            activeOpacity={0.85}
                          >
                            <Text style={styles.viewBtnText}>View</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* ── Pricing Summary ── */}
              {items.length > 0 && (
                <MotiView
                  from={{ opacity: 0, translateY: 16 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  style={styles.summaryCard}
                >
                  <Text style={styles.summaryTitle}>Order Summary</Text>

                  <View style={styles.summaryDivider} />

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>₹{productTotal.toFixed(2)}</Text>
                  </View>

                  {dynamicDeliveryTotal > 0 && (
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryLabelRow}>
                        <Truck color="#d97706" size={13} strokeWidth={2} />
                        <Text style={[styles.summaryLabel, { marginLeft: 5 }]}>Special Delivery</Text>
                      </View>
                      <Text style={[styles.summaryValue, { color: '#d97706' }]}>
                        ₹{dynamicDeliveryTotal.toFixed(2)}
                      </Text>
                    </View>
                  )}

                  {platformFee > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Platform Fee (3%)</Text>
                      <Text style={styles.summaryValue}>₹{platformFee.toFixed(2)}</Text>
                    </View>
                  )}

                  {dynamicDeliveryTotal === 0 && (
                    <Text style={styles.deliveryNote}>
                      Standard delivery charges calculated at checkout
                    </Text>
                  )}

                  <View style={styles.summaryDivider} />

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.checkoutBtn,
                      selectedItemIds.length === 0 && styles.checkoutBtnDisabled,
                    ]}
                    onPress={() => {
                      if (selectedItemIds.length === 0) {
                        Alert.alert('No Items Selected', 'Please select at least one item to checkout.');
                        return;
                      }
                      router.push('/checkout');
                    }}
                    disabled={selectedItemIds.length === 0}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.checkoutBtnText}>
                      {selectedItemIds.length === 0
                        ? 'Select Items to Checkout'
                        : `Checkout ${selectedItemIds.length} Item${selectedItemIds.length !== 1 ? 's' : ''}`
                      }
                    </Text>
                    {selectedItemIds.length > 0 && (
                      <ArrowRight color="#fff" size={18} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </MotiView>
              )}
            </>
          ) : (
            /* ── Recoveries Tab ── */
            <View style={styles.section}>
              {pendingOrders.length === 0 ? (
                <MotiView
                  from={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={styles.emptyCenter}
                >
                  <View style={[styles.emptyIconRing, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                    <Clock color="#3b82f6" size={34} strokeWidth={1.5} />
                  </View>
                  <Text style={styles.emptyTitle}>No Recoveries</Text>
                  <Text style={styles.emptySubtitle}>
                    You don't have any pending or failed orders to recover.
                  </Text>
                </MotiView>
              ) : (
                <>
                  <Text style={styles.sectionLabel}>Pending Orders</Text>
                  {pendingOrders.map((order, index) => {
                    const expiryDate = new Date(new Date(order.createdAt).getTime() + 30 * 60 * 1000);
                    const isExpired = new Date() > expiryDate;

                    return (
                      <MotiView
                        key={order.id}
                        from={{ opacity: 0, translateY: 12 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: index * 80 }}
                        style={styles.recoveryCard}
                      >
                        {/* Order header */}
                        <View style={styles.recoveryHeader}>
                          <View>
                            <Text style={styles.recoveryOrderId}>
                              Order #{order.id.slice(-6).toUpperCase()}
                            </Text>
                            <Text style={styles.recoveryDate}>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                          <View style={styles.recoveryTimerBox}>
                            <Text style={styles.recoveryStatusLabel}>
                              {isExpired ? 'EXPIRED' : 'PENDING'}
                            </Text>
                            {!isExpired && (
                              <CountdownTimer
                                expiryDate={expiryDate}
                                onExpire={() => {
                                  api.get('mobile/v1/orders/pending').then(
                                    (res: any) => res?.success && setPendingOrders(res.data || [])
                                  );
                                }}
                              />
                            )}
                          </View>
                        </View>

                        {/* Items list */}
                        <View style={styles.recoveryItems}>
                          {order.items?.map((item: any) => (
                            <View key={item.id} style={styles.recoveryItemRow}>
                              <Text style={styles.recoveryItemName} numberOfLines={1}>
                                {item.product?.productName}
                              </Text>
                              <Text style={styles.recoveryItemQty}>×{item.quantity}</Text>
                            </View>
                          ))}
                        </View>

                        {/* Total */}
                        <View style={styles.recoveryTotalBox}>
                          <Text style={styles.recoveryTotalLabel}>Total Amount</Text>
                          <Text style={styles.recoveryTotalValue}>₹{order.totalAmount.toFixed(2)}</Text>
                        </View>

                        {/* Actions */}
                        <View style={styles.recoveryActions}>
                          <TouchableOpacity
                            style={styles.startFreshBtn}
                            onPress={async () => {
                              Alert.alert('Start Fresh', 'Are you sure you want to cancel this pending order?', [
                                { text: 'No', style: 'cancel' },
                                {
                                  text: 'Yes, Cancel', style: 'destructive', onPress: async () => {
                                    try {
                                      await api.post('mobile/v1/orders', { action: 'cancelPending', orderId: order.id });
                                      api.get('mobile/v1/orders/pending').then((res: any) => res?.success && setPendingOrders(res.data || []));
                                    } catch (e) { }
                                  }
                                }
                              ]);
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.startFreshText}>Start Fresh</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.resumeBtn, isExpired && styles.resumeBtnDisabled]}
                            onPress={() => handleResumeOrder(order.id)}
                            disabled={isExpired}
                            activeOpacity={0.85}
                          >
                            <Text style={styles.resumeBtnText}>
                              {isExpired ? 'Expired' : 'Resume Order'}
                            </Text>
                            {!isExpired && <ArrowRight color="#fff" size={14} strokeWidth={2.5} />}
                          </TouchableOpacity>
                        </View>
                      </MotiView>
                    );
                  })}
                </>
              )}
            </View>
          )}
        </ScrollView>
      )}

      <SpecialDeliveryModal
        visible={isSpecialDeliveryModalVisible}
        onClose={() => setSpecialDeliveryModalVisible(false)}
        product={activeProductForMediation}
        onSuccess={() => {
          api.get('mobile/v1/special-delivery').then((res: any) => res?.success && setSpecialRequests(res.data || []));
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const GREEN = '#16a34a';
const GREEN_DARK = '#15803d';
const SURFACE = '#ffffff';
const BG = '#f8fafc';
const BORDER = '#e2e8f0';
const TEXT_PRIMARY = '#0f172a';
const TEXT_SECONDARY = '#64748b';
const TEXT_MUTED = '#94a3b8';

const styles = StyleSheet.create({

  // ── Root ─────────────────────────────────────────────────────────────────
  rootBg: { flex: 1, backgroundColor: BG },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 32 },

  // ── Loader ───────────────────────────────────────────────────────────────
  loaderContainer: { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center' },
  loaderText: { marginTop: 12, fontSize: 14, color: TEXT_SECONDARY, fontWeight: '500' },

  // ── Header ───────────────────────────────────────────────────────────────
  gradientHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    backgroundColor: SURFACE,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.72)', fontWeight: '600', marginTop: 3 },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    width: 32, height: 32,
    borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  headerBadgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },

  // ── Tab Bar ───────────────────────────────────────────────────────────────
  tabBar: {
    backgroundColor: SURFACE,
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: GREEN },
  tabLabel: { fontSize: 14, fontWeight: '600', color: TEXT_MUTED },
  tabLabelActive: { color: GREEN },

  // ── Section ───────────────────────────────────────────────────────────────
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_MUTED,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // ── Product Card ──────────────────────────────────────────────────────────
  card: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: BORDER,
  },
  cardSelected: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  checkboxHit: {
    paddingRight: 10,
    paddingTop: 2,
    justifyContent: 'center',
  },

  productImage: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
  },
  productImagePlaceholder: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'flex-start',
  },
  productName: {
    fontSize: 14,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    lineHeight: 20,
    marginBottom: 3,
  },
  productUnit: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontWeight: '500',
  },
  lineTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  lineTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: GREEN_DARK,
  },
  negotiatedFeeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  negotiatedFeeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },

  trashBtn: {
    padding: 6,
    marginLeft: 4,
    marginTop: -2,
  },

  // ── Quantity Controls ─────────────────────────────────────────────────────
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  qtyGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  qtyBtnDisabled: {
    opacity: 0.38,
  },
  qtyValue: {
    minWidth: 38,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
  },
  qtyUnit: {
    fontSize: 13,
    color: TEXT_SECONDARY,
    fontWeight: '600',
  },

  // ── Status Banners ────────────────────────────────────────────────────────
  bannerApproved: {
    marginTop: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: 12,
  },
  bannerPending: {
    marginTop: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 12,
  },
  bannerRejected: {
    marginTop: 12,
    backgroundColor: '#fff1f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
  },
  bannerOutOfRange: {
    marginTop: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 12,
  },

  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bannerLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  bannerTitleApproved: { fontSize: 11, fontWeight: '800', color: '#065f46', textTransform: 'uppercase', letterSpacing: 0.5 },
  bannerTitlePending: { fontSize: 11, fontWeight: '800', color: '#78350f', textTransform: 'uppercase', letterSpacing: 0.5 },
  bannerTitleRejected: { fontSize: 11, fontWeight: '800', color: '#7f1d1d', textTransform: 'uppercase', letterSpacing: 0.5 },
  bannerTitleOutOfRange: { fontSize: 11, fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: 0.5 },

  bannerBody: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    lineHeight: 17,
    marginBottom: 10,
  },

  chipApproved: { backgroundColor: '#bbf7d0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  chipTextApproved: { fontSize: 10, fontWeight: '800', color: '#065f46' },
  chipPending: { backgroundColor: '#fde68a', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  chipTextPending: { fontSize: 10, fontWeight: '800', color: '#78350f' },
  chipRejected: { backgroundColor: '#fecaca', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  chipTextRejected: { fontSize: 10, fontWeight: '800', color: '#7f1d1d' },

  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 10,
    gap: 4,
  },
  timerLabel: { fontSize: 11, fontWeight: '700', color: '#059669' },
  timerText: { fontSize: 11, fontWeight: '800', color: '#065f46' },

  bannerActionApproved: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignSelf: 'flex-start',
  },
  bannerActionTextApproved: { fontSize: 11, fontWeight: '700', color: '#065f46' },

  bannerActionPending: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
    alignSelf: 'flex-start',
  },
  bannerActionTextPending: { fontSize: 11, fontWeight: '700', color: '#78350f' },

  bannerActionRejected: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    alignSelf: 'flex-start',
  },
  bannerActionTextRejected: { fontSize: 11, fontWeight: '700', color: '#7f1d1d' },

  requestMediationBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  requestMediationText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // ── Mediation Cards ───────────────────────────────────────────────────────
  mediationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  mediationIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mediationInfo: { flex: 1 },
  mediationProductName: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY, marginBottom: 2 },
  mediationMeta: { fontSize: 12, color: TEXT_SECONDARY, marginBottom: 6 },
  statusChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusChipText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  viewBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  viewBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // ── Pricing Summary ───────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: SURFACE,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 14,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: { fontSize: 14, color: TEXT_SECONDARY, fontWeight: '500' },
  summaryValue: { fontSize: 14, color: TEXT_PRIMARY, fontWeight: '600' },
  deliveryNote: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: TEXT_PRIMARY },
  totalAmount: { fontSize: 22, fontWeight: '800', color: TEXT_PRIMARY },

  checkoutBtn: {
    backgroundColor: GREEN,
    paddingVertical: 15,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  checkoutBtnDisabled: { backgroundColor: '#cbd5e1' },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // ── Empty State ───────────────────────────────────────────────────────────
  emptyCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 32,
  },
  emptyIconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
    borderColor: '#d1fae5',
    backgroundColor: '#f0fdf4',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT_PRIMARY,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  shopNowBtn: {
    backgroundColor: GREEN,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopNowText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  loginBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  // ── Recoveries ────────────────────────────────────────────────────────────
  recoveryCard: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  recoveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  recoveryOrderId: { fontSize: 14, fontWeight: '700', color: TEXT_PRIMARY },
  recoveryDate: { fontSize: 12, color: TEXT_MUTED, marginTop: 2 },
  recoveryTimerBox: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  recoveryStatusLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#d97706',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  recoveryItems: { marginBottom: 12 },
  recoveryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  recoveryItemName: { fontSize: 13, color: TEXT_SECONDARY, flex: 1 },
  recoveryItemQty: { fontSize: 13, fontWeight: '700', color: TEXT_PRIMARY, marginLeft: 8 },
  recoveryTotalBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  recoveryTotalLabel: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY },
  recoveryTotalValue: { fontSize: 18, fontWeight: '800', color: GREEN_DARK },
  recoveryActions: {
    flexDirection: 'row',
    gap: 10,
  },
  startFreshBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  startFreshText: { fontSize: 13, fontWeight: '700', color: '#dc2626' },
  resumeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: GREEN,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  resumeBtnDisabled: { backgroundColor: '#e2e8f0' },
  resumeBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // ── Error ─────────────────────────────────────────────────────────────────
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { fontSize: 15, color: '#dc2626', textAlign: 'center', marginBottom: 16 },
  retryBtn: { backgroundColor: GREEN, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});