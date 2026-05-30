// import React, { useState, useCallback } from 'react';
// import {
//   View, Text, FlatList, Image, ActivityIndicator,
//   TouchableOpacity, RefreshControl, TextInput,
//   ScrollView, StyleSheet,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
// import { useFocusEffect, useRouter } from 'expo-router';
// import { useApiClient } from '@/services/api';
// import { MapPin, Package, Search, X, SlidersHorizontal, ChevronDown } from 'lucide-react-native';
// import { MotiView } from 'moti';

// const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices', 'Pulses', 'Others'];

// // Skeleton placeholder card
// function SkeletonCard() {
//   return (
//     <MotiView
//       from={{ opacity: 0.4 }}
//       animate={{ opacity: 1 }}
//       transition={{ loop: true, type: 'timing', duration: 900 }}
//       style={styles.skeletonCard}
//     >
//       <View style={styles.skeletonImg} />
//       <View style={{ padding: 12 }}>
//         <View style={[styles.skeletonLine, { width: '80%', height: 13, marginBottom: 8 }]} />
//         <View style={[styles.skeletonLine, { width: '50%', height: 16, marginBottom: 8 }]} />
//         <View style={[styles.skeletonLine, { width: '60%', height: 11 }]} />
//       </View>
//     </MotiView>
//   );
// }

// export default function MarketplaceScreen() {
//   const api = useApiClient();
//   const router = useRouter();
//   const [products, setProducts] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState('');
//   const [search, setSearch] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('All');
//   const [sortBy, setSortBy] = useState('newest');
//   const [sellerType, setSellerType] = useState('all');
//   const [regionFilter, setRegionFilter] = useState('');
//   const [showFilters, setShowFilters] = useState(false);

//   const fetchProducts = useCallback(async (
//     searchTerm = search,
//     category = selectedCategory,
//     sort = sortBy,
//     seller = sellerType,
//     region = regionFilter
//   ) => {
//     try {
//       setError('');
//       const params = new URLSearchParams({
//         search: searchTerm,
//         category,
//         sortBy: sort,
//         sellerType: seller,
//         region,
//         limit: '20',
//       });
//       const response = await api.get(`mobile/v1/products?${params.toString()}`);
//       setProducts(response.data || []);
//     } catch (err: any) {
//       setError(err.message || 'An error occurred');
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   }, [search, selectedCategory]);

//   useFocusEffect(
//     useCallback(() => {
//       setLoading(true);
//       fetchProducts();
//     }, [selectedCategory])
//   );

//   const onRefresh = () => {
//     setRefreshing(true);
//     fetchProducts();
//   };

//   const onSearchSubmit = () => {
//     setLoading(true);
//     fetchProducts(search, selectedCategory, sortBy, sellerType, regionFilter);
//   };

//   const clearSearch = () => {
//     setSearch('');
//     setLoading(true);
//     fetchProducts('', selectedCategory, sortBy, sellerType, regionFilter);
//   };

//   const onCategorySelect = (cat: string) => {
//     setSelectedCategory(cat);
//     setLoading(true);
//     fetchProducts(search, cat, sortBy, sellerType, regionFilter);
//   };

//   const applyFilters = (newSortBy: string, newSellerType: string, newRegion: string = regionFilter) => {
//     setSortBy(newSortBy);
//     setSellerType(newSellerType);
//     setRegionFilter(newRegion);
//     setLoading(true);
//     fetchProducts(search, selectedCategory, newSortBy, newSellerType, newRegion);
//   };

//   const renderProduct = ({ item, index }: { item: any; index: number }) => {
//     const imageUrl = item.images && item.images.length > 0 ? item.images[0] : null;
//     const seller = item.farmer || item.agent;
//     const sellerName = seller?.name || seller?.companyName || 'Unknown Seller';
//     const district = seller?.district;
//     const region = seller?.region;
//     const location = district ? `${district}${region ? ', ' + region : ''}` : null;
//     const stock = item.availableSellableStock !== undefined ? item.availableSellableStock : item.availableStock;

//     return (
//       <MotiView
//         from={{ opacity: 0, translateY: 24 }}
//         animate={{ opacity: 1, translateY: 0 }}
//         transition={{ type: 'timing', duration: 380, delay: index * 45 }}
//         style={styles.productCardWrapper}
//       >
//         <TouchableOpacity
//           style={styles.productCard}
//           activeOpacity={0.88}
//           onPress={() => router.push(`/product/${item.id}`)}
//         >
//           {imageUrl ? (
//             <Image source={{ uri: imageUrl }} style={styles.productImage} resizeMode="cover" />
//           ) : (
//             <View style={styles.productImagePlaceholder}>
//               <Package color="#94a3b8" size={34} />
//             </View>
//           )}

//           <LinearGradient
//             colors={['transparent', 'rgba(0,0,0,0.45)']}
//             style={styles.productImageGradient}
//           />

//           <View style={styles.categoryBadge}>
//             <Text style={styles.categoryBadgeText}>{item.category || 'General'}</Text>
//           </View>

//           <View style={styles.productInfo}>
//             <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
//             <Text style={styles.productPrice}>
//               ₹{item.pricePerUnit}{' '}
//               <Text style={styles.productUnit}>/ {item.unit}</Text>
//             </Text>

