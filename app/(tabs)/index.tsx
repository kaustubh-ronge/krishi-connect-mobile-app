import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, ActivityIndicator,
  TouchableOpacity, RefreshControl, TextInput,
  ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApiClient } from '@/services/api';
import { MapPin, Package, Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react-native';
import { MotiView } from 'moti';

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices', 'Pulses', 'Others'];

// Skeleton placeholder card
function SkeletonCard() {
  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: 1 }}
      transition={{ loop: true, type: 'timing', duration: 900 }}
      style={styles.skeletonCard}
    >
      <View style={styles.skeletonImg} />
      <View style={{ padding: 12 }}>
        <View style={[styles.skeletonLine, { width: '80%', height: 13, marginBottom: 8 }]} />
        <View style={[styles.skeletonLine, { width: '50%', height: 16, marginBottom: 8 }]} />
        <View style={[styles.skeletonLine, { width: '60%', height: 11 }]} />
      </View>
    </MotiView>
  );
}

export default function MarketplaceScreen() {
  const api = useApiClient();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [sellerType, setSellerType] = useState('all');
  const [regionFilter, setRegionFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = useCallback(async (
    searchTerm = search,
    category = selectedCategory,
    sort = sortBy,
    seller = sellerType,
    region = regionFilter
  ) => {
    try {
      setError('');
      const params = new URLSearchParams({
        search: searchTerm,
        category,
        sortBy: sort,
        sellerType: seller,
        region,
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
    fetchProducts(search, selectedCategory, sortBy, sellerType, regionFilter);
  };

  const clearSearch = () => {
    setSearch('');
    setLoading(true);
    fetchProducts('', selectedCategory, sortBy, sellerType, regionFilter);
  };

  const onCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setLoading(true);
    fetchProducts(search, cat, sortBy, sellerType, regionFilter);
  };

  const applyFilters = (newSortBy: string, newSellerType: string, newRegion: string = regionFilter) => {
    setSortBy(newSortBy);
    setSellerType(newSellerType);
    setRegionFilter(newRegion);
    setLoading(true);
    fetchProducts(search, selectedCategory, newSortBy, newSellerType, newRegion);
  };

  const renderProduct = ({ item, index }: { item: any; index: number }) => {
    const imageUrl = item.images && item.images.length > 0 ? item.images[0] : null;
    const seller = item.farmer || item.agent;
    const sellerName = seller?.name || seller?.companyName || 'Unknown Seller';
    const district = seller?.district;
    const region = seller?.region;
    const location = district ? `${district}${region ? ', ' + region : ''}` : null;
    const stock = item.availableSellableStock !== undefined ? item.availableSellableStock : item.availableStock;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 24 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 380, delay: index * 45 }}
        style={styles.productCardWrapper}
      >
        <TouchableOpacity
          style={styles.productCard}
          activeOpacity={0.88}
          onPress={() => router.push(`/product/${item.id}`)}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Package color="#94a3b8" size={34} />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.45)']}
            style={styles.productImageGradient}
          />

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category || 'General'}</Text>
          </View>

          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
            <Text style={styles.productPrice}>
              ₹{item.pricePerUnit}{' '}
              <Text style={styles.productUnit}>/ {item.unit}</Text>
            </Text>

            {location ? (
              <View style={styles.locationRow}>
                <MapPin color="#94a3b8" size={11} />
                <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
              </View>
            ) : null}

            <View style={styles.stockBadge}>
              <Text style={styles.stockText}>{stock} {item.unit}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Hero Header */}
      <LinearGradient
        colors={['#15803d', '#16a34a', '#22c55e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Marketplace</Text>
            <Text style={styles.headerSubtitle}>Fresh produce, directly from farmers</Text>
          </View>
          <View style={styles.headerIcon}>
            <Package color="#fff" size={22} />
          </View>
        </View>

        {/* Search Bar inside header */}
        <View style={styles.searchContainer}>
          <Search color="#94a3b8" size={17} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search fresh products..."
            placeholderTextColor="#94a3b8"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSearchSubmit}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X color="#94a3b8" size={16} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Category Chips */}
      <View style={styles.categoryBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => onCategorySelect(cat)}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal color={showFilters ? '#16a34a' : '#64748b'} size={18} />
        </TouchableOpacity>
      </View>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <MotiView
          from={{ opacity: 0, translateY: -12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 280 }}
          style={styles.filtersPanel}
        >
          <Text style={styles.filterSectionLabel}>Sort By</Text>
          <View style={styles.filterRow}>
            {['newest', 'price_asc', 'price_desc'].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => applyFilters(s, sellerType)}
                style={[styles.filterChip, sortBy === s && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, sortBy === s && styles.filterChipTextActive]}>
                  {s === 'newest' ? 'Newest' : s === 'price_asc' ? '↑ Price' : '↓ Price'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionLabel}>Seller Type</Text>
          <View style={styles.filterRow}>
            {['all', 'farmer', 'agent'].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => applyFilters(sortBy, s, regionFilter)}
                style={[styles.filterChip, sellerType === s && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, sellerType === s && styles.filterChipTextActive]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.filterSectionLabel}>Region</Text>
          <View style={styles.filterRow}>
            <TextInput
              style={styles.regionInput}
              placeholder="e.g. Pune"
              placeholderTextColor="#94a3b8"
              value={regionFilter}
              onChangeText={setRegionFilter}
              onSubmitEditing={() => applyFilters(sortBy, sellerType, regionFilter)}
            />
            {regionFilter.length > 0 && (
              <TouchableOpacity onPress={() => applyFilters(sortBy, sellerType, '')} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </MotiView>
      )}

      {/* Content */}
      {loading && !refreshing ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={(i) => String(i)}
          renderItem={() => <SkeletonCard />}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      ) : error ? (
        <View style={styles.centerContainer}>
          <Package color="#94a3b8" size={52} />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchProducts(); }}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} tintColor="#16a34a" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBg}>
                <Package color="#94a3b8" size={44} />
              </View>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your filters or search</Text>
              {(search || selectedCategory !== 'All') && (
                <TouchableOpacity
                  onPress={() => { setSearch(''); onCategorySelect('All'); }}
                  style={styles.clearFiltersBtn}
                >
                  <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
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
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  // Header
  header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 18 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '500' },
  headerIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b', fontWeight: '500' },

  // Category bar
  categoryBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  categoryScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  categoryChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
  },
  categoryChipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  categoryChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  categoryChipTextActive: { color: '#fff' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 10 },

  // Filters panel
  filtersPanel: {
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 4, marginBottom: 2,
    borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  filterSectionLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
  },
  filterChipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterChipTextActive: { color: '#fff' },
  regionInput: {
    flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#1e293b', backgroundColor: '#f8fafc',
  },
  clearBtn: { marginLeft: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fee2e2', borderRadius: 10 },
  clearBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 12 },

  // Product list
  listContent: { padding: 12, paddingBottom: 120 },
  columnWrapper: { gap: 12, marginBottom: 0 },

  // Product card
  productCardWrapper: { flex: 1 },
  productCard: {
    borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09, shadowRadius: 12, elevation: 5,
    marginBottom: 12,
  },
  productImage: { width: '100%', height: 130 },
  productImagePlaceholder: { width: '100%', height: 130, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  productImageGradient: { position: 'absolute', bottom: 130, left: 0, right: 0, height: 60 },
  categoryBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(22, 163, 74, 0.92)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  categoryBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  productInfo: { padding: 12 },
  productName: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 4, letterSpacing: -0.2 },
  productPrice: { fontSize: 16, fontWeight: '800', color: '#15803d', marginBottom: 6 },
  productUnit: { fontSize: 11, fontWeight: '500', color: '#94a3b8' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  locationText: { fontSize: 11, color: '#94a3b8', flex: 1 },
  stockBadge: {
    alignSelf: 'flex-start', backgroundColor: '#f0fdf4',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0',
  },
  stockText: { fontSize: 10, fontWeight: '700', color: '#15803d' },

  // Skeleton
  skeletonCard: {
    flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, marginBottom: 12,
  },
  skeletonImg: { width: '100%', height: 130, backgroundColor: '#e2e8f0' },
  skeletonLine: { backgroundColor: '#e2e8f0', borderRadius: 6 },

  // States
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginTop: 14, marginBottom: 6 },
  errorSubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#16a34a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIconBg: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
  clearFiltersBtn: { backgroundColor: '#f0fdf4', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  clearFiltersBtnText: { color: '#15803d', fontWeight: '700', fontSize: 13 },
});
