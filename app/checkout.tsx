import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert, StyleSheet,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useApiClient } from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import { useUserStore } from '@/store/userStore';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { CreditCard, Truck, ArrowLeft, MapPin, ShoppingBag, CheckCircle2 } from 'lucide-react-native';
import { MotiView } from 'moti';

const WEB_APP_URL = process.env.EXPO_PUBLIC_APP_URL?.replace('/api/', '') || 'https://krishi-web-for-mobile-building.vercel.app';

export default function CheckoutScreen() {
  const api = useApiClient();
  const { items, fetchCart } = useCartStore();
  const { profile, fetchProfile } = useUserStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) fetchProfile(api);
  }, []);

  const onCheckoutPress = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Missing Details', 'Please fill in all shipping details before placing your order.');
      return;
    }
    if (!profile?.lat || !profile?.lng) {
      Alert.alert('Location Required', 'Your profile is missing location coordinates. Please update your profile on the web app first (krishiconnect.com)', [{ text: 'OK' }]);
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
          forceFresh: false,
        },
      };
      const response = await api.post('mobile/v1/orders', payload);
      if (response.success && response.data) {
        if (response.data.isCollision) {
          Alert.alert(
            'Pending Order Found',
            'You already have a pending payment for some of these items.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Start Fresh',
                style: 'destructive',
                onPress: async () => {
                  try {
                    setLoading(true);
                    const freshPayload = { ...payload, params: { ...payload.params, forceFresh: true } };
                    const freshResponse = await api.post('mobile/v1/orders', freshPayload);
                    handleCheckoutSuccess(freshResponse);
                  } catch (e: any) {
                    Alert.alert('Error', e.message || 'Failed to start fresh order.');
                    setLoading(false);
                  }
                }
              },
              {
                text: 'Resume Order',
                onPress: () => { router.replace('/(tabs)/cart'); }
              }
            ]
          );
          setLoading(false);
          return;
        }
        handleCheckoutSuccess(response);
      } else {
        Alert.alert('Error', response.error || 'Failed to initiate checkout. Please try again.');
        setLoading(false);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleCheckoutSuccess = async (response: any) => {
    try {
      if (response.data.isCod || paymentMethod === 'COD') {
        Alert.alert('Order Placed! ✓', 'Your order has been placed successfully with Cash on Delivery.', [
          { text: 'View Orders', onPress: () => { fetchCart(api); router.replace('/orders'); } },
        ]);
      } else {
        const razorpayOrderId = response.data.razorpayOrderId || response.data.data?.razorpayOrderId;
        const orderId = response.data.orderId || response.data.data?.orderId || response.data.data?.id;
        const deepLink = Linking.createURL('payment-callback');
        const checkoutUrl = `${WEB_APP_URL}/mobile-checkout?orderId=${orderId}&razorpayOrderId=${razorpayOrderId}&redirectUrl=${encodeURIComponent(deepLink)}`;
        const browserResult = await WebBrowser.openAuthSessionAsync(checkoutUrl, deepLink);
        if (browserResult.type === 'success') {
          if (browserResult.url.includes('status=success')) {
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/cart')}
        >
          <ArrowLeft color="#fff" size={20} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.headerTitle}>Checkout</Text>
          <Text style={styles.headerSubtitle}>{items.length} item{items.length !== 1 ? 's' : ''} in order</Text>
        </View>
        <View style={styles.headerBadge}>
          <ShoppingBag color="#4ade80" size={18} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Order Summary */}
          <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400 }} style={styles.card}>
            <Text style={styles.cardTitle}>Order Summary</Text>
            {items.map((item: any) => (
              <View key={item.id} style={styles.orderRow}>
                <Text style={styles.orderItemName} numberOfLines={1}>{item.product?.productName}</Text>
                <Text style={styles.orderItemQty}>×{item.quantity}</Text>
                <Text style={styles.orderItemPrice}>₹{(item.product?.pricePerUnit || 0) * item.quantity}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Est. Delivery</Text>
              <Text style={styles.summaryValue}>₹{deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
            </View>
          </MotiView>

          {/* Shipping Details */}
          <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 80 }} style={styles.card}>
            <Text style={styles.cardTitle}>Shipping Details</Text>

            <Text style={styles.fieldLabel}>Full Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Phone Number *</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit mobile number"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Delivery Address *</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Full delivery address"
              placeholderTextColor="#94a3b8"
              style={[styles.input, styles.inputMultiline]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            {(!profile?.lat || !profile?.lng) && (
              <View style={styles.warningBox}>
                <MapPin color="#f59e0b" size={16} />
                <Text style={styles.warningText}>
                  Location coordinates missing. Please update your profile on the web app to enable checkout.
                </Text>
              </View>
            )}
          </MotiView>

          {/* Payment Method */}
          <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 160 }} style={styles.card}>
            <Text style={styles.cardTitle}>Payment Method</Text>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'ONLINE' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('ONLINE')}
            >
              <View style={styles.paymentIconBg}>
                <CreditCard size={20} color={paymentMethod === 'ONLINE' ? '#16a34a' : '#94a3b8'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentTitle, paymentMethod === 'ONLINE' && styles.paymentTitleActive]}>Pay Online</Text>
                <Text style={styles.paymentSubtitle}>Credit/Debit Card, UPI, Netbanking</Text>
              </View>
              <View style={[styles.radioOuter, paymentMethod === 'ONLINE' && styles.radioOuterActive]}>
                {paymentMethod === 'ONLINE' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionActive]}
              onPress={() => setPaymentMethod('COD')}
            >
              <View style={styles.paymentIconBg}>
                <Truck size={20} color={paymentMethod === 'COD' ? '#16a34a' : '#94a3b8'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentTitle, paymentMethod === 'COD' && styles.paymentTitleActive]}>Cash on Delivery</Text>
                <Text style={styles.paymentSubtitle}>Pay when you receive the order</Text>
              </View>
              <View style={[styles.radioOuter, paymentMethod === 'COD' && styles.radioOuterActive]}>
                {paymentMethod === 'COD' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>
          </MotiView>

          {/* Space for sticky button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Sticky Place Order Button */}
        <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity onPress={onCheckoutPress} disabled={loading} activeOpacity={0.88}>
            <LinearGradient
              colors={loading ? ['#64748b', '#64748b'] : ['#15803d', '#16a34a']}
              style={styles.placeOrderBtn}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <CheckCircle2 color="#fff" size={20} />
                  <Text style={styles.placeOrderText}>
                    {paymentMethod === 'COD' ? `Place Order · ₹${totalAmount.toFixed(2)}` : `Proceed to Payment · ₹${totalAmount.toFixed(2)}`}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500', marginTop: 2 },
  headerBadge: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(74,222,128,0.15)', alignItems: 'center', justifyContent: 'center' },

  scrollContent: { padding: 16 },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 18, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 14, letterSpacing: -0.2 },

  // Order Summary
  orderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  orderItemName: { flex: 1, fontSize: 13, color: '#334155', fontWeight: '500', marginRight: 8 },
  orderItemQty: { fontSize: 12, color: '#94a3b8', fontWeight: '600', width: 36, textAlign: 'center' },
  orderItemPrice: { fontSize: 13, fontWeight: '700', color: '#0f172a', width: 64, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  summaryValue: { fontSize: 13, fontWeight: '700', color: '#334155' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  totalLabel: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  totalValue: { fontSize: 18, fontWeight: '900', color: '#16a34a' },

  // Form
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 14 },
  input: {
    backgroundColor: '#f8fafc', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#0f172a', fontWeight: '500',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  inputMultiline: { height: 90, paddingTop: 12 },
  warningBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14,
    backgroundColor: '#fffbeb', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#fde68a',
  },
  warningText: { flex: 1, fontSize: 12, color: '#92400e', fontWeight: '500', lineHeight: 18 },

  // Payment
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
    borderRadius: 16, borderWidth: 2, borderColor: '#f1f5f9',
    backgroundColor: '#f8fafc', marginBottom: 10,
  },
  paymentOptionActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  paymentIconBg: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  paymentTitle: { fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 2 },
  paymentTitleActive: { color: '#15803d' },
  paymentSubtitle: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: '#16a34a' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#16a34a' },

  // Footer
  stickyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
  },
  placeOrderBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 18, paddingVertical: 17, gap: 10,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 6,
  },
  placeOrderText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: -0.2 },
});
