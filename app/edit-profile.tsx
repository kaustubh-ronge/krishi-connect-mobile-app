
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useApiClient } from '@/services/api';
import { useUserStore } from '@/store/userStore';
import { useCartStore } from '@/store/cartStore';
import { useAuth } from '@clerk/clerk-expo';
import { ArrowLeft, Save, User, Phone, MapPin, CreditCard, Tractor, Building2, Truck, ChevronRight, CheckCircle2, AlertCircle, Shield, Wallet, LogOut } from 'lucide-react-native';
import LocationPicker from '@/components/LocationPicker';
import { formatLocation } from '@/lib/apiHelpers';
import ImagePicker from '@/components/ImagePicker';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

// ─── Field configs (original, untouched) ──────────────────────────────────────
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
  { key: 'bankName', label: 'Bank Name', placeholder: 'e.g. State Bank of India' },
  { key: 'ifscCode', label: 'IFSC Code', placeholder: 'e.g. SBIN0001234' },
  { key: 'accountNumber', label: 'Account Number', placeholder: 'Enter Account Number', keyboardType: 'numeric' },
];

const ROLE_FIELDS: Record<string, FieldConfig[]> = {
  farmer: FARMER_FIELDS,
  agent: AGENT_FIELDS,
  delivery: DELIVERY_FIELDS,
};

// ─── Role meta for UI decoration ─────────────────────────────────────────────
const ROLE_META: Record<string, { label: string; gradient: readonly [string, string, ...string[]]; icon: any; accent: string; lightBg: string }> = {
  farmer: { label: 'Farmer', gradient: ['#0e5c2d', '#15803d', '#16a34a'], icon: Tractor, accent: '#16a34a', lightBg: '#f0fdf4' },
  agent: { label: 'Agent', gradient: ['#1e3a5f', '#1d4ed8', '#2563eb'], icon: Building2, accent: '#2563eb', lightBg: '#eff6ff' },
  delivery: { label: 'Delivery Partner', gradient: ['#7c2d12', '#c2410c', '#ea580c'], icon: Truck, accent: '#ea580c', lightBg: '#fff7ed' },
};

// ─── Section groupings for the fields ────────────────────────────────────────
const SECTION_KEYS: Record<string, { title: string; icon: any; keys: string[] }[]> = {
  farmer: [
    { title: 'Personal Info', icon: User, keys: ['name', 'phone', 'aadharNumber'] },
    { title: 'Farm Details', icon: Tractor, keys: ['farmName', 'farmSize', 'farmingExperience', 'primaryProduce'] },
    { title: 'Bank & Payment', icon: Wallet, keys: ['upiId', 'bankName', 'ifscCode', 'accountNumber'] },
  ],
  agent: [
    { title: 'Personal Info', icon: User, keys: ['name', 'phone', 'aadharNumber'] },
    { title: 'Business Info', icon: Building2, keys: ['companyName', 'agentType'] },
    { title: 'Bank & Payment', icon: Wallet, keys: ['upiId', 'bankName', 'ifscCode', 'accountNumber'] },
  ],
  delivery: [
    { title: 'Personal Info', icon: User, keys: ['name', 'phone', 'aadharNumber'] },
    { title: 'Vehicle Info', icon: Truck, keys: ['vehicleType', 'vehicleNumber', 'licenseNumber', 'radius', 'pricePerKm'] },
    { title: 'Bank Details', icon: Wallet, keys: ['bankName', 'ifscCode', 'accountNumber'] },
  ],
};

