import React, { useCallback, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Alert, Modal, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useApiClient } from '@/services/api';
import { Truck, MapPin, CheckCircle2, Clock, XCircle, ArrowRight, Package, Lock } from 'lucide-react-native';
import { MotiView } from 'moti';
import * as Location from 'expo-location';

export default function DeliveriesScreen() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // OTP Modal State
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [otp, setOtp] = useState('');

  const api = useApiClient();
  const router = useRouter();

  const fetchJobs = async () => {
    try {
      const res = await api.get('mobile/v1/delivery-jobs');
      if (res.data?.success) {
        setJobs(res.data.data || []);
      }
    } catch (err: any) {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchJobs();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobs();
  };

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required to update delivery status.');
      return null;
    }
    try {
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { lat: location.coords.latitude, lng: location.coords.longitude };
    } catch (e) {
      Alert.alert('Location Error', 'Failed to get current location. Please ensure location services are enabled.');
      return null;
    }
  };

  const handleUpdateStatus = async (jobId: string, status: string, requireLocation = false) => {
    let lat, lng;
    if (requireLocation) {
      setProcessingId(jobId);
      const loc = await getCurrentLocation();
      if (!loc) {
        setProcessingId(null);
        return;
      }
      lat = loc.lat;
      lng = loc.lng;
    }

    setProcessingId(jobId);
    try {
      const payload: any = { action: 'update_status', jobId, status };
      if (lat && lng) {
        payload.lat = lat;
        payload.lng = lng;
      }
      
      const res = await api.post('mobile/v1/delivery-jobs', payload);
      if (res.data?.success) {
        fetchJobs();
      } else {
        Alert.alert('Error', res.data?.error || 'Failed to update status');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setProcessingId(null);
    }
  };

  const handleCompleteDelivery = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
      return;
    }

    setProcessingId(selectedJob.id);
    const loc = await getCurrentLocation();
    if (!loc) {
      setProcessingId(null);
      return;
    }

    try {
      const res = await api.post('mobile/v1/delivery-jobs', {
        action: 'complete_otp',
        jobId: selectedJob.id,
        otp,
        lat: loc.lat,
        lng: loc.lng
      });

      if (res.data?.success) {
        setOtpModalVisible(false);
        setOtp('');
        setSelectedJob(null);
        Alert.alert('Success', 'Delivery completed successfully!');
        fetchJobs();
      } else {
        Alert.alert('Error', res.data?.error || 'Failed to complete delivery');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setProcessingId(null);
    }
  };

  const activeJobs = jobs.filter(j => ['ACCEPTED', 'PICKED_UP', 'IN_TRANSIT'].includes(j.status));
  const requestedJobs = jobs.filter(j => j.status === 'REQUESTED');
  const historyJobs = jobs.filter(j => ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(j.status));

  const renderJobCard = (job: any) => {
    const isProcessing = processingId === job.id;
    const firstItem = job.order?.items?.[0];
    const productName = firstItem?.product?.productName || 'Unknown Product';
    const pickupAddress = firstItem?.product?.farmer?.address || firstItem?.product?.agent?.address || 'Unknown Pickup';
    const dropAddress = job.order?.address || 'Unknown Drop';
    const buyerName = `${job.order?.buyerUser?.firstName || ''} ${job.order?.buyerUser?.lastName || ''}`;
    
    return (
      <View key={job.id} className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100">
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-row items-center flex-1 pr-4">
            <View className="w-12 h-12 rounded-2xl bg-amber-50 items-center justify-center mr-3">
              <Package color="#f59e0b" size={24} />
            </View>
            <View>
              <Text className="text-base font-bold text-gray-900 leading-tight" numberOfLines={1}>{productName}</Text>
              <Text className="text-xs text-gray-500 mt-1">Order #{job.orderId.substring(job.orderId.length - 6)}</Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-lg font-black text-emerald-600">₹{job.totalPrice}</Text>
            <Text className="text-xs font-bold text-gray-400">{job.distance} KM</Text>
          </View>
        </View>

        <View className="bg-gray-50 rounded-2xl p-4 mb-4">
          <View className="flex-row items-start mb-3">
            <View className="w-6 items-center">
              <View className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
              <View className="w-0.5 h-6 bg-gray-300 my-1" />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-xs font-bold text-gray-500 uppercase">Pickup</Text>
              <Text className="text-sm font-medium text-gray-900" numberOfLines={2}>{pickupAddress}</Text>
            </View>
          </View>
          <View className="flex-row items-start">
            <View className="w-6 items-center">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-xs font-bold text-gray-500 uppercase">Dropoff</Text>
              <Text className="text-sm font-medium text-gray-900" numberOfLines={2}>{dropAddress}</Text>
              <Text className="text-xs text-gray-500 mt-1">Buyer: {buyerName}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {job.status === 'REQUESTED' && (
          <View className="flex-row gap-3">
            <TouchableOpacity 
              className="flex-1 bg-gray-100 py-3 rounded-xl items-center justify-center"
              onPress={() => handleUpdateStatus(job.id, 'REJECTED')}
              disabled={isProcessing}
            >
              <Text className="text-gray-700 font-bold">Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-1 bg-amber-500 py-3 rounded-xl items-center justify-center flex-row"
              onPress={() => handleUpdateStatus(job.id, 'ACCEPTED')}
              disabled={isProcessing}
            >
              {isProcessing ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-bold">Accept Job</Text>}
            </TouchableOpacity>
          </View>
        )}

        {job.status === 'ACCEPTED' && (
          <TouchableOpacity 
            className="w-full bg-blue-600 py-4 rounded-xl items-center justify-center flex-row shadow-sm"
            onPress={() => handleUpdateStatus(job.id, 'PICKED_UP', true)}
            disabled={isProcessing}
          >
            {isProcessing ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <MapPin color="#fff" size={18} className="mr-2" />
                <Text className="text-white font-bold text-base">Mark as Picked Up</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {job.status === 'PICKED_UP' && (
          <TouchableOpacity 
            className="w-full bg-indigo-600 py-4 rounded-xl items-center justify-center flex-row shadow-sm"
            onPress={() => handleUpdateStatus(job.id, 'IN_TRANSIT')}
            disabled={isProcessing}
          >
            {isProcessing ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <Truck color="#fff" size={18} className="mr-2" />
                <Text className="text-white font-bold text-base">Start Transit</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {job.status === 'IN_TRANSIT' && (
          <TouchableOpacity 
            className="w-full bg-emerald-600 py-4 rounded-xl items-center justify-center flex-row shadow-sm"
            onPress={() => {
              setSelectedJob(job);
              setOtpModalVisible(true);
            }}
            disabled={isProcessing}
          >
            {isProcessing ? <ActivityIndicator color="#fff" size="small" /> : (
              <>
                <CheckCircle2 color="#fff" size={18} className="mr-2" />
                <Text className="text-white font-bold text-base">Complete Delivery</Text>
              </>
            )}
          </TouchableOpacity>
        )}
        
        {['DELIVERED', 'CANCELLED', 'REJECTED'].includes(job.status) && (
          <View className={`py-2 px-4 rounded-lg self-start ${job.status === 'DELIVERED' ? 'bg-emerald-100' : 'bg-red-100'}`}>
            <Text className={`font-bold text-xs ${job.status === 'DELIVERED' ? 'text-emerald-700' : 'text-red-700'}`}>
              {job.status}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#f59e0b" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ArrowRight color="#374151" size={24} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text className="text-2xl font-extrabold text-gray-900 tracking-tight">My Deliveries</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#f59e0b']} />}
      >
        {activeJobs.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Active Jobs</Text>
            {activeJobs.map(renderJobCard)}
          </View>
        )}

        {requestedJobs.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">New Requests</Text>
            {requestedJobs.map(renderJobCard)}
          </View>
        )}

        {historyJobs.length > 0 && (
          <View className="mb-6">
            <Text className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">History</Text>
            {historyJobs.map(renderJobCard)}
          </View>
        )}

        {jobs.length === 0 && (
          <View className="items-center justify-center py-20">
            <Truck color="#d1d5db" size={64} className="mb-4" />
            <Text className="text-lg font-bold text-gray-400">No deliveries yet</Text>
          </View>
        )}
      </ScrollView>

      {/* OTP Modal */}
      <Modal visible={otpModalVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <MotiView 
            from={{ translateY: 300 }}
            animate={{ translateY: 0 }}
            className="bg-white rounded-t-3xl p-6 pb-10"
          >
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
                  <Lock color="#059669" size={20} />
                </View>
                <Text className="text-xl font-bold text-gray-900">Verify Delivery</Text>
              </View>
              <TouchableOpacity onPress={() => setOtpModalVisible(false)} className="p-2 bg-gray-100 rounded-full">
                <XCircle color="#6b7280" size={20} />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-600 mb-4">
              Please enter the 6-digit OTP provided by the buyer to complete this delivery securely.
            </Text>

            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder="Enter 6-digit OTP"
              keyboardType="number-pad"
              maxLength={6}
              className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-center text-2xl font-black tracking-widest mb-6"
            />

            <TouchableOpacity
              className={`bg-emerald-600 py-4 rounded-xl items-center justify-center flex-row shadow-sm ${processingId ? 'opacity-70' : ''}`}
              onPress={handleCompleteDelivery}
              disabled={!!processingId}
            >
              {processingId ? <ActivityIndicator color="#fff" size="small" /> : (
                <Text className="text-white font-bold text-lg">Confirm & Complete</Text>
              )}
            </TouchableOpacity>
          </MotiView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
