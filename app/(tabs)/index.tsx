import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, Image, ActivityIndicator,
  TouchableOpacity, RefreshControl, TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useApiClient } from '@/services/api';
import { MapPin, Package, Search, X } from 'lucide-react-native';

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices', 'Pulses', 'Others'];

export default function MarketplaceScreen() {
  const api = useApiClient();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchProducts = useCallback(async (searchTerm = search, category = selectedCategory) => {
    try {
      setError('');
      const params = new URLSearchParams({
        search: searchTerm,
        category,
        limit: '20',
      });
      const response = await api.get(`mobile/v1/products?${params.toString()}`);
      setProducts(response.data || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedCategory]);

  // Re-fetch every time the screen is focused (cross-platform sync)
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchProducts();
    }, [selectedCategory])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const onSearchSubmit = () => {
    setLoading(true);
    fetchProducts(search, selectedCategory);
  };

  const clearSearch = () => {
    setSearch('');
    setLoading(true);
    fetchProducts('', selectedCategory);
  };

  const onCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setLoading(true);
    fetchProducts(search, cat);
  };

  const renderProduct = ({ item }: { item: any }) => {
    const imageUrl = item.images && item.images.length > 0 ? item.images[0] : null;
    const seller = item.farmer || item.agent;
    const sellerName = seller?.name || seller?.companyName || 'Unknown Seller';
    const location = seller?.district ? `${seller.district}${seller.region ? ', ' + seller.region : ''}` : 'Location hidden';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Package color={Colors.light.icon} size={32} />
          </View>
        )}

        <View style={styles.cardContent}>
          <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
          <Text style={styles.price}>
            ₹{item.pricePerUnit} <Text style={styles.unit}>/ {item.unit}</Text>
          </Text>

          <View style={styles.infoRow}>
            <MapPin color={Colors.light.icon} size={12} />
            <Text style={styles.infoText} numberOfLines={1}>{location}</Text>
          </View>

          <Text style={styles.sellerText} numberOfLines={1}>By {sellerName}</Text>

          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>{item.availableStock} {item.unit} avail.</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>KrishiConnect Market</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Search color={Colors.light.icon} size={18} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={Colors.light.icon}
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={onSearchSubmit}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={clearSearch}>
            <X color={Colors.light.icon} size={18} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, selectedCategory === cat && styles.chipSelected]}
            onPress={() => onCategorySelect(cat)}
          >
            <Text style={[styles.chipText, selectedCategory === cat && styles.chipTextSelected]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => { setLoading(true); fetchProducts(); }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.light.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Package color={Colors.light.icon} size={48} />
              <Text style={styles.emptyText}>No products found.</Text>
              {(search || selectedCategory !== 'All') && (
                <TouchableOpacity onPress={() => { setSearch(''); onCategorySelect('All'); }}>
                  <Text style={styles.clearFiltersText}>Clear filters</Text>
                </TouchableOpacity>
              )}
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
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.light.primaryDark },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: Colors.light.text },
  categoryScroll: { paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chipSelected: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  chipText: { fontSize: 13, color: Colors.light.text, fontWeight: '500' },
  chipTextSelected: { color: '#fff' },
  listContent: { padding: 12, paddingTop: 4 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },
  card: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    width: '48.5%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 130, backgroundColor: '#e5e7eb' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: 10 },
  productName: { fontSize: 14, fontWeight: 'bold', color: Colors.light.text, marginBottom: 3 },
  price: { fontSize: 15, fontWeight: 'bold', color: Colors.light.primary, marginBottom: 6 },
  unit: { fontSize: 11, color: Colors.light.icon, fontWeight: 'normal' },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  infoText: { fontSize: 11, color: Colors.light.icon, marginLeft: 3, flex: 1 },
  sellerText: { fontSize: 11, color: Colors.light.icon, marginBottom: 6 },
  stockBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  stockText: { fontSize: 10, color: Colors.light.primaryDark, fontWeight: '600' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: Colors.light.error, fontSize: 16, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: Colors.light.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  emptyContainer: { padding: 40, alignItems: 'center', gap: 12 },
  emptyText: { color: Colors.light.icon, fontSize: 16 },
  clearFiltersText: { color: Colors.light.primary, fontWeight: 'bold', fontSize: 14 },
});
