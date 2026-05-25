import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useApiClient } from '@/services/api';
import { getRouteParam } from '@/lib/apiHelpers';
import { ArrowLeft, Package, MapPin, CreditCard, Star } from 'lucide-react-native';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PROCESSING:  { bg: '#fef9c3', text: '#a16207', label: '⏳ Processing' },
  PACKED:      { bg: '#e0f2fe', text: '#0369a1', label: '📦 Packed' },
  SHIPPED:     { bg: '#ede9fe', text: '#6d28d9', label: '🚀 Shipped' },
  IN_TRANSIT:  { bg: '#ffedd5', text: '#c2410c', label: '🚚 In Transit' },
  DELIVERED:   { bg: '#dcfce7', text: '#15803d', label: '✅ Delivered' },
  CANCELLED:   { bg: '#fee2e2', text: '#b91c1c', label: '❌ Cancelled' },
};

export default function OrderDetailScreen() {
  const orderId = getRouteParam(useLocalSearchParams<{ id: string }>().id);
  const api = useApiClient();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`mobile/v1/orders?id=${orderId}`);
        setOrder(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.light.text} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Detail</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.light.text} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Detail</Text>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Order not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = order.orderStatus || 'PROCESSING';
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.PROCESSING;
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.light.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.invoiceNumber || order.id.slice(-8).toUpperCase()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusBannerText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          <Text style={[styles.statusDate, { color: statusStyle.text }]}>{date}</Text>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          {(order.items || []).map((item: any) => (
            <View key={item.id} style={styles.orderItem}>
              <Package color={Colors.light.icon} size={18} />
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemName}>{item.productName || item.product?.productName}</Text>
                <Text style={styles.orderItemMeta}>
                  {item.quantity} × ₹{item.pricePerUnit || item.product?.pricePerUnit}
                </Text>
                {status === 'DELIVERED' && (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 }}
                    onPress={() => router.push(`/review/${order.id}?productId=${item.productId}` as any)}
                  >
                    <Star color="#f59e0b" size={14} />
                    <Text style={{ color: '#f59e0b', fontSize: 13, fontWeight: 'bold' }}>Write Review</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.orderItemTotal}>
                ₹{((item.quantity || 1) * (item.pricePerUnit || item.product?.pricePerUnit || 0)).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.infoRow}>
              <MapPin color={Colors.light.icon} size={16} />
              <Text style={styles.infoText}>{order.deliveryAddress}</Text>
            </View>
          </View>
        )}

        {/* Payment Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.infoRow}>
            <CreditCard color={Colors.light.icon} size={16} />
            <Text style={styles.infoText}>
              {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Subtotal</Text>
            <Text style={styles.priceValue}>₹{Number(order.totalAmount || 0).toFixed(2)}</Text>
          </View>
          {order.deliveryFee > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Delivery Fee</Text>
              <Text style={styles.priceValue}>₹{Number(order.deliveryFee || 0).toFixed(2)}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.priceRowTotal]}>
            <Text style={styles.priceLabelTotal}>Total Paid</Text>
            <Text style={styles.priceValueTotal}>₹{Number(order.totalAmount || 0).toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
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
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  scrollContent: { padding: 16, paddingBottom: 40 },
  statusBanner: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBannerText: { fontSize: 16, fontWeight: 'bold' },
  statusDate: { fontSize: 13 },
  section: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: Colors.light.icon, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  orderItemInfo: { flex: 1 },
  orderItemName: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  orderItemMeta: { fontSize: 12, color: Colors.light.icon, marginTop: 2 },
  orderItemTotal: { fontSize: 14, fontWeight: 'bold', color: Colors.light.text },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  infoText: { fontSize: 14, color: Colors.light.text, flex: 1 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  priceRowTotal: { borderBottomWidth: 0, marginTop: 4 },
  priceLabel: { fontSize: 14, color: Colors.light.icon },
  priceValue: { fontSize: 14, color: Colors.light.text, fontWeight: '500' },
  priceLabelTotal: { fontSize: 16, fontWeight: 'bold', color: Colors.light.text },
  priceValueTotal: { fontSize: 18, fontWeight: 'bold', color: Colors.light.primary },
  errorText: { color: Colors.light.error, fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: Colors.light.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: 'bold' },
});
