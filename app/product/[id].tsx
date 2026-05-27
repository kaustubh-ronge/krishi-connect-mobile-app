import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, TouchableOpacity,
  ActivityIndicator, ScrollView, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { Colors } from '@/constants/Colors';
import { useApiClient } from '@/services/api';
import { getRouteParam, formatLocation, calculateDistance } from '@/lib/apiHelpers';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { ArrowLeft, MapPin, Package, Plus, Minus, ShoppingCart, Truck, AlertCircle, Clock, CheckCircle2 } from 'lucide-react-native';
import SpecialDeliveryModal from '@/components/SpecialDeliveryModal';

export default function ProductDetailScreen() {
  const productId = getRouteParam(useLocalSearchParams<{ id: string }>().id);
  const api = useApiClient();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { profile, role } = useUserStore();
  const { items: cartItems, addToCart, loading: cartLoading, fetchCart } = useCartStore();

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

  useEffect(() => {
    const fetchProductAndRequests = async () => {
      try {
        const [res, reqRes] = await Promise.all([
          api.get(`mobile/v1/products?id=${productId}`),
          isSignedIn ? api.get('mobile/v1/special-delivery').catch(() => ({ success: false, data: [] })) : { success: false, data: [] }
        ]);

        if (isSignedIn) {
          await fetchCart(api).catch(() => {});
        }
        
        const p = res.data ?? null;
        setProduct(p);
        
        let initialMinQty = Math.max(1, Number(p?.minOrderQuantity) || 1);
        
        if (reqRes?.success) {
          setSpecialRequests(reqRes.data || []);
          const hasApproval = reqRes.data?.some((r: any) => r.productId === p?.id && r.status === 'APPROVED' && !r.isConsumed);
          if (hasApproval) initialMinQty = 1;
        }

        if (p?.minOrderQuantity || reqRes?.success) {
          setQuantity(initialMinQty);
        }

        if (p && profile?.lat && profile?.lng) {
          setIsFeeLoading(true);
          const feeRes = await api.get(`mobile/v1/orders/fee?lat=${profile.lat}&lng=${profile.lng}&productId=${p.id}`);
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
    } catch (e) {}
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!isSignedIn) {
      router.push('/(auth)/sign-in');
      return;
    }

    if (!role || role === 'none' || !profile) {
      router.push('/onboarding');
      return;
    }

    if (!profile.lat || !profile.lng) {
      router.push('/edit-profile');
      return;
    }

    if (isBypassed) {
      if (quantity > dynamicMaxQty) {
        Alert.alert('Out of Range Limit Exceeded', `You can only add ${dynamicMaxQty} more unit(s) based on your approved request.`);
        return;
      }
    }

    setAddingToCart(true);
    try {
      await addToCart(api, product.id, quantity);
      Alert.alert('Added to Cart ✓', `${quantity} × ${product.productName} added to your cart.`, [
        { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
        { text: 'Continue Shopping', style: 'cancel' },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
            <ArrowLeft color={Colors.light.text} size={22} />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center p-6">
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
          <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
            <ArrowLeft color={Colors.light.text} size={22} />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-lg font-semibold text-gray-800 mb-4">{error || 'Product not found'}</Text>
          <TouchableOpacity className="bg-primary px-6 py-3 rounded-full" onPress={() => router.back()}>
            <Text className="text-white font-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const seller = product.farmer || product.agent;
  const sellerName = seller?.name || seller?.companyName || 'Unknown Seller';
  const location = formatLocation(seller);
  const images = product.images || [];
  
  const specialRequest = specialRequests.find((r: any) => r.productId === product.id && r.status === 'APPROVED' && !r.isConsumed);
  const isBypassed = !!specialRequest;
  const requestRecordExists = specialRequests.some((r: any) => r.productId === product.id && r.status === 'PENDING');
  
  const minQty = isBypassed ? 1 : Math.max(1, Number(product?.minOrderQuantity) || 1);
  
  // Inventory Reservation Logic
  const physicalStock = Number(product?.availableStock) || 0;
  const sellableStock = product?.availableSellableStock !== undefined ? Number(product.availableSellableStock) : physicalStock;
  
  // Normal buyers see sellable stock. Approved buyers can access up to physical stock (capped by their approval).
  const maxQty = isBypassed ? physicalStock : sellableStock;
  
  const canAddToCart = !isOutOfRange || isBypassed;
  
  // Calculate quantity limits exactly matching web
  const currentCartQuantity = cartItems.find((it: any) => it.productId === product.id)?.quantity || 0;
  let dynamicMaxQty = maxQty;
  if (isBypassed) {
    dynamicMaxQty = Math.min(maxQty, Math.max(0, (specialRequest?.quantity || 0) - currentCartQuantity));
  }

  // Handle Grayscale state
  const isGrayscaled = isOutOfRange && !isBypassed;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 bg-gray-50 rounded-full">
          <ArrowLeft color={Colors.light.text} size={22} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 flex-1 mx-3" numberOfLines={1}>{product.productName}</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} className="p-2 bg-green-50 rounded-full">
          <ShoppingCart color={Colors.light.primary} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ opacity: isGrayscaled ? 0.5 : 1 }}>
          {/* Image Gallery */}
          {images.length > 0 ? (
            <View>
              <Image source={{ uri: images[imageIndex] }} className="w-full h-72 bg-gray-200" resizeMode="cover" />
              {images.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mt-2 px-4 space-x-3">
                  {images.map((img: string, idx: number) => (
                    <TouchableOpacity key={idx} onPress={() => setImageIndex(idx)}>
                      <Image
                        source={{ uri: img }}
                        className={`w-16 h-16 rounded-xl border-2 ${idx === imageIndex ? "border-primary" : "border-transparent"}`}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : (
            <View className="w-full h-72 bg-gray-100 items-center justify-center">
              <Package color={Colors.light.icon} size={64} />
            </View>
          )}

          <View className="p-4 bg-white rounded-t-3xl -mt-4 pt-6 pb-8">
            {/* Category Badge */}
            <View className="self-start px-3 py-1 bg-green-50 rounded-lg border border-green-100 mb-3">
              <Text className="text-green-700 font-bold text-xs uppercase tracking-wide">{product.category || 'General'}</Text>
            </View>

            {/* Title & Price */}
            <Text className="text-2xl font-extrabold text-gray-900 mb-2 leading-tight">{product.productName}</Text>
            <Text className="text-3xl font-black text-primary mb-5">₹{product.pricePerUnit} <Text className="text-base font-semibold text-gray-500">/ {product.unit}</Text></Text>


          {/* Stock & Delivery */}
          <View className="flex-row flex-wrap gap-2 mb-6">
            <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
              <Text className="text-sm font-semibold text-gray-700">📦 {sellableStock} {product.unit} available</Text>
            </View>
            <View className="flex-row items-center bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
              <Text className="text-sm font-semibold text-gray-700">
                {product.deliveryChargeType === 'flat'
                  ? `🚚 ₹${product.deliveryCharge} delivery`
                  : product.deliveryCharge === 0 ? '🚚 Free delivery' : `🚚 ₹${product.deliveryCharge}/${product.unit}`}
              </Text>
            </View>
          </View>

          {/* Seller Info */}
          <View className="flex-row items-center p-4 bg-gray-50 rounded-2xl mb-6 border border-gray-100">
            <View className="w-12 h-12 bg-primary rounded-full items-center justify-center mr-4">
              <Text className="text-xl font-bold text-white">{sellerName[0]?.toUpperCase()}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-gray-900 mb-1">{sellerName}</Text>
              <View className="flex-row items-center">
                <MapPin color={Colors.light.icon} size={13} />
                <Text className="text-xs text-gray-500 ml-1">{location}</Text>
              </View>
            </View>
          </View>

          {/* Quantity Picker */}
          <Text className="text-lg font-bold text-gray-900 mb-3">Quantity ({product.unit})</Text>
          <View className="flex-row items-center mb-2">
            <TouchableOpacity
              className={`w-10 h-10 rounded-full items-center justify-center ${quantity <= minQty || maxQty === 0 ? 'bg-gray-50 opacity-50' : 'bg-gray-100'}`}
              onPress={() => setQuantity(Math.max(minQty, quantity - 1))}
              disabled={quantity <= minQty || maxQty === 0}
            >
              <Minus size={18} color={Colors.light.text} />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900 mx-5">{quantity}</Text>
            <TouchableOpacity
              className={`w-10 h-10 rounded-full items-center justify-center ${quantity >= dynamicMaxQty ? 'bg-gray-50 opacity-50' : 'bg-gray-100'}`}
              onPress={() => setQuantity(Math.min(dynamicMaxQty, quantity + 1))}
              disabled={quantity >= dynamicMaxQty}
            >
              <Plus size={18} color={Colors.light.text} />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-500 ml-auto">= ₹{((quantity || 1) * (Number(product?.pricePerUnit) || 0)).toFixed(2)}</Text>
          </View>

          {minQty > 1 && (
            <Text className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded self-start mt-2">Minimum order: {minQty} {product.unit}</Text>
          )}

          {isBypassed && dynamicMaxQty > 0 && (
            <View className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex-row items-center">
              <CheckCircle2 color="#059669" size={16} className="mr-2" />
              <Text className="text-sm text-emerald-800 flex-1">Approved to buy up to {specialRequest.quantity} units. You can add {dynamicMaxQty} more.</Text>
            </View>
          )}
          {isBypassed && dynamicMaxQty <= 0 && (
            <View className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100 flex-row items-center">
              <AlertCircle color="#d97706" size={16} className="mr-2" />
              <Text className="text-sm text-amber-800 flex-1">You have reached the approved limit ({specialRequest.quantity} {product.unit}) in your cart.</Text>
            </View>
          )}
          {isGrayscaled && (
            <View className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex-row items-start">
              <AlertCircle color="#dc2626" size={20} className="mr-2 mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-bold text-red-800 mb-1">Out of Delivery Range</Text>
                <Text className="text-xs text-red-700 leading-tight">This seller is located outside our standard delivery radius. You must request special logistics delivery to buy this product.</Text>
              </View>
            </View>
          )}
        </View>
        </View>
      </ScrollView>

      {/* Add to Cart Footer */}
      <View className="flex-row items-center justify-between p-4 bg-white border-t border-gray-100 pb-8">
        <View className="flex-1 mr-4">
          <Text className="text-sm font-semibold text-gray-500">Total</Text>
          <Text className="text-2xl font-black text-gray-900">₹{(quantity * product.pricePerUnit).toFixed(2)}</Text>
        </View>

        {isOutOfRange && !isBypassed && !requestRecordExists && isSignedIn && role !== 'none' && profile?.lat && profile?.lng ? (
          <TouchableOpacity
            className="flex-2 flex-row items-center justify-center px-6 py-4 rounded-2xl bg-amber-500"
            onPress={() => setSpecialDeliveryModalVisible(true)}
          >
            <Truck color="#fff" size={20} className="mr-2" />
            <Text className="text-white text-base font-bold">Request Delivery</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className={`flex-2 flex-row items-center justify-center px-6 py-4 rounded-2xl ${
              addingToCart || (isBypassed && dynamicMaxQty <= 0) || maxQty === 0 || isFeeLoading ? "opacity-70" : ""
            } ${
              !isSignedIn || !role || role === 'none' || !profile 
                ? "bg-blue-600" 
                : (!profile?.lat || !profile?.lng) 
                  ? "bg-amber-500" 
                  : (isBypassed && dynamicMaxQty <= 0) || maxQty === 0
                    ? "bg-gray-400"
                  : "bg-primary"
            }`}
            onPress={handleAddToCart}
            disabled={addingToCart || isFeeLoading || (isBypassed && dynamicMaxQty <= 0) || maxQty === 0}
          >
            {addingToCart || isFeeLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View className="flex-row items-center">
                {!isSignedIn ? (
                  <Text className="text-white text-base font-bold">Login to Purchase</Text>
                ) : (!role || role === 'none' || !profile) ? (
                  <Text className="text-white text-base font-bold">Complete Profile</Text>
                ) : (!profile.lat || !profile.lng) ? (
                  <Text className="text-white text-base font-bold">Location Required</Text>
                ) : maxQty === 0 ? (
                  <Text className="text-white text-lg font-bold">Out of Stock</Text>
                ) : (isOutOfRange && requestRecordExists && !isBypassed) ? (
                  <Text className="text-white text-lg font-bold">Awaiting Request</Text>
                ) : (
                  <Text className="text-white text-lg font-bold">Add to Cart</Text>
                )}
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <SpecialDeliveryModal 
        visible={isSpecialDeliveryModalVisible}
        onClose={() => setSpecialDeliveryModalVisible(false)}
        product={product}
        onSuccess={reloadRequests}
      />
    </SafeAreaView>
  );
}


