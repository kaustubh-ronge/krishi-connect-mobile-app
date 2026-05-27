import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Package, Trash2, Edit, PlusCircle } from 'lucide-react-native';
import { useApiClient } from '@/services/api';
import { unwrapData } from '@/lib/apiHelpers';
import { MotiView } from 'moti';

export default function MyListingsScreen() {
  const router = useRouter();
  const api = useApiClient();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('mobile/v1/seller/listings');
      setListings(unwrapData<any[]>(res) || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load your listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchListings(); }, [fetchListings]));

  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.del(`mobile/v1/seller/listings?id=${id}`);
              setListings(prev => prev.filter(item => item.id !== id));
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete listing.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay: index * 60 }}
    >
      <View style={styles.card}>
        <Image
          source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)']} style={styles.imageGradient} />
        <View style={[styles.statusPill, { backgroundColor: item.status === 'ACTIVE' ? '#16a34a' : '#ef4444' }]}>
          <Text style={styles.statusPillText}>{item.status}</Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.price}>₹{item.pricePerUnit}<Text style={styles.priceUnit}>/{item.unit}</Text></Text>
            <Text style={styles.stock}>📦 {item.availableStock} {item.unit}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => router.push(`/edit-listing/${item.id}`)}
            >
              <Edit size={15} color="#475569" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id)}
            >
              <Trash2 size={15} color="#ef4444" />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </MotiView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <ArrowLeft color="#fff" size={20} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.headerTitle}>My Inventory</Text>
          <Text style={styles.headerSubtitle}>{listings.length} listing{listings.length !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/create-listing')}>
          <PlusCircle color="#4ade80" size={22} />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconBg}>
            <Package color="#94a3b8" size={44} />
          </View>
          <Text style={styles.emptyTitle}>No Listings Yet</Text>
          <Text style={styles.emptySubtitle}>You haven't added any products to sell.</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/create-listing')}>
            <Text style={styles.createBtnText}>Create Your First Listing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchListings}
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
  addBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(74,222,128,0.15)', alignItems: 'center', justifyContent: 'center' },

  listContent: { padding: 14, paddingBottom: 100 },

  card: { backgroundColor: '#fff', borderRadius: 20, marginBottom: 14, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  cardImage: { width: '100%', height: 150 },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  statusPill: { position: 'absolute', top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },

  cardBody: { padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  productName: { fontSize: 16, fontWeight: '800', color: '#0f172a', flex: 1, marginRight: 8 },
  categoryBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  categoryText: { fontSize: 11, fontWeight: '600', color: '#64748b' },

  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  price: { fontSize: 20, fontWeight: '900', color: '#16a34a' },
  priceUnit: { fontSize: 12, fontWeight: '500', color: '#94a3b8' },
  stock: { fontSize: 12, fontWeight: '600', color: '#64748b' },

  actionRow: { flexDirection: 'row', gap: 10 },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: '#f1f5f9' },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#475569' },
  deleteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fef2f2' },
  deleteBtnText: { fontSize: 13, fontWeight: '700', color: '#ef4444' },

  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconBg: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', fontWeight: '500', textAlign: 'center', marginBottom: 20 },
  createBtn: { backgroundColor: '#16a34a', paddingHorizontal: 24, paddingVertical: 13, borderRadius: 16 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
