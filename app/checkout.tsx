import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useApiClient } from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { CreditCard, Truck, ArrowLeft } from 'lucide-react-native';

const WEB_APP_URL = process.env.EXPO_PUBLIC_APP_URL?.replace('/api/', '') || 'https://krishi-web-for-mobile-building.vercel.app';

export default function CheckoutScreen() {
  const api = useApiClient();
  const { items, fetchCart } = useCartStore();
  const { profile, fetchProfile } = useUserStore();
  const router = useRouter();

  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [loading, setLoading] = useState(false);

  // Calculate Totals
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);

  useEffect(() => {
    let newSubtotal = 0;
    let newDeliveryFee = 0;
    
    items.forEach((item: any) => {
      const product = item.product;
      const itemTotal = (product.pricePerUnit || 0) * item.quantity;
      newSubtotal += itemTotal;
      
      let itemDelivery = product.deliveryCharge || 0;
      if (product.deliveryChargeType === 'per_unit') {
        itemDelivery *= item.quantity;
      }
      newDeliveryFee += itemDelivery;
    });

    setSubtotal(newSubtotal);
    setDeliveryFee(newDeliveryFee);
  }, [items]);

  const totalAmount = subtotal + deliveryFee;

  // Pre-fill from profile
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  // Fetch profile if not loaded
  useEffect(() => {
    if (!profile) {
      fetchProfile(api);
    }
  }, []);

  const onCheckoutPress = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Missing Details', 'Please fill in all shipping details before placing your order.');
      return;
    }

    if (!profile?.lat || !profile?.lng) {
      Alert.alert(
        'Location Required',
        'Your profile is missing location coordinates. Please update your profile on the web app first (krishiconnect.com).',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        action: 'initiateCheckout',
        params: {
          addressData: {
            address: address.trim(),
            name: name.trim(),
            phone: phone.trim(),
            paymentMethod,
            lat: profile.lat,
            lng: profile.lng,
          },
          selectedItemIds: items.map((i: any) => i.id),
          forceFresh: true,
        },
      };

      const response = await api.post('mobile/v1/orders', payload);

      if (response.success && response.data) {
        if (response.data.isCod || paymentMethod === 'COD') {
          Alert.alert('Order Placed! ✓', 'Your order has been placed successfully with Cash on Delivery.', [
            { text: 'View Orders', onPress: () => { fetchCart(api); router.replace('/orders'); } },
          ]);
        } else {
          // Online payment via hosted web page
          const razorpayOrderId = response.data.razorpayOrderId;
          const orderId = response.data.orderId;
          const deepLink = Linking.createURL('payment-callback');
          const checkoutUrl = `${WEB_APP_URL}/mobile-checkout?orderId=${orderId}&razorpayOrderId=${razorpayOrderId}&redirectUrl=${encodeURIComponent(deepLink)}`;

          const browserResult = await WebBrowser.openAuthSessionAsync(checkoutUrl, deepLink);

          if (browserResult.type === 'success') {
            const url = browserResult.url;
            if (url.includes('status=success')) {
              Alert.alert('Payment Successful ✓', 'Your payment was completed and order placed!', [
                { text: 'View Orders', onPress: () => { fetchCart(api); router.replace('/orders'); } },
              ]);
            } else {
              Alert.alert('Payment Cancelled', 'Your payment was not completed. You can try again.');
            }
          } else {
            Alert.alert('Checkout Closed', 'You closed the payment page. Your order was not placed.');
          }
        }
      } else {
        Alert.alert('Error', response.error || 'Failed to initiate checkout. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center p-4 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-2 mr-3 bg-gray-50 rounded-full">
          <ArrowLeft color={Colors.light.text} size={22} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Checkout</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerClassName="p-4 pb-24" keyboardShouldPersistTaps="handled">
          <View className="bg-white p-4 rounded-2xl mb-4 border border-gray-100 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4">Order Summary</Text>
            {items.map((item: any) => (
              <View key={item.id} className="flex-row justify-between items-center mb-3">
                <Text className="flex-1 text-sm text-gray-700 mr-2" numberOfLines={1}>{item.product?.productName}</Text>
                <Text className="text-sm font-semibold text-gray-500 w-16 text-center">Qty: {item.quantity}</Text>
                <Text className="text-sm font-bold text-gray-800 w-20 text-right">₹{(item.product?.pricePerUnit || 0) * item.quantity}</Text>
              </View>
            ))}
            <View className="h-px bg-gray-100 my-3" />
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-500">Subtotal</Text>
              <Text className="text-sm font-bold text-gray-800">₹{subtotal}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-sm text-gray-500">Est. Delivery</Text>
              <Text className="text-sm font-bold text-gray-800">₹{deliveryFee}</Text>
            </View>
            <View className="flex-row justify-between mb-2 mt-2 pt-2 border-t border-gray-100">
              <Text className="text-base font-bold text-gray-900">Total Amount</Text>
              <Text className="text-lg font-black text-primary">₹{totalAmount}</Text>
            </View>
          </View>

          <View className="bg-white p-4 rounded-2xl mb-4 border border-gray-100 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4">Shipping Details</Text>

            <Text className="text-sm font-semibold text-gray-600 mt-3 mb-1">Full Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.light.icon}
              className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50"
            />

            <Text className="text-sm font-semibold text-gray-600 mt-3 mb-1">Phone Number *</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit mobile number"
              placeholderTextColor={Colors.light.icon}
              keyboardType="phone-pad"
              className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50"
            />

            <Text className="text-sm font-semibold text-gray-600 mt-3 mb-1">Delivery Address *</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Full delivery address"
              placeholderTextColor={Colors.light.icon}
              className="border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900 bg-gray-50 h-24"
              multiline
              numberOfLines={3}
            />

            {(!profile?.lat || !profile?.lng) && (
              <View className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                <Text className="text-sm text-red-600 leading-5">
                  ⚠️ Your profile is missing location coordinates. Please update your profile on the web app to enable checkout.
                </Text>
              </View>
            )}
          </View>

          <View className="bg-white p-4 rounded-2xl mb-4 border border-gray-100 shadow-sm">
            <Text className="text-lg font-bold text-gray-800 mb-4">Payment Method</Text>

            <TouchableOpacity
              className={`flex-row items-center p-4 rounded-xl border-2 mb-3 ${paymentMethod === "ONLINE" ? "border-primary bg-green-50" : "border-gray-100 bg-white"}`}
              onPress={() => setPaymentMethod('ONLINE')}
            >
              <CreditCard size={24} color={paymentMethod === 'ONLINE' ? Colors.light.primary : Colors.light.icon} />
              <View className="flex-1 mx-3">
                <Text className={`text-base font-bold ${paymentMethod === "ONLINE" ? "text-primary-dark" : "text-gray-800"}`}>Pay Online</Text>
                <Text className="text-xs text-gray-500 mt-1">Credit/Debit Card, UPI, Netbanking</Text>
              </View>
              {paymentMethod === 'ONLINE' && <View className="w-5 h-5 rounded-full border-[5px] border-primary bg-white" />}
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-row items-center p-4 rounded-xl border-2 mb-3 ${paymentMethod === "COD" ? "border-primary bg-green-50" : "border-gray-100 bg-white"}`}
              onPress={() => setPaymentMethod('COD')}
            >
              <Truck size={24} color={paymentMethod === 'COD' ? Colors.light.primary : Colors.light.icon} />
              <View className="flex-1 mx-3">
                <Text className={`text-base font-bold ${paymentMethod === "COD" ? "text-primary-dark" : "text-gray-800"}`}>Cash on Delivery</Text>
                <Text className="text-xs text-gray-500 mt-1">Pay when you receive the order</Text>
              </View>
              {paymentMethod === 'COD' && <View className="w-5 h-5 rounded-full border-[5px] border-primary bg-white" />}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
          <TouchableOpacity
            className={`flex-row justify-center items-center py-4 rounded-2xl bg-primary ${loading ? "opacity-70" : ""}`}
            onPress={onCheckoutPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {paymentMethod === 'COD' ? 'Place Order (COD)' : 'Proceed to Payment'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


