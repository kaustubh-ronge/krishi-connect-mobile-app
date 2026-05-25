import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useCartStore } from '@/store/cartStore';
import { useApiClient } from '@/services/api';
import { Plus, Minus, Trash2, Package, ShoppingCart } from 'lucide-react-native';

export default function CartScreen() {
  const { items, loading, error, fetchCart, updateQuantity, removeFromCart } = useCartStore();
  const api = useApiClient();
  const router = useRouter();

  // Re-fetch every time the cart tab is focused → cross-platform sync
  useFocusEffect(
    useCallback(() => {
      fetchCart(api);
    }, [])
  );

  const totalAmount = items.reduce(
    (sum, item) => sum + item.quantity * item.product.pricePerUnit, 0
  );

  const handleRemove = (itemId: string, name: string) => {
    Alert.alert('Remove Item', `Remove "${name}" from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(api, itemId) },
    ]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const imageUrl = item.product.images?.[0];
    return (
      <View style={styles.cartItem}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.itemImage} resizeMode="cover" />
        ) : (
          <View style={[styles.itemImage, styles.placeholderImage]}>
            <Package color={Colors.light.icon} size={24} />
          </View>
        )}

        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>{item.product.productName}</Text>
          <Text style={styles.itemPrice}>₹{item.product.pricePerUnit} / {item.product.unit}</Text>
          <Text style={styles.itemSubtotal}>Subtotal: ₹{(item.quantity * item.product.pricePerUnit).toFixed(2)}</Text>

          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => item.quantity > 1
                ? updateQuantity(api, item.id, item.quantity - 1)
                : handleRemove(item.id, item.product.productName)
              }
            >
              <Minus size={15} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.qtyButton}
              onPress={() => updateQuantity(api, item.id, item.quantity + 1)}
            >
              <Plus size={15} color={Colors.light.text} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleRemove(item.id, item.product.productName)}
            >
              <Trash2 size={18} color={Colors.light.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading && items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Cart</Text>
        </View>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Cart</Text>
        {items.length > 0 && (
          <Text style={styles.itemCount}>{items.length} item{items.length > 1 ? 's' : ''}</Text>
        )}
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchCart(api)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ShoppingCart color={Colors.light.icon} size={64} />
                <Text style={styles.emptyTitle}>Your cart is empty</Text>
                <Text style={styles.emptySubtitle}>Browse the marketplace and add items!</Text>
                <TouchableOpacity style={styles.shopButton} onPress={() => router.push('/(tabs)')}>
                  <Text style={styles.shopButtonText}>Shop Now</Text>
                </TouchableOpacity>
              </View>
            }
          />

          {items.length > 0 && (
            <View style={styles.footer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total ({items.length} items)</Text>
                <Text style={styles.summaryValue}>₹{totalAmount.toFixed(2)}</Text>
              </View>
              <Text style={styles.deliveryNote}>Delivery charges calculated at checkout</Text>
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={() => router.push('/checkout')}
              >
                <Text style={styles.checkoutButtonText}>Proceed to Checkout →</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.light.text },
  itemCount: { fontSize: 13, color: Colors.light.icon },
  listContent: { padding: 12 },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  itemImage: { width: 90, height: 90, borderRadius: 8, backgroundColor: '#e5e7eb' },
  placeholderImage: { justifyContent: 'center', alignItems: 'center' },
  itemDetails: { flex: 1, marginLeft: 12, justifyContent: 'space-between' },
  itemName: { fontSize: 14, fontWeight: 'bold', color: Colors.light.text, lineHeight: 20 },
  itemPrice: { fontSize: 13, color: Colors.light.icon },
  itemSubtotal: { fontSize: 14, fontWeight: '600', color: Colors.light.primaryDark },
  quantityContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  qtyText: { fontSize: 15, fontWeight: 'bold', marginHorizontal: 12, color: Colors.light.text },
  deleteButton: { marginLeft: 'auto', padding: 6 },
  footer: {
    backgroundColor: Colors.light.background,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  summaryLabel: { fontSize: 15, color: Colors.light.text },
  summaryValue: { fontSize: 22, fontWeight: 'bold', color: Colors.light.text },
  deliveryNote: { fontSize: 12, color: Colors.light.icon, marginBottom: 16 },
  checkoutButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: Colors.light.error, fontSize: 15, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: Colors.light.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: 'bold' },
  emptyContainer: { paddingTop: 80, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.light.text },
  emptySubtitle: { fontSize: 14, color: Colors.light.icon, textAlign: 'center' },
  shopButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  shopButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
