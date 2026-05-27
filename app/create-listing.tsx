


import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, ScrollView,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, CheckCircle2, ChevronRight, Package,
  Image as ImageIcon, Tag, Truck, DollarSign, FileText, Layers,
} from 'lucide-react-native';
import { useApiClient } from '@/services/api';
import { createListingSchema } from '@/lib/zodSchema';
import { z } from 'zod';
import ImagePicker from '@/components/ImagePicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Constants (unchanged) ─────────────────────────────────────────────────────
const PRODUCE_CATEGORIES = [
  'Tomatoes', 'Onions', 'Potatoes', 'Grapes', 'Pomegranate',
  'Sugarcane', 'Wheat', 'Rice', 'Soybean', 'Cotton',
  'Ginger', 'Turmeric', 'Green Chilli', 'Lemon', 'Other',
];
const UNIT_OPTIONS = ['kg', 'ton', 'quintal', 'crate', 'box', 'Other'];
const GRADE_OPTIONS = [
  'Export Quality', 'Grade A (Premium)', 'Grade B (Standard)',
  'Grade C (Mixed)', 'Organic Certified',
];

// ── Step metadata ─────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Details', icon: Tag, color: '#15803d' },
  { label: 'Pricing', icon: DollarSign, color: '#d97706' },
  { label: 'Media', icon: ImageIcon, color: '#7c3aed' },
  { label: 'Delivery', icon: Truck, color: '#0369a1' },
];

// ── Reusable sub-components ───────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <Text style={styles.fieldLabel}>
      {children}
      {required && <Text style={styles.requiredAsterisk}> *</Text>}
    </Text>
  );
}

function StyledInput({
  value, onChangeText, placeholder, keyboardType, multiline,
  numberOfLines, style,
}: any) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#a0b8ab"
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : 'center'}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[
        styles.input,
        focused && styles.inputFocused,
        multiline && styles.inputMultiline,
        style,
      ]}
    />
  );
}

function ChipGroup({
  options, selected, onSelect,
}: { options: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingRight: 8 }}
      style={{ marginTop: 4 }}
    >
      {options.map((o) => (
        <TouchableOpacity
          key={o}
          onPress={() => onSelect(o)}
          activeOpacity={0.75}
          style={[styles.chip, selected === o && styles.chipActive]}
        >
          <Text style={[styles.chipText, selected === o && styles.chipTextActive]}>{o}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function SectionCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.sectionCard, style]}>{children}</View>;
}

