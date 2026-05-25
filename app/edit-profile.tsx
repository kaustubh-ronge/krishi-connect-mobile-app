import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApiClient } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { ArrowLeft, Save } from 'lucide-react-native';
import LocationPicker from '@/components/LocationPicker';
import { formatLocation } from '@/lib/apiHelpers';
import ImagePicker from '@/components/ImagePicker';

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  keyboardType?: any;
  multiline?: boolean;
  readOnly?: boolean;
}

const FARMER_FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Full Name *', placeholder: 'Your full name' },
  { key: 'phone', label: 'Phone Number *', placeholder: '10-digit phone number', keyboardType: 'phone-pad' },
  { key: 'aadharNumber', label: 'Aadhar Number *', placeholder: 'XXXX XXXX XXXX', keyboardType: 'numeric' },
  { key: 'farmName', label: 'Farm Name', placeholder: 'Name of your farm' },
  { key: 'farmSize', label: 'Farm Size (Acres)', placeholder: 'e.g. 5.5', keyboardType: 'numeric' },
  { key: 'farmingExperience', label: 'Farming Exp (Years)', placeholder: 'e.g. 10', keyboardType: 'numeric' },
  { key: 'address', label: 'Address *', placeholder: 'Your full address', multiline: true },
  { key: 'city', label: 'City *', placeholder: 'e.g. Pune' },
  { key: 'pincode', label: 'Pincode *', placeholder: 'e.g. 400001', keyboardType: 'numeric' },
  { key: 'district', label: 'District', placeholder: 'e.g. Nashik', readOnly: true },
  { key: 'state', label: 'State', placeholder: 'e.g. Maharashtra', readOnly: true },
  { key: 'primaryProduce', label: 'Primary Produce (comma separated)', placeholder: 'e.g. Wheat, Rice' },
  { key: 'upiId', label: 'UPI ID', placeholder: 'yourname@upi', keyboardType: 'email-address' },
  { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. State Bank of India' },
  { key: 'ifscCode', label: 'IFSC Code', placeholder: 'e.g. SBIN0001234' },
  { key: 'accountNumber', label: 'Account Number', placeholder: 'Enter Account Number', keyboardType: 'numeric' },
];

const AGENT_FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Full Name *', placeholder: 'Your full name' },
  { key: 'phone', label: 'Phone Number *', placeholder: '10-digit phone number', keyboardType: 'phone-pad' },
  { key: 'aadharNumber', label: 'Aadhar Number *', placeholder: 'XXXX XXXX XXXX', keyboardType: 'numeric' },
  { key: 'companyName', label: 'Company Name', placeholder: 'Your company or business name' },
  { key: 'address', label: 'Address *', placeholder: 'Your full address', multiline: true },
  { key: 'city', label: 'City *', placeholder: 'e.g. Pune' },
  { key: 'pincode', label: 'Pincode *', placeholder: 'e.g. 400001', keyboardType: 'numeric' },
  { key: 'district', label: 'District', placeholder: 'e.g. Nashik', readOnly: true },
  { key: 'state', label: 'State', placeholder: 'e.g. Maharashtra', readOnly: true },
  { key: 'agentType', label: 'Agent Type (comma separated)', placeholder: 'e.g. Wholesaler, Retailer' },
  { key: 'upiId', label: 'UPI ID', placeholder: 'yourname@upi', keyboardType: 'email-address' },
  { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. State Bank of India' },
  { key: 'ifscCode', label: 'IFSC Code', placeholder: 'e.g. SBIN0001234' },
  { key: 'accountNumber', label: 'Account Number', placeholder: 'Enter Account Number', keyboardType: 'numeric' },
];

const DELIVERY_FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Full Name *', placeholder: 'Your full name' },
  { key: 'phone', label: 'Phone Number *', placeholder: '10-digit phone number', keyboardType: 'phone-pad' },
  { key: 'aadharNumber', label: 'Aadhar Number *', placeholder: 'XXXX XXXX XXXX', keyboardType: 'numeric' },
  { key: 'vehicleType', label: 'Vehicle Type *', placeholder: 'e.g. Bike, Car, Auto' },
  { key: 'vehicleNumber', label: 'Vehicle Number *', placeholder: 'e.g. MH12AB1234' },
  { key: 'licenseNumber', label: 'Driving License Number *', placeholder: 'Your DL Number' },
  { key: 'radius', label: 'Service Radius (KM) *', placeholder: 'e.g. 50', keyboardType: 'numeric' },
  { key: 'pricePerKm', label: 'Price Per KM (₹) *', placeholder: 'e.g. 10', keyboardType: 'numeric' },
  { key: 'address', label: 'Address *', placeholder: 'Your full address', multiline: true },
  { key: 'city', label: 'City *', placeholder: 'e.g. Pune' },
  { key: 'pincode', label: 'Pincode *', placeholder: 'e.g. 400001', keyboardType: 'numeric' },
  { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. State Bank of India' },
  { key: 'ifscCode', label: 'IFSC Code', placeholder: 'e.g. SBIN0001234' },
  { key: 'accountNumber', label: 'Account Number', placeholder: 'Enter Account Number', keyboardType: 'numeric' },
];

