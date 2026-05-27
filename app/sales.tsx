import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, TrendingUp, IndianRupee, Package } from 'lucide-react-native';
import { useApiClient } from '@/services/api';
import { unwrapData } from '@/lib/apiHelpers';
import { MotiView } from 'moti';

export default function SalesScreen() {
  const router = useRouter();
  const api = useApiClient();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('mobile/v1/seller/sales');
      const data = unwrapData<any[]>(res) || [];
      setSales(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchSales(); }, [fetchSales]));

  const totalRevenue = sales.reduce(
    (sum, item) => sum + Number(item.totalPriceAtTime || item.quantity * item.priceAtTime || 0),
    0
  );

  const totalItems = sales.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const order = item.order;
    const product = item.product;
    return (
      <MotiView
        from={{ opacity: 0, translateX: -16 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 340, delay: index * 45 }}
      >
        <View style={styles.saleCard}>
          <Image
            source={{ uri: product?.images?.[0] || 'https://via.placeholder.com/48' }}
            style={styles.saleImage}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.saleName} numberOfLines={1}>{product?.productName}</Text>
            <Text style={styles.saleMeta}>
              {item.quantity} {product?.unit} @ ₹{item.priceAtTime}
            </Text>
            <Text style={styles.saleOrderId}>
              Order #{order?.id?.slice(0, 8)} · {order?.orderStatus}
            </Text>
          </View>
          <Text style={styles.saleTotal}>₹{Number(item.totalPriceAtTime || 0).toFixed(2)}</Text>
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
          <Text style={styles.headerTitle}>Earnings</Text>
          <Text style={styles.headerSubtitle}>Your sales history</Text>
        </View>
      </LinearGradient>

      {/* Revenue Card */}
      <MotiView
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 18 }}
        style={styles.revenueCardWrapper}
      >
        <LinearGradient
          colors={['#065f46', '#059669', '#10b981']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.revenueCard}
        >
          <View style={styles.revenueRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.revenueLabel}>TOTAL REVENUE</Text>
              <Text style={styles.revenueValue}>₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.revenueLabel}>ITEMS SOLD</Text>
              <Text style={styles.revenueValue}>{totalItems}</Text>
            </View>
          </View>
          <View style={styles.trendsRow}>
            <TrendingUp color="rgba(255,255,255,0.6)" size={16} />
            <Text style={styles.trendsText}>{sales.length} sale record{sales.length !== 1 ? 's' : ''}</Text>
          </View>
        </LinearGradient>
      </MotiView>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : sales.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconBg}>
            <IndianRupee color="#94a3b8" size={44} />
          </View>
          <Text style={styles.emptyTitle}>No sales yet</Text>
          <Text style={styles.emptySubtitle}>Your sales will appear here once orders are delivered.</Text>
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchSales}
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

  revenueCardWrapper: { marginHorizontal: 14, marginTop: -4, marginBottom: 14, borderRadius: 22, overflow: 'hidden', shadowColor: '#059669', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 8 },
  revenueCard: { padding: 22 },
  revenueRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  revenueLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.65)', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  revenueValue: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  revenueDivider: { width: 1, height: 48, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 20 },
  trendsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendsText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },

  listContent: { paddingHorizontal: 14, paddingBottom: 100 },

  saleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  saleImage: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#f1f5f9' },
  saleName: { fontSize: 14, fontWeight: '800', color: '#0f172a', marginBottom: 3 },
  saleMeta: { fontSize: 12, color: '#64748b', fontWeight: '500', marginBottom: 2 },
  saleOrderId: { fontSize: 11, color: '#94a3b8', fontWeight: '500' },
  saleTotal: { fontSize: 16, fontWeight: '900', color: '#16a34a', flexShrink: 0 },

  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconBg: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', fontWeight: '500', textAlign: 'center', maxWidth: 260 },
});