//             {location ? (
//               <View style={styles.locationRow}>
//                 <MapPin color="#94a3b8" size={11} />
//                 <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
//               </View>
//             ) : null}

//             <View style={styles.stockBadge}>
//               <Text style={styles.stockText}>{stock} {item.unit}</Text>
//             </View>
//           </View>
//         </TouchableOpacity>
//       </MotiView>
//     );
//   };

//   return (
//     <SafeAreaView style={styles.container} edges={['top']}>
//       {/* Hero Header */}
//       <LinearGradient
//         colors={['#15803d', '#16a34a', '#22c55e']}
//         start={{ x: 0, y: 0 }}
//         end={{ x: 1, y: 1 }}
//         style={styles.header}
//       >
//         <View style={styles.headerContent}>
//           <View>
//             <Text style={styles.headerTitle}>Marketplace</Text>
//             <Text style={styles.headerSubtitle}>Fresh produce, directly from farmers</Text>
//           </View>
//           <View style={styles.headerIcon}>
//             <Package color="#fff" size={22} />
//           </View>
//         </View>

//         {/* Search Bar inside header */}
//         <View style={styles.searchContainer}>
//           <Search color="#94a3b8" size={17} style={{ marginRight: 8 }} />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search fresh products..."
//             placeholderTextColor="#94a3b8"
//             value={search}
//             onChangeText={setSearch}
//             onSubmitEditing={onSearchSubmit}
//             returnKeyType="search"
//           />
//           {search.length > 0 && (
//             <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
//               <X color="#94a3b8" size={16} />
//             </TouchableOpacity>
//           )}
//         </View>
//       </LinearGradient>

//       {/* Category Chips */}
//       <View style={styles.categoryBar}>
//         <ScrollView
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           contentContainerStyle={styles.categoryScroll}
//         >
//           {CATEGORIES.map((cat) => (
//             <TouchableOpacity
//               key={cat}
//               style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
//               onPress={() => onCategorySelect(cat)}
//             >
//               <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
//                 {cat}
//               </Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>

//         <TouchableOpacity
//           style={styles.filterBtn}
//           onPress={() => setShowFilters(!showFilters)}
//         >
//           <SlidersHorizontal color={showFilters ? '#16a34a' : '#64748b'} size={18} />
//         </TouchableOpacity>
//       </View>

//       {/* Advanced Filters Panel */}
//       {showFilters && (
//         <MotiView
//           from={{ opacity: 0, translateY: -12 }}
//           animate={{ opacity: 1, translateY: 0 }}
//           transition={{ type: 'timing', duration: 280 }}
//           style={styles.filtersPanel}
//         >
//           <Text style={styles.filterSectionLabel}>Sort By</Text>
//           <View style={styles.filterRow}>
//             {['newest', 'price_asc', 'price_desc'].map((s) => (
//               <TouchableOpacity
//                 key={s}
//                 onPress={() => applyFilters(s, sellerType)}
//                 style={[styles.filterChip, sortBy === s && styles.filterChipActive]}
//               >
//                 <Text style={[styles.filterChipText, sortBy === s && styles.filterChipTextActive]}>
//                   {s === 'newest' ? 'Newest' : s === 'price_asc' ? '↑ Price' : '↓ Price'}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           <Text style={styles.filterSectionLabel}>Seller Type</Text>
//           <View style={styles.filterRow}>
//             {['all', 'farmer', 'agent'].map((s) => (
//               <TouchableOpacity
//                 key={s}
//                 onPress={() => applyFilters(sortBy, s, regionFilter)}
//                 style={[styles.filterChip, sellerType === s && styles.filterChipActive]}
//               >
//                 <Text style={[styles.filterChipText, sellerType === s && styles.filterChipTextActive]}>
//                   {s.charAt(0).toUpperCase() + s.slice(1)}
//                 </Text>
//               </TouchableOpacity>
//             ))}
//           </View>

//           <Text style={styles.filterSectionLabel}>Region</Text>
//           <View style={styles.filterRow}>
//             <TextInput
//               style={styles.regionInput}
//               placeholder="e.g. Pune"
//               placeholderTextColor="#94a3b8"
//               value={regionFilter}
//               onChangeText={setRegionFilter}
//               onSubmitEditing={() => applyFilters(sortBy, sellerType, regionFilter)}
//             />
//             {regionFilter.length > 0 && (
//               <TouchableOpacity onPress={() => applyFilters(sortBy, sellerType, '')} style={styles.clearBtn}>
//                 <Text style={styles.clearBtnText}>Clear</Text>
//               </TouchableOpacity>
//             )}
//           </View>
//         </MotiView>
//       )}

