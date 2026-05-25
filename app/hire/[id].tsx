import React, { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useApiClient } from '@/services/api';
import { ArrowLeft, UserPlus, Truck, MapPin, Star, ShieldCheck, Zap, User } from 'lucide-react-native';
import { MotiView } from 'moti';
import { getRouteParam } from '@/lib/apiHelpers';

export default function HireDeliveryScreen() {
  const router = useRouter();
  const api = useApiClient();
  const orderId = getRouteParam(useLocalSearchParams<{ id: string }>().id);

  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hiringId, setHiringId] = useState<string | null>(null);

  const fetchPartners = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await api.get(`mobile/v1/delivery-jobs/hire?orderId=${orderId}`);
      if (res.data?.success) {
        setPartners(res.data.data || []);
      } else {
        throw new Error(res.data?.error || 'Failed to fetch delivery partners');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch delivery partners');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPartners();
    }, [orderId])
  );

  const handleHire = async (partnerId: string, distance: number) => {
    setHiringId(partnerId);
    try {
      const res = await api.post('mobile/v1/delivery-jobs/hire', {
        orderId,
        deliveryBoyId: partnerId,
        distance
      });

      if (res.data?.success) {
        Alert.alert('Success', 'Delivery partner requested successfully!');
        fetchPartners(); // Refresh list to show hiring status
      } else {
        throw new Error(res.data?.error || 'Failed to hire delivery partner');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to hire delivery partner');
    } finally {
      setHiringId(null);
    }
  };

  const getStatusBadge = (availability: string) => {
    switch (availability) {
      case 'AVAILABLE':
        return <View className="bg-emerald-100 px-2 py-1 rounded-full"><Text className="text-emerald-700 text-[10px] font-black">AVAILABLE NOW</Text></View>;
      case 'AVAILABLE_SOON':
        return <View className="bg-amber-100 px-2 py-1 rounded-full"><Text className="text-amber-700 text-[10px] font-black">BUSY - SOON</Text></View>;
      case 'AVAILABLE_LATER':
        return <View className="bg-orange-100 px-2 py-1 rounded-full"><Text className="text-orange-700 text-[10px] font-black">BUSY - LATER</Text></View>;
      case 'OFFLINE':
        return <View className="bg-gray-200 px-2 py-1 rounded-full"><Text className="text-gray-600 text-[10px] font-black">OFFLINE</Text></View>;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-100 shadow-sm z-10">
        <TouchableOpacity className="p-2 rounded-lg bg-gray-100" onPress={() => router.back()}>
          <ArrowLeft color="#1f2937" size={24} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Hire Delivery Partner</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f59e0b" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {partners.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Truck color="#d1d5db" size={64} className="mb-4" />
              <Text className="text-lg font-bold text-gray-400">No partners available near you.</Text>
            </View>
          ) : (
            partners.map((partner, index) => {
              const estCost = partner.distance * (partner.pricePerKm || 0);
              const isHiring = hiringId === partner.id;
              const hasActiveRequest = partner.hiringStatus && partner.hiringStatus !== 'REJECTED' && partner.hiringStatus !== 'CANCELLED';

              return (
                <MotiView 
                  key={partner.id}
                  from={{ opacity: 0, translateY: 20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', delay: index * 100 }}
                  className={`bg-white rounded-3xl p-5 mb-4 shadow-sm border ${hasActiveRequest ? 'border-amber-400 bg-amber-50/30' : 'border-gray-100'}`}
                >
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-row items-center">
                      <View className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center mr-4 border-2 border-white shadow-sm">
                        <User color="#3b82f6" size={28} />
                      </View>
                      <View>
                        <View className="flex-row items-center mb-1">
                          <Text className="text-lg font-bold text-gray-900 mr-2">{partner.name}</Text>
                          {partner.isOnline && <View className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white" />}
                        </View>
                        <View className="flex-row items-center">
                          {getStatusBadge(partner.availability)}
                        </View>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-black text-emerald-600">₹{partner.pricePerKm}/km</Text>
                      <Text className="text-xs text-gray-500 font-medium">Est: ₹{Math.max(0, estCost).toFixed(0)}</Text>
                    </View>
                  </View>

                  <View className="bg-gray-50 rounded-2xl p-4 mb-4 flex-row justify-between">
                    <View className="flex-1 items-center border-r border-gray-200">
                      <Truck color="#6b7280" size={18} className="mb-1" />
                      <Text className="text-[10px] text-gray-500 font-bold uppercase">Vehicle</Text>
                      <Text className="text-sm font-bold text-gray-900">{partner.vehicleType?.replace('_', ' ') || 'Any'}</Text>
                    </View>
                    <View className="flex-1 items-center border-r border-gray-200">
                      <MapPin color="#6b7280" size={18} className="mb-1" />
                      <Text className="text-[10px] text-gray-500 font-bold uppercase">Distance</Text>
                      <Text className="text-sm font-bold text-gray-900">{partner.distance} km</Text>
                    </View>
                    <View className="flex-1 items-center">
                      <Zap color="#f59e0b" size={18} className="mb-1" />
                      <Text className="text-[10px] text-gray-500 font-bold uppercase">Pickup in</Text>
                      <Text className="text-sm font-bold text-gray-900">{partner.pickupDistance} km</Text>
                    </View>
                  </View>

                  {hasActiveRequest ? (
                    <View className="bg-amber-100 py-4 rounded-xl items-center justify-center border border-amber-200">
                      <Text className="text-amber-800 font-bold text-base uppercase tracking-widest">
                        Status: {partner.hiringStatus}
                      </Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      className={`bg-blue-600 py-4 rounded-xl flex-row items-center justify-center shadow-sm shadow-blue-600/30 ${
                        (isHiring || partner.availability === 'OFFLINE') ? 'opacity-50' : ''
                      }`}
                      onPress={() => handleHire(partner.id, partner.distance)}
                      disabled={isHiring || partner.availability === 'OFFLINE'}
                    >
                      {isHiring ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <UserPlus color="#fff" size={20} className="mr-2" />
                          <Text className="text-white font-bold text-lg">Hire for ₹{Math.max(0, estCost).toFixed(0)}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </MotiView>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
