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
import { getRouteParam, formatLocation } from '@/lib/apiHelpers';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import { ArrowLeft, MapPin, Package, Plus, Minus, ShoppingCart } from 'lucide-react-native';

export default function ProductDetailScreen() {
  const productId = getRouteParam(useLocalSearchParams<{ id: string }>().id);
  const api = useApiClient();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { profile, role } = useUserStore();
  const { addToCart, loading: cartLoading } = useCartStore();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`mobile/v1/products?id=${productId}`);
        const p = res.data ?? null;
        setProduct(p);
        if (p?.minOrderQuantity) {
          setQuantity(Math.max(1, Number(p.minOrderQuantity) || 1));
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchProduct();
  }, [productId]);

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
  const minQty = Math.max(1, Number(product?.minOrderQuantity) || 1);
  const maxQty = Math.min(Number(product?.availableStock) || 0, 100);

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
              <Text className="text-sm font-semibold text-gray-700">📦 {product.availableStock} {product.unit} available</Text>
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
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              onPress={() => setQuantity(Math.max(minQty, quantity - 1))}
            >
              <Minus size={18} color={Colors.light.text} />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900 mx-5">{quantity}</Text>
            <TouchableOpacity
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              onPress={() => setQuantity(Math.min(maxQty, quantity + 1))}
            >
              <Plus size={18} color={Colors.light.text} />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-500 ml-auto">= ₹{((quantity || 1) * (Number(product?.pricePerUnit) || 0)).toFixed(2)}</Text>
          </View>

          {minQty > 1 && (
            <Text className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded self-start mt-2">Minimum order: {minQty} {product.unit}</Text>
          )}
        </View>
      </ScrollView>

      {/* Add to Cart Footer */}
      <View className="flex-row items-center justify-between p-4 bg-white border-t border-gray-100 pb-8">
        <View className="flex-1 mr-4">
          <Text className="text-sm font-semibold text-gray-500">Total</Text>
          <Text className="text-2xl font-black text-gray-900">₹{(quantity * product.pricePerUnit).toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          className={`flex-2 flex-row items-center justify-center px-6 py-4 rounded-2xl ${
            addingToCart ? "opacity-70" : ""
          } ${
            !isSignedIn || !role || role === 'none' || !profile 
              ? "bg-gradient-to-r from-blue-500 to-indigo-600" 
              : (!profile?.lat || !profile?.lng) 
                ? "bg-amber-500" 
                : "bg-primary"
          }`}
          onPress={handleAddToCart}
          disabled={addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View className="flex-row items-center">
              {!isSignedIn ? (
                <Text className="text-white text-base font-bold">Login to Purchase</Text>
              ) : (!role || role === 'none' || !profile) ? (
                <Text className="text-white text-base font-bold">Complete Profile</Text>
              ) : (!profile.lat || !profile.lng) ? (
                <Text className="text-white text-base font-bold">Location Required</Text>
              ) : (
                <Text className="text-white text-lg font-bold">Add to Cart</Text>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}


