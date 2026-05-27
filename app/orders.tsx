import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApiClient } from '@/services/api';
import { useState } from 'react';
import { Package, ChevronRight, ArrowLeft, ShoppingBag } from 'lucide-react-native';
import { MotiView } from 'moti';

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

  const renderOrder = ({ item, index }: { item: any; index: number }) => {
    const status = item.orderStatus || 'PROCESSING';
    const paymentStatus = item.paymentStatus || 'PENDING';
    const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.PROCESSING;
    const paymentStyle = PAYMENT_STATUS_STYLES[paymentStatus] || PAYMENT_STATUS_STYLES.PENDING;
    const date = new Date(item.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
    const itemCount = item.items?.length || item._count?.items || 0;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 360, delay: index * 55 }}
      >
        <TouchableOpacity
          style={styles.orderCard}
          onPress={() => router.push(`/order-detail/${item.id}`)}
          activeOpacity={0.88}
        >
          <View style={styles.orderTop}>
            <View>
              <Text style={styles.orderNumber}>
                Order #{item.invoiceNumber || item.id.slice(-8).toUpperCase()}
              </Text>
              <Text style={styles.orderDate}>{date}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
            </View>
          </View>

          <View style={styles.orderMeta}>
            <Package color="#94a3b8" size={14} />
            <Text style={styles.orderMetaText}>
              {itemCount} item{itemCount !== 1 ? 's' : ''}
            </Text>
            <View style={styles.metaDot} />
            <Text style={[styles.paymentLabel, { color: paymentStyle.color }]}>
              {item.paymentMethod === 'COD' ? 'Cash on Delivery' : `Online · ${paymentStyle.label}`}
            </Text>
          </View>

          <View style={styles.orderBottom}>
            <Text style={styles.orderAmount}>₹{Number(item.totalAmount || 0).toFixed(2)}</Text>
            <View style={styles.viewDetailBtn}>
              <Text style={styles.viewDetailText}>View Details</Text>
              <ChevronRight color="#16a34a" size={16} />
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
        >
          <ArrowLeft color="#fff" size={20} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.headerTitle}>My Orders</Text>
          <Text style={styles.headerSubtitle}>Track your purchase history</Text>
        </View>
      </LinearGradient>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Package color="#94a3b8" size={48} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchOrders(); }}>
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
              colors={['#16a34a']} tintColor="#16a34a"
            />
          }
          ListEmptyComponent={
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: 100 }}
              style={styles.emptyContainer}
            >
              <View style={styles.emptyIconBg}>
                <ShoppingBag color="#94a3b8" size={44} />
              </View>
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>Your order history will appear here</Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(tabs)')}>
                <Text style={styles.browseBtnText}>Browse Marketplace</Text>
              </TouchableOpacity>
            </MotiView>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500', marginTop: 2 },

  listContent: { padding: 14, paddingBottom: 100 },

  orderCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 10, elevation: 3,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  orderNumber: { fontSize: 15, fontWeight: '800', color: '#0f172a', letterSpacing: -0.2 },
  orderDate: { fontSize: 12, color: '#94a3b8', marginTop: 3, fontWeight: '500' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '800' },
  orderMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  orderMetaText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#cbd5e1' },
  paymentLabel: { fontSize: 13, fontWeight: '600' },
  orderBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderAmount: { fontSize: 20, fontWeight: '900', color: '#0f172a' },
  viewDetailBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewDetailText: { fontSize: 13, fontWeight: '700', color: '#16a34a' },

  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 14, marginBottom: 6 },
  errorSubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#16a34a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  emptyContainer: { paddingTop: 80, alignItems: 'center', gap: 12 },
  emptyIconBg: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', fontWeight: '500', textAlign: 'center' },
  browseBtn: { backgroundColor: '#16a34a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, marginTop: 8 },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
