// // import React, { useEffect, useState } from 'react';
// // import {
// //   View, Text, Image, TouchableOpacity,
// //   ActivityIndicator, ScrollView, Alert, StyleSheet,
// // } from 'react-native';
// // import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// // import { LinearGradient } from 'expo-linear-gradient';
// // import { useLocalSearchParams, useRouter } from 'expo-router';
// // import { useAuth } from '@clerk/clerk-expo';
// // import { Colors } from '@/constants/Colors';
// // import { useApiClient } from '@/services/api';
// // import { getRouteParam, formatLocation, calculateDistance } from '@/lib/apiHelpers';
// // import { useCartStore } from '@/store/cartStore';
// // import { useUserStore } from '@/store/userStore';
// // import { ArrowLeft, MapPin, Package, Plus, Minus, ShoppingCart, Truck, AlertCircle, Clock, CheckCircle2, MessageCircle, Scale } from 'lucide-react-native';
// // import SpecialDeliveryModal from '@/components/SpecialDeliveryModal';

// // export default function ProductDetailScreen() {
// //   const insets = useSafeAreaInsets();
// //   const productId = getRouteParam(useLocalSearchParams<{ id: string }>().id);
// //   const api = useApiClient();
// //   const router = useRouter();
// //   const { isSignedIn } = useAuth();
// //   const { profile, role } = useUserStore();
// //   const { items: cartItems, addToCart, loading: cartLoading, fetchCart } = useCartStore();

// //   const [product, setProduct] = useState<any>(null);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState('');
// //   const [quantity, setQuantity] = useState(1);
// //   const [imageIndex, setImageIndex] = useState(0);
// //   const [addingToCart, setAddingToCart] = useState(false);
// //   const [isSpecialDeliveryModalVisible, setSpecialDeliveryModalVisible] = useState(false);
// //   const [specialRequests, setSpecialRequests] = useState<any[]>([]);
// //   const [dynamicFee, setDynamicFee] = useState<number | null>(null);
// //   const [isOutOfRange, setIsOutOfRange] = useState(false);
// //   const [isLongDistance, setIsLongDistance] = useState(false);
// //   const [isFeeLoading, setIsFeeLoading] = useState(false);

// //   useEffect(() => {
// //     const fetchProductAndRequests = async () => {
// //       try {
// //         const [res, reqRes] = await Promise.all([
// //           api.get(`mobile/v1/products?id=${productId}`),
// //           isSignedIn ? api.get('mobile/v1/special-delivery').catch(() => ({ success: false, data: [] })) : { success: false, data: [] }
// //         ]);

// //         if (isSignedIn) {
// //           await fetchCart(api).catch(() => { });
// //         }

// //         const p = res.data ?? null;
// //         setProduct(p);

// //         let initialMinQty = Math.max(1, Number(p?.minOrderQuantity) || 1);

// //         if (reqRes?.success) {
// //           setSpecialRequests(reqRes.data || []);
// //           const hasApproval = reqRes.data?.some((r: any) => r.productId === p?.id && r.status === 'APPROVED' && !r.isConsumed);
// //           if (hasApproval) initialMinQty = 1;
// //         }

// //         if (p?.minOrderQuantity || reqRes?.success) {
// //           setQuantity(initialMinQty);
// //         }

// //         if (p && profile?.lat && profile?.lng) {
// //           setIsFeeLoading(true);
// //           const feeRes = await api.get(`mobile/v1/orders/fee?lat=${profile.lat}&lng=${profile.lng}&productId=${p.id}`);
// //           if (feeRes?.success) {
// //             setDynamicFee(feeRes.fee);
// //             setIsOutOfRange(feeRes.isOutOfRange);
// //             setIsLongDistance(feeRes.isLongDistance);
// //           }
// //           setIsFeeLoading(false);
// //         }
// //       } catch (err: any) {
// //         setError(err.message || 'Failed to load product');
// //         setIsFeeLoading(false);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     if (productId) fetchProductAndRequests();
// //   }, [productId, isSignedIn, profile?.lat, profile?.lng]);

// //   const reloadRequests = async () => {
// //     try {
// //       const res = await api.get('mobile/v1/special-delivery');
// //       if (res?.success) setSpecialRequests(res.data || []);
// //     } catch (e) { }
// //   };

// //   const handleAddToCart = async () => {
// //     if (!product) return;

// //     if (!isSignedIn) {
// //       router.push('/(auth)/sign-in');
// //       return;
// //     }

// //     if (!role || role === 'none' || !profile) {
// //       router.push('/onboarding');
// //       return;
// //     }

// //     if (!profile.lat || !profile.lng) {
// //       router.push('/edit-profile');
// //       return;
// //     }

// //     if (isBypassed) {
// //       if (quantity > dynamicMaxQty) {
// //         Alert.alert('Out of Range Limit Exceeded', `You can only add ${dynamicMaxQty} more unit(s) based on your approved request.`);
// //         return;
// //       }
// //     }

// //     setAddingToCart(true);
// //     try {
// //       await addToCart(api, product.id, quantity);
// //       Alert.alert('Added to Cart ✓', `${quantity} × ${product.productName} added to your cart.`, [
// //         { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
// //         { text: 'Continue Shopping', style: 'cancel' },
// //       ]);
// //     } catch (err: any) {
// //       Alert.alert('Error', err.message || 'Failed to add to cart. Please try again.');
// //     } finally {
// //       setAddingToCart(false);
// //     }
// //   };

// //   if (loading) {
// //     return (
// //       <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
// //         <LinearGradient colors={['#1e293b', '#0f172a']} style={{ paddingTop: insets.top + 12, paddingBottom: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' }}>
// //           <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
// //             <ArrowLeft color="#fff" size={20} />
// //           </TouchableOpacity>
// //         </LinearGradient>
// //         <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
// //           <ActivityIndicator size="large" color="#16a34a" />
// //         </View>
// //       </View>
// //     );
// //   }

// //   if (error || !product) {
// //     return (
// //       <SafeAreaView style={{ flex: 1, backgroundColor: '#1e293b' }} edges={['top']}>
// //         <LinearGradient colors={['#1e293b', '#0f172a']} style={{ paddingBottom: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' }}>
// //           <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
// //             <ArrowLeft color="#fff" size={20} />
// //           </TouchableOpacity>
// //         </LinearGradient>
// //         <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
// //           <Package color="#94a3b8" size={56} />
// //           <Text style={{ fontSize: 17, fontWeight: '700', color: '#1e293b', marginTop: 16, marginBottom: 8 }}>{error || 'Product not found'}</Text>
// //           <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={{ backgroundColor: '#16a34a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 }}>
// //             <Text style={{ color: '#fff', fontWeight: '700' }}>Go Back</Text>
// //           </TouchableOpacity>
// //         </View>
// //       </SafeAreaView>
// //     );
// //   }

// //   const seller = product.farmer || product.agent;
// //   const sellerName = seller?.name || seller?.companyName || 'Unknown Seller';
// //   const location = formatLocation(seller);
// //   const images = product.images || [];

// //   const specialRequest = specialRequests.find((r: any) => r.productId === product.id && r.status === 'APPROVED' && !r.isConsumed);
// //   const isBypassed = !!specialRequest;
// //   const requestRecordExists = specialRequests.some((r: any) => r.productId === product.id && r.status === 'PENDING');

// //   const minQty = isBypassed ? 1 : Math.max(1, Number(product?.minOrderQuantity) || 1);

// //   // Inventory Reservation Logic
// //   const physicalStock = Number(product?.availableStock) || 0;
// //   const sellableStock = product?.availableSellableStock !== undefined ? Number(product.availableSellableStock) : physicalStock;

// //   // Normal buyers see sellable stock. Approved buyers can access up to physical stock (capped by their approval).
// //   const maxQty = isBypassed ? physicalStock : sellableStock;

// //   const canAddToCart = !isOutOfRange || isBypassed;

// //   // Calculate quantity limits exactly matching web
// //   const currentCartQuantity = cartItems.find((it: any) => it.productId === product.id)?.quantity || 0;
// //   let dynamicMaxQty = maxQty;
// //   if (isBypassed) {
// //     dynamicMaxQty = Math.min(maxQty, Math.max(0, (specialRequest?.quantity || 0) - currentCartQuantity));
// //   }

// //   // Handle Grayscale state
// //   const isGrayscaled = isOutOfRange && !isBypassed;

// //   return (
// //     <SafeAreaView style={{ flex: 1, backgroundColor: '#1e293b' }} edges={['top']}>
// //       <LinearGradient
// //         colors={['#1e293b', '#0f172a']}
// //         style={{ paddingTop: 8, paddingBottom: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' }}
// //       >
// //         <TouchableOpacity
// //           onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
// //           style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' }}
// //         >
// //           <ArrowLeft color="#fff" size={20} />
// //         </TouchableOpacity>
// //         <Text style={{ flex: 1, fontSize: 16, fontWeight: '800', color: '#fff', marginHorizontal: 12, letterSpacing: -0.2 }} numberOfLines={1}>{product.productName}</Text>
// //         <TouchableOpacity
// //           onPress={() => router.push('/(tabs)/cart')}
// //           style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(74,222,128,0.15)', alignItems: 'center', justifyContent: 'center' }}
// //         >
// //           <ShoppingCart color="#4ade80" size={20} />
// //         </TouchableOpacity>
// //       </LinearGradient>

// //       <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, backgroundColor: '#f8fafc' }}>
// //         <View style={{ opacity: isGrayscaled ? 0.5 : 1 }}>
// //           {/* Image Gallery */}
// //           {images.length > 0 ? (
// //             <View>
// //               <Image source={{ uri: images[imageIndex] }} className="w-full h-72 bg-gray-200" resizeMode="cover" />
// //               {images.length > 1 && (
// //                 <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mt-2 px-4 space-x-3">
// //                   {images.map((img: string, idx: number) => (
// //                     <TouchableOpacity key={idx} onPress={() => setImageIndex(idx)}>
// //                       <Image
// //                         source={{ uri: img }}
// //                         className={`w-16 h-16 rounded-xl border-2 ${idx === imageIndex ? "border-primary" : "border-transparent"}`}
// //                         resizeMode="cover"
// //                       />
// //                     </TouchableOpacity>
// //                   ))}
// //                 </ScrollView>
// //               )}
// //             </View>
// //           ) : (
// //             <View className="w-full h-72 bg-gray-100 items-center justify-center">
// //               <Package color={Colors.light.icon} size={64} />
// //             </View>
// //           )}

// //           <View className="p-4 bg-white rounded-t-3xl -mt-4 pt-6 pb-8">
// //             {/* Category Badge */}
// //             <View className="self-start px-3 py-1 bg-green-50 rounded-lg border border-green-100 mb-3">
// //               <Text className="text-green-700 font-bold text-xs uppercase tracking-wide">{product.category || 'General'}</Text>
// //             </View>

// //             {/* Title & Price */}
// //             <Text className="text-2xl font-extrabold text-gray-900 mb-2 leading-tight">{product.productName}</Text>
// //             <Text className="text-3xl font-black text-primary mb-5">₹{product.pricePerUnit} <Text className="text-base font-semibold text-gray-500">/ {product.unit}</Text></Text>


// //             {/* Stock & Delivery */}
// //             <View className="flex-row flex-wrap gap-2 mb-6">
// //               <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
// //                 <Text className="text-sm font-semibold text-gray-700">📦 {sellableStock} {product.unit} available</Text>
// //               </View>
// //               <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
// //                 <Text className="text-sm font-semibold text-gray-700">
// //                   {product.deliveryChargeType === 'flat'
// //                     ? `🚚 ₹${product.deliveryCharge} delivery`
// //                     : product.deliveryCharge === 0 ? '🚚 Free delivery' : `🚚 ₹${product.deliveryCharge}/${product.unit}`}
// //                 </Text>
// //               </View>
// //             </View>

// //             {/* Seller Info */}
// //             <View style={{ flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#f8fafc', borderRadius: 18, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' }}>
// //               <LinearGradient colors={['#15803d', '#22c55e']} style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 14 }} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
// //                 <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>{sellerName[0]?.toUpperCase()}</Text>
// //               </LinearGradient>
// //               <View style={{ flex: 1 }}>
// //                 <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 4 }}>{sellerName}</Text>
// //                 {location ? (
// //                   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
// //                     <MapPin color="#94a3b8" size={13} />
// //                     <Text style={{ fontSize: 12, color: '#94a3b8', fontWeight: '500' }}>{location}</Text>
// //                   </View>
// //                 ) : null}
// //               </View>
// //             </View>

