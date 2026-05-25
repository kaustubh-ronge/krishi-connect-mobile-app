import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
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
  const { fetchCart } = useCartStore();
  const { profile, fetchProfile } = useUserStore();
  const router = useRouter();

  const [address, setAddress] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [loading, setLoading] = useState(false);

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.light.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Details</Text>

            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={Colors.light.icon}
              style={styles.input}
            />

            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit mobile number"
              placeholderTextColor={Colors.light.icon}
              keyboardType="phone-pad"
              style={styles.input}
            />

            <Text style={styles.label}>Delivery Address *</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="Full delivery address"
              placeholderTextColor={Colors.light.icon}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
            />

            {(!profile?.lat || !profile?.lng) && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Your profile is missing location coordinates. Please update your profile on the web app to enable checkout.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method</Text>

            <TouchableOpacity
              style={[styles.paymentCard, paymentMethod === 'ONLINE' && styles.paymentCardSelected]}
              onPress={() => setPaymentMethod('ONLINE')}
            >
              <CreditCard size={24} color={paymentMethod === 'ONLINE' ? Colors.light.primary : Colors.light.icon} />
              <View style={styles.paymentCardText}>
                <Text style={[styles.paymentTitle, paymentMethod === 'ONLINE' && styles.paymentTitleSelected]}>Pay Online</Text>
                <Text style={styles.paymentDesc}>Credit/Debit Card, UPI, Netbanking</Text>
              </View>
              {paymentMethod === 'ONLINE' && <View style={styles.radioSelected} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.paymentCard, paymentMethod === 'COD' && styles.paymentCardSelected]}
              onPress={() => setPaymentMethod('COD')}
            >
              <Truck size={24} color={paymentMethod === 'COD' ? Colors.light.primary : Colors.light.icon} />
              <View style={styles.paymentCardText}>
                <Text style={[styles.paymentTitle, paymentMethod === 'COD' && styles.paymentTitleSelected]}>Cash on Delivery</Text>
                <Text style={styles.paymentDesc}>Pay when you receive the order</Text>
              </View>
              {paymentMethod === 'COD' && <View style={styles.radioSelected} />}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={onCheckoutPress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {paymentMethod === 'COD' ? 'Place Order (COD)' : 'Proceed to Payment'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.light.text },
  scrollContent: { padding: 16, paddingBottom: 8 },
  section: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.light.text, marginBottom: 6 },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
    fontSize: 15,
    color: Colors.light.text,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  warningBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  warningText: { fontSize: 13, color: '#92400e', lineHeight: 18 },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderRadius: 12,
    marginBottom: 12,
    gap: 14,
  },
  paymentCardSelected: { borderColor: Colors.light.primary, backgroundColor: '#f0fdf4' },
  paymentCardText: { flex: 1 },
  paymentTitle: { fontSize: 15, fontWeight: 'bold', color: Colors.light.text },
  paymentTitleSelected: { color: Colors.light.primaryDark },
  paymentDesc: { fontSize: 12, color: Colors.light.icon, marginTop: 2 },
  radioSelected: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.light.primary,
  },
  footer: {
    backgroundColor: Colors.light.background,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  button: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
