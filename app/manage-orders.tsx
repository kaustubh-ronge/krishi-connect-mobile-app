import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, ClipboardList, Check, Truck, Package, UserPlus } from 'lucide-react-native';
import { useApiClient } from '@/services/api';
import { unwrapData } from '@/lib/apiHelpers';
import { MotiView } from 'moti';

const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string }> = {
  PROCESSING:  { bg: '#fef9c3', text: '#a16207', dot: '#eab308' },
  PACKED:      { bg: '#e0f2fe', text: '#0369a1', dot: '#3b82f6' },
  SHIPPED:     { bg: '#ede9fe', text: '#6d28d9', dot: '#8b5cf6' },
  IN_TRANSIT:  { bg: '#ffedd5', text: '#c2410c', dot: '#f59e0b' },
  DELIVERED:   { bg: '#dcfce7', text: '#15803d', dot: '#16a34a' },
  CANCELLED:   { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444' },
};

const NEXT_STATUS: Record<string, { status: string; label: string } | null> = {
  PROCESSING: { status: 'PACKED', label: 'Mark Packed' },
  PACKED:     { status: 'SHIPPED', label: 'Mark Shipped' },
  SHIPPED:    { status: 'IN_TRANSIT', label: 'In Transit' },
  IN_TRANSIT: { status: 'DELIVERED', label: 'Mark Delivered' },
};

export default function ManageOrdersScreen() {
  const router = useRouter();
  const api = useApiClient();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('mobile/v1/seller/orders?page=1&limit=50');
      const data = unwrapData<any[]>(res);
      setOrders(Array.isArray(data) ? data : []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load your orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchOrders(); }, [fetchOrders]));

  const updateStatus = async (orderId: string, status: string) => {
    Alert.alert('Update Order', `Update order status to ${status}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await api.put('mobile/v1/seller/orders', { orderId, status });
            Alert.alert('Success', 'Order updated.');
            fetchOrders();
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update order.');
          }
        },
      },
    ]);
  };

  const promptNextStatus = (order: any) => {
    const current = order.orderStatus || 'PROCESSING';
    const next = NEXT_STATUS[current];
    if (!next) return;
    updateStatus(order.id, next.status);
  };

  const renderItem = ({ item: order, index }: { item: any; index: number }) => {
    const status = order.orderStatus || 'PROCESSING';
    const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.PROCESSING;
    const buyer =
      order.buyerUser?.farmerProfile?.name ||
      order.buyerUser?.agentProfile?.name ||
      order.buyerUser?.email || 'Buyer';
    const next = NEXT_STATUS[status];

    return (
      <MotiView
        from={{ opacity: 0, translateY: 16 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 350, delay: index * 55 }}
      >
        <View style={styles.orderCard}>
          {/* Header */}
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <View style={[styles.statusDot, { backgroundColor: statusConfig.dot }]} />
              <Text style={styles.orderId}>#{order.id?.slice(0, 8).toUpperCase()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
              <Text style={[styles.statusText, { color: statusConfig.text }]}>{status}</Text>
            </View>
          </View>

          {/* Items */}
          {order.items?.map((line: any) => (
            <View key={line.id} style={styles.itemRow}>
              <Image
                source={{ uri: line.product?.images?.[0] || 'https://via.placeholder.com/50' }}
                style={styles.itemImage}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName} numberOfLines={1}>{line.product?.productName}</Text>
                <Text style={styles.itemMeta}>{line.quantity} × ₹{line.priceAtTime ?? line.pricePerUnit}</Text>
              </View>
              <Text style={styles.itemTotal}>₹{((line.quantity || 1) * (line.priceAtTime || 0)).toFixed(0)}</Text>
            </View>
          ))}

          {/* Buyer Info */}
          <View style={styles.buyerBox}>
            <View style={styles.buyerRow}>
              <Text style={styles.buyerLabel}>Buyer</Text>
              <Text style={styles.buyerName}>{buyer}</Text>
            </View>
            {order.shippingAddress ? (
              <Text style={styles.buyerAddress} numberOfLines={2}>{order.shippingAddress}</Text>
            ) : null}
            <Text style={styles.buyerTotal}>₹{Number(order.totalAmount || 0).toFixed(2)}</Text>
          </View>

          {/* Actions */}
          {next && status !== 'DELIVERED' && status !== 'CANCELLED' && (
            <View style={styles.actionRow}>
              {status === 'PACKED' && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]}
                  onPress={() => router.push(`/hire/${order.id}` as any)}
                >
                  <UserPlus size={15} color="white" />
                  <Text style={styles.actionBtnText}>Hire Delivery</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#16a34a', flex: 1 }]}
                onPress={() => promptNextStatus(order)}
              >
                {next.status === 'PACKED' && <Package size={15} color="white" />}
                {next.status === 'SHIPPED' && <Truck size={15} color="white" />}
                {next.status === 'DELIVERED' && <Check size={15} color="white" />}
                <Text style={styles.actionBtnText}>{next.label}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <ArrowLeft color="#fff" size={20} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.headerTitle}>Manage Orders</Text>
          <Text style={styles.headerSubtitle}>{orders.length} incoming order{orders.length !== 1 ? 's' : ''}</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconBg}>
            <ClipboardList color="#94a3b8" size={44} />
          </View>
          <Text style={styles.emptyTitle}>No Orders Yet</Text>
          <Text style={styles.emptySubtitle}>When customers buy your products, they will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchOrders}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 18 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500', marginTop: 2 },

  listContent: { padding: 14, paddingBottom: 100 },

  orderCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  orderHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  orderHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  orderId: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '800' },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  itemImage: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f1f5f9' },
  itemName: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 3 },
  itemMeta: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  itemTotal: { fontSize: 14, fontWeight: '800', color: '#0f172a' },

  buyerBox: { backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, marginVertical: 10 },
  buyerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  buyerLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  buyerName: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  buyerAddress: { fontSize: 12, color: '#64748b', fontWeight: '500', lineHeight: 17, marginBottom: 6 },
  buyerTotal: { fontSize: 15, fontWeight: '900', color: '#16a34a' },

  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, paddingHorizontal: 16, borderRadius: 14, gap: 6 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconBg: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', fontWeight: '500', textAlign: 'center', maxWidth: 260 },
});