// //             {/* Quantity Picker */}
// //             <Text className="text-lg font-bold text-gray-900 mb-3">Quantity ({product.unit})</Text>
// //             <View className="flex-row items-center mb-2">
// //               <TouchableOpacity
// //                 className={`w-10 h-10 rounded-full items-center justify-center ${quantity <= minQty || maxQty === 0 ? 'bg-gray-50 opacity-50' : 'bg-gray-100'}`}
// //                 onPress={() => setQuantity(Math.max(minQty, quantity - 1))}
// //                 disabled={quantity <= minQty || maxQty === 0}
// //               >
// //                 <Minus size={18} color={Colors.light.text} />
// //               </TouchableOpacity>
// //               <Text className="text-xl font-bold text-gray-900 mx-5">{quantity}</Text>
// //               <TouchableOpacity
// //                 className={`w-10 h-10 rounded-full items-center justify-center ${quantity >= dynamicMaxQty ? 'bg-gray-50 opacity-50' : 'bg-gray-100'}`}
// //                 onPress={() => setQuantity(Math.min(dynamicMaxQty, quantity + 1))}
// //                 disabled={quantity >= dynamicMaxQty}
// //               >
// //                 <Plus size={18} color={Colors.light.text} />
// //               </TouchableOpacity>
// //               <Text className="text-lg font-bold text-gray-500 ml-auto">= ₹{((quantity || 1) * (Number(product?.pricePerUnit) || 0)).toFixed(2)}</Text>
// //             </View>

// //             {minQty > 1 && (
// //               <Text className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded self-start mt-2">Minimum order: {minQty} {product.unit}</Text>
// //             )}

// //             {isBypassed && dynamicMaxQty > 0 && (
// //               <View className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex-row items-center">
// //                 <CheckCircle2 color="#059669" size={16} className="mr-2" />
// //                 <Text className="text-sm text-emerald-800 flex-1">Approved to buy up to {specialRequest.quantity} units. You can add {dynamicMaxQty} more.</Text>
// //               </View>
// //             )}
// //             {isBypassed && dynamicMaxQty <= 0 && (
// //               <View className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex-row items-center">
// //                 <AlertCircle color="#d97706" size={16} className="mr-2" />
// //                 <Text className="text-sm text-amber-800 flex-1">You have reached the approved limit ({specialRequest.quantity} {product.unit}) in your cart.</Text>
// //               </View>
// //             )}
// //             {isGrayscaled && (
// //               <View className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex-row items-start">
// //                 <AlertCircle color="#dc2626" size={20} className="mr-2 mt-0.5" />
// //                 <View className="flex-1">
// //                   <Text className="text-sm font-bold text-red-800 mb-1">Out of Delivery Range</Text>
// //                   <Text className="text-xs text-red-700 leading-tight">This seller is located outside our standard delivery radius. You must request special logistics delivery to buy this product.</Text>
// //                 </View>
// //               </View>
// //             )}
// //           </View>
// //         </View>
// //       </ScrollView>

// //       {/* Add to Cart Footer */}
// //       <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: insets.bottom + 14, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 8 }}>
// //         <View className="flex-1 mr-4">
// //           <Text className="text-sm font-semibold text-gray-500">Total</Text>
// //           <Text className="text-2xl font-black text-gray-900">₹{(quantity * product.pricePerUnit).toFixed(2)}</Text>
// //         </View>

// //         {isOutOfRange && !isBypassed && !requestRecordExists && isSignedIn && role !== 'none' && profile?.lat && profile?.lng ? (
// //           <TouchableOpacity
// //             className="flex-2 flex-row items-center justify-center px-6 py-4 rounded-2xl bg-amber-500"
// //             onPress={() => setSpecialDeliveryModalVisible(true)}
// //           >
// //             <Truck color="#fff" size={20} className="mr-2" />
// //             <Text className="text-white text-base font-bold">Request Delivery</Text>
// //           </TouchableOpacity>
// //         ) : (
// //           <TouchableOpacity
// //             className={`flex-2 flex-row items-center justify-center px-6 py-4 rounded-2xl ${addingToCart || (isBypassed && dynamicMaxQty <= 0) || maxQty === 0 || isFeeLoading ? "opacity-70" : ""
// //               } ${!isSignedIn || !role || role === 'none' || !profile
// //                 ? "bg-blue-600"
// //                 : (!profile?.lat || !profile?.lng)
// //                   ? "bg-amber-500"
// //                   : (isBypassed && dynamicMaxQty <= 0) || maxQty === 0
// //                     ? "bg-gray-400"
// //                     : "bg-primary"
// //               }`}
// //             onPress={handleAddToCart}
// //             disabled={addingToCart || isFeeLoading || (isBypassed && dynamicMaxQty <= 0) || maxQty === 0}
// //           >
// //             {addingToCart || isFeeLoading ? (
// //               <ActivityIndicator color="#fff" />
// //             ) : (
// //               <View className="flex-row items-center">
// //                 {!isSignedIn ? (
// //                   <Text className="text-white text-base font-bold">Login to Purchase</Text>
// //                 ) : (!role || role === 'none' || !profile) ? (
// //                   <Text className="text-white text-base font-bold">Complete Profile</Text>
// //                 ) : (!profile.lat || !profile.lng) ? (
// //                   <Text className="text-white text-base font-bold">Location Required</Text>
// //                 ) : maxQty === 0 ? (
// //                   <Text className="text-white text-lg font-bold">Out of Stock</Text>
// //                 ) : (isOutOfRange && requestRecordExists && !isBypassed) ? (
// //                   <Text className="text-white text-lg font-bold">Awaiting Request</Text>
// //                 ) : (
// //                   <Text className="text-white text-lg font-bold">Add to Cart</Text>
// //                 )}
// //               </View>
// //             )}
// //           </TouchableOpacity>
// //         )}
// //       </View>

// //       {/* Special Delivery Modal */}
// //       <SpecialDeliveryModal
// //         visible={isSpecialDeliveryModalVisible}
// //         onClose={() => setSpecialDeliveryModalVisible(false)}
// //         product={product}
// //         onSuccess={() => {
// //           reloadRequests();
// //           setSpecialDeliveryModalVisible(false);
// //           Alert.alert('Request Sent', 'Your special delivery request is now in mediation. We will notify you once approved.');
// //         }}
// //       />
// //     </SafeAreaView>
// //   );
// // }


// // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// // ===================================================================
// // BEFORE AND AFTER UPDATING THE UI 
// // ===================================================================
// // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// import React, { useEffect, useState } from 'react';
// import {
//   View, Text, Image, TouchableOpacity,
//   ActivityIndicator, ScrollView, Alert, StyleSheet,
//   Dimensions, Animated, Platform,
// } from 'react-native';
// import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { useAuth } from '@clerk/clerk-expo';
// import { Colors } from '@/constants/Colors';
// import { useApiClient } from '@/services/api';
// import { getRouteParam, formatLocation, calculateDistance } from '@/lib/apiHelpers';
// import { useCartStore } from '@/store/cartStore';
// import { useUserStore } from '@/store/userStore';
// import { ArrowLeft, MapPin, Package, Plus, Minus, ShoppingCart, Truck, AlertCircle, Clock, CheckCircle2, MessageCircle, Scale } from 'lucide-react-native';
// import SpecialDeliveryModal from '@/components/SpecialDeliveryModal';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');

// export default function ProductDetailScreen() {
//   const insets = useSafeAreaInsets();
//   const productId = getRouteParam(useLocalSearchParams<{ id: string }>().id);
//   const api = useApiClient();
//   const router = useRouter();
//   const { isSignedIn } = useAuth();
//   const { profile, role } = useUserStore();
//   const { items: cartItems, addToCart, loading: cartLoading, fetchCart } = useCartStore();

//   const [product, setProduct] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [quantity, setQuantity] = useState(1);
//   const [imageIndex, setImageIndex] = useState(0);
//   const [addingToCart, setAddingToCart] = useState(false);
//   const [isSpecialDeliveryModalVisible, setSpecialDeliveryModalVisible] = useState(false);
//   const [specialRequests, setSpecialRequests] = useState<any[]>([]);
//   const [dynamicFee, setDynamicFee] = useState<number | null>(null);
//   const [isOutOfRange, setIsOutOfRange] = useState(false);
//   const [isLongDistance, setIsLongDistance] = useState(false);
//   const [isFeeLoading, setIsFeeLoading] = useState(false);

//   // ── Animation values ──────────────────────────────────────────────
//   const fadeAnim = React.useRef(new Animated.Value(0)).current;
//   const slideAnim = React.useRef(new Animated.Value(32)).current;
//   const scaleAnim = React.useRef(new Animated.Value(0.97)).current;

//   useEffect(() => {
//     if (!loading && product) {
//       Animated.parallel([
//         Animated.timing(fadeAnim, { toValue: 1, duration: 380, useNativeDriver: true }),
//         Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
//         Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
//       ]).start();
//     }
//   }, [loading, product]);

//   // ── All existing logic unchanged ──────────────────────────────────
//   useEffect(() => {
//     const fetchProductAndRequests = async () => {
//       try {
//         const [res, reqRes] = await Promise.all([
//           api.get(`mobile/v1/products?id=${productId}`),
//           isSignedIn ? api.get('mobile/v1/special-delivery').catch(() => ({ success: false, data: [] })) : { success: false, data: [] }
//         ]);

//         if (isSignedIn) {
//           await fetchCart(api).catch(() => { });
//         }

//         const p = res.data ?? null;
//         setProduct(p);

//         let initialMinQty = Math.max(1, Number(p?.minOrderQuantity) || 1);

//         if (reqRes?.success) {
//           setSpecialRequests(reqRes.data || []);
//           const approvedReq = reqRes.data?.find((r: any) => r.productId === p?.id && r.status === 'APPROVED' && !r.isConsumed);
//           if (approvedReq) {
//             const currentCartQty = useCartStore.getState().items.find((it: any) => it.productId === p?.id)?.quantity || 0;
//             const maxAllowed = Math.max(0, approvedReq.quantity - currentCartQty);
//             const physical = Number(p?.availableStock) || 0;
//             const finalMax = Math.min(physical, maxAllowed);
//             initialMinQty = finalMax > 0 ? finalMax : 1;
//           }
//         }

//         if (p?.minOrderQuantity || reqRes?.success) {
//           setQuantity(initialMinQty);
//         }

//         if (p && profile?.lat && profile?.lng) {
//           setIsFeeLoading(true);
//           const feeRes = await api.get(`mobile/v1/orders/fee?lat=${profile.lat}&lng=${profile.lng}&productId=${p.id}`);
//           if (feeRes?.success) {
//             setDynamicFee(feeRes.fee);
//             setIsOutOfRange(feeRes.isOutOfRange);
//             setIsLongDistance(feeRes.isLongDistance);
//           }
//           setIsFeeLoading(false);
//         }
//       } catch (err: any) {
//         setError(err.message || 'Failed to load product');
//         setIsFeeLoading(false);
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (productId) fetchProductAndRequests();
//   }, [productId, isSignedIn, profile?.lat, profile?.lng]);

//   const reloadRequests = async () => {
//     try {
//       const res = await api.get('mobile/v1/special-delivery');
//       if (res?.success) setSpecialRequests(res.data || []);
//     } catch (e) { }
//   };

//   const handleAddToCart = async () => {
//     if (!product) return;

//     if (!isSignedIn) {
//       router.push('/(auth)/sign-in');
//       return;
//     }

//     if (!role || role === 'none' || !profile) {
//       router.push('/onboarding');
//       return;
//     }

//     if (!profile.lat || !profile.lng) {
//       router.push('/edit-profile');
//       return;
//     }

//     if (isBypassed) {
//       if (quantity > dynamicMaxQty) {
//         Alert.alert('Out of Range Limit Exceeded', `You can only add ${dynamicMaxQty} more unit(s) based on your approved request.`);
//         return;
//       }
//     }

//     setAddingToCart(true);
//     try {
//       await addToCart(api, product.id, quantity);
//       if (Platform.OS === 'web') {
//         if (window.confirm(`${quantity} × ${product.productName} added to your cart.\n\nDo you want to view your cart now?`)) {
//           router.push('/(tabs)/cart');
//         }
//       } else {
//         Alert.alert('Added to Cart ✓', `${quantity} × ${product.productName} added to your cart.`, [
//           { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
//           { text: 'Continue Shopping', style: 'cancel' },
//         ]);
//       }
//     } catch (err: any) {
//       if (Platform.OS === 'web') {
//         window.alert(err.message || 'Failed to add to cart. Please try again.');
//       } else {
//         Alert.alert('Error', err.message || 'Failed to add to cart. Please try again.');
//       }
//     } finally {
//       setAddingToCart(false);
//     }
//   };

