import React, { useState } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, ChevronRight, Package, Image as ImageIcon, MapPin, Tag } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useApiClient } from '@/services/api';
import { createListingSchema } from '@/lib/zodSchema';
import { z } from 'zod';
import ImagePicker from '@/components/ImagePicker';

const PRODUCE_CATEGORIES = ["Tomatoes", "Onions", "Potatoes", "Grapes", "Pomegranate", "Sugarcane", "Wheat", "Rice", "Soybean", "Cotton", "Ginger", "Turmeric", "Green Chilli", "Lemon", "Other"];
const UNIT_OPTIONS = ["kg", "ton", "quintal", "crate", "box", "Other"];
const GRADE_OPTIONS = ["Export Quality", "Grade A (Premium)", "Grade B (Standard)", "Grade C (Mixed)", "Organic Certified"];

export default function CreateListingScreen() {
  const router = useRouter();
  const api = useApiClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [productName, setProductName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tomatoes");
  const [customCategory, setCustomCategory] = useState("");
  const [qualityGrade, setQualityGrade] = useState("Grade A (Premium)");
  const [tags, setTags] = useState("");
  const [shelfLife, setShelfLife] = useState("");
  const [shelfLifeStartDate, setShelfLifeStartDate] = useState("");
  
  const [stock, setStock] = useState("");
  const [unit, setUnit] = useState("kg");
  const [customUnit, setCustomUnit] = useState("");
  const [price, setPrice] = useState("");
  const [minOrderQuantity, setMinOrderQuantity] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  
  const [images, setImages] = useState<string[]>([]);
  
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("0");
  const [deliveryChargeType, setDeliveryChargeType] = useState("per_unit");
  const [maxDeliveryRange, setMaxDeliveryRange] = useState("");

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    const category = selectedCategory === "Other" ? customCategory.trim() : selectedCategory;
    const unitToSubmit = unit === "Other" ? customUnit.trim() : unit;

    const validationData = {
      productName,
      category,
      variety: tags,
      description,
      availableStock: stock,
      pricePerUnit: price,
      minOrderQuantity,
      unit: unitToSubmit,
      deliveryCharge,
      deliveryChargeType,
      qualityGrade,
      shelfLife,
      whatsappNumber,
      harvestDate,
      shelfLifeStartDate,
      maxDeliveryRange,
      images,
    };

    try {
      createListingSchema.parse(validationData);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const message = error.issues?.[0]?.message || "Please fix the highlighted fields";
        Alert.alert("Validation Error", message);
        return;
      }
      Alert.alert("Validation failed.", "Please check your inputs.");
      return;
    }

    setLoading(true);
    try {
      const result = await api.post('mobile/v1/products', validationData);
      Alert.alert("Success", "Listing published successfully!");
      router.replace('/my-listings');
    } catch (error: any) {
      if (error.message === 'LOCATION_MISSING') {
        Alert.alert("Location Missing", "Please set your location in your profile first.", [
          { text: 'Update Location', onPress: () => router.push('/edit-profile') }
        ]);
      } else {
        Alert.alert("Error", error.message || "Failed to publish listing.");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View className="gap-4">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Product Details</Text>
      
      <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Product Name *</Text>
      <TextInput className="border border-gray-300 rounded-xl p-3.5 text-base bg-gray-50 text-gray-900" placeholder="e.g. Fresh Organic Mangoes" value={productName} onChangeText={setProductName} />

      <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Category *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pb-2 mt-2">
        {PRODUCE_CATEGORIES.map(c => (
          <TouchableOpacity key={c} className={`px-4 py-2.5 rounded-full mr-2 border ${selectedCategory === c ? "bg-green-50 border-green-500" : "bg-gray-100 border-gray-200"}`} onPress={() => setSelectedCategory(c)}>
            <Text className={`${selectedCategory === c ? "text-green-700 font-bold" : "text-gray-600 font-medium"}`}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedCategory === 'Other' && (
        <View style={{marginTop: 10}}>
          <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Custom Category *</Text>
          <TextInput className="border border-gray-300 rounded-xl p-3.5 text-base bg-gray-50 text-gray-900" placeholder="e.g. Spices" value={customCategory} onChangeText={setCustomCategory} />
        </View>
      )}

      <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Quality Grade</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pb-2 mt-2">
        {GRADE_OPTIONS.map(g => (
          <TouchableOpacity key={g} className={`px-4 py-2.5 rounded-full mr-2 border ${qualityGrade === g ? "bg-green-50 border-green-500" : "bg-gray-100 border-gray-200"}`} onPress={() => setQualityGrade(g)}>
            <Text className={`${qualityGrade === g ? "text-green-700 font-bold" : "text-gray-600 font-medium"}`}>{g}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Variety & Tags</Text>
      <TextInput className="border border-gray-300 rounded-xl p-3.5 text-base bg-gray-50 text-gray-900" placeholder="e.g. Organic, Hybrid (comma separated)" value={tags} onChangeText={setTags} />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Shelf Life</Text>
          <TextInput className="border border-gray-300 rounded-xl p-3.5 text-base bg-gray-50 text-gray-900" placeholder="e.g. 10 Days" value={shelfLife} onChangeText={setShelfLife} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Shelf Life Start</Text>
          <TextInput className="border border-gray-300 rounded-xl p-3.5 text-base bg-gray-50 text-gray-900" placeholder="YYYY-MM-DD" value={shelfLifeStartDate} onChangeText={setShelfLifeStartDate} />
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View className="gap-4">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Pricing & Inventory</Text>
      
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Total Stock *</Text>
          <TextInput className="border border-gray-300 rounded-xl p-3.5 text-base bg-gray-50 text-gray-900" placeholder="0" keyboardType="numeric" value={stock} onChangeText={setStock} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Unit *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pb-2 mt-2 mb-0">
            {UNIT_OPTIONS.map(u => (
              <TouchableOpacity key={u} className={`px-4 py-2.5 rounded-full mr-2 border ${unit === u ? "bg-green-50 border-green-500" : "bg-gray-100 border-gray-200"}`} onPress={() => setUnit(u)}>
                <Text className={`${unit === u ? "text-green-700 font-bold" : "text-gray-600 font-medium"}`}>{u}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {unit === 'Other' && (
        <View style={{marginTop: 10}}>
          <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Custom Unit *</Text>
          <TextInput className="border border-gray-300 rounded-xl p-3.5 text-base bg-gray-50 text-gray-900" placeholder="e.g. bundle" value={customUnit} onChangeText={setCustomUnit} />
        </View>
      )}

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Price per Unit (₹) *</Text>
          <TextInput className="border border-gray-300 rounded-xl p-3.5 text-base bg-gray-50 text-gray-900" placeholder="0" keyboardType="numeric" value={price} onChangeText={setPrice} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Min Order Qty</Text>
          <TextInput className="border border-gray-300 rounded-xl p-3.5 text-base bg-gray-50 text-gray-900" placeholder="0" keyboardType="numeric" value={minOrderQuantity} onChangeText={setMinOrderQuantity} />
        </View>
      </View>

      <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Harvest Date</Text>
      <TextInput className="border border-gray-300 rounded-xl p-3.5 text-base bg-gray-50 text-gray-900" placeholder="YYYY-MM-DD" value={harvestDate} onChangeText={setHarvestDate} />
    </View>
  );

  const renderStep3 = () => (
    <View className="gap-4">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Product Media</Text>
      <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Upload Images (Min 1, Max 5) *</Text>
      <ImagePicker
        value={images}
        onChange={(newImages) => setImages([...images, ...newImages])}
        onRemove={(url) => setImages(images.filter(i => i !== url))}
        maxImages={5}
      />
    </View>
  );

  const renderStep4 = () => (
    <View className="gap-4">
      <Text className="text-2xl font-bold text-gray-900 mb-2">Additional Details</Text>
      
      <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Description</Text>
      <TextInput
        className="border border-gray-300 rounded-xl p-3.5 text-base bg-gray-50 text-gray-900 h-24 text-top"
        placeholder="Write a detailed description of your product..."
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Delivery Charge (₹)</Text>
          <TextInput className="border border-gray-300 rounded-xl p-3.5 text-base bg-gray-50 text-gray-900" placeholder="0" keyboardType="numeric" value={deliveryCharge} onChangeText={setDeliveryCharge} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Charge Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row pb-2 mt-2 mb-0">
            {['per_unit', 'flat'].map(t => (
              <TouchableOpacity key={t} className={`px-4 py-2.5 rounded-full mr-2 border ${deliveryChargeType === t ? "bg-green-50 border-green-500" : "bg-gray-100 border-gray-200"}`} onPress={() => setDeliveryChargeType(t)}>
                <Text className={`${deliveryChargeType === t ? "text-green-700 font-bold" : "text-gray-600 font-medium"}`}>{t === 'flat' ? 'Flat Rate' : 'Per Unit'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">Max Delivery Range (KM)</Text>
      <TextInput className="border border-gray-300 rounded-xl p-3.5 text-base bg-gray-50 text-gray-900" placeholder="e.g. 50" keyboardType="numeric" value={maxDeliveryRange} onChangeText={setMaxDeliveryRange} />

      <Text className="text-sm font-semibold text-gray-600 mb-[-8px] mt-2">WhatsApp Number</Text>
      <TextInput className="border border-gray-300 rounded-xl p-3.5 text-base bg-gray-50 text-gray-900" placeholder="10 digit number" keyboardType="phone-pad" value={whatsappNumber} onChangeText={setWhatsappNumber} />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
        <TouchableOpacity className="p-2 rounded-lg bg-gray-100" onPress={() => { currentStep === 1 ? router.back() : handlePrev() }}>
          <ArrowLeft color="#1f2937" size={24} />
        </TouchableOpacity>
        <Text className="text-base font-semibold text-gray-700">Step {currentStep} of 4</Text>
        <View style={{width: 40}} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView className="flex-1 p-5" contentContainerStyle={{paddingBottom: 40}}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="p-5 border-t border-gray-100 bg-white">
        {currentStep < 4 ? (
          <TouchableOpacity className="flex-row items-center justify-center bg-primary p-4 rounded-2xl gap-2" onPress={handleNext}>
            <Text className="text-white text-base font-bold">Next Step</Text>
            <ChevronRight color="white" size={20} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity className="flex-row items-center justify-center bg-green-500 p-4 rounded-2xl gap-2" onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="white" /> : (
              <>
                <Text className="text-white text-base font-bold">Publish Listing</Text>
                <CheckCircle2 color="white" size={20} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}


