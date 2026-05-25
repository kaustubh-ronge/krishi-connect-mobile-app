import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Modal
} from 'react-native';
import { Truck, ShieldCheck, Scale, Send, Package, X, User, MessageCircle } from 'lucide-react-native';
import { useApiClient } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { Colors } from '@/constants/Colors';
import { Alert } from 'react-native';
import { MotiView } from 'moti';

interface SpecialDeliveryModalProps {
  visible: boolean;
  onClose: () => void;
  product: any;
  onSuccess: () => void;
}

export default function SpecialDeliveryModal({ visible, onClose, product, onSuccess }: SpecialDeliveryModalProps) {
  const api = useApiClient();
  const { profile } = useUserStore();
  
  const [name, setName] = useState(profile?.name || "");
  const [quantity, setQuantity] = useState(product?.minOrderQuantity?.toString() || "1");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const isFarmer = product?.sellerType === 'farmer';
  const seller = isFarmer ? product?.farmer : product?.agent;
  const sellerId = isFarmer ? product?.farmerId : product?.agentId;
  const sellerName = isFarmer ? seller?.name : (seller?.companyName || seller?.name);

  const handleSend = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name.");
      return;
    }
    
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert("Required", "Please enter a valid quantity.");
      return;
    }

    setIsSending(true);

    try {
      const payload = {
        action: "create_and_send",
        productId: product.id,
        quantity: Number(quantity),
        sellerId: sellerId,
        unit: product.unit,
        name: name.trim(),
        message: message.trim(),
        productName: product.productName
      };

      const res = await api.post('mobile/v1/special-delivery', payload);

      if (res.data?.success) {
        Alert.alert(
          "Request Sent!", 
          "Mediation initiated. Admin will review soon.",
          [{ text: "OK", onPress: () => {
            onSuccess();
            onClose();
          }}]
        );
      } else {
        throw new Error(res.data?.error || "Failed to submit request.");
      }
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Failed to initiate mediation.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/50"
      >
        <MotiView 
          from={{ translateY: 300 }}
          animate={{ translateY: 0 }}
          className="bg-white rounded-t-3xl max-h-[90%]"
        >
          {/* Header */}
          <View className="bg-slate-900 rounded-t-3xl p-6 pb-8">
            <View className="flex-row justify-between items-start mb-2">
              <View className="flex-row items-center gap-3">
                <View className="bg-amber-500 p-2 rounded-xl">
                  <Truck className="h-6 w-6 text-white" />
                </View>
                <View>
                  <Text className="text-amber-400 text-[10px] font-black uppercase tracking-widest mb-1">
                    Logistics Mediation
                  </Text>
                  <Text className="text-white text-2xl font-black uppercase">
                    Special Delivery
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} className="p-2 bg-white/10 rounded-full">
                <X color="#fff" size={20} />
              </TouchableOpacity>
            </View>
            <Text className="text-slate-400 font-bold text-sm mt-2">
              Request a custom logistics quote for out-of-range delivery.
            </Text>
          </View>

          <ScrollView className="px-6 py-6" showsVerticalScrollIndicator={false}>
            {/* Product Summary */}
            <View className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex-row items-center mb-6">
              <View className="w-12 h-12 bg-white rounded-xl items-center justify-center border border-gray-100 mr-4">
                <Package color="#059669" size={24} />
              </View>
              <View>
                <Text className="font-bold text-gray-900 text-base">{product?.productName}</Text>
                <Text className="text-emerald-700 font-bold text-xs mt-1">₹{product?.pricePerUnit}/{product?.unit}</Text>
              </View>
            </View>

            {/* Form */}
            <View className="space-y-5 mb-6">
              <View>
                <View className="flex-row items-center mb-2">
                  <User size={16} color="#059669" className="mr-2" />
                  <Text className="text-sm font-bold text-gray-700">Your Name *</Text>
                </View>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Rajesh Kumar"
                  className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base"
                />
              </View>

              <View>
                <View className="flex-row items-center mb-2">
                  <Package size={16} color="#059669" className="mr-2" />
                  <Text className="text-sm font-bold text-gray-700">Quantity of {product?.productName} *</Text>
                </View>
                <View className="relative flex-row items-center">
                  <TextInput
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholder="0.00"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 pr-20 text-lg font-bold"
                  />
                  <View className="absolute right-3 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                    <Text className="text-emerald-700 text-[10px] font-black uppercase">{product?.unit}</Text>
                  </View>
                </View>
              </View>

              <View>
                <View className="flex-row items-center mb-2">
                  <MessageCircle size={16} color="#059669" className="mr-2" />
                  <Text className="text-sm font-bold text-gray-700">Your Message (Optional)</Text>
                </View>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Ask about quality, delivery time..."
                  multiline
                  numberOfLines={4}
                  className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-4 text-base min-h-[100px]"
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Trust Indicators */}
            <View className="flex-row gap-3 mb-8">
              <View className="flex-1 flex-row items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <ShieldCheck size={20} color="#4f46e5" className="mr-2" />
                <View>
                  <Text className="text-[10px] font-black uppercase text-slate-900">Secure Mediation</Text>
                </View>
              </View>
              <View className="flex-1 flex-row items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <Scale size={20} color="#d97706" className="mr-2" />
                <View>
                  <Text className="text-[10px] font-black uppercase text-slate-900">Fair Pricing</Text>
                </View>
              </View>
            </View>

          </ScrollView>
          
          <View className="p-6 border-t border-gray-100 bg-white pb-10">
            <TouchableOpacity
              onPress={handleSend}
              disabled={isSending}
              className={`bg-emerald-600 rounded-2xl py-4 flex-row items-center justify-center shadow-lg shadow-emerald-600/30 ${isSending ? 'opacity-70' : ''}`}
            >
              {isSending ? (
                <>
                  <ActivityIndicator color="#fff" className="mr-3" />
                  <Text className="text-white font-bold text-lg">Processing...</Text>
                </>
              ) : (
                <>
                  <Send color="#fff" size={20} className="mr-3" />
                  <Text className="text-white font-bold text-lg">Send Request</Text>
                </>
              )}
            </TouchableOpacity>
            <Text className="text-center text-xs text-gray-400 mt-3 font-medium">
              Admin will mediate this conversation to ensure security.
            </Text>
          </View>
        </MotiView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