//   // ── Loading State ─────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <LinearGradient colors={['#0f2419', '#1a3a28']} style={[styles.header, { paddingTop: insets.top + 12 }]}>
//           <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
//             <ArrowLeft color="#fff" size={20} />
//           </TouchableOpacity>
//         </LinearGradient>
//         <View style={styles.loadingBody}>
//           {/* Skeleton shimmer blocks */}
//           <View style={styles.skeletonImage} />
//           <View style={styles.skeletonContent}>
//             <View style={[styles.skeletonLine, { width: '40%', height: 14, marginBottom: 10 }]} />
//             <View style={[styles.skeletonLine, { width: '80%', height: 22, marginBottom: 8 }]} />
//             <View style={[styles.skeletonLine, { width: '55%', height: 28, marginBottom: 20 }]} />
//             <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
//               <View style={[styles.skeletonLine, { width: 110, height: 36, borderRadius: 12 }]} />
//               <View style={[styles.skeletonLine, { width: 110, height: 36, borderRadius: 12 }]} />
//             </View>
//             <View style={[styles.skeletonLine, { width: '100%', height: 70, borderRadius: 16 }]} />
//           </View>
//         </View>
//       </View>
//     );
//   }

//   // ── Error State ───────────────────────────────────────────────────
//   if (error || !product) {
//     return (
//       <SafeAreaView style={{ flex: 1, backgroundColor: '#f8faf9' }} edges={['top']}>
//         <LinearGradient colors={['#0f2419', '#1a3a28']} style={[styles.header, { paddingTop: 12 }]}>
//           <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
//             <ArrowLeft color="#fff" size={20} />
//           </TouchableOpacity>
//         </LinearGradient>
//         <View style={styles.errorBody}>
//           <View style={styles.errorIconWrap}>
//             <Package color="#16a34a" size={38} />
//           </View>
//           <Text style={styles.errorTitle}>{error ? 'Something went wrong' : 'Product not found'}</Text>
//           <Text style={styles.errorSub}>{error || 'This product may no longer be available.'}</Text>
//           <TouchableOpacity
//             onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
//             style={styles.errorBtn}
//           >
//             <Text style={styles.errorBtnText}>← Go Back</Text>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   // ── Derived state (all original logic preserved) ──────────────────
//   const seller = product.farmer || product.agent;
//   const sellerName = seller?.name || seller?.companyName || 'Unknown Seller';
//   const location = formatLocation(seller);
//   const images = product.images || [];

//   const specialRequest = specialRequests.find((r: any) => r.productId === product.id && r.status === 'APPROVED' && !r.isConsumed);
//   const isBypassed = !!specialRequest;
//   const requestRecordExists = specialRequests.some((r: any) => r.productId === product.id && r.status === 'PENDING');

//   const minQty = isBypassed ? 1 : Math.max(1, Number(product?.minOrderQuantity) || 1);

//   const physicalStock = Number(product?.availableStock) || 0;
//   const sellableStock = product?.availableSellableStock !== undefined ? Number(product.availableSellableStock) : physicalStock;

//   const maxQty = isBypassed ? physicalStock : sellableStock;

//   const canAddToCart = !isOutOfRange || isBypassed;

//   const currentCartQuantity = cartItems.find((it: any) => it.productId === product.id)?.quantity || 0;
//   let dynamicMaxQty = maxQty;
//   if (isBypassed) {
//     dynamicMaxQty = Math.min(maxQty, Math.max(0, (specialRequest?.quantity || 0) - currentCartQuantity));
//   }

//   const isGrayscaled = isOutOfRange && !isBypassed;

//   // ── Delivery label (original logic) ──────────────────────────────
//   const deliveryLabel = product.deliveryChargeType === 'flat'
//     ? `₹${product.deliveryCharge} flat delivery`
//     : product.deliveryCharge === 0
//       ? 'Free delivery'
//       : `₹${product.deliveryCharge}/${product.unit}`;

//   // ── CTA button config (original logic, just styled) ───────────────
//   const getCtaConfig = () => {
//     if (!isSignedIn) return { label: 'Login to Purchase', bg: '#2563eb', icon: null };
//     if (!role || role === 'none' || !profile) return { label: 'Complete Profile', bg: '#2563eb', icon: null };
//     if (!profile?.lat || !profile?.lng) return { label: 'Set Location', bg: '#d97706', icon: null };
//     if (maxQty === 0) return { label: 'Out of Stock', bg: '#94a3b8', icon: null, disabled: true };
//     if (isOutOfRange && requestRecordExists && !isBypassed) return { label: 'Awaiting Approval', bg: '#94a3b8', icon: null, disabled: true };
//     return { label: 'Add to Cart', bg: '#16a34a', icon: <ShoppingCart color="#fff" size={18} /> };
//   };
//   const ctaConfig = getCtaConfig();
//   const ctaDisabled = addingToCart || isFeeLoading || (isBypassed && dynamicMaxQty <= 0) || maxQty === 0;

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: '#0f2419' }} edges={['top']}>
//       {/* ── Header ── */}
//       <LinearGradient
//         colors={['#0f2419', '#1a3a28']}
//         style={[styles.header, { paddingTop: 6 }]}
//       >
//         <TouchableOpacity
//           onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
//           style={styles.backBtn}
//         >
//           <ArrowLeft color="#fff" size={20} />
//         </TouchableOpacity>
//         <Text style={styles.headerTitle} numberOfLines={1}>{product.productName}</Text>
//         <TouchableOpacity
//           onPress={() => router.push('/(tabs)/cart')}
//           style={styles.cartBtn}
//         >
//           <ShoppingCart color="#4ade80" size={20} />
//           {cartItems.length > 0 && (
//             <View style={styles.cartBadge}>
//               <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
//             </View>
//           )}
//         </TouchableOpacity>
//       </LinearGradient>

//       <ScrollView
//         showsVerticalScrollIndicator={false}
//         style={{ flex: 1, backgroundColor: '#f4f7f4' }}
//         contentContainerStyle={{ paddingBottom: 16 }}
//       >
//         <Animated.View style={{ opacity: isGrayscaled ? 0.45 : fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>

//           {/* ── Image Gallery ── */}
//           <View style={styles.galleryContainer}>
//             {images.length > 0 ? (
//               <>
//                 <Image
//                   source={{ uri: images[imageIndex] }}
//                   style={styles.mainImage}
//                   resizeMode="cover"
//                 />
//                 {/* Gradient overlay at bottom of image */}
//                 <LinearGradient
//                   colors={['transparent', 'rgba(15,36,25,0.55)']}
//                   style={styles.imageGradientOverlay}
//                 />
//                 {/* Category pill over image */}
//                 <View style={styles.categoryPillOverlay}>
//                   <Text style={styles.categoryPillText}>{product.category || 'General'}</Text>
//                 </View>
//                 {/* Thumbnail strip */}
//                 {images.length > 1 && (
//                   <ScrollView
//                     horizontal
//                     showsHorizontalScrollIndicator={false}
//                     style={styles.thumbnailStrip}
//                     contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
//                   >
//                     {images.map((img: string, idx: number) => (
//                       <TouchableOpacity key={idx} onPress={() => setImageIndex(idx)} activeOpacity={0.8}>
//                         <View style={[styles.thumbnailWrap, idx === imageIndex && styles.thumbnailActive]}>
//                           <Image source={{ uri: img }} style={styles.thumbnail} resizeMode="cover" />
//                         </View>
//                       </TouchableOpacity>
//                     ))}
//                   </ScrollView>
//                 )}
//                 {/* Dot indicators for single row (no thumbnails needed if just dots) */}
//                 {images.length > 1 && (
//                   <View style={styles.dotRow}>
//                     {images.map((_: any, idx: number) => (
//                       <View key={idx} style={[styles.dot, idx === imageIndex && styles.dotActive]} />
//                     ))}
//                   </View>
//                 )}
//               </>
//             ) : (
//               <View style={styles.noImagePlaceholder}>
//                 <Package color="#a7c4b2" size={56} />
//                 <Text style={styles.noImageText}>No image available</Text>
//               </View>
//             )}
//           </View>

//           {/* ── Main Card ── */}
//           <View style={styles.mainCard}>

//             {/* ── Header Badges Row ── */}
//             <View style={styles.headerBadgesRow}>
//               <View style={[styles.headerBadge, product.sellerType === 'farmer'
//                 ? { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }
//                 : { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' }]}>
//                 <Text style={[styles.headerBadgeTxt, { color: product.sellerType === 'farmer' ? '#15803d' : '#1d4ed8' }]}>
//                   {product.sellerType === 'farmer' ? '🌾 Direct from Farm' : '🏢 Verified Trader'}
//                 </Text>
//               </View>
//               {product.category ? (
//                 <View style={[styles.headerBadge, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
//                   <Text style={[styles.headerBadgeTxt, { color: '#c2410c' }]}>{product.category}</Text>
//                 </View>
//               ) : null}
//               {seller?.averageRating != null && (
//                 <View style={[styles.headerBadge, { backgroundColor: '#fef9c3', borderColor: '#fde68a' }]}>
//                   <Text style={[styles.headerBadgeTxt, { color: '#92400e' }]}>
//                     ⭐ {Number(seller.averageRating).toFixed(1)}
//                     {seller?.totalReviews ? ` (${seller.totalReviews})` : ''}
//                   </Text>
//                 </View>
//               )}
//             </View>

//             {/* ── Product Name ── */}
//             <Text style={styles.productName}>{product.productName}</Text>

//             {/* ── Price Row ── */}
//             <View style={styles.priceRow}>
//               <Text style={styles.priceMain}>₹{product.pricePerUnit}</Text>
//               <Text style={styles.priceUnit}>/ {product.unit}</Text>
//               {sellableStock <= 0 && (
//                 <View style={styles.outOfStockBadge}>
//                   <Text style={styles.outOfStockTxt}>OUT OF STOCK</Text>
//                 </View>
//               )}
//               {sellableStock === 1 && (
//                 <View style={[styles.outOfStockBadge, { backgroundColor: '#dc2626' }]}>
//                   <Text style={styles.outOfStockTxt}>🔥 LAST UNIT</Text>
//                 </View>
//               )}
//               {sellableStock > 1 && sellableStock <= 10 && (
//                 <View style={[styles.outOfStockBadge, { backgroundColor: '#ea580c' }]}>
//                   <Text style={styles.outOfStockTxt}>⚡ Only {sellableStock} left</Text>
//                 </View>
//               )}
//             </View>

//             {/* ── Structured Info Panel (mirrors web design) ── */}
//             <View style={styles.infoPanel}>
//               {/* Stock Available Row */}
//               <View style={styles.infoPanelRow}>
//                 <View style={styles.infoPanelIcon}>
//                   <Package color="#2563eb" size={16} />
//                 </View>
//                 <View style={styles.infoPanelContent}>
//                   <Text style={styles.infoPanelLabel}>STOCK AVAILABLE</Text>
//                   <Text style={styles.infoPanelValue}>{sellableStock} {product.unit}</Text>
//                 </View>
//                 {maxQty > 0 ? (
//                   <View style={styles.infoPanelBadgeGreen}>
//                     <CheckCircle2 color="#15803d" size={10} />
//                     <Text style={styles.infoPanelBadgeGreenTxt}>Available</Text>
//                   </View>
//                 ) : (
//                   <View style={styles.infoPanelBadgeRed}>
//                     <Text style={styles.infoPanelBadgeRedTxt}>Out of Stock</Text>
//                   </View>
//                 )}
//               </View>

//               <View style={styles.infoPanelDivider} />

//               {/* Delivery Logistics Row */}
//               <View style={styles.infoPanelRow}>
//                 <View style={[styles.infoPanelIcon, { backgroundColor: '#fff7ed' }]}>
//                   <Truck color="#ea580c" size={16} />
//                 </View>
//                 <View style={styles.infoPanelContent}>
//                   <Text style={styles.infoPanelLabel}>DELIVERY LOGISTICS</Text>
//                   {isFeeLoading ? (
//                     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
//                       <ActivityIndicator size="small" color="#ea580c" />
//                       <Text style={[styles.infoPanelValue, { color: '#94a3b8' }]}>Calculating…</Text>
//                     </View>
//                   ) : (
//                     <Text style={[styles.infoPanelValue, isOutOfRange && { color: '#dc2626' }]}>
//                       {isOutOfRange
//                         ? 'Out of Range'
//                         : dynamicFee !== null
//                           ? `₹${dynamicFee} to you`
//                           : deliveryLabel}
//                     </Text>
//                   )}
//                 </View>
//                 {!isFeeLoading && dynamicFee !== null && !isOutOfRange && (
//                   <View style={[styles.infoPanelBadge, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
//                     <Text style={[styles.infoPanelBadgeTxt, { color: '#c2410c' }]}>Matched</Text>
//                   </View>
//                 )}
//                 {!isFeeLoading && isOutOfRange && !isBypassed && (
//                   <View style={[styles.infoPanelBadge, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
//                     <Text style={[styles.infoPanelBadgeTxt, { color: '#dc2626' }]}>Extended</Text>
//                   </View>
//                 )}
//               </View>

