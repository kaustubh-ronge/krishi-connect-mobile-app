import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ArrowLeft, Package, Trash2, Edit } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useApiClient } from '@/services/api';
import { unwrapData } from '@/lib/apiHelpers';

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

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [fetchListings])
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to delete this listing? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.del(`mobile/v1/seller/listings?id=${id}`);
              setListings(prev => prev.filter(item => item.id !== id));
              Alert.alert("Success", "Listing deleted.");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete listing.");
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="bg-white rounded-2xl overflow-hidden border border-gray-100 mb-4">
      <Image 
        source={{ uri: item.images?.[0] || 'https://via.placeholder.com/150' }} 
        className="w-full h-32 bg-gray-200" 
      />
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-lg font-bold text-gray-800 flex-1 mr-2" numberOfLines={1}>{item.productName}</Text>
          <View className={`px-2 py-1 rounded-lg ${item.status === "ACTIVE" ? "bg-green-100" : "bg-red-100"}`}>
            <Text className="text-xs font-bold text-gray-800">{item.status}</Text>
          </View>
        </View>
        
        <Text className="text-sm text-gray-500 mb-3">{item.category} • {item.qualityGrade || 'Standard'}</Text>
        
        <View className="flex-row justify-between mb-4 pb-4 border-b border-gray-100">
          <Text className="text-base font-bold text-green-500">₹{item.pricePerUnit}/{item.unit}</Text>
          <Text className="text-sm font-semibold text-gray-600">Stock: {item.availableStock} {item.unit}</Text>
        </View>

        <View className="flex-row gap-3">
          <TouchableOpacity 
            className="flex-1 flex-row items-center justify-center p-2.5 rounded-xl bg-gray-100 gap-2"
            onPress={() => router.push(`/edit-listing/${item.id}`)}
          >
            <Edit size={16} color="#4b5563" />
            <Text className="text-sm font-semibold text-gray-600">Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 flex-row items-center justify-center p-2.5 rounded-xl bg-red-50 gap-2"
            onPress={() => handleDelete(item.id)}
          >
            <Trash2 size={16} color="#ef4444" />
            <Text className="text-sm font-semibold text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-100">
        <TouchableOpacity className="p-2 rounded-lg bg-gray-100" onPress={() => router.back()}>
          <ArrowLeft color="#1f2937" size={24} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">My Inventory</Text>
        <View style={{width: 40}} />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center p-6">
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : listings.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <Package size={64} color="#d1d5db" />
          <Text className="text-xl font-bold text-gray-800 mt-4">No Listings Yet</Text>
          <Text className="text-sm text-gray-500 text-center mt-2 mb-6">You haven't added any products to sell.</Text>
          <TouchableOpacity 
            className="bg-primary px-6 py-3 rounded-xl"
            onPress={() => router.push('/create-listing')}
          >
            <Text className="text-white font-bold text-base">Create Listing</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerClassName="p-4 pb-20"
          refreshing={loading}
          onRefresh={fetchListings}
        />
      )}
    </SafeAreaView>
  );
}


