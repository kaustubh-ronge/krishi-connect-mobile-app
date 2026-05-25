import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useApiClient } from '@/services/api';
import { ArrowLeft, Star } from 'lucide-react-native';
import { getRouteParam } from '@/lib/apiHelpers';

export default function ReviewScreen() {
  const router = useRouter();
  const api = useApiClient();
  
  const { id, productId } = useLocalSearchParams();
  const orderId = getRouteParam(id);
  const prodId = getRouteParam(productId);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }
    
    setSubmitting(true);
    try {
      const res = await api.post('mobile/v1/reviews', {
        orderId,
        productId: prodId,
        rating,
        comment
      });

      if (res.data?.success) {
        Alert.alert('Success', 'Thank you for your review!');
        router.back();
      } else {
        throw new Error(res.data?.error || 'Failed to submit review');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View className="flex-row justify-center gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7} className="p-2">
            <Star
              size={48}
              color={rating >= star ? '#f59e0b' : '#d1d5db'}
              fill={rating >= star ? '#f59e0b' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-4 py-3.5 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ArrowLeft color="#1f2937" size={22} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900 ml-3">Write a Review</Text>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          <Text className="text-2xl font-black text-center text-gray-900 mb-2 mt-4">
            How was the product?
          </Text>
          <Text className="text-sm text-center text-gray-500 mb-8">
            Your feedback helps other buyers and farmers improve their services.
          </Text>

          {renderStars()}

          <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Write your comments (Optional)</Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-base min-h-[120px]"
            multiline
            placeholder="Share details of your experience with this product..."
            placeholderTextColor="#9ca3af"
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />

          <TouchableOpacity
            className={`mt-10 bg-emerald-600 py-4 rounded-xl items-center shadow-sm shadow-emerald-600/30 ${rating === 0 || submitting ? 'opacity-50' : ''}`}
            onPress={handleSubmit}
            disabled={rating === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-bold text-lg">Submit Review</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
