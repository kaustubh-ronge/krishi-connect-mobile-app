import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, ActivityIndicator,
  TouchableOpacity, RefreshControl, TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApiClient } from '@/services/api';
import { MapPin, Package, Search, X } from 'lucide-react-native';
import { MotiView } from 'moti';

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
    const location = seller?.district ? `${seller.district}${seller.region ? ', ' + seller.region : ''}` : 'Location hidden';

    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: index * 50 }}
        style={{ width: '48%' }}
        className="mb-4"
      >
        <TouchableOpacity
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          activeOpacity={0.85}
          onPress={() => router.push(`/product/${item.id}`)}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} className="w-full h-32 bg-gray-100" resizeMode="cover" />
          ) : (
            <View className="w-full h-32 bg-gray-100 items-center justify-center">
              <Package color="#9ca3af" size={32} />
            </View>
          )}

          <View className="p-3">
            <Text className="text-sm font-bold text-gray-900 mb-1" numberOfLines={1}>{item.productName}</Text>
            <Text className="text-base font-extrabold text-primary mb-2">
              ₹{item.pricePerUnit} <Text className="text-xs font-medium text-gray-500">/ {item.unit}</Text>
            </Text>

            <View className="flex-row items-center mb-1">
              <MapPin color="#6b7280" size={12} />
              <Text className="text-xs text-gray-500 ml-1 flex-1" numberOfLines={1}>{location}</Text>
            </View>

            <Text className="text-xs text-gray-400 mb-2" numberOfLines={1}>By {sellerName}</Text>

            <View className="bg-green-50 px-2 py-1 rounded border border-green-100 self-start">
              <Text className="text-[10px] text-green-700 font-bold">{item.availableStock} {item.unit} avail.</Text>
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100">
        <Text className="text-2xl font-extrabold text-primary-dark tracking-tight">Marketplace</Text>
      </View>

      <View className="flex-row items-center bg-white mx-4 mt-4 mb-2 px-4 py-3 rounded-2xl border border-gray-200 shadow-sm">
        <Search color="#6b7280" size={18} className="mr-2" />
        <TextInput
          className="flex-1 text-base text-gray-800"
          placeholder="Search fresh products..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={onSearchSubmit}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={clearSearch} className="p-1">
            <X color="#9ca3af" size={18} />
          </TouchableOpacity>
        )}
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4 py-2 gap-x-2"
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              className={`px-4 py-2 rounded-full border ${selectedCategory === cat ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
              onPress={() => onCategorySelect(cat)}
            >
              <Text className={`text-sm font-semibold ${selectedCategory === cat ? 'text-white' : 'text-gray-600'}`}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity 
        className="mx-4 mt-2 mb-2 self-start flex-row items-center"
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text className="text-primary font-bold">{showFilters ? 'Hide Filters' : 'Advanced Filters'}</Text>
      </TouchableOpacity>

      {showFilters && (
        <View className="bg-white mx-4 p-4 rounded-xl shadow-sm border border-gray-100 mb-2">
          <Text className="font-bold text-gray-800 mb-2">Sort By</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {['newest', 'price_asc', 'price_desc'].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => applyFilters(s, sellerType)}
                className={`px-3 py-1.5 rounded-lg border ${sortBy === s ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
              >
                <Text className={`text-xs font-semibold ${sortBy === s ? 'text-white' : 'text-gray-600'}`}>
                  {s === 'newest' ? 'Newest' : s === 'price_asc' ? 'Price: Low to High' : 'Price: High to Low'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-bold text-gray-800 mb-2">Seller Type</Text>
          <View className="flex-row gap-2 mb-4">
            {['all', 'farmer', 'agent'].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => applyFilters(sortBy, s, regionFilter)}
                className={`px-3 py-1.5 rounded-lg border ${sellerType === s ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
              >
                <Text className={`text-xs font-semibold ${sellerType === s ? 'text-white' : 'text-gray-600'}`}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="font-bold text-gray-800 mb-2">Region Filter</Text>
          <View className="flex-row items-center">
            <TextInput
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800"
              placeholder="e.g. Pune"
              value={regionFilter}
              onChangeText={setRegionFilter}
              onSubmitEditing={() => applyFilters(sortBy, sellerType, regionFilter)}
            />
            {regionFilter.length > 0 && (
              <TouchableOpacity onPress={() => applyFilters(sortBy, sellerType, '')} className="ml-2">
                <Text className="text-red-500 font-semibold text-sm">Clear</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center p-6">
          <Text className="text-red-500 text-base text-center mb-4">{error}</Text>
          <TouchableOpacity className="bg-primary px-6 py-3 rounded-xl" onPress={() => { setLoading(true); fetchProducts(); }}>
            <Text className="text-white font-bold">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerClassName="p-4"
          numColumns={2}
          columnWrapperClassName="justify-between"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#16a34a']} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-6 mt-10 bg-white rounded-3xl mx-4 border border-gray-100 border-dashed">
              <View className="w-20 h-20 rounded-full bg-gray-50 items-center justify-center mb-4">
                <Package color="#9ca3af" size={40} />
              </View>
              <Text className="text-gray-500 text-lg font-medium text-center">No products found</Text>
              <Text className="text-gray-400 text-sm text-center mt-1 mb-4">Try adjusting your filters or search term</Text>
              {(search || selectedCategory !== 'All') && (
                <TouchableOpacity onPress={() => { setSearch(''); onCategorySelect('All'); }} className="bg-green-50 px-5 py-2.5 rounded-full border border-green-200">
                  <Text className="text-green-700 font-bold text-sm">Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