//               {/* Min Order Row (only when > 1) */}
//               {product.minOrderQuantity > 1 && (
//                 <>
//                   <View style={styles.infoPanelDivider} />
//                   <View style={styles.infoPanelRow}>
//                     <View style={[styles.infoPanelIcon, { backgroundColor: '#f0fdf4' }]}>
//                       <Scale color="#15803d" size={16} />
//                     </View>
//                     <View style={styles.infoPanelContent}>
//                       <Text style={styles.infoPanelLabel}>MINIMUM ORDER</Text>
//                       <Text style={styles.infoPanelValue}>{product.minOrderQuantity} {product.unit}</Text>
//                     </View>
//                   </View>
//                 </>
//               )}
//             </View>

//             {/* Out-of-range banner */}
//             {isOutOfRange && !isBypassed && (
//               <View style={styles.outOfRangeBanner}>
//                 <AlertCircle color="#b45309" size={16} />
//                 <Text style={styles.outOfRangeTxt}>
//                   This seller is outside standard delivery range. Request special logistics approval below.
//                 </Text>
//               </View>
//             )}

//             {/* ── Divider ── */}
//             <View style={styles.divider} />

//             {/* ── Description ── */}
//             {product.description ? (
//               <>
//                 <Text style={styles.sectionLabel}>About this Product</Text>
//                 <Text style={styles.descriptionText}>{product.description}</Text>
//                 <View style={styles.divider} />
//               </>
//             ) : null}

//             {/* ── Product Details Stat Grid ── */}
//             <Text style={styles.sectionLabel}>Product Details</Text>
//             <View style={styles.statGrid}>
//               <View style={styles.statItem}>
//                 <Text style={styles.statEmoji}>⏳</Text>
//                 <Text style={styles.statLabel}>Shelf Life</Text>
//                 <Text style={styles.statValue}>{product.shelfLife || 'N/A'}</Text>
//               </View>
//               <View style={styles.statItem}>
//                 <Text style={styles.statEmoji}>📅</Text>
//                 <Text style={styles.statLabel}>Harvest Date</Text>
//                 <Text style={styles.statValue}>
//                   {product.harvestDate
//                     ? new Date(product.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
//                     : 'N/A'}
//                 </Text>
//               </View>
//               <View style={styles.statItem}>
//                 <Text style={styles.statEmoji}>🏆</Text>
//                 <Text style={styles.statLabel}>Quality</Text>
//                 <Text style={styles.statValue}>{product.qualityGrade || 'Standard'}</Text>
//               </View>
//               <View style={styles.statItem}>
//                 <Text style={styles.statEmoji}>📍</Text>
//                 <Text style={styles.statLabel}>Delivery Radius</Text>
//                 <Text style={styles.statValue}>
//                   {product.maxDeliveryRange ? `${product.maxDeliveryRange} KM` : 'Standard'}
//                 </Text>
//               </View>
//               <View style={styles.statItem}>
//                 <Text style={styles.statEmoji}>📦</Text>
//                 <Text style={styles.statLabel}>Min Order</Text>
//                 <Text style={styles.statValue}>{product.minOrderQuantity || 1} {product.unit}</Text>
//               </View>
//               {product.deliveryChargeType && (
//                 <View style={styles.statItem}>
//                   <Text style={styles.statEmoji}>🚚</Text>
//                   <Text style={styles.statLabel}>Delivery Type</Text>
//                   <Text style={styles.statValue}>{product.deliveryChargeType === 'flat' ? 'Flat Rate' : 'Per Unit'}</Text>
//                 </View>
//               )}
//             </View>

//             {/* ── Variety Tags ── */}
//             {product.variety ? (
//               <>
//                 <View style={styles.divider} />
//                 <Text style={styles.sectionLabel}>Variety & Features</Text>
//                 <View style={styles.varietyTagRow}>
//                   {product.variety.split(', ').map((tag: string, idx: number) => (
//                     <View key={idx} style={styles.varietyTag}>
//                       <Text style={styles.varietyTagTxt}>{tag.trim()}</Text>
//                     </View>
//                   ))}
//                 </View>
//               </>
//             ) : null}



//             {/* ── Seller Section ── */}
//             <View style={styles.divider} />
//             <Text style={styles.sectionLabel}>Seller Information</Text>
//             <View style={styles.sellerCard}>
//               <LinearGradient
//                 colors={product.sellerType === 'farmer' ? ['#15803d', '#4ade80'] : ['#1d4ed8', '#60a5fa']}
//                 style={styles.sellerAvatar}
//                 start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
//               >
//                 <Text style={styles.sellerAvatarText}>{sellerName[0]?.toUpperCase()}</Text>
//               </LinearGradient>

//               <View style={{ flex: 1 }}>
//                 <View style={styles.sellerNameRow}>
//                   <Text style={styles.sellerName} numberOfLines={1}>{sellerName}</Text>
//                   <View style={styles.sellerBadge}>
//                     <Text style={styles.sellerBadgeText}>✓ Verified</Text>
//                   </View>
//                 </View>

//                 {product.sellerType === 'farmer' && seller?.farmName && seller.farmName !== sellerName && (
//                   <Text style={styles.sellerSubName}>{seller.farmName}</Text>
//                 )}
//                 {product.sellerType === 'agent' && seller?.companyName && seller.companyName !== sellerName && (
//                   <Text style={styles.sellerSubName}>{seller.companyName}</Text>
//                 )}

//                 {product.sellerType === 'agent' && seller?.agentType && (
//                   <Text style={styles.sellerMeta}>🏢 {seller.agentType}</Text>
//                 )}

//                 {product.sellerType === 'farmer' && seller?.farmingExperience && (
//                   <Text style={styles.sellerMeta}>🌱 {seller.farmingExperience} yrs experience</Text>
//                 )}

//                 {product.sellerType === 'farmer' && seller?.primaryProduce && (
//                   <Text style={styles.sellerMeta}>🌾 Specialises in: {seller.primaryProduce}</Text>
//                 )}

//                 {location ? (
//                   <View style={styles.sellerLocation}>
//                     <MapPin color="#64748b" size={11} />
//                     <Text style={styles.sellerLocationText}>{location}</Text>
//                   </View>
//                 ) : null}
//               </View>
//             </View>

//             {/* Divider */}
//             <View style={styles.divider} />

//             {/* ── Quantity Picker ── */}
//             <Text style={styles.sectionLabel}>Quantity <Text style={styles.unitLabel}>({product.unit})</Text></Text>

//             <View style={styles.qtyRow}>
//               <TouchableOpacity
//                 style={[styles.qtyBtn, (quantity <= minQty || maxQty === 0) && styles.qtyBtnDisabled]}
//                 onPress={() => setQuantity(Math.max(minQty, quantity - 1))}
//                 disabled={quantity <= minQty || maxQty === 0}
//                 activeOpacity={0.7}
//               >
//                 <Minus size={16} color={quantity <= minQty || maxQty === 0 ? '#b0bbb5' : '#15803d'} />
//               </TouchableOpacity>

//               <View style={styles.qtyValueWrap}>
//                 <Text style={styles.qtyValue}>{quantity}</Text>
//                 <Text style={styles.qtyUnitSmall}>{product.unit}</Text>
//               </View>

//               <TouchableOpacity
//                 style={[styles.qtyBtn, quantity >= dynamicMaxQty && styles.qtyBtnDisabled]}
//                 onPress={() => setQuantity(Math.min(dynamicMaxQty, quantity + 1))}
//                 disabled={quantity >= dynamicMaxQty}
//                 activeOpacity={0.7}
//               >
//                 <Plus size={16} color={quantity >= dynamicMaxQty ? '#b0bbb5' : '#15803d'} />
//               </TouchableOpacity>

//               <View style={styles.qtyTotal}>
//                 <Text style={styles.qtyTotalLabel}>Total</Text>
//                 <Text style={styles.qtyTotalValue}>₹{((quantity || 1) * (Number(product?.pricePerUnit) || 0)).toFixed(2)}</Text>
//               </View>
//             </View>

//             {minQty > 1 && (
//               <View style={styles.minQtyNote}>
//                 <AlertCircle size={13} color="#92400e" />
//                 <Text style={styles.minQtyText}>Minimum order: {minQty} {product.unit}</Text>
//               </View>
//             )}

//             {/* ── Status Banners (all original conditions preserved) ── */}
//             {isBypassed && dynamicMaxQty > 0 && (
//               <View style={[styles.statusBanner, styles.statusBannerGreen]}>
//                 <CheckCircle2 color="#15803d" size={18} />
//                 <Text style={[styles.statusBannerText, { color: '#14532d' }]}>
//                   Approved for up to <Text style={{ fontWeight: '800' }}>{specialRequest.quantity} units</Text> — {dynamicMaxQty} more available to add.
//                 </Text>
//               </View>
//             )}
//             {isBypassed && dynamicMaxQty <= 0 && (
//               <View style={[styles.statusBanner, styles.statusBannerAmber]}>
//                 <AlertCircle color="#b45309" size={18} />
//                 <Text style={[styles.statusBannerText, { color: '#78350f' }]}>
//                   You've reached your approved limit of <Text style={{ fontWeight: '800' }}>{specialRequest.quantity} {product.unit}</Text> in your cart.
//                 </Text>
//               </View>
//             )}
//             {isGrayscaled && (
//               <View style={[styles.statusBanner, styles.statusBannerRed]}>
//                 <AlertCircle color="#b91c1c" size={18} />
//                 <View style={{ flex: 1 }}>
//                   <Text style={[styles.statusBannerTitle, { color: '#7f1d1d' }]}>Outside Delivery Range</Text>
//                   <Text style={[styles.statusBannerText, { color: '#991b1b', marginTop: 2 }]}>
//                     This seller is outside our standard delivery radius. Request special logistics to purchase.
//                   </Text>
//                 </View>
//               </View>
//             )}
//             {isOutOfRange && requestRecordExists && !isBypassed && (
//               <View style={[styles.statusBanner, styles.statusBannerBlue]}>
//                 <Clock color="#1d4ed8" size={18} />
//                 <Text style={[styles.statusBannerText, { color: '#1e3a8a' }]}>
//                   Your special delivery request is <Text style={{ fontWeight: '800' }}>under review</Text>. We'll notify you once approved.
//                 </Text>
//               </View>
//             )}
//           </View>
//         </Animated.View>
//       </ScrollView>

//       {/* ── Footer CTA ── */}
//       <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
//         <View style={styles.footerTotal}>
//           <Text style={styles.footerTotalLabel}>Total</Text>
//           <Text style={styles.footerTotalValue}>₹{(quantity * product.pricePerUnit).toFixed(2)}</Text>
//         </View>

//         {/* Request Special Delivery CTA (original condition unchanged) */}
//         {isOutOfRange && !isBypassed && !requestRecordExists && isSignedIn && role !== 'none' && profile?.lat && profile?.lng ? (
//           <TouchableOpacity
//             style={styles.ctaRequestDelivery}
//             onPress={() => setSpecialDeliveryModalVisible(true)}
//             activeOpacity={0.85}
//           >
//             <Truck color="#fff" size={18} />
//             <Text style={styles.ctaBtnText}>Request Delivery</Text>
//           </TouchableOpacity>
//         ) : (
//           <TouchableOpacity
//             style={[
//               styles.ctaBtn,
//               { backgroundColor: ctaConfig.bg },
//               ctaDisabled && styles.ctaBtnDisabled,
//             ]}
//             onPress={handleAddToCart}
//             disabled={ctaDisabled}
//             activeOpacity={0.85}
//           >
//             {addingToCart || isFeeLoading ? (
//               <ActivityIndicator color="#fff" size="small" />
//             ) : (
//               <View style={styles.ctaBtnInner}>
//                 {ctaConfig.icon && <View style={{ marginRight: 8 }}>{ctaConfig.icon}</View>}
//                 <Text style={styles.ctaBtnText}>{ctaConfig.label}</Text>
//               </View>
//             )}
//           </TouchableOpacity>
//         )}
//       </View>

