import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { MapPin } from 'lucide-react-native';

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
}

export default function LocationPicker({ onLocationSelect, initialLat, initialLng, initialAddress }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [lat, setLat] = useState<number | undefined>(initialLat);
  const [lng, setLng] = useState<number | undefined>(initialLng);
  const [address, setAddress] = useState<string | undefined>(initialAddress);

  useEffect(() => {
    if (initialLat && initialLng) {
      setLat(initialLat);
      setLng(initialLng);
    }
    if (initialAddress) {
      setAddress(initialAddress);
    }
  }, [initialLat, initialLng, initialAddress]);

  const fetchLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied. Location is mandatory for checkout and listing.');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const currentLat = location.coords.latitude;
      const currentLng = location.coords.longitude;
      
      setLat(currentLat);
      setLng(currentLng);

      // Try reverse geocoding
      let addressStr = undefined;
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({
          latitude: currentLat,
          longitude: currentLng
        });
        
        if (reverseGeocode && reverseGeocode.length > 0) {
          const res = reverseGeocode[0];
          addressStr = [res.name, res.street, res.city, res.region, res.postalCode, res.country]
            .filter(Boolean)
            .join(', ');
          setAddress(addressStr);
        }
      } catch (err) {
        console.log("Reverse geocoding failed", err);
      }

      onLocationSelect(currentLat, currentLng, addressStr);
      Alert.alert('Location Fetched ✓', 'Your coordinates have been pinned successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch location.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="mb-4 p-4 bg-white rounded-xl border border-gray-200">
      <Text className="text-sm font-semibold text-gray-800 mb-3">Farm / Business Location *</Text>
      
      {lat && lng ? (
        <View className="flex-row items-center bg-green-100 p-3 rounded-lg mb-3 gap-2">
          <MapPin color="#15803d" size={20} />
          <Text className="text-green-800 font-semibold text-sm flex-1" numberOfLines={3}>
            {address || 'Location saved'}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity 
        className="flex-row items-center justify-center p-3 rounded-lg bg-green-50 border border-primary gap-2"
        onPress={fetchLocation} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#15803d" />
        ) : (
          <>
            <MapPin color="#15803d" size={20} />
            <Text className="text-primary font-bold text-[15px]">
              {lat && lng ? "Update Current Location" : "Fetch Current Location"}
            </Text>
          </>
        )}
      </TouchableOpacity>
      <Text className="text-xs text-gray-500 mt-2 leading-4">
        Location is strictly enforced. You must fetch your coordinates to participate in the marketplace.
      </Text>
    </View>
  );
}

