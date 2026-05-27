import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, TextInput, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { MapPin, Navigation, Search } from 'lucide-react-native';
import { Country, State, City } from 'country-state-city';
import { Picker } from '@react-native-picker/picker';

interface LocationData {
  country?: string;
  state?: string;
  city?: string;
  pincode?: string;
  lat?: number;
  lng?: number;
  address?: string;
}

interface LocationPickerProps {
  onLocationSelect: (data: LocationData) => void;
  initialData?: LocationData;
}

export default function LocationPicker({ onLocationSelect, initialData = {} }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

  const [country, setCountry] = useState(initialData.country || 'IN');
  const [stateCode, setStateCode] = useState(initialData.state || '');
  const [city, setCity] = useState(initialData.city || '');
  const [pincode, setPincode] = useState(initialData.pincode || '');
  const [lat, setLat] = useState<number | undefined>(initialData.lat);
  const [lng, setLng] = useState<number | undefined>(initialData.lng);
  const [address, setAddress] = useState(initialData.address || '');

  const countries = Country.getAllCountries();
  const states = State.getStatesOfCountry(country);
  const cities = City.getCitiesOfState(country, stateCode);

  useEffect(() => {
    if (initialData.lat && initialData.lng) {
      setLat(initialData.lat);
      setLng(initialData.lng);
    }
    if (initialData.address) setAddress(initialData.address);
    if (initialData.country) setCountry(initialData.country);
    if (initialData.state) setStateCode(initialData.state);
    if (initialData.city) setCity(initialData.city);
    if (initialData.pincode) setPincode(initialData.pincode);
  }, [initialData]);

  const notify = useCallback((overrides: Partial<LocationData> = {}) => {
    onLocationSelect({
      country,
      state: stateCode,
      city,
      pincode,
      lat,
      lng,
      address,
      ...overrides,
    });
  }, [country, stateCode, city, pincode, lat, lng, address, onLocationSelect]);

  const reverseGeocode = async (lati: number, longi: number) => {
    setIsGeocoding(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lati}&lon=${longi}&zoom=18&addressdetails=1`, {
        headers: { 'User-Agent': 'KrishiConnect Mobile App' }
      });
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const newCity = addr.city || addr.town || addr.village || addr.suburb || '';
        const newStateName = addr.state || '';
        const newPincode = addr.postcode || '';
        const fullAddr = data.display_name || '';

        let finalAddr = fullAddr;
        if (newPincode && finalAddr.includes(newPincode)) {
          finalAddr = finalAddr.replace(new RegExp(`,?\\s*\\b${newPincode}\\b`), "");
        }

        setCity(newCity);
        setAddress(finalAddr);

        const allStates = State.getStatesOfCountry(country);
        const matchedState = allStates.find(s =>
          s.name.toLowerCase() === newStateName.toLowerCase() ||
          newStateName.toLowerCase().includes(s.name.toLowerCase())
        );

        let finalStateCode = stateCode;
        if (matchedState) {
          setStateCode(matchedState.isoCode);
          finalStateCode = matchedState.isoCode;
        }

        notify({
          city: newCity,
          state: finalStateCode,
          pincode, 
          address: finalAddr,
          lat: lati,
          lng: longi
        });
      }
    } catch (err) {
      console.error("[Reverse Geocoding] Failed:", err);
    } finally {
      setIsGeocoding(false);
    }
  };

  const fetchLocation = async () => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access location was denied.');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const currentLat = location.coords.latitude;
      const currentLng = location.coords.longitude;
      
      setLat(currentLat);
      setLng(currentLng);
      await reverseGeocode(currentLat, currentLng);
      Alert.alert('Location Fetched', 'Your coordinates have been pinned and fields updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to fetch location.');
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (c: string) => {
    setCountry(c);
    setStateCode('');
    setCity('');
    notify({ country: c, state: '', city: '' });
  };

  const handleStateChange = (s: string) => {
    setStateCode(s);
    setCity('');
    notify({ state: s, city: '' });
  };

  const handleCityChange = async (c: string) => {
    setCity(c);
    
    if (c) {
      setIsGeocoding(true);
      const query = `${c}, ${stateCode}, ${country}`;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
          headers: { 'User-Agent': 'KrishiConnect Mobile App' }
        });
        const data = await response.json();
        
        if (data && data.length > 0) {
          const newLat = parseFloat(data[0].lat);
          const newLng = parseFloat(data[0].lon);
          setLat(newLat);
          setLng(newLng);
          notify({ city: c, lat: newLat, lng: newLng });
        } else {
          notify({ city: c });
        }
      } catch (err) {
        console.error("[City Geocoding] Failed:", err);
        notify({ city: c });
      } finally {
        setIsGeocoding(false);
      }
    } else {
      notify({ city: c });
    }
  };

  const handlePincodeChange = (text: string) => {
    const p = text.replace(/\D/g, "").slice(0, 6);
    setPincode(p);
    notify({ pincode: p });
  };

  const handleAddressChange = (text: string) => {
    setAddress(text);
    notify({ address: text });
  };

  const handleFindAddress = async () => {
    if (!address && !city) return;
    
    setIsGeocoding(true);
    const query = `${address}, ${city}, ${stateCode}, ${country}`;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
        headers: { 'User-Agent': 'KrishiConnect Mobile App' }
      });
      const data = await response.json();
      
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setLat(newLat);
        setLng(newLng);
        notify({ lat: newLat, lng: newLng });
        Alert.alert('Coordinates Found', 'Successfully pinned coordinates from address.');
      } else {
        Alert.alert('Not Found', 'Could not pinpoint coordinates for this address.');
      }
    } catch (err) {
      console.error("[Geocoding] Failed:", err);
      Alert.alert('Error', 'Geocoding request failed.');
    } finally {
      setIsGeocoding(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Farm / Business Location *</Text>
        <TouchableOpacity 
          style={styles.autoSetBtn}
          onPress={fetchLocation} 
          disabled={loading || isGeocoding}
        >
          {loading ? (
            <ActivityIndicator color="#15803d" size="small" />
          ) : (
            <>
              <Navigation color="#15803d" size={14} />
              <Text style={styles.autoSetText}>Auto Set</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Country</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={country}
          onValueChange={handleCountryChange}
          style={styles.picker}
        >
          {countries.map((c) => (
            <Picker.Item key={c.isoCode} label={`${c.flag} ${c.name}`} value={c.isoCode} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>State / Province *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={stateCode}
          onValueChange={handleStateChange}
          style={styles.picker}
        >
          <Picker.Item label="Select State" value="" color="#94a3b8" />
          {states.map((s) => (
            <Picker.Item key={s.isoCode} label={s.name} value={s.isoCode} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>City / Village *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={city}
          onValueChange={handleCityChange}
          style={styles.picker}
        >
          <Picker.Item label="Select City" value="" color="#94a3b8" />
          {cities.map((c) => (
            <Picker.Item key={c.name} label={c.name} value={c.name} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Pincode *</Text>
      <TextInput
        value={pincode}
        onChangeText={handlePincodeChange}
        placeholder="e.g. 411001"
        keyboardType="number-pad"
        maxLength={6}
        style={styles.input}
        placeholderTextColor="#94a3b8"
      />

      <Text style={styles.label}>Full Address *</Text>
      <View style={styles.addressRow}>
        <TextInput
          value={address}
          onChangeText={handleAddressChange}
          placeholder="House/Plot, Street, Village, Taluka..."
          multiline
          style={[styles.input, styles.addressInput]}
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity
          style={styles.findBtn}
          onPress={handleFindAddress}
          disabled={isGeocoding}
        >
          {isGeocoding ? (
            <ActivityIndicator color="#15803d" size="small" />
          ) : (
            <>
              <Search color="#15803d" size={16} />
              <Text style={styles.findBtnText}>Find</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <MapPin color={lat && lng ? "#15803d" : "#94a3b8"} size={14} />
        <Text style={styles.footerText}>
          {lat && lng ? `Coordinates: ${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Coordinates not set'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  autoSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  autoSetText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 12,
    marginBottom: 6,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#1e293b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  addressRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addressInput: {
    flex: 1,
    minHeight: 50,
    textAlignVertical: 'top',
  },
  findBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  findBtnText: {
    color: '#15803d',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  }
});