//       {/* Content */}
//       {loading && !refreshing ? (
//         <FlatList
//           data={[1, 2, 3, 4, 5, 6]}
//           keyExtractor={(i) => String(i)}
//           renderItem={() => <SkeletonCard />}
//           numColumns={2}
//           columnWrapperStyle={styles.columnWrapper}
//           contentContainerStyle={styles.listContent}
//           scrollEnabled={false}
//         />
//       ) : error ? (
//         <View style={styles.centerContainer}>
//           <Package color="#94a3b8" size={52} />
//           <Text style={styles.errorTitle}>Something went wrong</Text>
//           <Text style={styles.errorSubtitle}>{error}</Text>
//           <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchProducts(); }}>
//             <Text style={styles.retryBtnText}>Try Again</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         <FlatList
//           data={products}
//           keyExtractor={(item) => item.id}
//           renderItem={renderProduct}
//           numColumns={2}
//           columnWrapperStyle={styles.columnWrapper}
//           contentContainerStyle={styles.listContent}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} tintColor="#16a34a" />
//           }
//           ListEmptyComponent={
//             <View style={styles.emptyContainer}>
//               <View style={styles.emptyIconBg}>
//                 <Package color="#94a3b8" size={44} />
//               </View>
//               <Text style={styles.emptyTitle}>No products found</Text>
//               <Text style={styles.emptySubtitle}>Try adjusting your filters or search</Text>
//               {(search || selectedCategory !== 'All') && (
//                 <TouchableOpacity
//                   onPress={() => { setSearch(''); onCategorySelect('All'); }}
//                   style={styles.clearFiltersBtn}
//                 >
//                   <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
//                 </TouchableOpacity>
//               )}
//             </View>
//           }
//         />
//       )}
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#f1f5f9' },

//   // Header
//   header: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 18 },
//   headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
//   headerTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
//   headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '500' },
//   headerIcon: {
//     width: 42, height: 42, borderRadius: 21,
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     alignItems: 'center', justifyContent: 'center',
//   },

//   // Search
//   searchContainer: {
//     flexDirection: 'row', alignItems: 'center',
//     backgroundColor: '#fff',
//     borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
//   },
//   searchInput: { flex: 1, fontSize: 14, color: '#1e293b', fontWeight: '500' },

//   // Category bar
//   categoryBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
//   categoryScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
//   categoryChip: {
//     paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
//     backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
//   },
//   categoryChipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
//   categoryChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
//   categoryChipTextActive: { color: '#fff' },
//   filterBtn: { paddingHorizontal: 14, paddingVertical: 10 },

//   // Filters panel
//   filtersPanel: {
//     backgroundColor: '#fff', marginHorizontal: 12, marginTop: 4, marginBottom: 2,
//     borderRadius: 16, padding: 16,
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
//   },
//   filterSectionLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 },
//   filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
//   filterChip: {
//     paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
//     backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0',
//   },
//   filterChipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
//   filterChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
//   filterChipTextActive: { color: '#fff' },
//   regionInput: {
//     flex: 1, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10,
//     paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#1e293b', backgroundColor: '#f8fafc',
//   },
//   clearBtn: { marginLeft: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#fee2e2', borderRadius: 10 },
//   clearBtnText: { color: '#dc2626', fontWeight: '700', fontSize: 12 },

//   // Product list
//   listContent: { padding: 12, paddingBottom: 120 },
//   columnWrapper: { gap: 12, marginBottom: 0 },

//   // Product card
//   productCardWrapper: { flex: 1 },
//   productCard: {
//     borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff',
//     shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.09, shadowRadius: 12, elevation: 5,
//     marginBottom: 12,
//   },
//   productImage: { width: '100%', height: 130 },
//   productImagePlaceholder: { width: '100%', height: 130, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
//   productImageGradient: { position: 'absolute', bottom: 130, left: 0, right: 0, height: 60 },
//   categoryBadge: {
//     position: 'absolute', top: 10, left: 10,
//     backgroundColor: 'rgba(22, 163, 74, 0.92)',
//     paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
//   },
//   categoryBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
//   productInfo: { padding: 12 },
//   productName: { fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 4, letterSpacing: -0.2 },
//   productPrice: { fontSize: 16, fontWeight: '800', color: '#15803d', marginBottom: 6 },
//   productUnit: { fontSize: 11, fontWeight: '500', color: '#94a3b8' },
//   locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
//   locationText: { fontSize: 11, color: '#94a3b8', flex: 1 },
//   stockBadge: {
//     alignSelf: 'flex-start', backgroundColor: '#f0fdf4',
//     paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#bbf7d0',
//   },
//   stockText: { fontSize: 10, fontWeight: '700', color: '#15803d' },

//   // Skeleton
//   skeletonCard: {
//     flex: 1, borderRadius: 18, overflow: 'hidden', backgroundColor: '#fff',
//     shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, marginBottom: 12,
//   },
//   skeletonImg: { width: '100%', height: 130, backgroundColor: '#e2e8f0' },
//   skeletonLine: { backgroundColor: '#e2e8f0', borderRadius: 6 },

//   // States
//   centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
//   errorTitle: { fontSize: 17, fontWeight: '700', color: '#1e293b', marginTop: 14, marginBottom: 6 },
//   errorSubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
//   retryBtn: { backgroundColor: '#16a34a', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
//   retryBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
//   emptyContainer: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
//   emptyIconBg: {
//     width: 90, height: 90, borderRadius: 45,
//     backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
//   },
//   emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
//   emptySubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 20 },
//   clearFiltersBtn: { backgroundColor: '#f0fdf4', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#bbf7d0' },
//   clearFiltersBtnText: { color: '#15803d', fontWeight: '700', fontSize: 13 },
// });


// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// ===================================================================
// BEFORE AND AFTER UPDATING THE UI 
// ===================================================================
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++


import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, Image,
  TouchableOpacity, RefreshControl, TextInput,
  ScrollView, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApiClient } from '@/services/api';
import {
  MapPin, Package, Search, X, SlidersHorizontal,
  ChevronLeft, ChevronRight, Leaf, TrendingUp, Star,
} from 'lucide-react-native';
import { MotiView } from 'moti';
import { formatLocation } from '@/lib/apiHelpers';

// ─── Constants ────────────────────────────────────────────────────────────────
const { width: SW } = Dimensions.get('window');
const H_PAD = 14;          // horizontal padding of list
const COL_GAP = 12;        // gap between the two columns
const CARD_W = (SW - H_PAD * 2 - COL_GAP) / 2;  // exact half-width
const IMG_H = 128;        // fixed image height
const PAGE_SIZE = 10;

const CATEGORIES = ['All', 'Vegetables', 'Fruits', 'Grains', 'Dairy', 'Spices', 'Pulses', 'Others'];

const CAT_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  Vegetables: { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  Fruits: { bg: '#fff7ed', text: '#c2410c', dot: '#f97316' },
  Grains: { bg: '#fefce8', text: '#a16207', dot: '#eab308' },
  Dairy: { bg: '#eff6ff', text: '#1d4ed8', dot: '#60a5fa' },
  Spices: { bg: '#fdf4ff', text: '#9333ea', dot: '#c084fc' },
  Pulses: { bg: '#fff1f2', text: '#be123c', dot: '#fb7185' },
  Others: { bg: '#f8fafc', text: '#475569', dot: '#94a3b8' },
  General: { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
};

// ─── Skeleton Card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <MotiView
      from={{ opacity: 0.35 }}
      animate={{ opacity: 0.85 }}
      transition={{ loop: true, type: 'timing', duration: 880 }}
      style={styles.card}
    >
      <View style={styles.skeletonImg} />
      <View style={styles.cardBody}>
        <View style={[styles.skeletonLine, { width: '78%', height: 12, marginBottom: 6 }]} />
        <View style={[styles.skeletonLine, { width: '52%', height: 12, marginBottom: 10 }]} />
        <View style={[styles.skeletonLine, { width: '48%', height: 20, marginBottom: 10 }]} />
        <View style={[styles.skeletonLine, { width: '68%', height: 10, marginBottom: 10 }]} />
        <View style={[styles.skeletonLine, { width: '44%', height: 24, borderRadius: 10 }]} />
      </View>
    </MotiView>
  );
}