const getDynamicFields = (role: string, usagePurpose: string) => {
  const rawFields = ROLE_FIELDS[role] || [];
  return rawFields.map(f => {
    if (['bankName', 'ifscCode', 'accountNumber'].includes(f.key)) {
      if (role === 'delivery' || usagePurpose === 'buy_and_sell') {
        if (!f.label.includes('*')) {
          return { ...f, label: f.label + ' *' };
        }
      } else {
        if (f.label.includes('*')) {
          return { ...f, label: f.label.replace(' *', '') };
        }
      }
    }
    return f;
  });
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function EditProfileScreen() {
  const router = useRouter();
  const { onboarding } = useLocalSearchParams();
  const api = useApiClient();
  const { profile, role, fetchProfile, clearProfile, loading } = useUserStore();
  const { clearLocalCart } = useCartStore();
  const { signOut } = useAuth();

  // ── Original state — untouched ────────────────────────────────────────────
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [usagePurpose, setUsagePurpose] = useState<'buy' | 'buy_and_sell'>('buy');
  const [aadharFront, setAadharFront] = useState<string[]>([]);
  const [aadharBack, setAadharBack] = useState<string[]>([]);
  const [licenseImage, setLicenseImage] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          clearLocalCart();
          clearProfile();
          try { await signOut(); } catch (e) {}
        }
      },
    ]);
  };

  // ── Original useEffects — verbatim ───────────────────────────────────────
  React.useEffect(() => {
    const load = async () => {
      setInitialLoad(true);
      if (!profile && !role) { await fetchProfile(api); }
      setInitialLoad(false);
    };
    load();
  }, []);

  React.useEffect(() => {
    if (!initialLoad && !loading && !role) { router.replace('/onboarding'); }
  }, [initialLoad, loading, role]);

  useEffect(() => {
    if (profile) {
      const initial: Record<string, string> = {};
      const fields = ROLE_FIELDS[role] || [];
      fields.forEach((f) => { initial[f.key] = (profile as any)[f.key]?.toString() || ''; });
      setFormData(initial);
      if ((profile as any).usagePurpose) setUsagePurpose((profile as any).usagePurpose);
      if ((profile as any).aadharFront) setAadharFront([(profile as any).aadharFront]);
      if ((profile as any).aadharBack) setAadharBack([(profile as any).aadharBack]);
      if ((profile as any).licenseImage) setLicenseImage([(profile as any).licenseImage]);
    }
  }, [profile, role]);

  // ── Original handleSave — verbatim ───────────────────────────────────────
  const handleSave = async () => {
    const fields = getDynamicFields(role, usagePurpose);
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

    const processedData: any = { ...formData, usagePurpose };
    if (processedData.primaryProduce && typeof processedData.primaryProduce === 'string') {
      processedData.primaryProduce = processedData.primaryProduce.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (processedData.agentType && typeof processedData.agentType === 'string') {
      processedData.agentType = processedData.agentType.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    processedData.aadharFront = aadharFront[0];
    processedData.aadharBack = aadharBack[0];
    if (role === 'delivery') processedData.licenseImage = licenseImage[0];

    setSaving(true);
    try {
      const endpoint = `mobile/v1/profiles/${role}`;
      if (isCreating) { await api.post(endpoint, processedData); }
      else { await api.put(endpoint, processedData); }
      await fetchProfile(api);
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

  const fields = getDynamicFields(role, usagePurpose);
  const isCreating = onboarding || !profile;
  const meta = ROLE_META[role] || ROLE_META['farmer'];
  const RoleIcon = meta.icon;
  const sections = SECTION_KEYS[role] || [];

  // ── Loading state ────────────────────────────────────────────────────────
  if (loading || initialLoad || (!profile && !role)) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 18 }}
          style={styles.loadingCard}
        >
          <LinearGradient colors={meta.gradient} style={styles.loadingIconWrap}>
            <RoleIcon color="#fff" size={28} />
          </LinearGradient>
          <ActivityIndicator size="large" color={meta.accent} style={{ marginTop: 16 }} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </MotiView>
      </SafeAreaView>
    );
  }

  // ── Helper: render a single field ────────────────────────────────────────
  const renderField = (field: FieldConfig, idx: number) => (
    <MotiView
      key={field.key}
      from={{ opacity: 0, translateX: -8 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 280, delay: idx * 35 }}
      style={styles.fieldWrap}
    >
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{field.label.replace(' *', '')}</Text>
        {field.label.includes('*') && !field.readOnly && (
          <View style={[styles.requiredDot, { backgroundColor: meta.accent }]} />
        )}
        {field.readOnly && (
          <View style={styles.autoBadge}>
            <Text style={styles.autoBadgeTxt}>Auto</Text>
          </View>
        )}
      </View>
      <TextInput
        style={[
          styles.input,
          field.multiline && styles.inputMultiline,
          field.readOnly && styles.inputReadOnly,
          !field.readOnly && styles.inputEditable,
        ]}
        value={formData[field.key] || ''}
        onChangeText={(v) => setFormData((prev) => ({ ...prev, [field.key]: v }))}
        placeholder={field.placeholder}
        placeholderTextColor="#b0bec5"
        keyboardType={field.keyboardType || 'default'}
        multiline={field.multiline}
        numberOfLines={field.multiline ? 3 : 1}
        editable={!field.readOnly}
        textAlignVertical={field.multiline ? 'top' : 'center'}
      />
    </MotiView>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* ── Header ── */}
        <LinearGradient colors={meta.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
          <View style={styles.hDecor1} />
          <View style={styles.hDecor2} />

          <View style={styles.hRow}>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.hBackBtn} activeOpacity={0.7}>
              <ArrowLeft color="#fff" size={20} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.hSuperTitle}>
                {isCreating ? 'Welcome to KrishiConnect' : 'Edit Your Profile'}
              </Text>
              <Text style={styles.hTitle}>
                {isCreating ? 'Create Profile' : 'Edit Profile'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {isCreating && (
                <TouchableOpacity onPress={handleSignOut} style={[styles.hSaveBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]} activeOpacity={0.7}>
                  <LogOut color="#fff" size={18} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSave}
                disabled={saving}
                style={styles.hSaveBtn}
              >
                {saving
                  ? <ActivityIndicator size="small" color={meta.accent} />
                  : <Save color={meta.accent} size={18} />
                }
              </TouchableOpacity>
            </View>
          </View>

          {/* Role pill */}
          <View style={styles.rolePill}>
            <RoleIcon color={meta.accent} size={13} />
            <Text style={[styles.rolePillTxt, { color: meta.accent }]}>{meta.label}</Text>
          </View>
        </LinearGradient>

        {/* ── Step progress strip ── */}
        {isCreating && (
          <View style={styles.progressStrip}>
            {['Profile Info', 'Documents', 'Location', 'Done'].map((step, i) => (
              <View key={step} style={styles.progressStep}>
                <View style={[styles.progressDot, i === 0 && { backgroundColor: meta.accent }]}>
                  <Text style={[styles.progressDotTxt, i === 0 && { color: '#fff' }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.progressStepTxt, i === 0 && { color: meta.accent, fontWeight: '700' }]}>
                  {step}
                </Text>
                {i < 3 && <View style={styles.progressLine} />}
              </View>
            ))}
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {fields.length === 0 ? (
            <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={styles.emptyState}>
              <AlertCircle color="#94a3b8" size={40} />
              <Text style={styles.emptyStateTxt}>Profile editing is not available for your role.</Text>
            </MotiView>
          ) : (
            <>
              {/* ── Usage Purpose (not for delivery) ── */}
              {role !== 'delivery' && (
                <MotiView
                  from={{ opacity: 0, translateY: 12 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'spring', damping: 18, delay: 50 }}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.cardIconWrap, { backgroundColor: meta.lightBg }]}>
                      <CheckCircle2 color={meta.accent} size={16} />
                    </View>
                    <Text style={styles.cardTitle}>How will you use KrishiConnect?</Text>
                  </View>
                  <Text style={styles.cardSubtitle}>Select your primary usage intent *</Text>

                  <View style={{ gap: 10 }}>
                    {[
                      { key: 'buy', label: 'Buy Only', desc: 'I only want to purchase products' },
                      { key: 'buy_and_sell', label: 'Buy & Sell', desc: 'I want to buy AND list products for sale' },
                    ].map((opt) => {
                      const on = usagePurpose === opt.key;
                      return (
                        <TouchableOpacity
                          key={opt.key}
                          onPress={() => setUsagePurpose(opt.key as any)}
                          style={[styles.intentOption, on && { borderColor: meta.accent, backgroundColor: meta.lightBg }]}
                          activeOpacity={0.8}
                        >
                          <View style={[styles.radio, on && { borderColor: meta.accent }]}>
                            {on && <View style={[styles.radioDot, { backgroundColor: meta.accent }]} />}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.intentLabel, on && { color: meta.accent }]}>{opt.label}</Text>
                            <Text style={styles.intentDesc}>{opt.desc}</Text>
                          </View>
                          {on && <CheckCircle2 color={meta.accent} size={16} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {usagePurpose === 'buy_and_sell' && (
                    <MotiView
                      from={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ type: 'timing', duration: 250 }}
                      style={styles.approvalNote}
                    >
                      <AlertCircle color="#d97706" size={13} />
                      <Text style={styles.approvalNoteTxt}>
                        Seller capabilities require admin approval after profile creation.
                      </Text>
                    </MotiView>
                  )}
                </MotiView>
              )}

              {/* ── Dynamic field sections ── */}
              {sections.map((section, si) => {
                const SectionIcon = section.icon;
                const sectionFields = fields.filter(f => section.keys.includes(f.key));
                if (sectionFields.length === 0) return null;
                return (
                  <MotiView
                    key={section.title}
                    from={{ opacity: 0, translateY: 14 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', damping: 18, delay: 80 + si * 60 }}
                    style={styles.card}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.cardIconWrap, { backgroundColor: meta.lightBg }]}>
                        <SectionIcon color={meta.accent} size={16} />
                      </View>
                      <Text style={styles.cardTitle}>{section.title}</Text>
                    </View>
                    <View style={styles.divider} />
                    {sectionFields.map((field, fi) => renderField(field, fi))}
                  </MotiView>
                );
              })}

              {/* Fallback: fields not covered by sections */}
              {(() => {
                const coveredKeys = sections.flatMap(s => s.keys);
                const extra = fields.filter(f => !coveredKeys.includes(f.key));
                if (extra.length === 0) return null;
                return (
                  <MotiView
                    from={{ opacity: 0, translateY: 14 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', damping: 18, delay: 200 }}
                    style={styles.card}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.cardIconWrap, { backgroundColor: meta.lightBg }]}>
                        <User color={meta.accent} size={16} />
                      </View>
                      <Text style={styles.cardTitle}>Other Details</Text>
                    </View>
                    <View style={styles.divider} />
                    {extra.map((field, fi) => renderField(field, fi))}
                  </MotiView>
                );
              })()}

              {/* ── Identity Verification ── */}
              <MotiView
                from={{ opacity: 0, translateY: 14 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, delay: 260 }}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIconWrap, { backgroundColor: meta.lightBg }]}>
                    <Shield color={meta.accent} size={16} />
                  </View>
                  <Text style={styles.cardTitle}>Identity Verification</Text>
                </View>
                <Text style={styles.cardSubtitle}>Upload clear photos of your documents</Text>
                <View style={styles.divider} />

                {/* Aadhaar Front */}
                <View style={styles.docUploadRow}>
                  <View style={styles.docLabelRow}>
                    <CreditCard color={meta.accent} size={14} />
                    <Text style={styles.docLabel}>Aadhaar Card — Front</Text>
                    <View style={[styles.requiredDot, { backgroundColor: meta.accent }]} />
                  </View>
                  <ImagePicker
                    value={aadharFront}
                    onChange={setAadharFront}
                    onRemove={() => setAadharFront([])}
                    maxImages={1}
                  />
                </View>

                {/* Aadhaar Back */}
                <View style={[styles.docUploadRow, { marginTop: 16 }]}>
                  <View style={styles.docLabelRow}>
                    <CreditCard color={meta.accent} size={14} />
                    <Text style={styles.docLabel}>Aadhaar Card — Back</Text>
                    <View style={[styles.requiredDot, { backgroundColor: meta.accent }]} />
                  </View>
                  <ImagePicker
                    value={aadharBack}
                    onChange={setAadharBack}
                    onRemove={() => setAadharBack([])}
                    maxImages={1}
                  />
                </View>

                {/* Driving License (delivery only) */}
                {role === 'delivery' && (
                  <View style={[styles.docUploadRow, { marginTop: 16 }]}>
                    <View style={styles.docLabelRow}>
                      <Truck color={meta.accent} size={14} />
                      <Text style={styles.docLabel}>Driving License</Text>
                      <View style={[styles.requiredDot, { backgroundColor: meta.accent }]} />
                    </View>
                    <ImagePicker
                      value={licenseImage}
                      onChange={setLicenseImage}
                      onRemove={() => setLicenseImage([])}
                      maxImages={1}
                    />
                  </View>
                )}
              </MotiView>

              {/* ── Location Picker ── */}
              <MotiView
                from={{ opacity: 0, translateY: 14 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, delay: 310 }}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.cardIconWrap, { backgroundColor: meta.lightBg }]}>
                    <MapPin color={meta.accent} size={16} />
                  </View>
                  <Text style={styles.cardTitle}>Location</Text>
                </View>
                <Text style={styles.cardSubtitle}>Your location is required to show you nearby products</Text>
                <View style={styles.divider} />
                <LocationPicker
                  initialData={{
                    lat: profile ? Number((profile as any).lat) : undefined,
                    lng: profile ? Number((profile as any).lng) : undefined,
                    address: profile ? (profile as any).address : undefined,
                    country: profile ? (profile as any).country : undefined,
                    state: profile ? (profile as any).state : undefined,
                    city: profile ? (profile as any).city : undefined,
                    pincode: profile ? (profile as any).pincode : undefined,
                  }}
                  onLocationSelect={(data) => {
                    setFormData((prev) => {
                      const updates: any = { ...prev };
                      if (data.lat !== undefined) updates.lat = data.lat.toString();
                      if (data.lng !== undefined) updates.lng = data.lng.toString();
                      if (data.address) updates.address = data.address;
                      if (data.country) updates.country = data.country;
                      if (data.state) updates.state = data.state;
                      if (data.city) updates.city = data.city;
                      if (data.pincode) updates.pincode = data.pincode;
                      return updates;
                    });
                  }}
                />
              </MotiView>

              {/* ── Save Button ── */}
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, delay: 360 }}
                style={{ marginBottom: 8 }}
              >
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={saving}
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={saving ? ['#94a3b8', '#94a3b8'] : meta.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveBtnGrad}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Save color="#fff" size={18} />
                        <Text style={styles.saveBtnTxt}>
                          {onboarding ? 'Complete Setup' : 'Save Profile'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {onboarding && (
                  <Text style={styles.onboardingNote}>
                    By completing setup, you agree to our Terms of Service and Privacy Policy.
                  </Text>
                )}
              </MotiView>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },

  // Loading
  loadingContainer: { flex: 1, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  loadingCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 32, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 6 },
  loadingIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, fontWeight: '600', color: '#64748b', marginTop: 10 },

  // Header
  header: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 20, overflow: 'hidden' },
  hDecor1: { position: 'absolute', top: -32, right: -32, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.07)' },
  hDecor2: { position: 'absolute', top: 24, right: 58, width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.04)' },
  hRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  hBackBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  hSuperTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 0.8, marginBottom: 2 },
  hTitle: { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.6 },
  hSaveBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6, elevation: 3 },
  rolePill: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rolePillTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },

  // Progress strip
  progressStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 0 },
  progressStep: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  progressDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  progressDotTxt: { fontSize: 10, fontWeight: '800', color: '#94a3b8' },
  progressStepTxt: { fontSize: 10, fontWeight: '600', color: '#94a3b8' },
  progressLine: { width: 16, height: 2, backgroundColor: '#e2e8f0', marginHorizontal: 2 },

  // Scroll
  scrollContent: { padding: 14, paddingBottom: 40 },

  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  cardIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 },
  cardSubtitle: { fontSize: 12, color: '#94a3b8', fontWeight: '500', marginBottom: 8, marginLeft: 42 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 14 },

  // Fields
  fieldWrap: { marginBottom: 14 },
  fieldLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  fieldLabel: { fontSize: 12.5, fontWeight: '700', color: '#374151', flex: 1 },
  requiredDot: { width: 6, height: 6, borderRadius: 3 },
  autoBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  autoBadgeTxt: { fontSize: 9, fontWeight: '800', color: '#94a3b8', letterSpacing: 0.5 },

  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
  },
  inputEditable: { backgroundColor: '#fafafa' },
  inputReadOnly: { backgroundColor: '#f8fafc', color: '#94a3b8' },
  inputMultiline: { height: 88, textAlignVertical: 'top', paddingTop: 11 },

  // Intent / Usage Purpose
  intentOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 14,
    padding: 13, backgroundColor: '#fafafa',
  },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  intentLabel: { fontSize: 13.5, fontWeight: '700', color: '#374151', marginBottom: 2 },
  intentDesc: { fontSize: 11.5, color: '#94a3b8', fontWeight: '500' },
  approvalNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, backgroundColor: '#fffbeb', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#fde68a', marginTop: 10 },
  approvalNoteTxt: { fontSize: 11.5, color: '#92400e', fontWeight: '500', flex: 1, lineHeight: 17 },

  // Document upload rows
  docUploadRow: {},
  docLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  docLabel: { fontSize: 12.5, fontWeight: '700', color: '#374151', flex: 1 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyStateTxt: { fontSize: 14, color: '#94a3b8', textAlign: 'center', fontWeight: '500' },

  // Save button
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  saveBtnDisabled: { opacity: 0.65 },
  saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  saveBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  onboardingNote: { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 10, lineHeight: 16, fontWeight: '500' },
});