//       {/* ── Special Delivery Modal (unchanged) ── */}
//       <SpecialDeliveryModal
//         visible={isSpecialDeliveryModalVisible}
//         onClose={() => setSpecialDeliveryModalVisible(false)}
//         product={product}
//         onSuccess={() => {
//           reloadRequests();
//           setSpecialDeliveryModalVisible(false);
//           Alert.alert('Request Sent', 'Your special delivery request is now in mediation. We will notify you once approved.');
//         }}
//       />
//     </SafeAreaView>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // Styles
// // ─────────────────────────────────────────────────────────────────────────────
// const styles = StyleSheet.create({
//   // Loading
//   loadingContainer: {
//     flex: 1,
//     backgroundColor: '#f4f7f4',
//   },
//   loadingBody: {
//     flex: 1,
//   },
//   skeletonImage: {
//     width: '100%',
//     height: 300,
//     backgroundColor: '#dde8e2',
//   },
//   skeletonContent: {
//     padding: 20,
//   },
//   skeletonLine: {
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#dde8e2',
//     marginBottom: 6,
//   },

//   // Error
//   errorBody: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     padding: 32,
//     backgroundColor: '#f4f7f4',
//   },
//   errorIconWrap: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     backgroundColor: '#dcfce7',
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginBottom: 20,
//   },
//   errorTitle: {
//     fontSize: 19,
//     fontWeight: '800',
//     color: '#0f2419',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   errorSub: {
//     fontSize: 14,
//     color: '#6b8575',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 28,
//   },
//   errorBtn: {
//     backgroundColor: '#16a34a',
//     paddingHorizontal: 28,
//     paddingVertical: 14,
//     borderRadius: 16,
//   },
//   errorBtnText: {
//     color: '#fff',
//     fontWeight: '800',
//     fontSize: 15,
//   },