// ─── Pagination Bar ────────────────────────────────────────────────────────────
function PaginationBar({
  currentPage, totalPages, onPageChange,
}: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 320 }}
      style={styles.pgContainer}
    >
      {/* Prev */}
      <TouchableOpacity
        onPress={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={[styles.pgNav, currentPage === 1 && styles.pgNavOff]}
      >
        <ChevronLeft color={currentPage === 1 ? '#cbd5e1' : '#16a34a'} size={16} />
      </TouchableOpacity>

      {/* Page buttons */}
      <View style={styles.pgNumbers}>
        {pages.map((p, i) =>
          p === '...' ? (
            <Text key={`d${i}`} style={styles.pgDots}>···</Text>
          ) : (
            <TouchableOpacity
              key={p}
              onPress={() => onPageChange(p as number)}
              style={[styles.pgBtn, currentPage === p && styles.pgBtnActive]}
            >
              <Text style={[styles.pgBtnTxt, currentPage === p && styles.pgBtnTxtActive]}>{p}</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Next */}
      <TouchableOpacity
        onPress={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={[styles.pgNav, currentPage === totalPages && styles.pgNavOff]}
      >
        <ChevronRight color={currentPage === totalPages ? '#cbd5e1' : '#16a34a'} size={16} />
      </TouchableOpacity>
    </MotiView>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function MarketplaceScreen() {
  const api = useApiClient();
  const router = useRouter();

  // ── Original state (untouched) ──────────────────────────────────────────────
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

  // ── Pagination (UI only, no API changes) ────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const listRef = useRef<FlatList>(null);
  const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const pagedProducts = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Original logic — verbatim ───────────────────────────────────────────────
  const fetchProducts = useCallback(async (
    searchTerm = search,
    category = selectedCategory,
    sort = sortBy,
    seller = sellerType,
    region = regionFilter,
  ) => {
    try {
      setError('');
      const params = new URLSearchParams({ search: searchTerm, category, sortBy: sort, sellerType: seller, region, limit: '20' });
      const response = await api.get(`mobile/v1/products?${params.toString()}`);
      setProducts(response.data || []);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, selectedCategory]);

  useFocusEffect(useCallback(() => { setLoading(true); fetchProducts(); }, [selectedCategory]));

  const onRefresh = () => { setRefreshing(true); fetchProducts(); };
  const onSearchSubmit = () => { setLoading(true); fetchProducts(search, selectedCategory, sortBy, sellerType, regionFilter); };
  const clearSearch = () => { setSearch(''); setLoading(true); fetchProducts('', selectedCategory, sortBy, sellerType, regionFilter); };
  const onCategorySelect = (cat: string) => { setSelectedCategory(cat); setLoading(true); fetchProducts(search, cat, sortBy, sellerType, regionFilter); };
  const applyFilters = (nb: string, ns: string, nr: string = regionFilter) => {
    setSortBy(nb); setSellerType(ns); setRegionFilter(nr);
    setLoading(true);
    fetchProducts(search, selectedCategory, nb, ns, nr);
  };

  const onPageChange = (page: number) => {
    setCurrentPage(page);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  // ── Product Card ─────────────────────────────────────────────────────────────
  const renderProduct = ({ item, index }: { item: any; index: number }) => {
    const imageUrl = item.images?.length > 0 ? item.images[0] : null;
    const seller = item.farmer || item.agent;
    const isFarmer = item.sellerType === 'farmer';

    // Seller name
    const sellerName = isFarmer
      ? (seller?.farmName || seller?.name || '')
      : (seller?.companyName || seller?.name || '');

    // Location: marketplace API returns district + region only
    const district = seller?.district;
    const region = seller?.region;
    const location = [district, region].filter(Boolean).join(', ');

    // Stock
    const stock = item.availableSellableStock !== undefined
      ? item.availableSellableStock
      : (item.availableStock ?? 0);
    const isLowStock = stock > 0 && stock <= 10;
    const isLastItem = stock === 1;
    const isSoldOut = stock <= 0;

    // Rating
    const rating = seller?.averageRating;

    // Category colours
    const catKey = item.category || 'General';
    const cc = CAT_COLORS[catKey] ?? CAT_COLORS['General'];

    // Seller badge colours
    const sellerBadgeColor = isFarmer ? '#15803d' : '#1d4ed8';
    const sellerBadgeBg = isFarmer ? '#dcfce7' : '#dbeafe';
    const sellerLabel = isFarmer ? '🌾 Farm' : '🏢 Agent';

    // Delivery
    const isFreeDelivery = Number(item.deliveryCharge) === 0;
    const minQty = item.minOrderQuantity || 1;

    // Stock pill label — single fixed string, never wraps
    const stockPillLabel = isSoldOut
      ? 'Out of Stock'
      : isLastItem
      ? '🔥 Last 1'
      : isLowStock
      ? `⚡ ${stock} ${item.unit}`
      : `${stock} ${item.unit}`;
    const stockPillGreen = !isSoldOut;

    // Delivery pill — single fixed string
    const deliveryPillLabel = isFreeDelivery ? '🚚 Free' : `🚚 ₹${item.deliveryCharge}`;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 18, scale: 0.96 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: 'spring', delay: index * 45, damping: 18, stiffness: 130 }}
        style={styles.cardWrap}
      >
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.80}
          onPress={() => router.push(`/product/${item.id}`)}
        >
          {/* ── Image ── */}
          <View style={styles.imgBox}>
            {imageUrl
              ? <Image source={{ uri: imageUrl }} style={styles.productImg} resizeMode="cover" />
              : (
                <View style={styles.imgPlaceholder}>
                  <View style={styles.imgPlaceholderRing}>
                    <Package color="#86efac" size={26} />
                  </View>
                </View>
              )
            }
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.40)']} style={styles.imgGrad} />

            {/* Category badge — top left */}
            <View style={[styles.catBadge, { backgroundColor: cc.bg }]}>
              <View style={[styles.catDot, { backgroundColor: cc.dot }]} />
              <Text style={[styles.catBadgeTxt, { color: cc.text }]} numberOfLines={1}>{catKey}</Text>
            </View>

            {/* Seller type badge — top right */}
            <View style={[styles.sellerTypeBadge, { backgroundColor: sellerBadgeBg }]}>
              <Text style={[styles.sellerTypeBadgeTxt, { color: sellerBadgeColor }]}>{sellerLabel}</Text>
            </View>

            {/* Stock urgency badge — bottom-left (only when low/last/sold) */}
            {(isLastItem || (isLowStock && !isLastItem) || isSoldOut) && (
              <View style={[
                styles.urgencyBadge,
                { backgroundColor: isSoldOut ? '#374151' : isLastItem ? '#dc2626' : '#ea580c' }
              ]}>
                <Text style={styles.urgencyBadgeTxt}>
                  {isSoldOut ? 'SOLD OUT' : isLastItem ? '🔥 LAST' : `⚡ ${stock} left`}
                </Text>
              </View>
            )}
          </View>

          {/* ── Card Body ── */}
          <View style={styles.cardBody}>

            {/* Name — exactly 2 lines, fixed height */}
            <View style={styles.nameBox}>
              <Text style={styles.productName} numberOfLines={2}>{item.productName}</Text>
            </View>

            {/* Price + rating — fixed height row */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>₹{item.pricePerUnit}</Text>
              <Text style={styles.unit}> /{item.unit}</Text>
              {rating != null && (
                <View style={styles.ratingPill}>
                  <Text style={styles.ratingTxt}>⭐ {Number(rating).toFixed(1)}</Text>
                </View>
              )}
            </View>

            {/* Location — 1 line fixed height, always shows */}
            <View style={styles.locRow}>
              <MapPin color="#94a3b8" size={10} />
              <Text style={styles.locTxt} numberOfLines={1}>
                {location.length > 0 ? location : 'India'}
              </Text>
            </View>

            {/* Seller — 1 line fixed height */}
            <View style={styles.sellerRow}>
              <View style={[styles.sellerDot, { backgroundColor: sellerBadgeColor }]} />
              <Text style={[styles.sellerNameTxt, { color: sellerBadgeColor }]} numberOfLines={1}>
                {sellerName || (isFarmer ? 'Farmer' : 'Agent')}
              </Text>
            </View>

            {/* Pills — EXACTLY 2 fixed pills, no wrap = consistent height */}
            <View style={styles.pillRow}>
              <View style={[styles.pill, stockPillGreen ? styles.pillGreen : styles.pillRed]}>
                <Leaf color={stockPillGreen ? '#15803d' : '#b91c1c'} size={8} />
                <Text style={[styles.pillTxt, { color: stockPillGreen ? '#15803d' : '#b91c1c' }]} numberOfLines={1}>
                  {stockPillLabel}
                </Text>
              </View>
              <View style={[styles.pill, isFreeDelivery ? styles.pillGreen : styles.pillDefault]}>
                <Text style={[styles.pillTxt, { color: isFreeDelivery ? '#15803d' : '#475569' }]} numberOfLines={1}>
                  {deliveryPillLabel}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  };

  // ── Filters Panel ─────────────────────────────────────────────────────────────
  const FiltersPanel = () => (
    <MotiView
      from={{ opacity: 0, translateY: -10, scale: 0.98 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 22, stiffness: 200 }}
      style={styles.filtersPanel}
    >
      <View style={styles.filterHead}>
        <SlidersHorizontal color="#16a34a" size={14} />
        <Text style={styles.filterHeadTxt}>Filters &amp; Sorting</Text>
      </View>

      <Text style={styles.filterLabel}>Sort By</Text>
      <View style={styles.filterRow}>
        {[{ k: 'newest', l: 'Newest' }, { k: 'price_asc', l: 'Price ↑' }, { k: 'price_desc', l: 'Price ↓' }].map(s => (
          <TouchableOpacity key={s.k} onPress={() => applyFilters(s.k, sellerType)}
            style={[styles.fChip, sortBy === s.k && styles.fChipOn]}>
            <Text style={[styles.fChipTxt, sortBy === s.k && styles.fChipTxtOn]}>{s.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.filterLabel}>Seller Type</Text>
      <View style={styles.filterRow}>
        {[{ k: 'all', l: '🌐 All' }, { k: 'farmer', l: '🌾 Farmer' }, { k: 'agent', l: '🏢 Agent' }].map(s => (
          <TouchableOpacity key={s.k} onPress={() => applyFilters(sortBy, s.k, regionFilter)}
            style={[styles.fChip, sellerType === s.k && styles.fChipOn]}>
            <Text style={[styles.fChipTxt, sellerType === s.k && styles.fChipTxtOn]}>{s.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.filterLabel}>Region</Text>
      <View style={styles.regionRow}>
        <View style={styles.regionInputBox}>
          <MapPin color="#94a3b8" size={13} />
          <TextInput
            style={styles.regionInput}
            placeholder="e.g. Pune, Mumbai..."
            placeholderTextColor="#b0bec5"
            value={regionFilter}
            onChangeText={setRegionFilter}
            onSubmitEditing={() => applyFilters(sortBy, sellerType, regionFilter)}
          />
        </View>
        {regionFilter.length > 0 && (
          <TouchableOpacity onPress={() => applyFilters(sortBy, sellerType, '')} style={styles.clearBtn}>
            <X color="#dc2626" size={11} />
            <Text style={styles.clearBtnTxt}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>
    </MotiView>
  );

  // ── Empty ─────────────────────────────────────────────────────────────────────
  const EmptyState = () => (
    <MotiView from={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 16 }} style={styles.emptyBox}>
      <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.emptyIconBg}>
        <Package color="#86efac" size={36} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No products found</Text>
      <Text style={styles.emptySubtitle}>Try adjusting your filters or search</Text>
      {(search || selectedCategory !== 'All') && (
        <TouchableOpacity onPress={() => { setSearch(''); onCategorySelect('All'); }} style={styles.clearFiltersBtn}>
          <X color="#16a34a" size={12} />
          <Text style={styles.clearFiltersTxt}>Clear all filters</Text>
        </TouchableOpacity>
      )}
    </MotiView>
  );

  // ── Error ─────────────────────────────────────────────────────────────────────
  const ErrorState = () => (
    <MotiView from={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 16 }} style={styles.centerBox}>
      <LinearGradient colors={['#fef2f2', '#fee2e2']} style={styles.emptyIconBg}>
        <Package color="#fca5a5" size={36} />
      </LinearGradient>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchProducts(); }}>
        <Text style={styles.retryBtnTxt}>Try Again</Text>
      </TouchableOpacity>
    </MotiView>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      {/* ── Header ── */}
      <LinearGradient colors={['#0e5c2d', '#15803d', '#16a34a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.hDecor1} /><View style={styles.hDecor2} />
        <View style={styles.hTop}>
          <View style={{ flex: 1 }}>
            <View style={styles.hBadge}>
              <Leaf color="#4ade80" size={10} />
              <Text style={styles.hBadgeTxt}>FRESH &amp; LOCAL</Text>
            </View>
            <Text style={styles.hTitle}>Marketplace</Text>
            <Text style={styles.hSubtitle}>Direct from farm to your door</Text>
          </View>
          <View style={styles.hIconWrap}><Package color="#fff" size={20} /></View>
        </View>

        {!loading && products.length > 0 && (
          <MotiView from={{ opacity: 0, translateY: 4 }} animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }} style={styles.countPill}>
            <TrendingUp color="#16a34a" size={11} />
            <Text style={styles.countPillTxt}>{products.length} products available</Text>
          </MotiView>
        )}

        {/* Search */}
        <View style={styles.searchBox}>
          <Search color="#94a3b8" size={16} />
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
            <TouchableOpacity onPress={clearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.searchClear}>
              <X color="#64748b" size={10} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* ── Category bar ── */}
      <View style={styles.catBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {CATEGORIES.map(cat => {
            const on = selectedCategory === cat;
            return (
              <TouchableOpacity key={cat} style={[styles.catChip, on && styles.catChipOn]}
                onPress={() => onCategorySelect(cat)} activeOpacity={0.72}>
                {on && <View style={styles.catChipDot} />}
                <Text style={[styles.catChipTxt, on && styles.catChipTxtOn]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.fBtnWrap}>
          <TouchableOpacity style={[styles.fBtn, showFilters && styles.fBtnOn]} onPress={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal color={showFilters ? '#fff' : '#64748b'} size={15} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Filters ── */}
      {showFilters && <FiltersPanel />}

      {/* ── Results bar ── */}
      {!loading && !error && products.length > 0 && (
        <View style={styles.resultsBar}>
          <Text style={styles.resultsTxt}>{pagedProducts.length} of {products.length} products</Text>
          {totalPages > 1 && <Text style={styles.pageTxt}>Page {currentPage}/{totalPages}</Text>}
        </View>
      )}

      {/* ── Content ── */}
      {loading && !refreshing ? (
        <FlatList
          data={[1, 2, 3, 4, 5, 6]}
          keyExtractor={i => String(i)}
          renderItem={() => <SkeletonCard />}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      ) : error ? (
        <ErrorState />
      ) : (
        <FlatList
          ref={listRef}
          data={pagedProducts}
          keyExtractor={item => item.id}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              colors={['#16a34a']} tintColor="#16a34a" progressBackgroundColor="#f0fdf4" />
          }
          ListEmptyComponent={<EmptyState />}
          ListFooterComponent={
            products.length > 0
              ? <PaginationBar currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
              : null
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── StyleSheet ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  // Header
  header: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 14, overflow: 'hidden' },
  hDecor1: { position: 'absolute', top: -30, right: -30, width: 115, height: 115, borderRadius: 58, backgroundColor: 'rgba(255,255,255,0.06)' },
  hDecor2: { position: 'absolute', top: 24, right: 52, width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.04)' },
  hTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  hBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.13)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 20, marginBottom: 3 },
  hBadgeTxt: { color: '#4ade80', fontSize: 8, fontWeight: '800', letterSpacing: 1.2 },
  hTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.8, lineHeight: 26 },
  hSubtitle: { fontSize: 11.5, color: 'rgba(255,255,255,0.70)', marginTop: 2, fontWeight: '500' },
  hIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  countPill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, marginBottom: 8 },
  countPillTxt: { fontSize: 10.5, fontWeight: '700', color: '#16a34a' },

  // Search
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.10, shadowRadius: 10, elevation: 4 },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b', fontWeight: '500' },
  searchClear: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },

  // Category bar
  catBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  catScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 7 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 13, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0' },
  catChipOn: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  catChipDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#4ade80' },
  catChipTxt: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  catChipTxtOn: { color: '#fff' },
  fBtnWrap: { paddingRight: 12, paddingLeft: 4 },
  fBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  fBtnOn: { backgroundColor: '#16a34a', borderColor: '#16a34a' },

  // Filters panel
  filtersPanel: { backgroundColor: '#fff', marginHorizontal: 14, marginTop: 8, marginBottom: 2, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e8f5e9', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.07, shadowRadius: 12, elevation: 5 },
  filterHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  filterHeadTxt: { fontSize: 13, fontWeight: '800', color: '#1e293b', letterSpacing: -0.2 },
  filterLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  fChip: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 11, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#e2e8f0' },
  fChipOn: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  fChipTxt: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  fChipTxtOn: { color: '#fff' },
  regionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  regionInputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 11, paddingHorizontal: 11, paddingVertical: 9, backgroundColor: '#f8fafc' },
  regionInput: { flex: 1, fontSize: 13, color: '#1e293b', fontWeight: '500' },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 9, paddingHorizontal: 11, backgroundColor: '#fef2f2', borderRadius: 11, borderWidth: 1, borderColor: '#fecaca' },
  clearBtnTxt: { color: '#dc2626', fontWeight: '800', fontSize: 12 },

  // Results bar
  resultsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 2 },
  resultsTxt: { fontSize: 11.5, fontWeight: '700', color: '#64748b' },
  pageTxt: { fontSize: 11.5, fontWeight: '700', color: '#16a34a' },

  // List — space-between keeps both columns exactly equal width
  listContent: { paddingHorizontal: H_PAD, paddingTop: 12, paddingBottom: 100 },
  row: { justifyContent: 'space-between', marginBottom: COL_GAP },

  // ── Card — explicit CARD_W so both columns are always pixel-perfect equal ──
  cardWrap: { width: CARD_W },
  card: {
    width: CARD_W,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#0f5c2e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09, shadowRadius: 10, elevation: 5,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
  },

  // Image — fixed height
  imgBox: { width: '100%', height: IMG_H, position: 'relative' },
  productImg: { width: '100%', height: IMG_H },
  imgPlaceholder: { width: '100%', height: IMG_H, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  imgPlaceholderRing: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(134,239,172,0.18)', borderWidth: 1.5, borderColor: 'rgba(134,239,172,0.45)', alignItems: 'center', justifyContent: 'center' },
  imgGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 42 },
  catBadge: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.10, shadowRadius: 3, elevation: 2 },
  catDot: { width: 5, height: 5, borderRadius: 2.5 },
  catBadgeTxt: { fontSize: 9, fontWeight: '800', letterSpacing: 0.2 },

  // Card body — ALL rows have explicit fixed heights = pixel-perfect equal cards
  cardBody: { padding: 10 },
  nameBox: { height: 36, justifyContent: 'flex-start', marginBottom: 5 }, // 2 lines × 18px
  productName: { fontSize: 12.5, fontWeight: '800', color: '#0f172a', lineHeight: 18, letterSpacing: -0.2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', height: 22, marginBottom: 4, gap: 1 },
  price: { fontSize: 16, fontWeight: '900', color: '#15803d', letterSpacing: -0.4 },
  unit: { fontSize: 10, fontWeight: '600', color: '#94a3b8', flex: 1 },
  ratingPill: { backgroundColor: '#fef9c3', borderRadius: 7, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: '#fde68a' },
  ratingTxt: { fontSize: 9, fontWeight: '800', color: '#92400e' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 15, marginBottom: 4 },
  locTxt: { fontSize: 10, color: '#94a3b8', flex: 1, fontWeight: '500' },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 14, marginBottom: 7 },
  sellerDot: { width: 5, height: 5, borderRadius: 2.5, flexShrink: 0 },
  sellerNameTxt: { fontSize: 9.5, fontWeight: '700', flex: 1 },
  // Pills — fixed 1-row height (no flexWrap, exactly 2 pills always visible)
  pillRow: { flexDirection: 'row', gap: 5, height: 22, overflow: 'hidden' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#f1f5f9', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7, borderWidth: 1, borderColor: '#e2e8f0', flexShrink: 0 },
  pillDefault: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  pillGreen: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  pillRed: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  pillTxt: { fontSize: 9, fontWeight: '700', color: '#475569' },
  // Urgency badge over image
  urgencyBadge: { position: 'absolute', bottom: 8, left: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  urgencyBadgeTxt: { fontSize: 8.5, fontWeight: '900', color: '#fff', letterSpacing: 0.2 },
  // Seller type badge
  sellerTypeBadge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 7 },
  sellerTypeBadgeTxt: { fontSize: 8, fontWeight: '800', letterSpacing: 0.1 },

  // Skeleton (same dimensions as real card)
  skeletonImg: { width: '100%', height: IMG_H, backgroundColor: '#e8f5e9' },
  skeletonLine: { backgroundColor: '#e2e8f0', borderRadius: 6 },

  // Empty / Error
  emptyBox: { alignItems: 'center', paddingTop: 56, paddingBottom: 40, paddingHorizontal: 32 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconBg: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 18, shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.13, shadowRadius: 12, elevation: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 6, letterSpacing: -0.3 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 20, lineHeight: 19, fontWeight: '500' },
  clearFiltersBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 13, borderWidth: 1.5, borderColor: '#86efac' },
  clearFiltersTxt: { color: '#16a34a', fontWeight: '800', fontSize: 13 },
  errorTitle: { fontSize: 17, fontWeight: '800', color: '#1e293b', marginTop: 16, marginBottom: 6, letterSpacing: -0.3 },
  errorSubtitle: { fontSize: 13, color: '#94a3b8', textAlign: 'center', marginBottom: 22, lineHeight: 19 },
  retryBtn: { backgroundColor: '#16a34a', paddingHorizontal: 26, paddingVertical: 12, borderRadius: 14, shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 4 },
  retryBtnTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Pagination
  pgContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, paddingHorizontal: 16, gap: 8, marginTop: 4 },
  pgNav: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  pgNavOff: { backgroundColor: '#f8fafc', borderColor: '#f1f5f9', shadowOpacity: 0 },
  pgNumbers: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pgBtn: { minWidth: 36, height: 36, borderRadius: 11, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  pgBtnActive: { backgroundColor: '#16a34a', borderColor: '#16a34a', shadowColor: '#16a34a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  pgBtnTxt: { fontSize: 13, fontWeight: '700', color: '#475569' },
  pgBtnTxtActive: { color: '#fff' },
  pgDots: { fontSize: 13, color: '#94a3b8', fontWeight: '700', letterSpacing: 1, paddingHorizontal: 4 },
});