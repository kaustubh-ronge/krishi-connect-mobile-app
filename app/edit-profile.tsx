import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useApiClient } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { ArrowLeft, Save } from 'lucide-react-native';

interface FieldConfig {
  key: string;
  label: string;
  placeholder: string;
  keyboardType?: any;
  multiline?: boolean;
  readOnly?: boolean;
}

const FARMER_FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Full Name', placeholder: 'Your full name' },
  { key: 'phone', label: 'Phone Number', placeholder: '10-digit phone number', keyboardType: 'phone-pad' },
  { key: 'aadharNumber', label: 'Aadhar Number', placeholder: 'XXXX XXXX XXXX', keyboardType: 'numeric' },
  { key: 'farmName', label: 'Farm Name', placeholder: 'Name of your farm' },
  { key: 'farmSize', label: 'Farm Size (Acres)', placeholder: 'e.g. 5.5', keyboardType: 'numeric' },
  { key: 'farmingExperience', label: 'Farming Exp (Years)', placeholder: 'e.g. 10', keyboardType: 'numeric' },
  { key: 'address', label: 'Address', placeholder: 'Your full address', multiline: true },
  { key: 'city', label: 'City', placeholder: 'e.g. Pune' },
  { key: 'pincode', label: 'Pincode', placeholder: 'e.g. 400001', keyboardType: 'numeric' },
  { key: 'district', label: 'District', placeholder: 'e.g. Nashik', readOnly: true },
  { key: 'state', label: 'State', placeholder: 'e.g. Maharashtra', readOnly: true },
  { key: 'upiId', label: 'UPI ID', placeholder: 'yourname@upi', keyboardType: 'email-address' },
];

const AGENT_FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Full Name', placeholder: 'Your full name' },
  { key: 'phone', label: 'Phone Number', placeholder: '10-digit phone number', keyboardType: 'phone-pad' },
  { key: 'aadharNumber', label: 'Aadhar Number', placeholder: 'XXXX XXXX XXXX', keyboardType: 'numeric' },
  { key: 'companyName', label: 'Company Name', placeholder: 'Your company or business name' },
  { key: 'address', label: 'Address', placeholder: 'Your full address', multiline: true },
  { key: 'city', label: 'City', placeholder: 'e.g. Pune' },
  { key: 'pincode', label: 'Pincode', placeholder: 'e.g. 400001', keyboardType: 'numeric' },
  { key: 'district', label: 'District', placeholder: 'e.g. Nashik', readOnly: true },
  { key: 'state', label: 'State', placeholder: 'e.g. Maharashtra', readOnly: true },
  { key: 'upiId', label: 'UPI ID', placeholder: 'yourname@upi', keyboardType: 'email-address' },
];

const DELIVERY_FIELDS: FieldConfig[] = [
  { key: 'name', label: 'Full Name', placeholder: 'Your full name' },
  { key: 'phone', label: 'Phone Number', placeholder: '10-digit phone number', keyboardType: 'phone-pad' },
  { key: 'aadharNumber', label: 'Aadhar Number', placeholder: 'XXXX XXXX XXXX', keyboardType: 'numeric' },
  { key: 'vehicleType', label: 'Vehicle Type', placeholder: 'e.g. Bike, Car, Auto' },
  { key: 'vehicleNumber', label: 'Vehicle Number', placeholder: 'e.g. MH12AB1234' },
  { key: 'address', label: 'Address', placeholder: 'Your full address', multiline: true },
  { key: 'city', label: 'City', placeholder: 'e.g. Pune' },
  { key: 'pincode', label: 'Pincode', placeholder: 'e.g. 400001', keyboardType: 'numeric' },
];

const ROLE_FIELDS: Record<string, FieldConfig[]> = {
  farmer: FARMER_FIELDS,
  agent: AGENT_FIELDS,
  delivery: DELIVERY_FIELDS,
};

export default function EditProfileScreen() {
  const router = useRouter();
  const api = useApiClient();
  const { profile, role, fetchProfile } = useUserStore();

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      const initial: Record<string, string> = {};
      const fields = ROLE_FIELDS[role] || [];
      fields.forEach((f) => {
        initial[f.key] = (profile as any)[f.key]?.toString() || '';
      });
      setFormData(initial);
    }
  }, [profile, role]);

  const handleSave = async () => {
    const fields = ROLE_FIELDS[role] || [];
    // Validate required fields
    const required = fields.filter((f) => !f.readOnly);
    const missing = required.filter((f) => !formData[f.key]?.trim());
    if (missing.length > 0) {
      Alert.alert('Missing Fields', `Please fill in: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }

    setSaving(true);
    try {
      const endpoint = `mobile/v1/profiles/${role}`;
      await api.put(endpoint, formData);
      await fetchProfile(api); // Refresh global store
      Alert.alert('Success ✓', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const fields = ROLE_FIELDS[role] || [];

  if (!profile && !role) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.light.text} size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <Save color={Colors.light.primary} size={22} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {fields.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.noProfileText}>Profile editing is not available for your role.</Text>
            </View>
          ) : (
            <>
              {fields.map((field) => (
                <View key={field.key} style={styles.fieldGroup}>
                  <Text style={styles.label}>{field.label}</Text>
                  <TextInput
                    style={[
                      styles.input,
                      field.multiline && styles.textArea,
                      field.readOnly && styles.readOnlyInput,
                    ]}
                    value={formData[field.key] || ''}
                    onChangeText={(v) => setFormData((prev) => ({ ...prev, [field.key]: v }))}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.light.icon}
                    keyboardType={field.keyboardType || 'default'}
                    multiline={field.multiline}
                    numberOfLines={field.multiline ? 3 : 1}
                    editable={!field.readOnly}
                  />
                  {field.readOnly && (
                    <Text style={styles.readOnlyNote}>
                      Location can only be updated from the web app.
                    </Text>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: Colors.light.text },
  saveBtn: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.light.text, marginBottom: 6 },
  input: {
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.text,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  readOnlyInput: { backgroundColor: '#f9fafb', color: Colors.light.icon },
  readOnlyNote: { fontSize: 11, color: Colors.light.icon, marginTop: 4 },
  saveButton: {
    backgroundColor: Colors.light.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  noProfileText: { color: Colors.light.icon, fontSize: 15, textAlign: 'center' },
});