//   // Header
//   header: {
//     paddingBottom: 14,
//     paddingHorizontal: 16,
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   backBtn: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255,255,255,0.12)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerTitle: {
//     flex: 1,
//     fontSize: 16,
//     fontWeight: '800',
//     color: '#fff',
//     marginHorizontal: 12,
//     letterSpacing: -0.3,
//   },
//   cartBtn: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(74,222,128,0.15)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   cartBadge: {
//     position: 'absolute',
//     top: 4,
//     right: 4,
//     width: 16,
//     height: 16,
//     borderRadius: 8,
//     backgroundColor: '#4ade80',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   cartBadgeText: {
//     fontSize: 9,
//     fontWeight: '900',
//     color: '#0f2419',
//   },

//   // Gallery
//   galleryContainer: {
//     backgroundColor: '#fff',
//     position: 'relative',
//   },
//   mainImage: {
//     width: '100%',
//     height: 300,
//   },
//   imageGradientOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 100,
//   },
//   categoryPillOverlay: {
//     position: 'absolute',
//     top: 14,
//     left: 14,
//     backgroundColor: 'rgba(15,36,25,0.72)',
//     paddingHorizontal: 12,
//     paddingVertical: 5,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: 'rgba(74,222,128,0.3)',
//   },
//   categoryPillText: {
//     color: '#4ade80',
//     fontSize: 11,
//     fontWeight: '800',
//     letterSpacing: 0.8,
//     textTransform: 'uppercase',
//   },
//   thumbnailStrip: {
//     position: 'absolute',
//     bottom: 10,
//     left: 0,
//     right: 0,
//   },
//   thumbnailWrap: {
//     width: 52,
//     height: 52,
//     borderRadius: 10,
//     borderWidth: 2,
//     borderColor: 'rgba(255,255,255,0.3)',
//     overflow: 'hidden',
//   },
//   thumbnailActive: {
//     borderColor: '#4ade80',
//     borderWidth: 2.5,
//   },
//   thumbnail: {
//     width: '100%',
//     height: '100%',
//   },
//   dotRow: {
//     position: 'absolute',
//     bottom: -24,
//     left: 0,
//     right: 0,
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: 5,
//   },
//   dot: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: '#cbd5d0',
//   },
//   dotActive: {
//     backgroundColor: '#16a34a',
//     width: 18,
//     borderRadius: 3,
//   },
//   noImagePlaceholder: {
//     width: '100%',
//     height: 260,
//     backgroundColor: '#e8f0eb',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 12,
//   },
//   noImageText: {
//     color: '#8aab96',
//     fontSize: 14,
//     fontWeight: '600',
//   },

//   // Main Card
//   mainCard: {
//     backgroundColor: '#fff',
//     marginTop: 10,
//     marginHorizontal: 0,
//     borderTopLeftRadius: 28,
//     borderTopRightRadius: 28,
//     padding: 22,
//     paddingTop: 26,
//     // Inner shadow simulation
//     shadowColor: '#0f2419',
//     shadowOffset: { width: 0, height: -2 },
//     shadowOpacity: 0.06,
//     shadowRadius: 12,
//     elevation: 4,
//   },
//   productName: {
//     fontSize: 24,
//     fontWeight: '900',
//     color: '#0a1f12',
//     letterSpacing: -0.5,
//     lineHeight: 30,
//     marginBottom: 10,
//   },
//   priceRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     marginBottom: 18,
//   },
//   priceMain: {
//     fontSize: 34,
//     fontWeight: '900',
//     color: '#15803d',
//     letterSpacing: -1,
//     lineHeight: 38,
//   },
//   priceUnit: {
//     fontSize: 15,
//     fontWeight: '600',
//     color: '#86a892',
//     marginLeft: 4,
//     marginBottom: 4,
//   },

//   // Chips
//   chipRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginBottom: 16,
//   },
//   chip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f0f5f2',
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#dde8e2',
//     gap: 6,
//   },
//   chipGreen: {
//     backgroundColor: '#dcfce7',
//     borderColor: '#bbf7d0',
//   },
//   chipEmoji: {
//     fontSize: 14,
//   },
//   chipText: {
//     fontSize: 13,
//     fontWeight: '600',
//     color: '#3d5a48',
//   },

//   // Fee
//   feeLoader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//     paddingVertical: 6,
//   },
//   feeLoaderText: {
//     fontSize: 13,
//     color: '#86a892',
//   },
//   feeChip: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     backgroundColor: '#dcfce7',
//     paddingHorizontal: 12,
//     paddingVertical: 7,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#bbf7d0',
//     alignSelf: 'flex-start',
//     marginBottom: 4,
//   },
//   feeChipText: {
//     fontSize: 13,
//     fontWeight: '700',
//     color: '#15803d',
//   },

//   // Divider
//   divider: {
//     height: 1,
//     backgroundColor: '#edf2ef',
//     marginVertical: 20,
//   },

//   // Section labels
//   sectionLabel: {
//     fontSize: 13,
//     fontWeight: '800',
//     color: '#86a892',
//     letterSpacing: 0.8,
//     textTransform: 'uppercase',
//     marginBottom: 12,
//   },
//   unitLabel: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#a0b8ab',
//     textTransform: 'none',
//     letterSpacing: 0,
//   },

//   // Seller Card
//   sellerCard: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f8fbf9',
//     borderRadius: 18,
//     padding: 14,
//     borderWidth: 1,
//     borderColor: '#dde8e2',
//     gap: 14,
//   },
//   sellerAvatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   sellerAvatarText: {
//     fontSize: 20,
//     fontWeight: '900',
//     color: '#fff',
//   },
//   sellerName: {
//     fontSize: 15,
//     fontWeight: '800',
//     color: '#0a1f12',
//     marginBottom: 3,
//   },
//   sellerLocation: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 3,
//   },
//   sellerLocationText: {
//     fontSize: 12,
//     color: '#86a892',
//     fontWeight: '500',
//   },
//   sellerBadge: {
//     backgroundColor: '#dcfce7',
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#bbf7d0',
//   },
//   sellerBadgeText: {
//     fontSize: 11,
//     fontWeight: '800',
//     color: '#15803d',
//   },

//   // Quantity
//   qtyRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     gap: 4,
//   },
//   qtyBtn: {
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//     backgroundColor: '#f0f5f2',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1.5,
//     borderColor: '#dde8e2',
//   },
//   qtyBtnDisabled: {
//     opacity: 0.4,
//   },
//   qtyValueWrap: {
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   qtyValue: {
//     fontSize: 24,
//     fontWeight: '900',
//     color: '#0a1f12',
//     lineHeight: 28,
//   },
//   qtyUnitSmall: {
//     fontSize: 11,
//     fontWeight: '600',
//     color: '#86a892',
//     marginTop: 1,
//   },
//   qtyTotal: {
//     marginLeft: 'auto',
//     alignItems: 'flex-end',
//     backgroundColor: '#f0f5f2',
//     paddingHorizontal: 14,
//     paddingVertical: 8,
//     borderRadius: 14,
//     borderWidth: 1,
//     borderColor: '#dde8e2',
//   },
//   qtyTotalLabel: {
//     fontSize: 11,
//     fontWeight: '600',
//     color: '#86a892',
//     marginBottom: 1,
//   },
//   qtyTotalValue: {
//     fontSize: 17,
//     fontWeight: '900',
//     color: '#15803d',
//   },
//   minQtyNote: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     backgroundColor: '#fffbeb',
//     paddingHorizontal: 12,
//     paddingVertical: 7,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: '#fde68a',
//     alignSelf: 'flex-start',
//     marginTop: 4,
//   },
//   minQtyText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: '#92400e',
//   },

//   // Status Banners
//   statusBanner: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     gap: 10,
//     padding: 14,
//     borderRadius: 16,
//     marginTop: 16,
//     borderWidth: 1,
//   },
//   statusBannerGreen: {
//     backgroundColor: '#f0fdf4',
//     borderColor: '#bbf7d0',
//   },
//   statusBannerAmber: {
//     backgroundColor: '#fffbeb',
//     borderColor: '#fde68a',
//   },
//   statusBannerRed: {
//     backgroundColor: '#fef2f2',
//     borderColor: '#fecaca',
//   },
//   statusBannerBlue: {
//     backgroundColor: '#eff6ff',
//     borderColor: '#bfdbfe',
//   },
//   statusBannerTitle: {
//     fontSize: 13,
//     fontWeight: '800',
//     marginBottom: 2,
//   },
//   statusBannerText: {
//     fontSize: 13,
//     fontWeight: '500',
//     lineHeight: 19,
//     flex: 1,
//   },

//   // Header Badges
//   headerBadgesRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     marginBottom: 12,
//   },
//   headerBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//     borderWidth: 1,
//   },
//   headerBadgeTxt: {
//     fontSize: 10,
//     fontWeight: '800',
//   },
//   outOfStockBadge: {
//     backgroundColor: '#9ca3af',
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//     marginLeft: 6,
//   },
//   outOfStockTxt: {
//     color: '#fff',
//     fontSize: 9,
//     fontWeight: '800',
//   },

//   // Stat Grid
//   statGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginTop: 4,
//   },
//   statItem: {
//     width: '48%',
//     backgroundColor: '#f8fafc',
//     padding: 12,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#f1f5f9',
//   },
//   statEmoji: {
//     fontSize: 18,
//     marginBottom: 6,
//   },
//   statLabel: {
//     fontSize: 11,
//     fontWeight: '700',
//     color: '#64748b',
//     textTransform: 'uppercase',
//     marginBottom: 2,
//   },
//   statValue: {
//     fontSize: 13,
//     fontWeight: '800',
//     color: '#0f172a',
//   },

//   // Variety Tags
//   varietyTagRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 8,
//     marginTop: 4,
//   },
//   varietyTag: {
//     backgroundColor: '#eff6ff',
//     borderWidth: 1,
//     borderColor: '#bfdbfe',
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//   },
//   varietyTagTxt: {
//     color: '#1d4ed8',
//     fontSize: 12,
//     fontWeight: '700',
//   },

//   // Seller Section Enhancements
//   sellerNameRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 6,
//     marginBottom: 2,
//   },
//   sellerSubName: {
//     fontSize: 13,
//     color: '#475569',
//     fontWeight: '600',
//     marginBottom: 4,
//   },
//   sellerMeta: {
//     fontSize: 12,
//     color: '#64748b',
//     marginBottom: 2,
//   },

//   // Info Panel
//   infoPanel: {
//     backgroundColor: '#f8fafc',
//     borderRadius: 18,
//     borderWidth: 1,
//     borderColor: '#e2e8f0',
//     padding: 16,
//     marginBottom: 20,
//   },
//   infoPanelRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   infoPanelIcon: {
//     width: 36,
//     height: 36,
//     borderRadius: 10,
//     backgroundColor: '#dbeafe',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   infoPanelContent: {
//     flex: 1,
//     justifyContent: 'center',
//   },
//   infoPanelLabel: {
//     fontSize: 10,
//     fontWeight: '800',
//     color: '#64748b',
//     letterSpacing: 0.5,
//     marginBottom: 2,
//   },
//   infoPanelValue: {
//     fontSize: 15,
//     fontWeight: '800',
//     color: '#0f172a',
//   },
//   infoPanelBadgeGreen: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#dcfce7',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//     gap: 4,
//   },
//   infoPanelBadgeGreenTxt: {
//     fontSize: 10,
//     fontWeight: '800',
//     color: '#15803d',
//   },
//   infoPanelBadgeRed: {
//     backgroundColor: '#fee2e2',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   infoPanelBadgeRedTxt: {
//     fontSize: 10,
//     fontWeight: '800',
//     color: '#b91c1c',
//   },
//   infoPanelBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//     borderWidth: 1,
//   },
//   infoPanelBadgeTxt: {
//     fontSize: 10,
//     fontWeight: '800',
//   },
//   infoPanelDivider: {
//     height: 1,
//     backgroundColor: '#e2e8f0',
//     marginVertical: 12,
//   },

//   // Action Row
//   actionRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//     marginBottom: 20,
//   },
//   contactSupportBtn: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//     backgroundColor: '#eff6ff',
//     borderWidth: 1.5,
//     borderColor: '#bfdbfe',
//     paddingVertical: 14,
//     borderRadius: 16,
//   },
//   contactSupportTxt: {
//     color: '#1d4ed8',
//     fontSize: 14,
//     fontWeight: '800',
//   },

//   // Out of Range Banner
//   outOfRangeBanner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#fffbeb',
//     padding: 12,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#fde68a',
//     marginBottom: 20,
//     gap: 8,
//   },
//   outOfRangeTxt: {
//     flex: 1,
//     fontSize: 12,
//     color: '#92400e',
//     fontWeight: '500',
//     lineHeight: 18,
//   },

//   // Description
//   descriptionText: {
//     fontSize: 14,
//     color: '#475569',
//     lineHeight: 22,
//     marginBottom: 16,
//   },

//   // Footer
//   footer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingTop: 14,
//     backgroundColor: '#fff',
//     borderTopWidth: 1,
//     borderTopColor: '#edf2ef',
//     shadowColor: '#0f2419',
//     shadowOffset: { width: 0, height: -4 },
//     shadowOpacity: 0.08,
//     shadowRadius: 16,
//     elevation: 10,
//     gap: 14,
//   },
//   footerTotal: {
//     flex: 1,
//   },
//   footerTotalLabel: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#86a892',
//     marginBottom: 2,
//   },
//   footerTotalValue: {
//     fontSize: 26,
//     fontWeight: '900',
//     color: '#0a1f12',
//     letterSpacing: -0.5,
//   },
//   ctaBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 24,
//     paddingVertical: 16,
//     borderRadius: 20,
//     minWidth: 160,
//   },
//   ctaRequestDelivery: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 22,
//     paddingVertical: 16,
//     borderRadius: 20,
//     backgroundColor: '#d97706',
//     gap: 8,
//     minWidth: 160,
//   },
//   ctaBtnDisabled: {
//     opacity: 0.55,
//   },
//   ctaBtnInner: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   ctaBtnText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '800',
//     letterSpacing: -0.2,
//   },
// });



// // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// // ===================================================================
// // BEFORE AND AFTER UPDATING THE UI SECOND TIME
// // ===================================================================
// // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  ActivityIndicator, ScrollView, Alert,
  Dimensions, Animated, Platform, StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Colors } from '@/constants/Colors';
import { useApiClient } from '@/services/api';
import { getRouteParam, formatLocation, calculateDistance } from '@/lib/apiHelpers';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import {
  ArrowLeft, MapPin, Package, Plus, Minus, ShoppingCart,
  Truck, AlertCircle, Clock, CheckCircle2, MessageCircle,
  Scale, Star, Leaf, Shield,
} from 'lucide-react-native';
import SpecialDeliveryModal from '@/components/SpecialDeliveryModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Lightweight pulsing skeleton block ──────────────────────────────────────
function SkeletonBlock({ w, h, radius = 8, mb = 8 }: { w: any; h: number; radius?: number; mb?: number }) {
  const pulse = React.useRef(new Animated.Value(0.4)).current;
  React.useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.85, duration: 720, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 720, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View
      style={{ width: w, height: h, borderRadius: radius, backgroundColor: '#dde8e2', opacity: pulse, marginBottom: mb }}
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const productId = getRouteParam(useLocalSearchParams<{ id: string }>().id);
  const api = useApiClient();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { profile, role } = useUserStore();
  const { items: cartItems, addToCart, loading: cartLoading, fetchCart } = useCartStore();

  // ── Original state — verbatim ─────────────────────────────────────────────
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [isSpecialDeliveryModalVisible, setSpecialDeliveryModalVisible] = useState(false);
  const [specialRequests, setSpecialRequests] = useState<any[]>([]);
  const [dynamicFee, setDynamicFee] = useState<number | null>(null);
  const [isOutOfRange, setIsOutOfRange] = useState(false);
  const [isLongDistance, setIsLongDistance] = useState(false);
  const [isFeeLoading, setIsFeeLoading] = useState(false);

  // ── Lightweight fade + slide (no spring scale, useNativeDriver: true) ─────
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(22)).current;

  useEffect(() => {
    if (!loading && product) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [loading, product]);

  // ── Original data-fetching logic — verbatim ───────────────────────────────
  useEffect(() => {
    const fetchProductAndRequests = async () => {
      try {
        const [res, reqRes] = await Promise.all([
          api.get(`mobile/v1/products?id=${productId}`),
          isSignedIn
            ? api.get('mobile/v1/special-delivery').catch(() => ({ success: false, data: [] }))
            : { success: false, data: [] },
        ]);

        if (isSignedIn) await fetchCart(api).catch(() => { });

        const p = res.data ?? null;
        setProduct(p);

        let initialMinQty = Math.max(1, Number(p?.minOrderQuantity) || 1);

        if (reqRes?.success) {
          setSpecialRequests(reqRes.data || []);
          const approvedReq = reqRes.data?.find(
            (r: any) => r.productId === p?.id && r.status === 'APPROVED' && !r.isConsumed
          );
          if (approvedReq) {
            const currentCartQty = useCartStore.getState().items.find((it: any) => it.productId === p?.id)?.quantity || 0;
            const maxAllowed = Math.max(0, approvedReq.quantity - currentCartQty);
            const physical = Number(p?.availableStock) || 0;
            const finalMax = Math.min(physical, maxAllowed);
            initialMinQty = finalMax > 0 ? finalMax : 1;
          }
        }

        if (p?.minOrderQuantity || reqRes?.success) setQuantity(initialMinQty);

        if (p && profile?.lat && profile?.lng) {
          setIsFeeLoading(true);
          const feeRes = await api.get(
            `mobile/v1/orders/fee?lat=${profile.lat}&lng=${profile.lng}&productId=${p.id}`
          );
          if (feeRes?.success) {
            setDynamicFee(feeRes.fee);
            setIsOutOfRange(feeRes.isOutOfRange);
            setIsLongDistance(feeRes.isLongDistance);
          }
          setIsFeeLoading(false);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product');
        setIsFeeLoading(false);
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchProductAndRequests();
  }, [productId, isSignedIn, profile?.lat, profile?.lng]);

  const reloadRequests = async () => {
    try {
      const res = await api.get('mobile/v1/special-delivery');
      if (res?.success) setSpecialRequests(res.data || []);
    } catch (e) { }
  };

  // ── Original handleAddToCart — verbatim ──────────────────────────────────
  const handleAddToCart = async () => {
    if (!product) return;
    if (!isSignedIn) { router.push('/(auth)/sign-in'); return; }
    if (!role || role === 'none' || !profile) { router.push('/onboarding'); return; }
    if (!profile.lat || !profile.lng) { router.push('/edit-profile'); return; }
    if (isBypassed && quantity > dynamicMaxQty) {
      Alert.alert('Out of Range Limit Exceeded', `You can only add ${dynamicMaxQty} more unit(s) based on your approved request.`);
      return;
    }
    setAddingToCart(true);
    try {
      await addToCart(api, product.id, quantity);
      if (Platform.OS === 'web') {
        if (window.confirm(`${quantity} × ${product.productName} added to your cart.\n\nDo you want to view your cart now?`)) {
          router.push('/(tabs)/cart');
        }
      } else {
        Alert.alert('Added to Cart ✓', `${quantity} × ${product.productName} added to your cart.`, [
          { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
          { text: 'Continue Shopping', style: 'cancel' },
        ]);
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        window.alert(err.message || 'Failed to add to cart. Please try again.');
      } else {
        Alert.alert('Error', err.message || 'Failed to add to cart. Please try again.');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  // ── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0a1f12', '#0f2419']}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            style={styles.backBtn}
          >
            <ArrowLeft color="#fff" size={20} />
          </TouchableOpacity>
          <View style={{ flex: 1, height: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, marginHorizontal: 12 }} />
        </LinearGradient>
        <SkeletonBlock w="100%" h={290} radius={0} mb={0} />
        <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, marginTop: -10 }}>
          <SkeletonBlock w="40%" h={12} />
          <SkeletonBlock w="72%" h={26} />
          <SkeletonBlock w="48%" h={36} mb={20} />
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
            <SkeletonBlock w={140} h={72} radius={14} mb={0} />
            <SkeletonBlock w={140} h={72} radius={14} mb={0} />
          </View>
          <SkeletonBlock w="100%" h={90} radius={16} />
        </View>
      </View>
    );
  }

  // ── Error State ───────────────────────────────────────────────────────────
  if (error || !product) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f4f7f4' }} edges={['top']}>
        <LinearGradient colors={['#0a1f12', '#0f2419']} style={[styles.header, { paddingTop: 8 }]}>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            style={styles.backBtn}
          >
            <ArrowLeft color="#fff" size={20} />
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.errorBody}>
          <View style={styles.errorIconWrap}>
            <Package color="#16a34a" size={38} />
          </View>
          <Text style={styles.errorTitle}>{error ? 'Something went wrong' : 'Product not found'}</Text>
          <Text style={styles.errorSub}>{error || 'This product may no longer be available.'}</Text>
          <TouchableOpacity
            onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
            style={styles.errorBtn}
          >
            <Text style={styles.errorBtnText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived state — ALL original logic verbatim ───────────────────────────
  const seller = product.farmer || product.agent;
  const sellerName = seller?.name || seller?.companyName || 'Unknown Seller';
  const location = formatLocation(seller);
  const images = product.images || [];
  const isFarmer = product.sellerType === 'farmer';

  const specialRequest = specialRequests.find((r: any) => r.productId === product.id && r.status === 'APPROVED' && !r.isConsumed);
  const isBypassed = !!specialRequest;
  const requestRecordExists = specialRequests.some((r: any) => r.productId === product.id && r.status === 'PENDING');

  const minQty = isBypassed ? 1 : Math.max(1, Number(product?.minOrderQuantity) || 1);
  const physicalStock = Number(product?.availableStock) || 0;
  const sellableStock = product?.availableSellableStock !== undefined ? Number(product.availableSellableStock) : physicalStock;
  const maxQty = isBypassed ? physicalStock : sellableStock;
  const canAddToCart = !isOutOfRange || isBypassed;

  const currentCartQuantity = cartItems.find((it: any) => it.productId === product.id)?.quantity || 0;
  let dynamicMaxQty = maxQty;
  if (isBypassed) dynamicMaxQty = Math.min(maxQty, Math.max(0, (specialRequest?.quantity || 0) - currentCartQuantity));

  const isGrayscaled = isOutOfRange && !isBypassed;

  const deliveryLabel = product.deliveryChargeType === 'flat'
    ? `₹${product.deliveryCharge} flat delivery`
    : product.deliveryCharge === 0
      ? 'Free delivery'
      : `₹${product.deliveryCharge}/${product.unit}`;

  const getCtaConfig = () => {
    if (!isSignedIn) return { label: 'Login to Purchase', bg: '#2563eb', icon: null };
    if (!role || role === 'none' || !profile) return { label: 'Complete Profile', bg: '#2563eb', icon: null };
    if (!profile?.lat || !profile?.lng) return { label: 'Set Location', bg: '#d97706', icon: null };
    if (maxQty === 0) return { label: 'Out of Stock', bg: '#94a3b8', icon: null, disabled: true };
    if (isOutOfRange && requestRecordExists && !isBypassed) return { label: 'Awaiting Approval', bg: '#94a3b8', icon: null, disabled: true };
    return { label: 'Add to Cart', bg: '#16a34a', icon: <ShoppingCart color="#fff" size={18} /> };
  };
  const ctaConfig = getCtaConfig();
  const ctaDisabled = addingToCart || isFeeLoading || (isBypassed && dynamicMaxQty <= 0) || maxQty === 0;

  // stock urgency
  const stockUrgency = sellableStock <= 0 ? 'none' : sellableStock === 1 ? 'last' : sellableStock <= 10 ? 'low' : 'ok';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a1f12' }} edges={['top']}>

      {/* ── Top Nav ─────────────────────────────────────────────────────── */}
      <LinearGradient colors={['#0a1f12', '#0f2419']} style={[styles.header, { paddingTop: 6 }]}>
        <TouchableOpacity
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
          style={styles.backBtn}
        >
          <ArrowLeft color="#fff" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.productName}</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={styles.cartBtn}>
          <ShoppingCart color="#4ade80" size={20} />
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, backgroundColor: '#f2f6f3' }}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <Animated.View style={{ opacity: isGrayscaled ? 0.45 : fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Image Gallery ──────────────────────────────────────────────── */}
          <View style={styles.galleryContainer}>
            {images.length > 0 ? (
              <>
                <Image source={{ uri: images[imageIndex] }} style={styles.mainImage} resizeMode="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(10,31,18,0.65)']}
                  style={styles.imageGradientOverlay}
                />

                {/* Category pill */}
                <View style={styles.categoryPillOverlay}>
                  <Leaf color="#4ade80" size={10} />
                  <Text style={styles.categoryPillText}>{product.category || 'General'}</Text>
                </View>

                {/* Stock urgency pill */}
                {(stockUrgency === 'last' || stockUrgency === 'low') && (
                  <View style={[
                    styles.urgencyPill,
                    { backgroundColor: stockUrgency === 'last' ? '#dc2626' : '#ea580c' },
                  ]}>
                    <Text style={styles.urgencyPillText}>
                      {stockUrgency === 'last' ? '🔥 LAST UNIT' : `⚡ ${sellableStock} LEFT`}
                    </Text>
                  </View>
                )}

                {/* Thumbnail strip */}
                {images.length > 1 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.thumbnailStrip}
                    contentContainerStyle={{ paddingHorizontal: 14, gap: 7 }}
                  >
                    {images.map((img: string, idx: number) => (
                      <TouchableOpacity key={idx} onPress={() => setImageIndex(idx)} activeOpacity={0.8}>
                        <View style={[styles.thumbnailWrap, idx === imageIndex && styles.thumbnailActive]}>
                          <Image source={{ uri: img }} style={styles.thumbnail} resizeMode="cover" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {/* Dot indicators */}
                {images.length > 1 && (
                  <View style={styles.dotRow}>
                    {images.map((_: any, idx: number) => (
                      <View key={idx} style={[styles.dot, idx === imageIndex && styles.dotActive]} />
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noImagePlaceholder}>
                <View style={styles.noImageRing}>
                  <Package color="#8aab96" size={36} />
                </View>
                <Text style={styles.noImageText}>No image available</Text>
              </View>
            )}
          </View>

          {/* ── Main Content Card ──────────────────────────────────────────── */}
          <View style={styles.mainCard}>

            {/* Badges row */}
            <View style={styles.headerBadgesRow}>
              <View style={[styles.headerBadge, isFarmer
                ? { backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }
                : { backgroundColor: '#dbeafe', borderColor: '#bfdbfe' }]}>
                <Text style={[styles.headerBadgeTxt, { color: isFarmer ? '#15803d' : '#1d4ed8' }]}>
                  {isFarmer ? '🌾 Direct from Farm' : '🏢 Verified Trader'}
                </Text>
              </View>
              {product.category ? (
                <View style={[styles.headerBadge, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
                  <Text style={[styles.headerBadgeTxt, { color: '#c2410c' }]}>{product.category}</Text>
                </View>
              ) : null}
              {seller?.averageRating != null && (
                <View style={[styles.headerBadge, { backgroundColor: '#fef9c3', borderColor: '#fde68a', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                  <Star color="#d97706" size={9} fill="#d97706" />
                  <Text style={[styles.headerBadgeTxt, { color: '#92400e' }]}>
                    {Number(seller.averageRating).toFixed(1)}
                    {seller?.totalReviews ? ` (${seller.totalReviews})` : ''}
                  </Text>
                </View>
              )}
            </View>

            {/* Product name */}
            <Text style={styles.productName}>{product.productName}</Text>

            {/* Price row */}
            <View style={styles.priceRow}>
              <Text style={styles.priceMain}>₹{product.pricePerUnit}</Text>
              <Text style={styles.priceUnit}>/ {product.unit}</Text>
              {sellableStock <= 0 && (
                <View style={[styles.stockPill, { backgroundColor: '#9ca3af' }]}>
                  <Text style={styles.stockPillTxt}>OUT OF STOCK</Text>
                </View>
              )}
            </View>

            {/* ── Info Panel ────────────────────────────────────────────────── */}
            <View style={styles.infoPanel}>
              {/* Stock row */}
              <View style={styles.infoPanelRow}>
                <View style={[styles.infoPanelIcon, { backgroundColor: '#dbeafe' }]}>
                  <Package color="#2563eb" size={16} />
                </View>
                <View style={styles.infoPanelContent}>
                  <Text style={styles.infoPanelLabel}>STOCK AVAILABLE</Text>
                  <Text style={styles.infoPanelValue}>{sellableStock} {product.unit}</Text>
                </View>
                {maxQty > 0 ? (
                  <View style={styles.infoPanelBadgeGreen}>
                    <CheckCircle2 color="#15803d" size={10} />
                    <Text style={styles.infoPanelBadgeGreenTxt}>In Stock</Text>
                  </View>
                ) : (
                  <View style={styles.infoPanelBadgeRed}>
                    <Text style={styles.infoPanelBadgeRedTxt}>Sold Out</Text>
                  </View>
                )}
              </View>

              <View style={styles.infoPanelDivider} />

              {/* Delivery row */}
              <View style={styles.infoPanelRow}>
                <View style={[styles.infoPanelIcon, { backgroundColor: '#ffedd5' }]}>
                  <Truck color="#ea580c" size={16} />
                </View>
                <View style={styles.infoPanelContent}>
                  <Text style={styles.infoPanelLabel}>DELIVERY</Text>
                  {isFeeLoading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ActivityIndicator size="small" color="#ea580c" />
                      <Text style={[styles.infoPanelValue, { color: '#94a3b8', fontSize: 13 }]}>Calculating…</Text>
                    </View>
                  ) : (
                    <Text style={[styles.infoPanelValue, isOutOfRange && { color: '#dc2626' }]}>
                      {isOutOfRange
                        ? 'Out of Delivery Range'
                        : dynamicFee !== null
                          ? `₹${dynamicFee} to your location`
                          : deliveryLabel}
                    </Text>
                  )}
                </View>
                {!isFeeLoading && dynamicFee !== null && !isOutOfRange && (
                  <View style={[styles.infoPanelBadge, { backgroundColor: '#fff7ed', borderColor: '#fed7aa' }]}>
                    <Text style={[styles.infoPanelBadgeTxt, { color: '#c2410c' }]}>Calculated</Text>
                  </View>
                )}
                {!isFeeLoading && isOutOfRange && !isBypassed && (
                  <View style={[styles.infoPanelBadge, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
                    <Text style={[styles.infoPanelBadgeTxt, { color: '#dc2626' }]}>Extended</Text>
                  </View>
                )}
              </View>

              {/* Min order row */}
              {product.minOrderQuantity > 1 && (
                <>
                  <View style={styles.infoPanelDivider} />
                  <View style={styles.infoPanelRow}>
                    <View style={[styles.infoPanelIcon, { backgroundColor: '#dcfce7' }]}>
                      <Scale color="#15803d" size={16} />
                    </View>
                    <View style={styles.infoPanelContent}>
                      <Text style={styles.infoPanelLabel}>MINIMUM ORDER</Text>
                      <Text style={styles.infoPanelValue}>{product.minOrderQuantity} {product.unit}</Text>
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Out of range banner */}
            {isOutOfRange && !isBypassed && (
              <View style={styles.outOfRangeBanner}>
                <AlertCircle color="#b45309" size={15} />
                <Text style={styles.outOfRangeTxt}>
                  This seller is outside standard delivery range. Request special logistics approval below.
                </Text>
              </View>
            )}

            <View style={styles.divider} />

            {/* ── Description ───────────────────────────────────────────────── */}
            {product.description ? (
              <>
                <Text style={styles.sectionLabel}>About this Product</Text>
                <Text style={styles.descriptionText}>{product.description}</Text>
                <View style={styles.divider} />
              </>
            ) : null}

            {/* ── Product Details Grid ───────────────────────────────────────── */}
            <Text style={styles.sectionLabel}>Product Details</Text>
            <View style={styles.statGrid}>
              {[
                { emoji: '⏳', label: 'Shelf Life', value: product.shelfLife || 'N/A' },
                { emoji: '📅', label: 'Harvest Date', value: product.harvestDate ? new Date(product.harvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : 'N/A' },
                { emoji: '🏆', label: 'Quality', value: product.qualityGrade || 'Standard' },
                { emoji: '📍', label: 'Delivery Radius', value: product.maxDeliveryRange ? `${product.maxDeliveryRange} KM` : 'Standard' },
                { emoji: '📦', label: 'Min Order', value: `${product.minOrderQuantity || 1} ${product.unit}` },
                ...(product.deliveryChargeType ? [{ emoji: '🚚', label: 'Delivery Type', value: product.deliveryChargeType === 'flat' ? 'Flat Rate' : 'Per Unit' }] : []),
              ].map((item, i) => (
                <View key={i} style={styles.statItem}>
                  <Text style={styles.statEmoji}>{item.emoji}</Text>
                  <Text style={styles.statLabel}>{item.label}</Text>
                  <Text style={styles.statValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* ── Variety Tags ──────────────────────────────────────────────── */}
            {product.variety ? (
              <>
                <View style={styles.divider} />
                <Text style={styles.sectionLabel}>Variety &amp; Features</Text>
                <View style={styles.varietyTagRow}>
                  {product.variety.split(', ').map((tag: string, idx: number) => (
                    <View key={idx} style={styles.varietyTag}>
                      <Text style={styles.varietyTagTxt}>{tag.trim()}</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {/* ── Contact Support ────────────────────────────────────────────── */}
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.contactSupportBtn}
              onPress={() => setSpecialDeliveryModalVisible(true)}
            >
              <MessageCircle color="#1d4ed8" size={18} />
              <Text style={styles.contactSupportTxt}>Contact Support</Text>
            </TouchableOpacity>

            {/* ── Seller Section ─────────────────────────────────────────────── */}
            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>Seller Information</Text>
            <View style={styles.sellerCard}>
              <LinearGradient
                colors={isFarmer ? ['#15803d', '#4ade80'] : ['#1d4ed8', '#60a5fa']}
                style={styles.sellerAvatar}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Text style={styles.sellerAvatarText}>{sellerName[0]?.toUpperCase()}</Text>
              </LinearGradient>

              <View style={{ flex: 1 }}>
                <View style={styles.sellerNameRow}>
                  <Text style={styles.sellerName} numberOfLines={1}>{sellerName}</Text>
                  <View style={styles.sellerBadge}>
                    <Shield color="#15803d" size={9} />
                    <Text style={styles.sellerBadgeText}>Verified</Text>
                  </View>
                </View>

                {isFarmer && seller?.farmName && seller.farmName !== sellerName && (
                  <Text style={styles.sellerSubName}>{seller.farmName}</Text>
                )}
                {!isFarmer && seller?.companyName && seller.companyName !== sellerName && (
                  <Text style={styles.sellerSubName}>{seller.companyName}</Text>
                )}
                {!isFarmer && seller?.agentType && (
                  <Text style={styles.sellerMeta}>🏢 {seller.agentType}</Text>
                )}
                {isFarmer && seller?.farmingExperience && (
                  <Text style={styles.sellerMeta}>🌱 {seller.farmingExperience} yrs experience</Text>
                )}
                {isFarmer && seller?.primaryProduce && (
                  <Text style={styles.sellerMeta}>🌾 Specialises in: {seller.primaryProduce}</Text>
                )}
                {location ? (
                  <View style={styles.sellerLocation}>
                    <MapPin color="#86a892" size={11} />
                    <Text style={styles.sellerLocationText}>{location}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* ── Quantity Picker ────────────────────────────────────────────── */}
            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>
              Quantity <Text style={styles.unitLabel}>({product.unit})</Text>
            </Text>

            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={[styles.qtyBtn, (quantity <= minQty || maxQty === 0) && styles.qtyBtnDisabled]}
                onPress={() => setQuantity(Math.max(minQty, quantity - 1))}
                disabled={quantity <= minQty || maxQty === 0}
                activeOpacity={0.7}
              >
                <Minus size={16} color={quantity <= minQty || maxQty === 0 ? '#b0bbb5' : '#15803d'} />
              </TouchableOpacity>

              <View style={styles.qtyValueWrap}>
                <Text style={styles.qtyValue}>{quantity}</Text>
                <Text style={styles.qtyUnitSmall}>{product.unit}</Text>
              </View>

              <TouchableOpacity
                style={[styles.qtyBtn, quantity >= dynamicMaxQty && styles.qtyBtnDisabled]}
                onPress={() => setQuantity(Math.min(dynamicMaxQty, quantity + 1))}
                disabled={quantity >= dynamicMaxQty}
                activeOpacity={0.7}
              >
                <Plus size={16} color={quantity >= dynamicMaxQty ? '#b0bbb5' : '#15803d'} />
              </TouchableOpacity>

              <View style={styles.qtyTotal}>
                <Text style={styles.qtyTotalLabel}>Total</Text>
                <Text style={styles.qtyTotalValue}>
                  ₹{((quantity || 1) * (Number(product?.pricePerUnit) || 0)).toFixed(2)}
                </Text>
              </View>
            </View>

            {minQty > 1 && (
              <View style={styles.minQtyNote}>
                <AlertCircle size={12} color="#92400e" />
                <Text style={styles.minQtyText}>Minimum order: {minQty} {product.unit}</Text>
              </View>
            )}

            {/* ── Status Banners — ALL original conditions verbatim ──────────── */}
            {isBypassed && dynamicMaxQty > 0 && (
              <View style={[styles.statusBanner, styles.statusBannerGreen]}>
                <CheckCircle2 color="#15803d" size={18} />
                <Text style={[styles.statusBannerText, { color: '#14532d' }]}>
                  Approved for up to{' '}
                  <Text style={{ fontWeight: '800' }}>{specialRequest.quantity} units</Text>
                  {' '}— {dynamicMaxQty} more available to add.
                </Text>
              </View>
            )}
            {isBypassed && dynamicMaxQty <= 0 && (
              <View style={[styles.statusBanner, styles.statusBannerAmber]}>
                <AlertCircle color="#b45309" size={18} />
                <Text style={[styles.statusBannerText, { color: '#78350f' }]}>
                  You've reached your approved limit of{' '}
                  <Text style={{ fontWeight: '800' }}>{specialRequest.quantity} {product.unit}</Text> in your cart.
                </Text>
              </View>
            )}
            {isGrayscaled && (
              <View style={[styles.statusBanner, styles.statusBannerRed]}>
                <AlertCircle color="#b91c1c" size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusBannerTitle, { color: '#7f1d1d' }]}>Outside Delivery Range</Text>
                  <Text style={[styles.statusBannerText, { color: '#991b1b', marginTop: 2 }]}>
                    This seller is outside our standard delivery radius. Request special logistics to purchase.
                  </Text>
                </View>
              </View>
            )}
            {isOutOfRange && requestRecordExists && !isBypassed && (
              <View style={[styles.statusBanner, styles.statusBannerBlue]}>
                <Clock color="#1d4ed8" size={18} />
                <Text style={[styles.statusBannerText, { color: '#1e3a8a' }]}>
                  Your special delivery request is{' '}
                  <Text style={{ fontWeight: '800' }}>under review</Text>. We'll notify you once approved.
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      {/* ── Footer CTA ─────────────────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total</Text>
          <Text style={styles.footerTotalValue}>₹{(quantity * product.pricePerUnit).toFixed(2)}</Text>
        </View>

        {/* Request Special Delivery — original condition verbatim */}
        {isOutOfRange && !isBypassed && !requestRecordExists && isSignedIn && role !== 'none' && profile?.lat && profile?.lng ? (
          <TouchableOpacity
            style={styles.ctaRequestDelivery}
            onPress={() => setSpecialDeliveryModalVisible(true)}
            activeOpacity={0.85}
          >
            <Truck color="#fff" size={18} />
            <Text style={styles.ctaBtnText}>Request Delivery</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: ctaConfig.bg }, ctaDisabled && styles.ctaBtnDisabled]}
            onPress={handleAddToCart}
            disabled={ctaDisabled}
            activeOpacity={0.85}
          >
            {addingToCart || isFeeLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <View style={styles.ctaBtnInner}>
                {ctaConfig.icon && <View style={{ marginRight: 6 }}>{ctaConfig.icon}</View>}
                <Text style={styles.ctaBtnText}>{ctaConfig.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* ── Special Delivery Modal — verbatim ─────────────────────────────── */}
      <SpecialDeliveryModal
        visible={isSpecialDeliveryModalVisible}
        onClose={() => setSpecialDeliveryModalVisible(false)}
        product={product}
        onSuccess={() => {
          reloadRequests();
          setSpecialDeliveryModalVisible(false);
          Alert.alert('Request Sent', 'Your special delivery request is now in mediation. We will notify you once approved.');
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Loading
  loadingContainer: { flex: 1, backgroundColor: '#f4f7f4' },

  // Error
  errorBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#f4f7f4' },
  errorIconWrap: { width: 86, height: 86, borderRadius: 43, backgroundColor: '#dcfce7', borderWidth: 2, borderColor: '#bbf7d0', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  errorTitle: { fontSize: 19, fontWeight: '800', color: '#0f2419', marginBottom: 8, textAlign: 'center' },
  errorSub: { fontSize: 14, color: '#6b8575', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  errorBtn: { backgroundColor: '#16a34a', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 16 },
  errorBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Header
  header: { paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#fff', marginHorizontal: 12, letterSpacing: -0.3 },
  cartBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(74,222,128,0.14)', borderWidth: 1, borderColor: 'rgba(74,222,128,0.2)', alignItems: 'center', justifyContent: 'center' },
  cartBadge: { position: 'absolute', top: 3, right: 3, width: 16, height: 16, borderRadius: 8, backgroundColor: '#4ade80', alignItems: 'center', justifyContent: 'center' },
  cartBadgeText: { fontSize: 9, fontWeight: '900', color: '#0a1f12' },

  // Gallery
  galleryContainer: { backgroundColor: '#fff', position: 'relative' },
  mainImage: { width: '100%', height: 290 },
  imageGradientOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 110 },
  categoryPillOverlay: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(10,31,18,0.75)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(74,222,128,0.3)' },
  categoryPillText: { color: '#4ade80', fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  urgencyPill: { position: 'absolute', top: 14, right: 14, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  urgencyPillText: { color: '#fff', fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },
  thumbnailStrip: { position: 'absolute', bottom: 10, left: 0, right: 0 },
  thumbnailWrap: { width: 50, height: 50, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  thumbnailActive: { borderColor: '#4ade80', borderWidth: 2.5 },
  thumbnail: { width: '100%', height: '100%' },
  dotRow: { position: 'absolute', bottom: -22, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#cbd5d0' },
  dotActive: { backgroundColor: '#16a34a', width: 18, borderRadius: 3 },
  noImagePlaceholder: { width: '100%', height: 260, backgroundColor: '#e8f0eb', alignItems: 'center', justifyContent: 'center', gap: 12 },
  noImageRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#d1e8da', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  noImageText: { color: '#8aab96', fontSize: 14, fontWeight: '600' },

  // Main card
  mainCard: { backgroundColor: '#fff', marginTop: -10, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingTop: 26, shadowColor: '#0f2419', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },

  // Badges
  headerBadgesRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  headerBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  headerBadgeTxt: { fontSize: 10, fontWeight: '800' },

  // Product name / price
  productName: { fontSize: 24, fontWeight: '900', color: '#0a1f12', letterSpacing: -0.5, lineHeight: 30, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 18, gap: 4 },
  priceMain: { fontSize: 34, fontWeight: '900', color: '#15803d', letterSpacing: -1, lineHeight: 38 },
  priceUnit: { fontSize: 15, fontWeight: '600', color: '#86a892', marginBottom: 4 },
  stockPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, marginLeft: 6, marginBottom: 4, alignSelf: 'flex-end' },
  stockPillTxt: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Info panel
  infoPanel: { backgroundColor: '#f8fafc', borderRadius: 18, borderWidth: 1, borderColor: '#e2e8f0', padding: 16, marginBottom: 20 },
  infoPanelRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoPanelIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  infoPanelContent: { flex: 1 },
  infoPanelLabel: { fontSize: 10, fontWeight: '800', color: '#64748b', letterSpacing: 0.6, marginBottom: 2 },
  infoPanelValue: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  infoPanelBadgeGreen: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, gap: 4 },
  infoPanelBadgeGreenTxt: { fontSize: 10, fontWeight: '800', color: '#15803d' },
  infoPanelBadgeRed: { backgroundColor: '#fee2e2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  infoPanelBadgeRedTxt: { fontSize: 10, fontWeight: '800', color: '#b91c1c' },
  infoPanelBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  infoPanelBadgeTxt: { fontSize: 10, fontWeight: '800' },
  infoPanelDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 12 },

  // Out of range
  outOfRangeBanner: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fffbeb', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#fde68a', marginBottom: 20, gap: 8 },
  outOfRangeTxt: { flex: 1, fontSize: 12, color: '#92400e', fontWeight: '500', lineHeight: 18 },

  // Divider / sections
  divider: { height: 1, backgroundColor: '#edf2ef', marginVertical: 20 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#86a892', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  unitLabel: { fontSize: 11, fontWeight: '600', color: '#a0b8ab', textTransform: 'none', letterSpacing: 0 },
  descriptionText: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 4 },

  // Stat grid
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  statItem: { width: '48.2%', backgroundColor: '#f8fafc', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#f1f5f9' },
  statEmoji: { fontSize: 18, marginBottom: 6 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  statValue: { fontSize: 13, fontWeight: '800', color: '#0f172a' },

  // Variety tags
  varietyTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  varietyTag: { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  varietyTagTxt: { color: '#1d4ed8', fontSize: 12, fontWeight: '700' },

  // Contact support
  contactSupportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: '#bfdbfe', paddingVertical: 14, borderRadius: 16, marginBottom: 4 },
  contactSupportTxt: { color: '#1d4ed8', fontSize: 14, fontWeight: '800' },

  // Seller card
  sellerCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f8fbf9', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#dde8e2', gap: 14 },
  sellerAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  sellerAvatarText: { fontSize: 22, fontWeight: '900', color: '#fff' },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' },
  sellerName: { fontSize: 15, fontWeight: '800', color: '#0a1f12' },
  sellerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1, borderColor: '#bbf7d0' },
  sellerBadgeText: { fontSize: 10, fontWeight: '800', color: '#15803d' },
  sellerSubName: { fontSize: 13, color: '#475569', fontWeight: '600', marginBottom: 3 },
  sellerMeta: { fontSize: 12, color: '#64748b', marginBottom: 2 },
  sellerLocation: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  sellerLocationText: { fontSize: 12, color: '#86a892', fontWeight: '500' },

  // Quantity
  qtyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 4 },
  qtyBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0f5f2', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#dde8e2' },
  qtyBtnDisabled: { opacity: 0.38 },
  qtyValueWrap: { alignItems: 'center', paddingHorizontal: 18 },
  qtyValue: { fontSize: 26, fontWeight: '900', color: '#0a1f12', lineHeight: 30 },
  qtyUnitSmall: { fontSize: 11, fontWeight: '600', color: '#86a892', marginTop: 1 },
  qtyTotal: { marginLeft: 'auto', alignItems: 'flex-end', backgroundColor: '#f0f5f2', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, borderWidth: 1, borderColor: '#dde8e2' },
  qtyTotalLabel: { fontSize: 10, fontWeight: '600', color: '#86a892', marginBottom: 1 },
  qtyTotalValue: { fontSize: 17, fontWeight: '900', color: '#15803d' },
  minQtyNote: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fffbeb', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: '#fde68a', alignSelf: 'flex-start', marginTop: 4 },
  minQtyText: { fontSize: 12, fontWeight: '700', color: '#92400e' },

  // Status banners
  statusBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 16, marginTop: 16, borderWidth: 1 },
  statusBannerGreen: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  statusBannerAmber: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  statusBannerRed: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  statusBannerBlue: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },
  statusBannerTitle: { fontSize: 13, fontWeight: '800', marginBottom: 2 },
  statusBannerText: { fontSize: 13, fontWeight: '500', lineHeight: 19, flex: 1 },

  // Footer
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#edf2ef', shadowColor: '#0f2419', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 10, gap: 14 },
  footerTotal: { flex: 1 },
  footerTotalLabel: { fontSize: 11, fontWeight: '600', color: '#86a892', marginBottom: 2 },
  footerTotalValue: { fontSize: 26, fontWeight: '900', color: '#0a1f12', letterSpacing: -0.5 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 20, minWidth: 160 },
  ctaRequestDelivery: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 16, borderRadius: 20, backgroundColor: '#d97706', gap: 8, minWidth: 160 },
  ctaBtnDisabled: { opacity: 0.55 },
  ctaBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaBtnText: { color: '#fff', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
});