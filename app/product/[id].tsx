import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ActivityIndicator, ScrollView, FlatList, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useApiClient } from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import { ArrowLeft, MapPin, Package, Plus, Minus, ShoppingCart } from 'lucide-react-native';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApiClient();
  const router = useRouter();
  const { addToCart, loading: cartLoading } = useCartStore();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`mobile/v1/products?id=${id}`);
        setProduct(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await addToCart(api, product.id, quantity);
      Alert.alert('Added to Cart ✓', `${quantity} × ${product.productName} added to your cart.`, [
        { text: 'View Cart', onPress: () => router.push('/(tabs)/cart') },
        { text: 'Continue Shopping', style: 'cancel' },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add to cart. Please try again.');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.light.text} size={22} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={Colors.light.text} size={22} />
          </TouchableOpacity>
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || 'Product not found'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const seller = product.farmer || product.agent;
  const sellerName = seller?.name || seller?.companyName || 'Unknown Seller';
  const location = [seller?.district, seller?.region].filter(Boolean).join(', ') || 'Location hidden';
  const images = product.images || [];
  const maxQty = Math.min(product.availableStock, 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={Colors.light.text} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.productName}</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={styles.cartBtn}>
          <ShoppingCart color={Colors.light.primary} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {images.length > 0 ? (
          <View>
            <Image source={{ uri: images[imageIndex] }} style={styles.mainImage} resizeMode="cover" />
            {images.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailRow}>
                {images.map((img: string, idx: number) => (
                  <TouchableOpacity key={idx} onPress={() => setImageIndex(idx)}>
                    <Image
                      source={{ uri: img }}
                      style={[styles.thumbnail, idx === imageIndex && styles.thumbnailActive]}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Package color={Colors.light.icon} size={64} />
          </View>
        )}

        <View style={styles.content}>
          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{product.category || 'General'}</Text>
          </View>

          {/* Title & Price */}
          <Text style={styles.productName}>{product.productName}</Text>
          <Text style={styles.price}>₹{product.pricePerUnit} <Text style={styles.priceUnit}>/ {product.unit}</Text></Text>

          {/* Stock & Delivery */}
          <View style={styles.infoRow}>
            <View style={styles.infoChip}>
              <Text style={styles.infoChipText}>📦 {product.availableStock} {product.unit} available</Text>
            </View>
            <View style={styles.infoChip}>
              <Text style={styles.infoChipText}>
                {product.deliveryChargeType === 'flat'
                  ? `🚚 ₹${product.deliveryCharge} delivery`
                  : product.deliveryCharge === 0 ? '🚚 Free delivery' : `🚚 ₹${product.deliveryCharge}/${product.unit}`}
              </Text>
            </View>
          </View>

          {/* Seller Info */}
          <View style={styles.sellerCard}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>{sellerName[0]?.toUpperCase()}</Text>
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{sellerName}</Text>
              <View style={styles.locationRow}>
                <MapPin color={Colors.light.icon} size={13} />
                <Text style={styles.locationText}>{location}</Text>
              </View>
            </View>
          </View>

          {/* Quantity Picker */}
          <Text style={styles.sectionLabel}>Quantity ({product.unit})</Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus size={18} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.qtyValue}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(Math.min(maxQty, quantity + 1))}
            >
              <Plus size={18} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.qtyTotal}>= ₹{(quantity * product.pricePerUnit).toFixed(2)}</Text>
          </View>

          {product.minOrderQuantity > 1 && (
            <Text style={styles.minOrderNote}>Minimum order: {product.minOrderQuantity} {product.unit}</Text>
          )}
        </View>
      </ScrollView>

      {/* Add to Cart Footer */}
      <View style={styles.footer}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerPriceLabel}>Total</Text>
          <Text style={styles.footerPriceValue}>₹{(quantity * product.pricePerUnit).toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.addToCartBtn, addingToCart && styles.addToCartBtnDisabled]}
          onPress={handleAddToCart}
          disabled={addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.addToCartText}>Add to Cart</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: 'bold', color: Colors.light.text },
  cartBtn: { padding: 4 },
  mainImage: { width: '100%', height: 280, backgroundColor: '#e5e7eb' },
  imagePlaceholder: {
    width: '100%', height: 280, backgroundColor: '#f3f4f6',
    justifyContent: 'center', alignItems: 'center',
  },
  thumbnailRow: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f9fafb' },
  thumbnail: {
    width: 56, height: 56, borderRadius: 8, marginRight: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbnailActive: { borderColor: Colors.light.primary },
  content: { padding: 16 },
  categoryBadge: {
    backgroundColor: '#f0fdf4',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryText: { fontSize: 12, color: Colors.light.primaryDark, fontWeight: '600' },
  productName: { fontSize: 22, fontWeight: 'bold', color: Colors.light.text, marginBottom: 6 },
  price: { fontSize: 26, fontWeight: 'bold', color: Colors.light.primary, marginBottom: 14 },
  priceUnit: { fontSize: 14, color: Colors.light.icon, fontWeight: 'normal' },
  infoRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  infoChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  infoChipText: { fontSize: 13, color: Colors.light.text },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 12,
  },
  sellerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerAvatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 15, fontWeight: 'bold', color: Colors.light.text, marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: Colors.light.icon },
  sectionLabel: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 10 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  qtyBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.light.border,
  },
  qtyValue: { fontSize: 20, fontWeight: 'bold', color: Colors.light.text, minWidth: 30, textAlign: 'center' },
  qtyTotal: { fontSize: 16, fontWeight: '600', color: Colors.light.primary },
  minOrderNote: { fontSize: 12, color: Colors.light.icon, marginBottom: 16 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
    gap: 16,
  },
  footerPrice: { flex: 1 },
  footerPriceLabel: { fontSize: 12, color: Colors.light.icon },
  footerPriceValue: { fontSize: 22, fontWeight: 'bold', color: Colors.light.text },
  addToCartBtn: {
    flex: 2,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addToCartBtnDisabled: { opacity: 0.7 },
  addToCartText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorText: { color: Colors.light.error, fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: Colors.light.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: 'bold' },
});