function RowGroup({ children }: { children: React.ReactNode }) {
  return <View style={styles.rowGroup}>{children}</View>;
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function CreateListingScreen() {
  const router = useRouter();
  const api = useApiClient();
  const insets = useSafeAreaInsets();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // ── All original form state (unchanged) ──────────────────────────
  const [productName, setProductName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tomatoes');
  const [customCategory, setCustomCategory] = useState('');
  const [qualityGrade, setQualityGrade] = useState('Grade A (Premium)');
  const [tags, setTags] = useState('');
  const [shelfLife, setShelfLife] = useState('');
  const [shelfLifeStartDate, setShelfLifeStartDate] = useState('');

  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('kg');
  const [customUnit, setCustomUnit] = useState('');
  const [price, setPrice] = useState('');
  const [minOrderQuantity, setMinOrderQuantity] = useState('');
  const [harvestDate, setHarvestDate] = useState('');

  const [images, setImages] = useState<string[]>([]);

  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [description, setDescription] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('0');
  const [deliveryChargeType, setDeliveryChargeType] = useState('per_unit');
  const [maxDeliveryRange, setMaxDeliveryRange] = useState('');

  // ── Step transition animation (Animated API only, no MotiView) ───
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateStepChange = (cb: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -20, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      cb();
      slideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
      ]).start();
    });
  };

  // ── All original handlers (unchanged) ────────────────────────────
  const handleNext = () => {
    if (currentStep < 4) animateStepChange(() => setCurrentStep(currentStep + 1));
  };

  const handlePrev = () => {
    if (currentStep > 1) animateStepChange(() => setCurrentStep(currentStep - 1));
  };

  const handleSubmit = async () => {
    const category = selectedCategory === 'Other' ? customCategory.trim() : selectedCategory;
    const unitToSubmit = unit === 'Other' ? customUnit.trim() : unit;

    const validationData = {
      productName, category, variety: tags, description,
      availableStock: stock, pricePerUnit: price, minOrderQuantity,
      unit: unitToSubmit, deliveryCharge, deliveryChargeType,
      qualityGrade, shelfLife, whatsappNumber, harvestDate,
      shelfLifeStartDate, maxDeliveryRange, images,
    };

    try {
      createListingSchema.parse(validationData);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const message = error.issues?.[0]?.message || 'Please fix the highlighted fields';
        Alert.alert('Validation Error', message);
        return;
      }
      Alert.alert('Validation failed.', 'Please check your inputs.');
      return;
    }

    setLoading(true);
    try {
      await api.post('mobile/v1/products', validationData);
      Alert.alert('Success', 'Listing published successfully!');
      router.replace('/my-listings');
    } catch (error: any) {
      if (error.message === 'LOCATION_MISSING') {
        Alert.alert('Location Missing', 'Please set your location in your profile first.', [
          { text: 'Update Location', onPress: () => router.push('/edit-profile') },
        ]);
      } else {
        Alert.alert('Error', error.message || 'Failed to publish listing.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 1: Product Details ───────────────────────────────────────
  const renderStep1 = () => (
    <>
      <SectionCard>
        <FieldLabel required>Product Name</FieldLabel>
        <StyledInput
          value={productName}
          onChangeText={setProductName}
          placeholder="e.g. Fresh Organic Mangoes"
        />
      </SectionCard>

      <SectionCard>
        <FieldLabel required>Category</FieldLabel>
        <ChipGroup
          options={PRODUCE_CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
        {selectedCategory === 'Other' && (
          <View style={{ marginTop: 14 }}>
            <FieldLabel required>Custom Category</FieldLabel>
            <StyledInput
              value={customCategory}
              onChangeText={setCustomCategory}
              placeholder="e.g. Spices"
            />
          </View>
        )}
      </SectionCard>

      <SectionCard>
        <FieldLabel>Quality Grade</FieldLabel>
        <ChipGroup
          options={GRADE_OPTIONS}
          selected={qualityGrade}
          onSelect={setQualityGrade}
        />
      </SectionCard>

      <SectionCard>
        <FieldLabel>Variety & Tags</FieldLabel>
        <StyledInput
          value={tags}
          onChangeText={setTags}
          placeholder="e.g. Organic, Hybrid (comma separated)"
        />
      </SectionCard>

      <SectionCard>
        <RowGroup>
          <View style={{ flex: 1 }}>
            <FieldLabel>Shelf Life</FieldLabel>
            <StyledInput
              value={shelfLife}
              onChangeText={setShelfLife}
              placeholder="e.g. 10 Days"
            />
          </View>
          <View style={styles.rowSpacer} />
          <View style={{ flex: 1 }}>
            <FieldLabel>Shelf Life Start</FieldLabel>
            <StyledInput
              value={shelfLifeStartDate}
              onChangeText={setShelfLifeStartDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
        </RowGroup>
      </SectionCard>
    </>
  );

  // ── Step 2: Pricing & Inventory ──────────────────────────────────
  const renderStep2 = () => (
    <>
      <SectionCard>
        <FieldLabel required>Unit</FieldLabel>
        <ChipGroup options={UNIT_OPTIONS} selected={unit} onSelect={setUnit} />
        {unit === 'Other' && (
          <View style={{ marginTop: 14 }}>
            <FieldLabel required>Custom Unit</FieldLabel>
            <StyledInput
              value={customUnit}
              onChangeText={setCustomUnit}
              placeholder="e.g. bundle"
            />
          </View>
        )}
      </SectionCard>

      <SectionCard>
        <RowGroup>
          <View style={{ flex: 1 }}>
            <FieldLabel required>Total Stock</FieldLabel>
            <View style={styles.inputWithBadgeWrap}>
              <StyledInput
                value={stock}
                onChangeText={setStock}
                placeholder="0"
                keyboardType="numeric"
                style={{ flex: 1 }}
              />
              <View style={styles.inputBadge}>
                <Text style={styles.inputBadgeText}>{unit === 'Other' ? customUnit || 'unit' : unit}</Text>
              </View>
            </View>
          </View>
          <View style={styles.rowSpacer} />
          <View style={{ flex: 1 }}>
            <FieldLabel>Min Order Qty</FieldLabel>
            <View style={styles.inputWithBadgeWrap}>
              <StyledInput
                value={minOrderQuantity}
                onChangeText={setMinOrderQuantity}
                placeholder="0"
                keyboardType="numeric"
                style={{ flex: 1 }}
              />
              <View style={styles.inputBadge}>
                <Text style={styles.inputBadgeText}>{unit === 'Other' ? customUnit || 'unit' : unit}</Text>
              </View>
            </View>
          </View>
        </RowGroup>
      </SectionCard>

      <SectionCard>
        <FieldLabel required>Price per Unit (₹)</FieldLabel>
        <View style={styles.inputWithBadgeWrap}>
          <View style={styles.currencyBadge}>
            <Text style={styles.currencyBadgeText}>₹</Text>
          </View>
          <StyledInput
            value={price}
            onChangeText={setPrice}
            placeholder="0.00"
            keyboardType="numeric"
            style={[{ flex: 1 }, styles.inputWithLeadingBadge]}
          />
        </View>
      </SectionCard>

      <SectionCard>
        <FieldLabel>Harvest Date</FieldLabel>
        <StyledInput
          value={harvestDate}
          onChangeText={setHarvestDate}
          placeholder="YYYY-MM-DD"
        />
      </SectionCard>
    </>
  );

  // ── Step 3: Media ────────────────────────────────────────────────
  const renderStep3 = () => (
    <SectionCard>
      <View style={styles.mediaHeader}>
        <View style={styles.mediaIconWrap}>
          <ImageIcon color="#7c3aed" size={22} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.mediaTitle}>Product Photos</Text>
          <Text style={styles.mediaSub}>Upload 1–5 clear photos of your produce</Text>
        </View>
        <View style={styles.mediaCount}>
          <Text style={styles.mediaCountText}>{images.length}/5</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.mediaProgress}>
        <View style={[styles.mediaProgressFill, { width: `${(images.length / 5) * 100}%` }]} />
      </View>

      <View style={{ marginTop: 16 }}>
        <ImagePicker
          value={images}
          onChange={(newImages) => setImages([...images, ...newImages])}
          onRemove={(url) => setImages(images.filter((i) => i !== url))}
          maxImages={5}
        />
      </View>

      <View style={styles.mediaTips}>
        <Text style={styles.mediaTipsTitle}>📸 Photo tips</Text>
        <Text style={styles.mediaTipsText}>• Natural daylight photos look best</Text>
        <Text style={styles.mediaTipsText}>• Show quantity/grade clearly</Text>
        <Text style={styles.mediaTipsText}>• Include close-up & wide shots</Text>
      </View>
    </SectionCard>
  );

  // ── Step 4: Additional Details ───────────────────────────────────
  const renderStep4 = () => (
    <>
      <SectionCard>
        <FieldLabel>Description</FieldLabel>
        <StyledInput
          value={description}
          onChangeText={setDescription}
          placeholder="Write a detailed description of your product..."
          multiline
          numberOfLines={5}
        />
      </SectionCard>

      <SectionCard>
        <FieldLabel>Delivery Charge (₹)</FieldLabel>
        <RowGroup>
          <View style={styles.inputWithBadgeWrap}>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyBadgeText}>₹</Text>
            </View>
            <StyledInput
              value={deliveryCharge}
              onChangeText={setDeliveryCharge}
              placeholder="0"
              keyboardType="numeric"
              style={[{ flex: 1 }, styles.inputWithLeadingBadge]}
            />
          </View>
        </RowGroup>

        <View style={{ marginTop: 14 }}>
          <FieldLabel>Charge Type</FieldLabel>
          <ChipGroup
            options={['per_unit', 'flat']}
            selected={deliveryChargeType}
            onSelect={setDeliveryChargeType}
          />
        </View>
      </SectionCard>

      <SectionCard>
        <FieldLabel>Max Delivery Range (KM)</FieldLabel>
        <View style={styles.inputWithBadgeWrap}>
          <StyledInput
            value={maxDeliveryRange}
            onChangeText={setMaxDeliveryRange}
            placeholder="e.g. 50"
            keyboardType="numeric"
            style={{ flex: 1 }}
          />
          <View style={styles.inputBadge}>
            <Text style={styles.inputBadgeText}>km</Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard>
        <FieldLabel>WhatsApp Number</FieldLabel>
        <StyledInput
          value={whatsappNumber}
          onChangeText={setWhatsappNumber}
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
        />
      </SectionCard>
    </>
  );

  // ── Step icon/color for current step ─────────────────────────────
  const stepMeta = STEPS[currentStep - 1];
  const StepIcon = stepMeta.icon;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#0f2419', '#1a3a28']}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => { currentStep === 1 ? router.back() : handlePrev(); }}
          style={styles.backBtn}
          activeOpacity={0.75}
        >
          <ArrowLeft color="#fff" size={20} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>New Listing</Text>
          <Text style={styles.headerSub}>Step {currentStep} of 4 · {stepMeta.label}</Text>
        </View>

        {/* Placeholder to balance the back button */}
        <View style={styles.backBtn} />
      </LinearGradient>

      {/* ── Step Progress Bar ── */}
      <View style={styles.progressBarTrack}>
        {STEPS.map((s, i) => {
          const done = i + 1 < currentStep;
          const active = i + 1 === currentStep;
          const SIcon = s.icon;
          return (
            <React.Fragment key={s.label}>
              <View style={styles.progressStep}>
                <View style={[
                  styles.progressDot,
                  done && styles.progressDotDone,
                  active && { backgroundColor: s.color, borderColor: s.color },
                ]}>
                  {done
                    ? <CheckCircle2 color="#fff" size={13} />
                    : <SIcon color={active ? '#fff' : '#94a3b8'} size={13} />
                  }
                </View>
                <Text style={[styles.progressLabel, (done || active) && { color: '#0a1f12', fontWeight: '700' }]}>
                  {s.label}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.progressConnector, done && styles.progressConnectorDone]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* ── Form Content ── */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step header card */}
          <View style={styles.stepTitleRow}>
            <View style={[styles.stepTitleIcon, { backgroundColor: stepMeta.color + '18' }]}>
              <StepIcon color={stepMeta.color} size={20} />
            </View>
            <View>
              <Text style={styles.stepTitle}>
                {currentStep === 1 && 'Product Details'}
                {currentStep === 2 && 'Pricing & Inventory'}
                {currentStep === 3 && 'Product Media'}
                {currentStep === 4 && 'Delivery & Contact'}
              </Text>
              <Text style={styles.stepSubtitle}>
                {currentStep === 1 && 'Name, category, quality & variety'}
                {currentStep === 2 && 'Stock, price & harvest info'}
                {currentStep === 3 && 'Add photos to attract buyers'}
                {currentStep === 4 && 'Delivery settings & contact'}
              </Text>
            </View>
          </View>

          {/* Animated step content */}
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Footer CTA ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        {/* Mini step dots */}
        <View style={styles.footerDots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.footerDot,
                i + 1 === currentStep && styles.footerDotActive,
                i + 1 < currentStep && styles.footerDotDone,
              ]}
            />
          ))}
        </View>

        {currentStep < 4 ? (
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#15803d', '#16a34a']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaBtnGradient}
            >
              <Text style={styles.ctaBtnText}>Next Step</Text>
              <ChevronRight color="#fff" size={20} />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={loading ? ['#86efac', '#86efac'] : ['#15803d', '#16a34a']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaBtnGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <CheckCircle2 color="#fff" size={20} />
                  <Text style={styles.ctaBtnText}>Publish Listing</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f2419',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#86a892',
    marginTop: 2,
  },

  // Progress Bar
  progressBarTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2ef',
  },
  progressStep: {
    alignItems: 'center',
    gap: 5,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f5f2',
    borderWidth: 2,
    borderColor: '#dde8e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotDone: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    letterSpacing: 0.2,
  },
  progressConnector: {
    flex: 1,
    height: 2,
    backgroundColor: '#dde8e2',
    marginHorizontal: 4,
    marginBottom: 18,
    borderRadius: 1,
  },
  progressConnectorDone: {
    backgroundColor: '#15803d',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: '#f4f7f4',
  },

  // Step title
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  stepTitleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0a1f12',
    letterSpacing: -0.4,
  },
  stepSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#86a892',
    marginTop: 2,
  },

  // Section cards
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#edf2ef',
    shadowColor: '#0f2419',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  // Field label
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2d4a38',
    marginBottom: 10,
    letterSpacing: 0.1,
  },
  requiredAsterisk: {
    color: '#dc2626',
    fontWeight: '900',
  },

  // Input
  input: {
    backgroundColor: '#f8fbf9',
    borderWidth: 1.5,
    borderColor: '#dde8e2',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: '#0a1f12',
    fontWeight: '600',
  },
  inputFocused: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  inputMultiline: {
    minHeight: 110,
    paddingTop: 13,
  },

  // Input with trailing/leading badge
  inputWithBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fbf9',
    borderWidth: 1.5,
    borderColor: '#dde8e2',
    borderRadius: 14,
    overflow: 'hidden',
  },
  inputBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f5f2',
    borderLeftWidth: 1,
    borderLeftColor: '#dde8e2',
    marginRight: 4,
  },
  inputBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3d5a48',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  currencyBadge: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f5f2',
    borderRightWidth: 1,
    borderRightColor: '#dde8e2',
    alignSelf: 'stretch',
  },
  currencyBadgeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803d',
  },
  inputWithLeadingBadge: {
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
  },

  // Chip
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#f0f5f2',
    borderWidth: 1.5,
    borderColor: '#dde8e2',
  },
  chipActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3d5a48',
  },
  chipTextActive: {
    color: '#15803d',
    fontWeight: '800',
  },

  // Row group
  rowGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowSpacer: {
    width: 12,
  },

  // Media step
  mediaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  mediaIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0a1f12',
  },
  mediaSub: {
    fontSize: 12,
    color: '#86a892',
    marginTop: 2,
    fontWeight: '500',
  },
  mediaCount: {
    backgroundColor: '#f0f5f2',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dde8e2',
  },
  mediaCountText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3d5a48',
  },
  mediaProgress: {
    height: 4,
    backgroundColor: '#edf2ef',
    borderRadius: 2,
    overflow: 'hidden',
  },
  mediaProgressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 2,
  },
  mediaTips: {
    marginTop: 18,
    backgroundColor: '#f8fbf9',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#edf2ef',
    gap: 4,
  },
  mediaTipsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2d4a38',
    marginBottom: 4,
  },
  mediaTipsText: {
    fontSize: 12,
    color: '#6b8575',
    fontWeight: '500',
    lineHeight: 18,
  },

  // Footer
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#edf2ef',
    shadowColor: '#0f2419',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 8,
    gap: 12,
  },
  footerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dde8e2',
  },
  footerDotActive: {
    width: 20,
    backgroundColor: '#15803d',
    borderRadius: 3,
  },
  footerDotDone: {
    backgroundColor: '#86efac',
  },
  ctaBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaBtnDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    gap: 10,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
});