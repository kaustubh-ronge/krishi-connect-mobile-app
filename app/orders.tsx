import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useApiClient } from '@/services/api';
import { useState } from 'react';
import { Package, ChevronRight, ArrowLeft } from 'lucide-react-native';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PROCESSING:  { bg: '#fef9c3', text: '#a16207', label: 'Processing' },
  PACKED:      { bg: '#e0f2fe', text: '#0369a1', label: 'Packed' },
  SHIPPED:     { bg: '#ede9fe', text: '#6d28d9', label: 'Shipped' },
  IN_TRANSIT:  { bg: '#ffedd5', text: '#c2410c', label: 'In Transit' },
  DELIVERED:   { bg: '#dcfce7', text: '#15803d', label: 'Delivered' },
  CANCELLED:   { bg: '#fee2e2', text: '#b91c1c', label: 'Cancelled' },
};

const PAYMENT_STATUS_STYLES: Record<string, { color: string; label: string }> = {
  PENDING: { color: '#f59e0b', label: 'Pending' },
  PAID:    { color: '#16a34a', label: 'Paid' },
  REFUNDED: { color: '#6b7280', label: 'Refunded' },
};

export default function OrdersScreen() {
  const api = useApiClient();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      setError('');
      const res = await api.get('mobile/v1/orders');
      setOrders(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();
    }, [])
  );

  const renderOrder = ({ item }: { item: any }) => {
    const status = item.orderStatus || 'PROCESSING';
    const paymentStatus = item.paymentStatus || 'PENDING';
    const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.PROCESSING;
    const paymentStyle = PAYMENT_STATUS_STYLES[paymentStatus] || PAYMENT_STATUS_STYLES.PENDING;
    const date = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    const itemCount = item.items?.length || item._count?.items || 0;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => router.push(`/order-detail/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Order #{item.invoiceNumber || item.id.slice(-8).toUpperCase()}</Text>
            <Text style={styles.orderDate}>{date}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
          </View>
        </View>

        <View style={styles.orderMeta}>
          <Package color={Colors.light.icon} size={14} />
          <Text style={styles.metaText}>{itemCount} item{itemCount !== 1 ? 's' : ''}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={[styles.paymentStatus, { color: paymentStyle.color }]}>
            {item.paymentMethod === 'COD' ? 'COD' : `Online · ${paymentStyle.label}`}
          </Text>
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.totalAmount}>₹{Number(item.totalAmount || 0).toFixed(2)}</Text>
          <ChevronRight color={Colors.light.icon} size={18} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.light.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchOrders(); }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              colors={[Colors.light.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package color={Colors.light.icon} size={56} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
              <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/(tabs)')}>
                <Text style={styles.shopButtonText}>Browse Marketplace</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  listContent: { padding: 12 },
  orderCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderId: { fontSize: 15, fontWeight: 'bold', color: Colors.light.text },
  orderDate: { fontSize: 12, color: Colors.light.icon, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  metaText: { fontSize: 13, color: Colors.light.icon },
  metaDot: { color: Colors.light.icon, fontSize: 13 },
  paymentStatus: { fontSize: 13, fontWeight: '500' },
  orderFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.light.border, paddingTop: 10 },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: Colors.light.text },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: Colors.light.error, fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: Colors.light.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  emptyContainer: { paddingTop: 80, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.light.text },
  emptySubtitle: { fontSize: 14, color: Colors.light.icon, textAlign: 'center' },
  shopButton: { backgroundColor: Colors.light.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, marginTop: 8 },
  shopButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