const ROLE_FIELDS: Record<string, FieldConfig[]> = {
  farmer: FARMER_FIELDS,
  agent: AGENT_FIELDS,
  delivery: DELIVERY_FIELDS,
};

export default function EditProfileScreen() {
  const router = useRouter();
  const { onboarding } = useLocalSearchParams();
  const api = useApiClient();
  const { profile, role, fetchProfile, loading } = useUserStore();

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [usagePurpose, setUsagePurpose] = useState<'buy' | 'buy_and_sell'>('buy');
  const [aadharFront, setAadharFront] = useState<string[]>([]);
  const [aadharBack, setAadharBack] = useState<string[]>([]);
  const [licenseImage, setLicenseImage] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  React.useEffect(() => {
    const load = async () => {
      setInitialLoad(true);
      if (!profile && !role) {
        await fetchProfile(api);
      }
      setInitialLoad(false);
    };
    load();
  }, []);

  React.useEffect(() => {
    if (!initialLoad && !loading && !role) {
      router.replace('/onboarding');
    }
  }, [initialLoad, loading, role]);

  useEffect(() => {
    if (profile) {
      const initial: Record<string, string> = {};
      const fields = ROLE_FIELDS[role] || [];
      fields.forEach((f) => {
        initial[f.key] = (profile as any)[f.key]?.toString() || '';
      });
      setFormData(initial);
      
      if ((profile as any).usagePurpose) {
        setUsagePurpose((profile as any).usagePurpose);
      }
      if ((profile as any).aadharFront) {
        setAadharFront([(profile as any).aadharFront]);
      }
      if ((profile as any).aadharBack) {
        setAadharBack([(profile as any).aadharBack]);
      }
      if ((profile as any).licenseImage) {
        setLicenseImage([(profile as any).licenseImage]);
      }
    }
  }, [profile, role]);

  const handleSave = async () => {
    const fields = ROLE_FIELDS[role] || [];
    const required = fields.filter((f) => f.label.includes('*') && !f.readOnly);
    const missing = required.filter((f) => !formData[f.key]?.trim());
    
    if (missing.length > 0) {
      Alert.alert('Missing Fields', `Please fill in: ${missing.map((f) => f.label.replace('*', '').trim()).join(', ')}`);
      return;
    }

    if (!formData['lat'] || !formData['lng']) {
      Alert.alert('Location Missing', 'Please fetch your current location. It is mandatory.');
      return;
    }

    if (aadharFront.length === 0 || aadharBack.length === 0) {
      Alert.alert('Aadhaar Missing', 'Please upload both front and back images of your Aadhaar card.');
      return;
    }

    if (role === 'delivery' && licenseImage.length === 0) {
      Alert.alert('Driving License Missing', 'Please upload an image of your driving license.');
      return;
    }

    // Process Array Fields
    const processedData: any = { ...formData, usagePurpose };
    
    if (processedData.primaryProduce && typeof processedData.primaryProduce === 'string') {
      processedData.primaryProduce = processedData.primaryProduce.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (processedData.agentType && typeof processedData.agentType === 'string') {
      processedData.agentType = processedData.agentType.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    // Aadhar Images (Base64) - Web API accepts these natively or checks for them
    processedData.aadharFront = aadharFront[0];
    processedData.aadharBack = aadharBack[0];

    if (role === 'delivery') {
      processedData.licenseImage = licenseImage[0];
    }

    setSaving(true);
    try {
      const endpoint = `mobile/v1/profiles/${role}`;
      if (isCreating) {
        await api.post(endpoint, processedData);
      } else {
        await api.put(endpoint, processedData);
      }
      await fetchProfile(api); // Refresh global store
      if (onboarding) {
        Alert.alert('Profile Created ✓', 'Welcome to KrishiConnect!', [
          { text: 'Start', onPress: () => router.replace('/(tabs)') },
        ]);
      } else {
        Alert.alert('Success ✓', 'Your profile has been updated.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const fields = ROLE_FIELDS[role] || [];
  const isCreating = onboarding || !profile;

  if (loading || initialLoad || (!profile && !role)) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#15803d" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View className="flex-row items-center bg-white px-4 py-4 border-b border-gray-200">
          {!isCreating && (
            <TouchableOpacity onPress={() => router.back()} className="p-1 mr-3">
              <ArrowLeft color="#1f2937" size={24} />
            </TouchableOpacity>
          )}
          <Text className="flex-1 text-xl font-bold text-gray-900">
            {isCreating ? 'Create Profile' : 'Edit Profile'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} className="p-1">
            {saving ? <ActivityIndicator size="small" color="#15803d" /> : <Save color="#15803d" size={24} />}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerClassName="p-4 pb-10" keyboardShouldPersistTaps="handled">
          {fields.length === 0 ? (
            <View className="py-10 items-center">
              <Text className="text-gray-500 text-base">Profile editing is not available for your role.</Text>
            </View>
          ) : (
            <>
              {/* Profile Intent (Not applicable for Delivery) */}
              {role !== 'delivery' && (
                <View className="mb-6 bg-white p-4 rounded-xl border border-gray-200">
                  <Text className="text-sm font-semibold text-gray-800 mb-3">How do you plan to use KrishiConnect? *</Text>
                  <View className="gap-3">
                    <TouchableOpacity 
                      className={`flex-row items-center p-3 rounded-lg border ${usagePurpose === 'buy' ? 'border-primary bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                      onPress={() => setUsagePurpose('buy')}
                    >
                      <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${usagePurpose === 'buy' ? 'border-primary' : 'border-gray-300'}`}>
                        {usagePurpose === 'buy' && <View className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </View>
                      <View>
                        <Text className={`font-semibold ${usagePurpose === 'buy' ? 'text-primary' : 'text-gray-700'}`}>Buy Only</Text>
                        <Text className="text-xs text-gray-500">I only want to purchase products</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      className={`flex-row items-center p-3 rounded-lg border ${usagePurpose === 'buy_and_sell' ? 'border-primary bg-green-50' : 'border-gray-200 bg-gray-50'}`}
                      onPress={() => setUsagePurpose('buy_and_sell')}
                    >
                      <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-3 ${usagePurpose === 'buy_and_sell' ? 'border-primary' : 'border-gray-300'}`}>
                        {usagePurpose === 'buy_and_sell' && <View className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </View>
                      <View>
                        <Text className={`font-semibold ${usagePurpose === 'buy_and_sell' ? 'text-primary' : 'text-gray-700'}`}>Buy & Sell</Text>
                        <Text className="text-xs text-gray-500">I want to buy AND list products for sale</Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                  {usagePurpose === 'buy_and_sell' && (
                    <Text className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded">
                      Note: Seller capabilities require admin approval after profile creation.
                    </Text>
                  )}
                </View>
              )}

              {/* Dynamic Fields */}
              <View className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
                <Text className="text-lg font-bold text-gray-800 mb-4">Personal Details</Text>
                {fields.map((field) => (
                  <View key={field.key} className="mb-4">
                    <Text className="text-sm font-semibold text-gray-700 mb-1.5">{field.label}</Text>
                    <TextInput
                      className={`px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 text-[15px] ${field.multiline ? 'h-24 text-top' : ''} ${field.readOnly ? 'bg-gray-100 text-gray-500' : ''}`}
                      value={formData[field.key] || ''}
                      onChangeText={(v) => setFormData((prev) => ({ ...prev, [field.key]: v }))}
                      placeholder={field.placeholder}
                      placeholderTextColor="#9ca3af"
                      keyboardType={field.keyboardType || 'default'}
                      multiline={field.multiline}
                      numberOfLines={field.multiline ? 3 : 1}
                      editable={!field.readOnly}
                      textAlignVertical={field.multiline ? 'top' : 'center'}
                    />
                    {field.readOnly && (
                      <Text className="text-[11px] text-gray-500 mt-1">This field is auto-populated.</Text>
                    )}
                  </View>
                ))}
              </View>

              {/* Aadhaar Uploads */}
              <View className="bg-white p-4 rounded-xl border border-gray-200 mb-6">
                <Text className="text-lg font-bold text-gray-800 mb-4">Identity Verification</Text>
                
                <Text className="text-sm font-semibold text-gray-700 mb-2">Aadhaar Card (Front) *</Text>
                <ImagePicker 
                  value={aadharFront} 
                  onChange={setAadharFront} 
                  onRemove={() => setAadharFront([])} 
                  maxImages={1} 
                />
                
                <Text className="text-sm font-semibold text-gray-700 mb-2 mt-5">Aadhaar Card (Back) *</Text>
                <ImagePicker 
                  value={aadharBack} 
                  onChange={setAadharBack} 
                  onRemove={() => setAadharBack([])} 
                  maxImages={1} 
                />

                {role === 'delivery' && (
                  <>
                    <Text className="text-sm font-semibold text-gray-700 mb-2 mt-5">Driving License Image *</Text>
                    <ImagePicker 
                      value={licenseImage} 
                      onChange={setLicenseImage} 
                      onRemove={() => setLicenseImage([])} 
                      maxImages={1} 
                    />
                  </>
                )}
              </View>

              {/* Location Picker */}
              <LocationPicker 
                initialLat={profile ? Number((profile as any).lat) : undefined}
                initialLng={profile ? Number((profile as any).lng) : undefined}
                initialAddress={profile ? formatLocation(profile as any) : undefined}
                onLocationSelect={(lat, lng, address) => {
                  setFormData((prev) => {
                    const updates: any = {
                      ...prev,
                      lat: lat.toString(),
                      lng: lng.toString(),
                    };
                    if (address) {
                       updates.address = address; // Update the form text input with the address!
                    }
                    return updates;
                  });
                }} 
              />

              <TouchableOpacity
                className={`bg-primary p-4 rounded-xl items-center mt-2 ${saving ? 'opacity-70' : ''}`}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-bold">
                    {onboarding ? 'Complete Setup' : 'Save Profile'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
