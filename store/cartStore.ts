import { create } from 'zustand';

interface CartProduct {
  productName: string;
  pricePerUnit: number;
  unit: string;
  availableStock: number;
  images: string[];
  deliveryCharge: number;
  deliveryChargeType: string;
  id: string;
  maxDeliveryRange: number;
  farmer?: { lat?: number; lng?: number; name?: string; companyName?: string };
  agent?: { lat?: number; lng?: number; name?: string; companyName?: string };
}

interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: CartProduct;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  // Always fetches fresh from server — call this on screen focus for cross-platform sync
  fetchCart: (api: any) => Promise<void>;
  addToCart: (api: any, productId: string, quantity: number) => Promise<void>;
  updateQuantity: (api: any, cartItemId: string, quantity: number) => Promise<void>;
  removeFromCart: (api: any, cartItemId: string) => Promise<void>;
  clearLocalCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  clearLocalCart: () => set({ items: [], error: null }),

  fetchCart: async (api) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('mobile/v1/cart');
      // Backend returns { success: true, data: { items: [...] } }
      const cartData = res.data;
      set({ items: cartData?.items || [] });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch cart' });
    } finally {
      set({ loading: false });
    }
  },

  addToCart: async (api, productId, quantity) => {
    set({ error: null });
    try {
      await api.post('mobile/v1/cart', { productId, quantity });
      // Re-fetch to get fully populated items from server
      await get().fetchCart(api);
    } catch (err: any) {
      set({ error: err.message || 'Failed to add item to cart' });
      throw err;
    }
  },

  updateQuantity: async (api, cartItemId, quantity) => {
    // Optimistic update
    const prevItems = get().items;
    set((state) => ({
      items: state.items.map((item) =>
        item.id === cartItemId ? { ...item, quantity } : item
      ),
    }));
    try {
      await api.put(`mobile/v1/cart/items/${cartItemId}`, { quantity });
    } catch (err: any) {
      // Revert on error
      set({ items: prevItems, error: err.message });
    }
  },

  removeFromCart: async (api, cartItemId) => {
    // Optimistic update
    const prevItems = get().items;
    set((state) => ({
      items: state.items.filter((item) => item.id !== cartItemId),
    }));
    try {
      await api.del(`mobile/v1/cart/items/${cartItemId}`);
    } catch (err: any) {
      // Revert on error
      set({ items: prevItems, error: err.message });
    }
  },
}));
