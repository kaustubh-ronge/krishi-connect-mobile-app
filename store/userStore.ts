import { create } from 'zustand';

interface UserProfile {
  // Common fields
  name: string;
  phone?: string;
  address?: string;
  lat?: number;
  lng?: number;
  district?: string;
  region?: string;
  state?: string;
  city?: string;
  pincode?: string;
  upiId?: string;
  // Farmer specific
  farmName?: string;
  aadharNumber?: string;
  sellingStatus?: string;
  usagePurpose?: string;
  // Agent specific
  companyName?: string;
  agentType?: string[];
  // Delivery specific
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  isOnline?: boolean;
  approvalStatus?: string;
  radius?: number;
  pricePerKm?: number;
}

interface UserState {
  profile: UserProfile | null;
  role: string;
  loading: boolean;
  error: string | null;
  fetchProfile: (api: any) => Promise<void>;
  clearProfile: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  role: '',
  loading: false,
  error: null,

  clearProfile: () => set({ profile: null, role: '', error: null }),

  fetchProfile: async (api) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('mobile/v1/profiles/me');
      set({
        profile: res.data?.profile || null,
        role: res.data?.role || '',
      });
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch profile' });
    } finally {
      set({ loading: false });
    }
  },
}));
